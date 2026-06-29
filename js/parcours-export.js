// Logique pure de construction/validation du parcours (sans Leaflet ni DOM).
// Séparée pour être testable en node. Utilisée par l'éditeur concepteur (editeur.js).
// Le format de sortie reste rétro-compatible avec app.js / portail-ar.js :
// les champs geo (position, zones, indices) sont additifs et ignorés par le runtime
// tant que le GPS n'est pas activé (décision council : GPS = gate de proximité, différé).

const arr2 = (latlng) => latlng ? [Number(latlng.lat ?? latlng[0]), Number(latlng.lng ?? latlng[1])] : null;

// base : { histoire, cibles, badges } (récupérés d'un import ou par défaut)
// items : [{ kind:'polaroid'|'indice'|'zone', meta:{}, position?:LatLng, polygone?:LatLng[] }]
export function construireParcours(base, items) {
  base = base || {};
  const polaroids = [];
  const zones = [];
  const indices = [];

  (items || []).forEach((it) => {
    if (!it || !it.kind) return;
    if (it.kind === 'polaroid') {
      polaroids.push({
        cible: Number.isFinite(+it.meta?.cible) ? +it.meta.cible : 0,
        entree: (it.meta?.entree || '').trim(),
        indice: (it.meta?.indice || '').trim(),
        position: arr2(it.position),
      });
    } else if (it.kind === 'indice') {
      indices.push({ texte: (it.meta?.texte || '').trim(), position: arr2(it.position) });
    } else if (it.kind === 'zone') {
      zones.push({
        nom: (it.meta?.nom || '').trim(),
        type: (it.meta?.type || 'manuel').trim(),
        polygone: (it.polygone || []).map(arr2).filter(Boolean),
      });
    }
  });

  return {
    histoire: base.histoire || './assets/histoire.json',
    cibles: base.cibles || './assets/targets/polaroid.mind',
    polaroids,
    zones,
    indices,
    badges: base.badges || {},
  };
}

// Contrôles d'intégrité non bloquants : renvoie une liste d'avertissements lisibles.
export function avertissements(parcours) {
  const w = [];
  const p = parcours || {};
  if (!p.polaroids || !p.polaroids.length) w.push('Aucun polaroïd : le mode AR n’aura pas de point d’entrée.');
  (p.polaroids || []).forEach((x, i) => {
    if (!x.entree) w.push(`Polaroïd #${i} (cible ${x.cible}) : aucun passage d’entrée (champ "entree").`);
  });
  const cibles = (p.polaroids || []).map((x) => x.cible);
  if (new Set(cibles).size !== cibles.length) w.push('Deux polaroïds partagent le même index de cible.');
  (p.zones || []).forEach((z, i) => {
    if ((z.polygone || []).length < 3) w.push(`Zone #${i} ("${z.nom}") : moins de 3 points, polygone invalide.`);
  });
  return w;
}
