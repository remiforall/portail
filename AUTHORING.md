# Écrire les histoires de PORTAIL avec Twine

Tu écris **toute la narration dans [Twine](https://twinery.org/)** (l'éditeur visuel des
« livres dont vous êtes le héros » : arcs ramifiés, fins multiples). Le code n'a pas à être
touché. Tu exportes en **Twison** (JSON) et tu déposes le fichier.

## Le pipeline

1. **Twine** (app de bureau ou [twinery.org/2](https://twinery.org/2)) → crée/édite ton histoire en glissant des passages reliés par des liens `[[…]]`.
2. Installe le format **Twison** : Twine → *Formats d'histoire* → *Ajouter* →
   `https://lazerwalker.com/twison/format.js`. Choisis Twison comme format actif.
3. **Publie** : *Publier dans un fichier* → tu obtiens un `.json` Twison.
4. **Dépose-le** sous `assets/histoire.json` (ou un autre nom, et pointe `parcours.json` dessus).

## La grammaire que le moteur comprend

### Liens = choix
La syntaxe Twine standard. Chaque lien devient un bouton :
```
[[Texte du choix->Nom du passage cible]]
[[Nom du passage cible]]
```

### Fins multiples
Un passage **sans aucun lien sortant** est une **fin**. Le moteur affiche le texte puis le
bouton « Revenir au réel ». Tu peux avoir autant de fins que tu veux.

### Badges (récompenses)
Deux façons, au choix :
- **Tag** sur le passage : `badge-gardien-des-lieux` → attribue le badge `gardien-des-lieux`.
- **Directive** dans le texte : une ligne `@badge: gardien-des-lieux`.

Le badge est attribué **dès que le passage s'affiche**. Définis l'apparence des badges
(icône, nom, texte) dans `parcours.json` → bloc `badges`.

### Indice « code » (pont réel ↔ virtuel)
Mets une ligne `@code: chêne` dans un passage. Le moteur affiche alors un **champ de saisie**
au lieu des boutons ; si le joueur tape le bon mot (insensible aux accents/majuscules), il suit
le **premier lien** du passage. Sinon, il reste. Idéal pour : un mot trouvé dans le réel
(sur un objet, une plaque, une affiche) qu'un seuil redemande.

### Point d'entrée d'un polaroïd (mode AR)
Chaque polaroïd ouvre l'histoire à un passage précis. Tag conventionnel : `portail-1`,
`portail-2`… La correspondance polaroïd → passage se déclare dans `parcours.json`
(`polaroids[].entree` = le **nom** du passage). En mode non-AR, l'histoire démarre au passage
tagué `debut` (ou au passage de départ de Twine).

## Le parcours (config concepteur) — `parcours.json`

```json
{
  "histoire": "./assets/histoire.json",
  "cibles": "./assets/targets/polaroid.mind",
  "polaroids": [
    { "cible": 0, "entree": "Premier seuil", "indice": "Le seuil de départ." }
  ],
  "badges": { "gardien-des-lieux": { "icone": "🌿", "nom": "...", "texte": "..." } }
}
```

- `cibles` : un seul fichier `.mind` peut contenir **plusieurs polaroïds** (MindAR compile N
  images dans un fichier). `cible` = l'index (0, 1, 2…) de l'image dans ce fichier.
- Ajouter un polaroïd au parcours = recompiler le `.mind` avec l'image en plus
  (cf. `assets/targets/README.md`) + ajouter une entrée dans `polaroids`.

## Bonnes pratiques (cf. valeurs du projet)
- **A11y** : le mode non-AR doit pouvoir vivre toute l'histoire (ne mets pas de contenu
  atteignable *uniquement* par un polaroïd physique sans chemin alternatif par lien).
- **Registres** respectant nature, faune, flore, humanité ; jamais de trait discriminant.
- Codes simples (un mot), pas de devinette impossible : l'indice doit donner le mot dans le réel.

## L'éditeur de terrain (carte) — `editeur.html`

Pour le **géographique** (zones, position des polaroïds et indices sur le terrain réel), pas
besoin d'éditer `parcours.json` à la main : ouvre **`editeur.html`** (outil concepteur).

- **Fond de carte** : IGN Géoplateforme (service public FR, souverain, sans clé). Les tuiles se
  chargent à l'usage de l'éditeur uniquement — le jeu, lui, ne dépend d'aucune carte tant que le
  GPS n'est pas activé.
- **Dessiner une zone** : outil polygone (coin haut-gauche de la carte) → nomme-la et choisis son
  type (manuel, administratif, hydro, route, courbe de niveau) dans le panneau.
- **Poser un polaroïd** : bouton 📸 puis clique sur la carte → renseigne l'index de cible `.mind`,
  le **passage Twine d'entrée**, et l'indice (où le trouver).
- **Poser un indice** : bouton 🔑 puis clique → saisis le texte.
- **Importer** un `parcours.json` existant pour continuer l'édition ; **Exporter** pour récupérer
  le `parcours.json` à déposer dans `assets/`.

> Note (décision council) : le GPS reste **différé**. Les positions/zones sont enregistrées dès
> maintenant mais ne verrouillent pas encore le jeu (elles serviront quand le gate de proximité
> sera activé). Le polaroïd reste l'ancre du portail.
