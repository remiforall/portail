// Mode AR du jeu PORTAIL — scan polaroid → portail stencil → franchir le seuil.
// Stack WebAR souveraine : MindAR (image tracking on-device) + three.js (portail).
// Architecture (council 2026-06-26) : le POLAROID ancre le portail (image tracking).
// Exporte une fonction : l'orchestration (quête, accueil) est dans app.js.

import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';

const REF = 1; // référence stencil = « la découpe » du portail

// demarrerPortailAR : monte la scène AR et lance la caméra.
//   conteneur : élément hôte de la vue AR (#ar-container)
//   indice    : élément d'aide au scan (masqué quand la cible est trouvée)
//   onEntree  : appelé la 1re fois que le joueur franchit le seuil (tap)
// Retourne { arreter, pret }.
export function demarrerPortailAR({ conteneur, indice, onEntree }) {
  let immersion = false;
  let cibleVisible = false;
  let entreeSignalee = false;

  const mindar = new MindARThree({
    container: conteneur,
    imageTargetSrc: './assets/targets/polaroid.mind',
    uiScanning: 'no',
    uiLoading: 'no',
  });
  const { renderer, scene, camera } = mindar; // MindARThree expose ces champs directement
  const anchor = mindar.addAnchor(0);

  // --- Masque du portail (l'ouverture) : écrit le stencil, pas la couleur ---
  const ouverture = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.92),
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

  // --- Cadre lumineux du seuil ---
  const cadre = new THREE.Mesh(
    new THREE.RingGeometry(0.46, 0.50, 48),
    new THREE.MeshBasicMaterial({ color: 0x6ec5ff, transparent: true, opacity: 0.9 })
  );
  cadre.scale.set(1, 1.48, 1);
  anchor.group.add(cadre);

  // --- L'autre monde — visible seulement à travers l'ouverture (stencil == REF) ---
  const monde = new THREE.Group();
  anchor.group.add(monde);
  const materiauMonde = (mat) => Object.assign(mat, {
    stencilWrite: true, stencilRef: REF, stencilFunc: THREE.EqualStencilFunc,
  });

  const ciel = new THREE.Mesh(
    new THREE.SphereGeometry(6, 32, 16),
    materiauMonde(new THREE.MeshBasicMaterial({ color: 0x0a1a2f, side: THREE.BackSide }))
  );
  ciel.position.z = -2.5; ciel.renderOrder = 1; monde.add(ciel);

  const sol = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    materiauMonde(new THREE.MeshStandardMaterial({ color: 0x12243b, roughness: 1 }))
  );
  sol.rotation.x = -Math.PI / 2; sol.position.set(0, -0.7, -1.5); sol.renderOrder = 1; monde.add(sol);

  const presence = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.14, 0),
    materiauMonde(new THREE.MeshStandardMaterial({
      color: 0x6ec5ff, emissive: 0x2b6cb0, emissiveIntensity: 1.2, roughness: 0.35,
    }))
  );
  presence.position.set(0, 0, -0.9); presence.renderOrder = 2; monde.add(presence);

  monde.add(Object.assign(new THREE.PointLight(0x9ad0ff, 3, 12), { position: new THREE.Vector3(0, 0.4, -0.4) }));
  monde.add(new THREE.AmbientLight(0x32507a, 0.7));

  function setImmersion(actif) {
    immersion = actif && cibleVisible;
    const func = immersion ? THREE.AlwaysStencilFunc : THREE.EqualStencilFunc;
    monde.traverse((o) => { if (o.material && o.material.stencilWrite) o.material.stencilFunc = func; });
    ouverture.material.depthWrite = immersion;
    if (immersion && !entreeSignalee) { entreeSignalee = true; if (onEntree) onEntree(); }
  }

  function gererTap() { if (cibleVisible && !immersion) setImmersion(true); }
  conteneur.addEventListener('click', gererTap);

  anchor.onTargetFound = () => { cibleVisible = true; if (indice) indice.hidden = true; };
  anchor.onTargetLost = () => {
    cibleVisible = false;
    if (immersion) setImmersion(false);
    if (indice) indice.hidden = false;
  };

  const horloge = new THREE.Clock();

  async function lancer() {
    await mindar.start();
    renderer.setAnimationLoop(() => {
      const t = horloge.getElapsedTime();
      presence.rotation.y = t * 0.8;
      presence.position.y = Math.sin(t * 1.5) * 0.06;
      cadre.material.opacity = 0.7 + Math.sin(t * 2) * 0.2; // pulse < 3 Hz (a11y)
      renderer.render(scene, camera);
    });
  }

  const pret = lancer().catch((err) => {
    if (indice) {
      indice.hidden = false;
      const nom = (err && err.name) ? err.name : 'Error';
      const msg = String((err && (err.message || err)) || 'inconnue').replace(/</g, '&lt;');
      indice.innerHTML = '⚠️ Démarrage impossible.<br><strong>' + nom + '</strong><br><code>' + msg + '</code>';
    }
    console.error('[PORTAIL] échec démarrage AR :', err);
  });

  async function arreter() {
    conteneur.removeEventListener('click', gererTap);
    try { renderer.setAnimationLoop(null); } catch { /* ignore */ }
    try { if (typeof mindar.stop === 'function') await mindar.stop(); } catch { /* ignore */ }
  }

  return { arreter, pret };
}
