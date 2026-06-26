// Moteur de narration à embranchements — partagé par le mode AR et le mode non-AR
// (engagement a11y « une mécanique, deux chemins »). Charge une quête JSON éditable.
// Profil local minimal (badges) en localStorage : zéro serveur, zéro email (RGPD).

const CLE_PROFIL = 'portail.profil';

function chargerProfil() {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE_PROFIL) || '{}');
    // validation des types avant usage (donnée non fiable)
    return { badges: Array.isArray(brut.badges) ? brut.badges.filter((b) => typeof b === 'string') : [] };
  } catch {
    return { badges: [] };
  }
}

function sauverProfil(profil) {
  try { localStorage.setItem(CLE_PROFIL, JSON.stringify(profil)); } catch { /* stockage indispo : on continue */ }
}

export class Narration {
  // conteneur : élément où afficher le dialogue (role=dialog)
  // annonce   : région aria-live sr-only pour les lecteurs d'écran
  // surSortie : callback du bouton « Revenir au réel »
  constructor({ quete, conteneur, annonce, surSortie }) {
    this.quete = quete;
    this.$ = conteneur;
    this.$annonce = annonce || null;
    this.surSortie = surSortie || (() => {});
  }

  demarrer() {
    this.$.hidden = false;
    this.$.setAttribute('role', 'dialog');
    this.$.setAttribute('aria-modal', 'true');
    this.$.setAttribute('aria-label', this.quete.titre || 'Histoire');
    this.allerA(this.quete.depart);
  }

  allerA(idNoeud) {
    const noeud = this.quete.noeuds[idNoeud];
    if (!noeud) { console.error('[narration] nœud introuvable :', idNoeud); return; }
    if (noeud.fin) this._rendreFin(noeud);
    else this._rendreNoeud(noeud);
  }

  _rendreNoeud(noeud) {
    this.$.innerHTML = '';
    const texte = document.createElement('p');
    texte.className = 'narr-texte';
    texte.setAttribute('aria-live', 'polite');
    texte.textContent = noeud.texte;
    this.$.appendChild(texte);
    this._annoncer(noeud.texte);

    const liste = document.createElement('div');
    liste.className = 'narr-choix';
    liste.setAttribute('role', 'group');
    liste.setAttribute('aria-label', 'Que fais-tu ?');
    (noeud.choix || []).forEach((choix, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'narr-bouton';
      b.textContent = choix.libelle;
      b.addEventListener('click', () => this.allerA(choix.vers));
      liste.appendChild(b);
      if (i === 0) this._focusBientot(b);
    });
    this.$.appendChild(liste);
  }

  _rendreFin(noeud) {
    const rec = this.quete.recompenses && this.quete.recompenses[noeud.recompense];
    if (rec) this._attribuer(noeud.recompense);

    this.$.innerHTML = '';
    const texte = document.createElement('p');
    texte.className = 'narr-texte';
    texte.setAttribute('aria-live', 'polite');
    texte.textContent = noeud.texte;
    this.$.appendChild(texte);

    if (rec) {
      const carte = document.createElement('div');
      carte.className = 'narr-recompense';
      carte.innerHTML =
        '<span class="narr-recompense-icone" aria-hidden="true">' + rec.icone + '</span>' +
        '<strong>Badge obtenu : ' + rec.nom + '</strong>' +
        '<span>' + rec.texte + '</span>';
      this.$.appendChild(carte);
      this._annoncer('Histoire terminée. ' + noeud.texte + ' Badge obtenu : ' + rec.nom + '. ' + rec.texte);
    } else {
      this._annoncer('Histoire terminée. ' + noeud.texte);
    }

    const sortir = document.createElement('button');
    sortir.type = 'button';
    sortir.className = 'narr-bouton narr-bouton--sortir';
    sortir.textContent = 'Revenir au réel';
    sortir.addEventListener('click', () => this.surSortie());
    this.$.appendChild(sortir);
    this._focusBientot(sortir);
  }

  _attribuer(idBadge) {
    const profil = chargerProfil();
    if (!profil.badges.includes(idBadge)) {
      profil.badges.push(idBadge);
      sauverProfil(profil);
    }
  }

  fermer() {
    this.$.hidden = true;
    this.$.innerHTML = '';
  }

  _annoncer(msg) { if (this.$annonce) this.$annonce.textContent = msg; }

  _focusBientot(el) {
    // léger délai pour laisser le DOM se peindre avant de prendre le focus
    requestAnimationFrame(() => { try { el.focus(); } catch { /* ignore */ } });
  }
}

export function badgesObtenus() {
  return chargerProfil().badges;
}
