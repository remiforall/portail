// Orchestrateur PORTAIL — accueil + routage AR / non-AR, narration Twison partagée.
// Charge le parcours (config concepteur) et l'histoire (export Twine/Twison).

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

let parcours = null;
let histoire = null;
let narration = null;
let sessionAR = null;

async function charger() {
  if (!parcours) {
    parcours = await fetch('./assets/parcours.json').then((r) => r.json());
    histoire = await fetch(parcours.histoire).then((r) => r.json());
  }
}

function afficher(el, visible) { if (el) el.hidden = !visible; }

function revenirAccueil() {
  if (narration) { narration.fermer(); narration = null; }
  if (sessionAR) { sessionAR.arreter(); sessionAR = null; }
  [arContainer, scanHint, fondPlat, scene, sortir, etat].forEach((el) => afficher(el, false));
  afficher(accueil, true);
  const titre = $('#titre-accueil');
  if (titre) requestAnimationFrame(() => { try { titre.focus(); } catch { /* ignore */ } });
}

function nouvelleNarration() {
  return new Narration({
    twison: histoire, badges: parcours.badges,
    conteneur: scene, annonce, surSortie: revenirAccueil,
  });
}

async function jouerAR() {
  await charger();
  afficher(accueil, false);
  afficher(arContainer, true);
  afficher(sortir, true);
  afficher(etat, true);
  etat.textContent = 'Monde réel';
  scanHint.hidden = false;
  scanHint.innerHTML = '📸 Cadre un <strong>polaroïd</strong> dans la vue.<br>Le portail s’ouvrira dessus.';

  narration = nouvelleNarration();
  const { demarrerParcoursAR } = await import('./portail-ar.js');
  sessionAR = demarrerParcoursAR({
    conteneur: arContainer,
    indice: scanHint,
    cibles: parcours.cibles,
    polaroids: parcours.polaroids,
    onEntree: (entree) => {
      etat.textContent = 'Dans le monde virtuel';
      annonce.textContent = 'Tu as franchi le seuil.';
      narration.demarrer(entree);
    },
  });
}

async function jouerSansAR() {
  await charger();
  afficher(accueil, false);
  afficher(fondPlat, true);
  afficher(sortir, true);
  narration = nouvelleNarration();
  narration.demarrer(); // commence au passage "debut" / startnode
}

sortir.addEventListener('click', revenirAccueil);
$('#jouer-ar').addEventListener('click', jouerAR);
$('#jouer-sans-ar').addEventListener('click', jouerSansAR);

revenirAccueil();
