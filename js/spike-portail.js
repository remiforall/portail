// PORTAIL — spike J0 (jetable)
// But : prouver R2 (tracking polaroid) + R3 (effet portail convaincant) + entrer/sortir.
// Stack : MindAR (image tracking on-device, zéro upload) + three.js (portail stencil).
// Architecture verrouillée par le council 2026-06-26 :
//   le POLAROID est l'ancre du portail (image tracking = source de vérité).
//   Le GPS n'intervient pas dans ce spike (gate de proximité = plus tard).

import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';

const REF = 1; // valeur de référence du stencil (le "masque" du portail)

const $hint = document.querySelector('#scan-hint');
const $etat = document.querySelector('#etat');
const $annonce = document.querySelector('#annonce');
const $sortir = document.querySelector('#sortir');

let immersion = false;       // true = "entré" dans le monde virtuel
let cibleVisible = false;    // le polaroid est-il actuellement tracké ?

const annoncer = (msg) => { $annonce.textContent = msg; };

const mindar = new MindARThree({
  container: document.querySelector('#ar-container'),
  imageTargetSrc: './assets/targets/polaroid.mind',
  uiScanning: 'no',
  uiLoading: 'no',
});

const { renderer, scene, camera } = mindar.scene;
const anchor = mindar.addAnchor(0);

// --- Le MASQUE du portail (l'ouverture) ---------------------------------
// Écrit dans le stencil mais pas dans la couleur : c'est la "découpe"
// à travers laquelle on verra l'autre monde.
const ouverture = new THREE.Mesh(
  new THREE.PlaneGeometry(0.62, 0.92), // ~ratio polaroid, repère target = largeur 1
  Object.assign(new THREE.MeshBasicMaterial(), {
    colorWrite: false,
    depthWrite: false,
    stencilWrite: true,
    stencilRef: REF,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilZPass: THREE.ReplaceStencilOp,
  })
);
ouverture.renderOrder = 0;
anchor.group.add(ouverture);

// --- Cadre lumineux du seuil (visible, donne le "il se passe qqch") -----
const cadre = new THREE.Mesh(
  new THREE.RingGeometry(0.46, 0.50, 48),
  new THREE.MeshBasicMaterial({ color: 0x6ec5ff, transparent: true, opacity: 0.9 })
);
cadre.scale.set(1, 1.48, 1); // ovalise vers le ratio portail
cadre.renderOrder = 0;
anchor.group.add(cadre);

// --- L'AUTRE MONDE (l'Upside Down) — visible seulement où stencil == REF -
const monde = new THREE.Group();
anchor.group.add(monde);

const materiauMonde = (mat) => Object.assign(mat, {
  stencilWrite: true,
  stencilRef: REF,
  stencilFunc: THREE.EqualStencilFunc, // ne rend QUE dans l'ouverture
});

// Ciel inversé, ambiance inquiétante
const ciel = new THREE.Mesh(
  new THREE.SphereGeometry(6, 32, 16),
  materiauMonde(new THREE.MeshBasicMaterial({ color: 0x0a1a2f, side: THREE.BackSide }))
);
ciel.position.z = -2.5;
ciel.renderOrder = 1;
monde.add(ciel);

// Sol
const sol = new THREE.Mesh(
  new THREE.PlaneGeometry(8, 8),
  materiauMonde(new THREE.MeshStandardMaterial({ color: 0x12243b, roughness: 1 }))
);
sol.rotation.x = -Math.PI / 2;
sol.position.set(0, -0.7, -1.5);
sol.renderOrder = 1;
monde.add(sol);

// Objet flottant lumineux (la "présence" de l'autre côté)
const presence = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.14, 0),
  materiauMonde(new THREE.MeshStandardMaterial({
    color: 0x6ec5ff, emissive: 0x2b6cb0, emissiveIntensity: 1.2, roughness: 0.35,
  }))
);
presence.position.set(0, 0, -0.9);
presence.renderOrder = 2;
monde.add(presence);

const point = new THREE.PointLight(0x9ad0ff, 3, 12);
point.position.set(0, 0.4, -0.4);
monde.add(point);
monde.add(new THREE.AmbientLight(0x32507a, 0.7));

// --- Immersion : "entrer" / "sortir" ------------------------------------
// Entrer = l'autre monde déborde de l'ouverture et remplit la vue.
// (Pas de franchissement physique au proto — décision gate "posé devant soi".)
function setImmersion(actif) {
  immersion = actif && cibleVisible;
  const func = immersion ? THREE.AlwaysStencilFunc : THREE.EqualStencilFunc;
  monde.traverse((o) => { if (o.material && o.material.stencilWrite) o.material.stencilFunc = func; });
  ouverture.material.depthWrite = immersion; // en immersion, l'ouverture occulte le réel
  $etat.textContent = immersion ? 'Dans le monde virtuel' : 'Monde réel';
  annoncer(immersion ? 'Tu es entré dans le monde virtuel.' : 'Tu es revenu dans le monde réel.');
}

// Tap sur la vue = franchir le seuil (toggle)
document.querySelector('#ar-container').addEventListener('click', () => {
  if (!cibleVisible) return;
  setImmersion(!immersion);
});

// Bouton Sortir = garde-fou permanent, force le retour au réel
$sortir.addEventListener('click', (e) => { e.stopPropagation(); setImmersion(false); });

// --- Cycle de vie du tracking -------------------------------------------
anchor.onTargetFound = () => {
  cibleVisible = true;
  $hint.hidden = true;
  annoncer('Polaroid détecté, un portail s’ouvre.');
};
anchor.onTargetLost = () => {
  cibleVisible = false;
  if (immersion) setImmersion(false);
  $hint.hidden = false;
  $etat.textContent = 'Monde réel';
};

// --- Démarrage -----------------------------------------------------------
const horloge = new THREE.Clock();

(async function start() {
  try {
    await mindar.start();
    renderer.setAnimationLoop(() => {
      const t = horloge.getElapsedTime();
      presence.rotation.y = t * 0.8;
      presence.position.y = Math.sin(t * 1.5) * 0.06;
      cadre.material.opacity = 0.7 + Math.sin(t * 2) * 0.2; // pulse < 3 Hz (a11y)
      renderer.render(scene, camera);
    });
  } catch (err) {
    $hint.hidden = false;
    $hint.innerHTML = '⚠️ Impossible de démarrer la caméra ou de charger la cible.<br>' +
      'Vérifie : libs récupérées (libs/fetch-libs.sh), fichier assets/targets/polaroid.mind présent, ' +
      'page servie en HTTPS ou sur localhost.';
    console.error('[PORTAIL spike] échec démarrage :', err);
  }
})();
