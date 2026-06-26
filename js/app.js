// Orchestrateur PORTAIL — écran d'accueil + routage des deux chemins
// (réalité augmentée / sans AR), moteur de narration partagé.

import { Narration } from './narration.js';

const $ = (sel) => document.querySelector(sel);

const accueil = $('#accueil');
const arContainer = $('#ar-container');
const scanHint = $('#scan-hint');
const fondPlat = $('#fond-plat');
const scene = $('#scene-narration');
const sortir = $('#sortir');
const etat = $('#etat');
const annonce = $('#annonce');

let quete = null;
let narration = null;
let sessionAR = null;

async function chargerQuete() {
  if (!quete) quete = await fetch('./assets/quete.json').then((r) => r.json());
  return quete;
}

function afficher(el, visible) { if (el) el.hidden = !visible; }

function revenirAccueil() {
  if (narration) { narration.fermer(); narration = null; }
  if (sessionAR) { sessionAR.arreter(); sessionAR = null; }
  afficher(arContainer, false);
  afficher(scanHint, false);
  afficher(fondPlat, false);
  afficher(scene, false);
  afficher(sortir, false);
  afficher(etat, false);
  afficher(accueil, true);
  const titre = $('#titre-accueil');
  if (titre) requestAnimationFrame(() => { try { titre.focus(); } catch { /* ignore */ } });
}

function nouvelleNarration(q) {
  return new Narration({ quete: q, conteneur: scene, annonce, surSortie: revenirAccueil });
}

async function jouerAR() {
  const q = await chargerQuete();
  afficher(accueil, false);
  afficher(arContainer, true);
  scanHint.hidden = false;
  scanHint.innerHTML = '📸 Cadre ton <strong>polaroid</strong> dans la vue.<br>Le portail s’ouvrira dessus.';
  afficher(sortir, true);
  afficher(etat, true);
  etat.textContent = 'Monde réel';

  narration = nouvelleNarration(q);
  const { demarrerPortailAR } = await import('./portail-ar.js');
  sessionAR = demarrerPortailAR({
    conteneur: arContainer,
    indice: scanHint,
    onEntree: () => {
      etat.textContent = 'Dans le monde virtuel';
      annonce.textContent = 'Tu as franchi le seuil.';
      narration.demarrer();
    },
  });
}

async function jouerSansAR() {
  const q = await chargerQuete();
  afficher(accueil, false);
  afficher(fondPlat, true);
  afficher(sortir, true);
  // Mode équivalent : même quête, sans caméra. On donne l'intro en contexte.
  if (fondPlat) {
    const intro = $('#fond-plat-intro');
    if (intro) intro.textContent = q.intro || '';
  }
  narration = nouvelleNarration(q);
  narration.demarrer();
}

sortir.addEventListener('click', revenirAccueil);
$('#jouer-ar').addEventListener('click', jouerAR);
$('#jouer-sans-ar').addEventListener('click', jouerSansAR);

// État initial : accueil seul.
revenirAccueil();
