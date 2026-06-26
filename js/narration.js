// Moteur de narration — consomme le format TWISON (export JSON de Twine).
// Tu écris l'histoire dans Twine (arcs, fins multiples), tu exportes en Twison,
// tu déposes le fichier. Voir AUTHORING.md pour les conventions (tags / directives).
// Partagé par le mode AR et le mode non-AR (« une mécanique, deux chemins »).
// Profil local (badges) en localStorage : zéro serveur, zéro email (RGPD).

const CLE_PROFIL = 'portail.profil';

function chargerProfil() {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE_PROFIL) || '{}');
    return { badges: Array.isArray(brut.badges) ? brut.badges.filter((b) => typeof b === 'string') : [] };
  } catch {
    return { badges: [] };
  }
}
function sauverProfil(p) {
  try { localStorage.setItem(CLE_PROFIL, JSON.stringify(p)); } catch { /* stockage indispo */ }
}

function normaliser(s) {
  // comparaison de code tolérante : minuscules, sans accents, trim
  return String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export class Narration {
  // twison : objet Twison ({ passages, startnode, ... })
  // badges : dictionnaire id -> { icone, nom, texte }
  constructor({ twison, badges, conteneur, annonce, surSortie }) {
    this.twison = twison;
    this.badges = badges || {};
    this.$ = conteneur;
    this.$annonce = annonce || null;
    this.surSortie = surSortie || (() => {});
    this._index = new Map();           // nom de passage -> passage
    this._pidIndex = new Map();        // pid -> passage
    (twison.passages || []).forEach((p) => {
      this._index.set(p.name, p);
      this._pidIndex.set(String(p.pid), p);
    });
  }

  passageDebut() {
    // priorité au passage tagué "debut", sinon le startnode Twine
    const debut = (this.twison.passages || []).find((p) => (p.tags || []).includes('debut'));
    return debut || this._pidIndex.get(String(this.twison.startnode)) || (this.twison.passages || [])[0];
  }

  demarrer(nomEntree) {
    this.$.hidden = false;
    this.$.setAttribute('role', 'dialog');
    this.$.setAttribute('aria-modal', 'true');
    this.$.setAttribute('aria-label', this.twison.name || 'Histoire');
    const p = nomEntree ? this._index.get(nomEntree) : this.passageDebut();
    if (!p) { console.error('[narration] passage d’entrée introuvable :', nomEntree); return; }
    this.rendre(p);
  }

  allerVers(nom) {
    const p = this._index.get(nom);
    if (!p) { console.error('[narration] lien cassé vers :', nom); return; }
    this.rendre(p);
  }

  // Extrait les directives @code / @badge et nettoie le texte affichable.
  _analyser(passage) {
    let code = null;
    const badgesDirectifs = [];
    const lignes = String(passage.text || '').split('\n').filter((ligne) => {
      const mC = ligne.match(/^@code:\s*(.+)$/i);
      if (mC) { code = mC[1].trim(); return false; }
      const mB = ligne.match(/^@badge:\s*(.+)$/i);
      if (mB) { badgesDirectifs.push(mB[1].trim()); return false; }
      return true;
    });
    // tags badge-<id>
    (passage.tags || []).forEach((t) => {
      if (t.indexOf('badge-') === 0) badgesDirectifs.push(t.slice('badge-'.length));
    });
    const texte = lignes.join('\n').replace(/\[\[[\s\S]*?\]\]/g, '').replace(/\n{3,}/g, '\n\n').trim();
    return { texte, code, badges: badgesDirectifs, liens: passage.links || [] };
  }

  rendre(passage) {
    const { texte, code, badges, liens } = this._analyser(passage);
    badges.forEach((id) => this._attribuer(id));

    this.$.innerHTML = '';
    const pTexte = document.createElement('p');
    pTexte.className = 'narr-texte';
    pTexte.setAttribute('aria-live', 'polite');
    pTexte.textContent = texte;
    this.$.appendChild(pTexte);

    // Récompenses gagnées sur ce passage
    badges.forEach((id) => {
      const b = this.badges[id];
      if (!b) return;
      const carte = document.createElement('div');
      carte.className = 'narr-recompense';
      carte.innerHTML =
        '<span class="narr-recompense-icone" aria-hidden="true">' + b.icone + '</span>' +
        '<strong>Badge : ' + b.nom + '</strong><span>' + b.texte + '</span>';
      this.$.appendChild(carte);
      this._annoncer('Badge obtenu : ' + b.nom + '. ' + b.texte);
    });

    if (code) { this._rendreCode(code, liens); return; }
    if (liens.length) { this._rendreChoix(liens); return; }
    this._rendreFin(texte);
  }

  _rendreChoix(liens) {
    const groupe = document.createElement('div');
    groupe.className = 'narr-choix';
    groupe.setAttribute('role', 'group');
    groupe.setAttribute('aria-label', 'Que fais-tu ?');
    liens.forEach((lien, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'narr-bouton';
      b.textContent = lien.name;
      b.addEventListener('click', () => this.allerVers(lien.link));
      groupe.appendChild(b);
      if (i === 0) this._focus(b);
    });
    this.$.appendChild(groupe);
  }

  _rendreCode(attendu, liens) {
    const cible = liens[0] ? liens[0].link : null;
    const form = document.createElement('form');
    form.className = 'narr-saisie';
    const id = 'code-' + Math.floor(performance.now());
    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = 'Mot de passe';
    const input = document.createElement('input');
    input.id = id; input.type = 'text'; input.autocomplete = 'off';
    input.setAttribute('autocapitalize', 'none');
    const valider = document.createElement('button');
    valider.type = 'submit'; valider.className = 'narr-bouton'; valider.textContent = 'Donner le mot';
    const erreur = document.createElement('p');
    erreur.className = 'narr-erreur'; erreur.setAttribute('aria-live', 'assertive');
    form.append(label, input, valider, erreur);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (normaliser(input.value) === normaliser(attendu) && cible) {
        this.allerVers(cible);
      } else {
        erreur.textContent = '⚠️ Ce n’est pas le bon mot. Cherche encore, dans le réel.';
        input.focus(); input.select();
      }
    });
    this.$.appendChild(form);
    this._focus(input);
  }

  _rendreFin(texte) {
    const sortir = document.createElement('button');
    sortir.type = 'button';
    sortir.className = 'narr-bouton narr-bouton--sortir';
    sortir.textContent = 'Revenir au réel';
    sortir.addEventListener('click', () => this.surSortie());
    this.$.appendChild(sortir);
    this._annoncer('Histoire terminée. ' + texte);
    this._focus(sortir);
  }

  _attribuer(idBadge) {
    const profil = chargerProfil();
    if (!profil.badges.includes(idBadge)) { profil.badges.push(idBadge); sauverProfil(profil); }
  }

  fermer() { this.$.hidden = true; this.$.innerHTML = ''; }
  _annoncer(msg) { if (this.$annonce) this.$annonce.textContent = msg; }
  _focus(el) { requestAnimationFrame(() => { try { el.focus(); } catch { /* ignore */ } }); }
}

export function badgesObtenus() { return chargerProfil().badges; }
