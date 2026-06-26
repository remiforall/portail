#!/usr/bin/env bash
# Récupère les libs en local (vendored) — zéro CDN au runtime.
# À relancer si tu changes les versions ci-dessous.
set -euo pipefail
cd "$(dirname "$0")"

# MindAR 1.2.x est couplé à une version précise de three.js.
# Si MindAR jette une erreur "three" au démarrage, ajuste THREE_VER ici.
THREE_VER="0.149.0"
MINDAR_VER="1.2.5"

echo "→ three.js ${THREE_VER}"
curl -fsSL "https://unpkg.com/three@${THREE_VER}/build/three.module.js" -o three.module.js

# MindAR importe un addon three (CSS3DRenderer) en bare specifier "three/addons/...".
# On le vendorise sous three-addons/ et on le mappe dans l'importmap d'index.html.
echo "→ three addons (CSS3DRenderer)"
mkdir -p three-addons/renderers
curl -fsSL "https://unpkg.com/three@${THREE_VER}/examples/jsm/renderers/CSS3DRenderer.js" -o three-addons/renderers/CSS3DRenderer.js

# MindAR : le build -three.prod.js importe dynamiquement des chunks voisins
# (controller-*.js, etc.). Il FAUT tout le dossier dist/, pas juste l'entrée,
# sinon le contrôleur de tracking renvoie 404 et la caméra ne démarre jamais.
echo "→ MindAR ${MINDAR_VER} (dist/ complet via npm pack)"
TMP="$(mktemp -d)"
( cd "$TMP" && npm pack "mind-ar@${MINDAR_VER}" >/dev/null 2>&1 && tar xzf mind-ar-*.tgz )
cp -f "$TMP"/package/dist/*.js ./
rm -rf "$TMP"

echo "✓ Libs dans $(pwd) :"
ls -1 *.js
echo
echo "Rappel souveraineté : ces libs sont MIT/Apache, désormais servies en local."
echo "Aucun appel CDN n'est fait quand on ouvre index.html."
