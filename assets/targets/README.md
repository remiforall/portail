# Cible image — `polaroid.mind`

Le portail s'ancre sur **ton vrai polaroid** (image tracking MindAR, 100 % client-side).
Il faut compiler une photo de référence du polaroid en fichier `.mind`.

## 1. Photographier la référence
- Polaroid **à plat**, bien éclairé, **sans reflet** ni ombre portée.
- Cadre net qui remplit le champ. Format paysage ou portrait, peu importe.
- Une image **contrastée et détaillée** tracke bien mieux qu'une photo uniforme/floue
  (c'est le risque **R2** à mesurer : un cadre blanc + photo pâle = peu de points d'accroche).

## 2. Compiler en `.mind`
Le plus rapide — **compilateur officiel MindAR** (le traitement se fait *dans ton navigateur*,
l'image n'est pas envoyée à un serveur, donc RGPD-OK pour un spike) :

  https://hiukim.github.io/mind-ar-js-doc/tools/compile

→ charger la photo → **Start** → **Download** → renommer le fichier en **`polaroid.mind`**
→ le déposer **ici** (`assets/targets/polaroid.mind`).

> Pour une version 100 % souveraine plus tard (compilation hors-ligne via le paquet npm
> `mind-ar`), voir la doc MindAR « Compile » — hors périmètre du spike J0.

## 3. Mesurer R2 (fiabilité du tracking)
Une fois le portail visible, teste le **même polaroid** en conditions réelles et note le taux d'échec :
- intérieur lumière douce / plein soleil / pénombre,
- tenu à la main (tremblement) vs posé,
- de biais (angle 30-45°).

**Plan B si R2 échoue** : glisser un **micro-motif discret** (petit QR ou texture) dans le cadre
blanc pour donner des points d'accroche, sans trahir l'esthétique polaroid.
