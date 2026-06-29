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

# Leaflet + Leaflet.draw — uniquement pour l'éditeur concepteur (editeur.html).
# Vendorisés en local (JS/CSS/images). Les tuiles, elles, viennent d'IGN à l'usage.
LEAFLET_VER="1.9.4"
LEAFLET_DRAW_VER="1.0.4"
echo "→ Leaflet ${LEAFLET_VER}"
TMPL="$(mktemp -d)"
( cd "$TMPL" && npm pack "leaflet@${LEAFLET_VER}" >/dev/null 2>&1 && tar xzf leaflet-*.tgz )
mkdir -p leaflet/images
cp -f "$TMPL"/package/dist/leaflet.js leaflet/
cp -f "$TMPL"/package/dist/leaflet.css leaflet/
cp -f "$TMPL"/package/dist/images/* leaflet/images/
rm -rf "$TMPL"
echo "→ Leaflet.draw ${LEAFLET_DRAW_VER}"
TMPD="$(mktemp -d)"
( cd "$TMPD" && npm pack "leaflet-draw@${LEAFLET_DRAW_VER}" >/dev/null 2>&1 && tar xzf leaflet-draw-*.tgz )
mkdir -p leaflet-draw/images
cp -f "$TMPD"/package/dist/leaflet.draw.js leaflet-draw/
cp -f "$TMPD"/package/dist/leaflet.draw.css leaflet-draw/
cp -f "$TMPD"/package/dist/images/* leaflet-draw/images/ 2>/dev/null || true
rm -rf "$TMPD"

echo "✓ Libs dans $(pwd) :"
ls -1 *.js
echo
echo "Rappel souveraineté : ces libs sont MIT/Apache, désormais servies en local."
echo "Aucun appel CDN n'est fait quand on ouvre index.html."
