# PORTAIL — spike J0 (jetable)

Prototype de dérisquage du jeu mobile AR **PORTAIL** (dispositif photographique narratif :
scan d'un polaroid → portail → monde virtuel). Ce dossier n'est **pas** le produit : c'est une
maquette jetable dont le seul but est de répondre par oui/non à trois questions avant d'investir.

## Ce que ce spike doit prouver

| Risque | Question | Critère de réussite |
|---|---|---|
| **R2** | Le tracking d'un vrai polaroid est-il fiable ? | Le portail reste accroché au polaroid en intérieur **et** au soleil, tremblement compris, taux d'échec acceptable (cf. `assets/targets/README.md`). |
| **R3** | L'effet portail procure-t-il la magie du *seuil* ? | « Voir un autre monde à travers une découpe » + entrer/sortir donne un effet convaincant, pas juste un changement d'écran. |
| **R1** | (résolu par design) | L'ancrage est porté par le **polaroid** (image tracking), pas le GPS. Le GPS = simple gate de proximité, hors de ce spike. |

> **Go / No-Go** : si R2 ou R3 ne passent pas, on **ne lance pas J1**. On réoriente l'effet
> (ex. portail « posé devant soi » sans franchissement, ou plan B motif dans le cadre).

## Décisions verrouillées (gate du 2026-06-26)
- Cible **majeurs-only** au proto.
- Concepteur = **toi, en fichier-config** (pas d'éditeur graphique avant J3).
- Portail **« posé devant soi »** (pas de franchissement physique au proto).
- Stack : **WebAR souverain** (MindAR + three.js). Unity réservé en rampe commerciale.

## Lancer le spike

1. **Récupérer les libs** (une fois) :
   ```
   bash libs/fetch-libs.sh
   ```
2. **Compiler la cible** : suivre `assets/targets/README.md` → déposer `polaroid.mind`.
3. **Tester d'abord à la webcam du laptop** (boucle rapide, `localhost` = contexte sécurisé) :
   ```
   python3 -m http.server 8000
   ```
   puis ouvrir `http://localhost:8000/` et présenter le polaroid à la webcam.
4. **Tester sur téléphone** (caméra exige HTTPS hors localhost). Au choix :
   - servir via **Caddy** (HTTPS auto, CA interne) ou un tunnel TLS,
   - puis ouvrir l'URL sur le mobile et autoriser la caméra.

## Utilisation
- Cadrer le polaroid → un portail bleuté s'ouvre dessus, on aperçoit l'autre monde au travers.
- **Taper l'écran** = franchir le seuil (l'autre monde déborde et remplit la vue).
- **Bouton « Sortir »** (toujours visible) = retour au réel immédiat, sans risque.
- Perdre le polaroid de vue = retour auto au réel (le polaroid est la *clé*).

## Garde-fous déjà câblés (cohérents avec les valeurs du projet)
- **RGPD** : caméra traitée **on-device**, rien n'est uploadé (MindAR = CV navigateur).
- **Zéro CDN au runtime** : libs vendored dans `libs/`.
- **a11y** : bouton Sortir ≥ 44 px, `aria-live` sur les changements d'état, pas de
  clignotement > 3 Hz, pas de `user-scalable=no`. *(Le mode narratif non-AR équivalent
  — une mécanique, deux chemins — viendra avec le MVP J1, hors spike.)*

## Limites assumées du spike
- Effet portail volontairement simple (1 ouverture, 1 monde, 1 présence). Pas de quête, pas de son.
- L'immersion ne tient que tant que le polaroid est visible (propriété voulue : la clé, c'est l'objet).
- iOS Safari ne supporte pas WebXR `immersive-ar`, **mais MindAR n'en a pas besoin** (il lit la
  caméra + CV). Le plafond iOS ne se révélera que si on veut un jour de l'occlusion mesh / depth.

## Statut de vérification
Code écrit et **syntaxe JS validée** (`node --check`). **L'effet AR n'a PAS été testé sur appareil**
par l'assistant (impossible headless) — R2 et R3 sont à valider par toi sur ton vrai polaroid.
