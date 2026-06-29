// Smoke e2e de l'éditeur concepteur : la carte s'initialise, Leaflet est chargé,
// et la chaîne collecter() -> parcours fonctionne dans le navigateur.
// (Le rendu des tuiles IGN n'est pas testé : réseau externe, hors périmètre.)
import { chromium } from 'playwright';

const URL = 'http://127.0.0.1:8000/editeur.html';
let ok = 0; const echecs = [];
const check = (c, l) => { if (c) { ok++; console.log('  ✓', l); } else { echecs.push(l); console.log('  ✗', l); } };

const navigateur = await chromium.launch();
const page = await navigateur.newPage();
const consoleErrs = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()); });
page.on('pageerror', (e) => consoleErrs.push('pageerror: ' + e.message));

try {
  console.log('[éditeur]');
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__editeur && window.__editeur.map, null, { timeout: 15000 });
  check(true, 'la carte Leaflet s’initialise (window.__editeur.map)');
  check(await page.evaluate(() => typeof L !== 'undefined' && typeof L.Control.Draw === 'function'), 'Leaflet + Leaflet.draw chargés');
  check(await page.locator('#btn-polaroid').count() === 1 && await page.locator('#btn-export').count() === 1, 'boutons concepteur présents');

  const parcours = await page.evaluate(() => {
    const E = window.__editeur;
    const m = L.marker([46.6, 2.4]); m._meta = { kind: 'polaroid', cible: 0, entree: 'Premier seuil', indice: 'ici' }; E.elements.addLayer(m);
    const poly = L.polygon([[46, 2], [46, 3], [47, 3]]); poly._meta = { kind: 'zone', nom: 'Forêt', type: 'manuel' }; E.elements.addLayer(poly);
    return E.collecter();
  });
  check(parcours.polaroids.length === 1 && parcours.polaroids[0].entree === 'Premier seuil', 'collecter() : polaroïd capturé');
  check(parcours.zones.length === 1 && parcours.zones[0].polygone.length === 3, 'collecter() : zone polygone capturée');

  const erreursReelles = consoleErrs.filter((e) => !/geopf|wmts|tile|net::|Failed to load resource/i.test(e));
  check(erreursReelles.length === 0, 'aucune erreur console (hors tuiles réseau)');
  if (erreursReelles.length) erreursReelles.forEach((e) => console.log('    ⚠️', e));
} catch (e) {
  echecs.push('EXCEPTION: ' + e.message);
  console.log('\n💥', e.message);
} finally {
  await navigateur.close();
}

console.log('\n================ RÉSULTAT ================');
console.log(`${ok} checks OK, ${echecs.length} échec(s)`);
process.exit(echecs.length ? 1 : 0);
