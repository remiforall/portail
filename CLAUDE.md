# CLAUDE.md — PORTAIL

## Nature
Jeu mobile **AR géolocalisé narratif** : un polaroid physique ouvre un portail vers un monde
virtuel ancré à un lieu réel. Trajectoire : **proto → œuvre photographique → peut-être commercial**.
Solo, budget ~0. Voir la mémoire workspace `project_portail_jeu_ar.md` + `council-stack-ar-portail.md`.

## État actuel
**Spike J0 jetable** uniquement (ce dossier). Dérisque R2 (tracking polaroid) et R3 (effet portail)
avant d'écrire la moindre ligne du vrai MVP. Lire `README.md`.

## Stack (verrouillée — council 2026-06-26)
- **WebAR souverain** : MindAR (image tracking on-device) + three.js (portail stencil). Vanilla JS, modules ES.
- **Unity AR Foundation** = rampe de réserve, seulement si une trajectoire commerciale exige
  occlusion mesh / depth / géo centimétrique. Ne pas y aller sans décision explicite.
- Architecture clé : **le polaroid (image tracking) ancre le portail** ; le GPS n'est qu'un gate de
  proximité grossière (±15 m), jamais l'ancre métrique → supprime toute dépendance Google/Niantic.

## Non négociables
- **Zéro CDN au runtime** : toutes les libs dans `libs/` (script `fetch-libs.sh`).
- **RGPD radical** : caméra/photo traitées on-device, **rien n'est uploadé**. Pas d'email ni de
  compte serveur avant les briques sociales (J4). Fond de carte IGN/OSM, jamais Google.
- **a11y AAA visée** : la mécanique AR doit avoir un **équivalent narratif non-AR** (une mécanique,
  deux chemins). Pas de clignotement > 3 Hz (effet Upside Down = risque épilepsie). Cibles ≥ 44 px,
  `aria-live`, pas de `user-scalable=no`.
- **Sûreté des personnes** : pas de rencontre réelle au proto ; bouton « Sortir » toujours
  atteignable ; majeurs-only tant que la sûreté n'est pas cadrée.
- **Tout en français** : commits, commentaires, UI.
- Vérifier `node --check` sur les JS avant tout commit.

## Tests
- `npm install && npx playwright install chromium` (une fois), puis `npm run serve` + `npm test`.
- `tests/test-narration.mjs` couvre en e2e le **mode non-AR** (narration Twison) : branches,
  champ code, badges, fins. Le rendu AR (WebGL/MindAR) n'est pas couvert (nécessite un appareil).
- Lancer cette suite après toute modif du moteur de narration. Cible : `17 checks OK`.

## Roadmap
J0 spikes (dérisquage) → **J1 MVP « portail magique »** → **J2 V1 artistique photo (le pivot œuvre)**
→ **J3 éditeur concepteur no-code** → J4 social (modération/sûreté livrées **avant**, rencontres en dernier).
État : J0→J3 livrés. Prochaine étape J4 (social), ou consolidation J3 (import frontières/rivières, scission de zones).

## Dépendances approuvées
- **Leaflet 1.9.4 + Leaflet.draw 1.0.4** (MIT, vendorisés `libs/`) — uniquement pour `editeur.html`.
  Tuiles **IGN Géoplateforme** (`data.geopf.fr`, service public FR, sans clé) chargées à l'usage de
  l'éditeur. Le runtime joueur n'embarque aucune carte (GPS différé). Approuvé 2026-06-29.

## Git
`main` = source de vérité. Hub Forgejo (`forge:remiforall/portail.git`), `origin` pousse aussi
le miroir GitHub public (`github.com:remiforall/portail`). Pas de commit direct sur `main` en
contexte multi-machines : brancher `feat/…` et fetch/pull avant toute modif.
