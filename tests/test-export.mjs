// Test unitaire (node pur, sans navigateur) de la logique d'export du parcours.
import { construireParcours, avertissements } from '../js/parcours-export.js';

let ok = 0; const echecs = [];
const check = (c, l) => { if (c) { ok++; console.log('  ✓', l); } else { echecs.push(l); console.log('  ✗', l); } };

console.log('[parcours-export]');

const items = [
  { kind: 'polaroid', meta: { cible: '1', entree: ' Premier seuil ', indice: 'près du chêne' }, position: { lat: 46.6, lng: 2.4 } },
  { kind: 'indice', meta: { texte: 'sous le banc' }, position: [48.85, 2.35] },
  { kind: 'zone', meta: { nom: 'Forêt', type: 'hydro' }, polygone: [{ lat: 46, lng: 2 }, { lat: 46, lng: 3 }, { lat: 47, lng: 3 }] },
];
const p = construireParcours({ histoire: './h.json', cibles: './c.mind', badges: { x: { nom: 'X' } } }, items);

check(p.polaroids.length === 1 && p.polaroids[0].cible === 1, 'cible convertie en nombre');
check(p.polaroids[0].entree === 'Premier seuil', 'entree trim');
check(Array.isArray(p.polaroids[0].position) && p.polaroids[0].position[0] === 46.6, 'position polaroïd [lat,lng]');
check(p.indices.length === 1 && p.indices[0].position[0] === 48.85, 'indice depuis tableau [lat,lng]');
check(p.zones.length === 1 && p.zones[0].polygone.length === 3, 'polygone 3 points');
check(p.zones[0].type === 'hydro', 'type de zone conservé');
check(p.histoire === './h.json' && p.cibles === './c.mind', 'base histoire/cibles conservée');
check(p.badges && p.badges.x, 'badges conservés');

// rétro-compat : la sortie est du JSON sérialisable et relisible
const round = JSON.parse(JSON.stringify(p));
check(round.polaroids[0].entree === 'Premier seuil', 'round-trip JSON');

// défauts quand base vide
const p2 = construireParcours({}, []);
check(p2.histoire.includes('histoire.json') && p2.cibles.includes('.mind'), 'défauts appliqués');

// avertissements
const w = avertissements({ polaroids: [{ cible: 0, entree: '' }, { cible: 0, entree: 'A' }], zones: [{ nom: 'z', polygone: [[0, 0]] }] });
check(w.some((x) => x.includes('aucun passage')), 'avertit : entrée manquante');
check(w.some((x) => x.includes('même index')), 'avertit : cibles en double');
check(w.some((x) => x.includes('3 points')), 'avertit : polygone invalide');
check(avertissements({ polaroids: [{ cible: 0, entree: 'A' }], zones: [] }).length === 0, 'aucun avertissement si tout est bon');

console.log('\n================ RÉSULTAT ================');
console.log(`${ok} checks OK, ${echecs.length} échec(s)`);
process.exit(echecs.length ? 1 : 0);
