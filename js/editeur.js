// Éditeur concepteur PORTAIL — carte Leaflet (tuiles IGN), dessin de zones,
// placement de polaroïds/indices, export d'un parcours.json prêt à déposer.
// Leaflet est chargé en global (L) via <script>. Logique d'export : parcours-export.js.

import { construireParcours, avertissements } from './parcours-export.js';

const $ = (s) => document.querySelector(s);

// --- Carte + fond IGN (Géoplateforme, service public FR, sans clé) ---
const map = L.map('carte').setView([46.6, 2.4], 6); // France entière
L.tileLayer(
  'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0' +
  '&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&TILEMATRIXSET=PM' +
  '&FORMAT=image/png&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}',
  { attribution: 'IGN-F / Géoplateforme', maxZoom: 19, tileSize: 256 }
).addTo(map);

const elements = new L.FeatureGroup().addTo(map);

// --- Dessin des zones (polygones) ---
const controleDessin = new L.Control.Draw({
  edit: { featureGroup: elements, edit: {}, remove: true },
  draw: { polygon: { allowIntersection: false, showArea: false },
    marker: false, polyline: false, rectangle: false, circle: false, circlemarker: false },
});
map.addControl(controleDessin);

map.on(L.Draw.Event.CREATED, (e) => {
  const couche = e.layer;
  couche._meta = { kind: 'zone', nom: '', type: 'manuel' };
  ajouter(couche);
  selectionner(couche);
});

// --- Placement des marqueurs (polaroïd / indice) ---
const ICONES = { polaroid: '📸', indice: '🔑' };
function divIcon(kind) { return L.divIcon({ className: 'marqueur', html: ICONES[kind], iconSize: [28, 28] }); }
let modePlacement = null;

function activerPlacement(kind) {
  modePlacement = kind;
  map.getContainer().style.cursor = 'crosshair';
}
$('#btn-polaroid').addEventListener('click', () => activerPlacement('polaroid'));
$('#btn-indice').addEventListener('click', () => activerPlacement('indice'));

map.on('click', (e) => {
  if (!modePlacement) return;
  const kind = modePlacement;
  const m = L.marker(e.latlng, { icon: divIcon(kind), draggable: true });
  m._meta = kind === 'polaroid'
    ? { kind: 'polaroid', cible: 0, entree: '', indice: '' }
    : { kind: 'indice', texte: '' };
  ajouter(m);
  selectionner(m);
  modePlacement = null;
  map.getContainer().style.cursor = '';
});

function ajouter(couche) {
  elements.addLayer(couche);
  couche.on('click', (ev) => { L.DomEvent.stop(ev); selectionner(couche); });
}

// --- Panneau d'édition de l'élément sélectionné ---
let selection = null;
const $form = $('#form-selection');

function champ(labelTxt, valeur, onInput, type = 'input') {
  const wrap = document.createElement('div');
  wrap.className = 'champ';
  const id = 'f-' + Math.random().toString(36).slice(2, 8);
  const label = document.createElement('label');
  label.setAttribute('for', id); label.textContent = labelTxt;
  const input = document.createElement(type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input');
  input.id = id;
  if (type === 'select') {
    ['manuel', 'administratif', 'hydro', 'route', 'courbe-niveau'].forEach((v) => {
      const o = document.createElement('option'); o.value = v; o.textContent = v;
      if (v === valeur) o.selected = true; input.appendChild(o);
    });
  } else { input.value = valeur ?? ''; }
  input.addEventListener('input', () => onInput(input.value));
  wrap.append(label, input);
  return wrap;
}

function selectionner(couche) {
  selection = couche;
  $form.innerHTML = '';
  const m = couche._meta;
  if (m.kind === 'zone') {
    $form.append(
      champ('Nom de la zone', m.nom, (v) => { m.nom = v; }),
      champ('Type de frontière', m.type, (v) => { m.type = v; }, 'select'),
    );
  } else if (m.kind === 'polaroid') {
    $form.append(
      champ('Index de cible (.mind)', m.cible, (v) => { m.cible = v; }),
      champ('Passage Twine d’entrée', m.entree, (v) => { m.entree = v; }),
      champ('Indice (où trouver ce polaroïd)', m.indice, (v) => { m.indice = v; }, 'textarea'),
    );
  } else if (m.kind === 'indice') {
    $form.append(champ('Texte de l’indice', m.texte, (v) => { m.texte = v; }, 'textarea'));
  }
  const sup = document.createElement('button');
  sup.type = 'button'; sup.textContent = '🗑 Supprimer cet élément';
  sup.addEventListener('click', () => { elements.removeLayer(couche); $form.innerHTML = ''; selection = null; });
  $form.appendChild(sup);
}

// --- Import / Export ---
let badgesBase = {};

function collecter() {
  const items = [];
  elements.eachLayer((l) => {
    const m = l._meta; if (!m) return;
    if (m.kind === 'zone') items.push({ kind: 'zone', meta: m, polygone: l.getLatLngs()[0] });
    else items.push({ kind: m.kind, meta: m, position: l.getLatLng() });
  });
  return construireParcours(
    { histoire: $('#base-histoire').value, cibles: $('#base-cibles').value, badges: badgesBase },
    items,
  );
}

function afficherAvertissements(liste) {
  const ul = $('#avertissements'); ul.innerHTML = '';
  if (!liste.length) { ul.innerHTML = '<li style="color:#9ae6b4">✓ Parcours cohérent.</li>'; return; }
  liste.forEach((w) => { const li = document.createElement('li'); li.textContent = '⚠️ ' + w; ul.appendChild(li); });
}

$('#btn-export').addEventListener('click', () => {
  const parcours = collecter();
  afficherAvertissements(avertissements(parcours));
  const blob = new Blob([JSON.stringify(parcours, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'parcours.json';
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(a.href);
});

$('#import-fichier').addEventListener('change', async (e) => {
  const file = e.target.files[0]; if (!file) return;
  try {
    const p = JSON.parse(await file.text());
    $('#base-histoire').value = p.histoire || './assets/histoire.json';
    $('#base-cibles').value = p.cibles || './assets/targets/polaroid.mind';
    badgesBase = p.badges || {};
    elements.clearLayers();
    (p.zones || []).forEach((z) => {
      if ((z.polygone || []).length < 3) return;
      const poly = L.polygon(z.polygone);
      poly._meta = { kind: 'zone', nom: z.nom || '', type: z.type || 'manuel' };
      ajouter(poly);
    });
    (p.polaroids || []).forEach((x) => {
      if (!x.position) return;
      const mk = L.marker(x.position, { icon: divIcon('polaroid'), draggable: true });
      mk._meta = { kind: 'polaroid', cible: x.cible ?? 0, entree: x.entree || '', indice: x.indice || '' };
      ajouter(mk);
    });
    (p.indices || []).forEach((x) => {
      if (!x.position) return;
      const mk = L.marker(x.position, { icon: divIcon('indice'), draggable: true });
      mk._meta = { kind: 'indice', texte: x.texte || '' };
      ajouter(mk);
    });
    if (elements.getLayers().length) map.fitBounds(elements.getBounds().pad(0.2));
    afficherAvertissements(avertissements(collecter()));
  } catch (err) {
    afficherAvertissements(['Import impossible : ' + (err.message || err)]);
  }
});

// Exposé pour les tests e2e (drive sans souris).
window.__editeur = { map, elements, collecter, selectionner, activerPlacement };
