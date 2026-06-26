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

echo "→ MindAR ${MINDAR_VER} (image-three, prod)"
curl -fsSL "https://cdn.jsdelivr.net/npm/mind-ar@${MINDAR_VER}/dist/mindar-image-three.prod.js" -o mindar-image-three.prod.js

echo "✓ Libs dans $(pwd) :"
ls -lh three.module.js mindar-image-three.prod.js
echo
echo "Rappel souveraineté : ces libs sont MIT/Apache, désormais servies en local."
echo "Aucun appel CDN n'est fait quand on ouvre index.html."
