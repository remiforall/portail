// Mode AR du jeu PORTAIL — multi-cibles : chaque polaroïd ouvre un portail
// qui entre dans l'histoire à un point d'entrée (passage Twine) défini par le
// concepteur dans parcours.json. Stack WebAR souveraine : MindAR + three.js.

import * as THREE from 'three';
import { MindARThree } from 'mindar-image-three';

const REF = 1; // référence stencil = « la découpe » du portail

// Construit un portail (masque + cadre + monde) dans un groupe d'ancre donné.
// Retourne { setImmersion, animer }.
function construirePortail(groupe) {
  const ouverture = new THREE.Mesh(
    new THREE.PlaneGeometry(0.62, 0.92),
    Object.assign(new THREE.MeshBasicMaterial(), {
      colorWrite: false, depthWrite: false,
      stencilWrite: true, stencilRef: REF,
      stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp,
    })
  );
  ouverture.renderOrder = 0;
  groupe.add(ouverture);

  const cadre = new THREE.Mesh(
    new THREE.RingGeometry(0.46, 0.50, 48),
    new THREE.MeshBasicMaterial({ color: 0x6ec5ff, transparent: true, opacity: 0.9 })
  );
  cadre.scale.set(1, 1.48, 1);
  groupe.add(cadre);

  const monde = new THREE.Group();
  groupe.add(monde);
  const matMonde = (m) => Object.assign(m, { stencilWrite: true, stencilRef: REF, stencilFunc: THREE.EqualStencilFunc });

  const ciel = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 16),
    matMonde(new THREE.MeshBasicMaterial({ color: 0x0a1a2f, side: THREE.BackSide })));
  ciel.position.z = -2.5; ciel.renderOrder = 1; monde.add(ciel);

  const sol = new THREE.Mesh(new THREE.PlaneGeometry(8, 8),
    matMonde(new THREE.MeshStandardMaterial({ color: 0x12243b, roughness: 1 })));
  sol.rotation.x = -Math.PI / 2; sol.position.set(0, -0.7, -1.5); sol.renderOrder = 1; monde.add(sol);

  const presence = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 0),
    matMonde(new THREE.MeshStandardMaterial({ color: 0x6ec5ff, emissive: 0x2b6cb0, emissiveIntensity: 1.2, roughness: 0.35 })));
  presence.position.set(0, 0, -0.9); presence.renderOrder = 2; monde.add(presence);

  monde.add(Object.assign(new THREE.PointLight(0x9ad0ff, 3, 12), { position: new THREE.Vector3(0, 0.4, -0.4) }));
  monde.add(new THREE.AmbientLight(0x32507a, 0.7));

  let immersion = false;
  function setImmersion(actif) {
    immersion = actif;
    const func = immersion ? THREE.AlwaysStencilFunc : THREE.EqualStencilFunc;
    monde.traverse((o) => { if (o.material && o.material.stencilWrite) o.material.stencilFunc = func; });
    ouverture.material.depthWrite = immersion;
  }
  function animer(t) {
    presence.rotation.y = t * 0.8;
    presence.position.y = Math.sin(t * 1.5) * 0.06;
    cadre.material.opacity = 0.7 + Math.sin(t * 2) * 0.2; // pulse < 3 Hz (a11y)
  }
  return { setImmersion, animer };
}

// demarrerParcoursAR : monte la scène AR multi-cibles et lance la caméra.
//   cibles    : chemin du .mind (1 à N cibles)
//   polaroids : [{ cible, entree, indice }]
//   onEntree(entree) : appelé au franchissement d'un seuil (tap)
// Retourne { arreter, pret }.
export function demarrerParcoursAR({ conteneur, indice, cibles, polaroids, onEntree }) {
  let cibleActive = -1;     // index du polaroïd actuellement visible
  let immergeSur = -1;      // index du polaroïd dont le seuil est franchi

  const mindar = new MindARThree({
    container: conteneur,
    imageTargetSrc: cibles,
    maxTrack: Math.max(1, polaroids.length),
    uiScanning: 'no', uiLoading: 'no',
  });
  const { renderer, scene, camera } = mindar;

  const portails = polaroids.map((p) => {
    const anchor = mindar.addAnchor(p.cible);
    const portail = construirePortail(anchor.group);
    anchor.onTargetFound = () => { cibleActive = p.cible; if (indice) indice.hidden = true; };
    anchor.onTargetLost = () => {
      if (cibleActive === p.cible) cibleActive = -1;
      if (immergeSur === p.cible) { portail.setImmersion(false); immergeSur = -1; }
      if (indice && cibleActive === -1) indice.hidden = false;
    };
    return { def: p, portail };
  });

  function gererTap() {
    if (cibleActive < 0 || immergeSur >= 0) return;
    const entree = portails.find((x) => x.def.cible === cibleActive);
    if (!entree) return;
    entree.portail.setImmersion(true);
    immergeSur = cibleActive;
    if (onEntree) onEntree(entree.def.entree);
  }
  conteneur.addEventListener('click', gererTap);

  const horloge = new THREE.Clock();
  async function lancer() {
    await mindar.start();
    renderer.setAnimationLoop(() => {
      const t = horloge.getElapsedTime();
      portails.forEach((x) => x.portail.animer(t));
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
