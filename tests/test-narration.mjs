// e2e du mode non-AR de PORTAIL (narration Twison) — sans caméra ni WebGL.
import { chromium } from 'playwright';

const URL = 'http://127.0.0.1:8000/';
const erreurs = [];
let ok = 0;
const check = (cond, label) => { if (cond) { ok++; console.log('  ✓', label); } else { erreurs.push(label); console.log('  ✗', label); } };

const navigateur = await chromium.launch();
const page = await navigateur.newPage();
const consoleErrs = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()); });
page.on('pageerror', (e) => consoleErrs.push('pageerror: ' + e.message));

async function texteScene() { return (await page.locator('#scene-narration').innerText()).trim(); }
async function clicChoix(re) { await page.getByRole('button', { name: re }).click(); }

try {
  // --- Parcours 1 : Gardien + code + Passeur (exerce toute la mécanique J2) ---
  console.log('\n[1] Parcours Gardien → code → Passeur');
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.addInitScript(() => localStorage.clear());
  await page.goto(URL, { waitUntil: 'networkidle' });

  await page.getByRole('button', { name: /Vivre l.histoire sans AR/ }).click();
  await page.waitForSelector('#scene-narration:not([hidden])');
  check((await texteStartContient(page)), 'le passage de départ s’affiche');

  await clicChoix(/Franchir le premier seuil/);
  await clicChoix(/Explorer ce monde/);
  check((await texteScene()).includes('fleur de givre'), 'nœud Explorer (fleur de givre)');

  await clicChoix(/photographier/);
  check((await texteScene()).includes('Gardien des lieux'), 'badge Gardien des lieux affiché');
  check((await texteScene()).toLowerCase().includes('chêne'), 'indice du chêne donné');

  await clicChoix(/Poursuivre la déambulation/);
  check(await page.locator('#scene-narration input').count() === 1, 'champ code présent (Deuxième seuil)');

  // mauvais code
  await page.locator('#scene-narration input').fill('mauvais');
  await page.getByRole('button', { name: /Donner le mot/ }).click();
  check((await page.locator('.narr-erreur').innerText()).length > 0, 'mauvais code → message d’erreur');
  check(await page.locator('#scene-narration input').count() === 1, 'on reste sur le champ code');

  // bon code (avec accent, doit être toléré)
  await page.locator('#scene-narration input').fill('CHÊNE');
  await page.getByRole('button', { name: /Donner le mot/ }).click();
  check((await texteScene()).toLowerCase().includes('clairière'), 'bon code → la clairière');
  check((await texteScene()).includes('Passeur de seuil'), 'badge Passeur de seuil affiché');

  await clicChoix(/Revenir, transformé/);
  check((await texteScene()).includes('— Fin —'), 'fin atteinte');
  check(await page.getByRole('button', { name: /Revenir au réel/ }).count() === 1, 'bouton Revenir au réel');

  const profil = await page.evaluate(() => JSON.parse(localStorage.getItem('portail.profil') || '{}'));
  check(Array.isArray(profil.badges) && profil.badges.includes('gardien-des-lieux') && profil.badges.includes('passeur-de-seuil'),
    'les 2 badges persistés en localStorage');

  // retour accueil
  await page.getByRole('button', { name: /Revenir au réel/ }).click();
  check(await page.locator('#accueil:not([hidden])').count() === 1, 'retour à l’accueil après la fin');

  // --- Parcours 2 : une autre fin (Perdu → Fin passeur) ---
  console.log('\n[2] Parcours alternatif (Perdu)');
  await page.getByRole('button', { name: /Vivre l.histoire sans AR/ }).click();
  await page.waitForSelector('#scene-narration:not([hidden])');
  await clicChoix(/Franchir le premier seuil/);
  await clicChoix(/Je me suis perdu/);
  await clicChoix(/Repartir/);
  check((await texteScene()).includes('— Fin —'), 'fin alternative atteinte');

  // --- Parcours 3 : leçon (Cueillir, sans badge) ---
  console.log('\n[3] Parcours leçon (Cueillir)');
  await page.getByRole('button', { name: /Revenir au réel/ }).click();
  await page.getByRole('button', { name: /Vivre l.histoire sans AR/ }).click();
  await page.waitForSelector('#scene-narration:not([hidden])');
  await clicChoix(/Franchir le premier seuil/);
  await clicChoix(/Explorer ce monde/);
  await clicChoix(/cueillir/i);
  check((await texteScene()).includes('poussière bleue'), 'nœud Cueillir');
  await clicChoix(/Baisser les yeux/);
  check((await texteScene()).includes('ne se possède pas'), 'fin leçon (sans badge)');

  check(consoleErrs.length === 0, 'aucune erreur console (' + consoleErrs.length + ')');
  if (consoleErrs.length) consoleErrs.forEach((e) => console.log('    ⚠️', e));
} catch (e) {
  erreurs.push('EXCEPTION: ' + e.message);
  console.log('\n💥', e.message);
} finally {
  await navigateur.close();
}

async function texteStartContient(p) {
  const t = (await p.locator('#scene-narration').innerText()).trim();
  return t.length > 0;
}

console.log('\n================ RÉSULTAT ================');
console.log(`${ok} checks OK, ${erreurs.length} échec(s)`);
process.exit(erreurs.length ? 1 : 0);
