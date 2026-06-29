# Tests e2e — mode non-AR (narration Twison)

Filet anti-régression du **moteur de narration** (le cœur de J2). Pilote un navigateur
headless à travers le mode *sans AR* — pas de caméra ni de WebGL requis — et déroule :
branchements, champ **code** (bon/mauvais, tolérance accents/casse), attribution et
**persistance des badges** (localStorage), **fins multiples**, retour à l'accueil. Échoue à la
moindre erreur console.

> Le rendu **AR** (MindAR + WebGL) n'est pas couvert : il exige un vrai appareil avec caméra.

## Lancer

Installation unique de l'outillage (dev only — le jeu lui-même reste vanilla, sans build) :
```
npm install
npx playwright install chromium
```

Puis, dans deux terminaux (ou le serveur en arrière-plan) :
```
npm run serve
```
```
npm test
```

Sortie attendue : `17 checks OK, 0 échec(s)`.

## Étendre

Quand tu écris une nouvelle histoire Twine, ajuste les libellés de choix attendus dans
`test-narration.mjs` (ils matchent le texte des boutons par expression régulière), ou ajoute
un parcours couvrant tes nouvelles branches/fins.
