// ── CIELOS DE GUATEMALA ─────────────────────────────────────────────────────

const TRIGGER_ID = "__TRIGGER_ID__";
const APP_MARKER = "CG_APP_MARKER";

// ── OFFLINE COPY ────────────────────────────────────────────────────────────
// A saved copy carries a JSON snapshot (and optionally the photo pack) in the page.
const SNAPSHOT = (() => { try { const el = document.getElementById("cg-snapshot"); return el ? JSON.parse(el.textContent) : null; } catch { return null; } })();
const OFFLINE = !!SNAPSHOT;                     // a saved offline copy of the Claude build
const LOCAL = OFFLINE || PLATFORM === "web";    // data lives on this device
const BASE = SNAPSHOT || { sites: {}, forecasts: {}, log: {}, places: {}, loadout: { checked: {} } };
(() => { try { const el = document.getElementById("cg-photos"); if (el) PHOTOS.embedded = JSON.parse(el.textContent); } catch {} })();
if (PLATFORM === "web" && !PHOTOS.embedded) PHOTOS.url = "photos-public.json";
const EDITS_KEY = "cg-edits";
const CONFIG_REF = { appJs: null, photos: null };
const DEFAULT_STATUS = { cuch: "verified", tajumulco: "verified", chicabal: "verified", minas: "verified", antigua: "verified" };
const DEFAULT_SITES = LOCATIONS.map((l) => {
  const c = SITE_COORDS[l.id];
  const site = { ...l, lat: c[0], lon: c[1], elevM: c[2], status: DEFAULT_STATUS[l.id] || "scouting", custom: false };
  return PLATFORM === "web" ? publicSite(site) : site;
});
const LOADOUT_USE = PLATFORM === "web" ? LOADOUT_PUBLIC : LOADOUT;
const SITE_PREP_USE = PLATFORM === "web" ? SITE_PREP_PUBLIC : SITE_PREP;
const LOGISTICS_USE = PLATFORM === "web" ? LOGISTICS_PUBLIC : LOGISTICS_NOTES;
const adviceText = (lang, k) => { const t = ADVICE_TEXT[lang][k]; return PLATFORM === "web" ? t.replace(/the STC filter/g, "a dual-band filter").replace(/el filtro STC/g, "un filtro de banda dual") : t; };
const HL_BY_ID = Object.fromEntries(HIGHLIGHTS.map((h) => [h.id, h]));
const LENS_BY_ID = Object.fromEntries(LENSES.map((l) => [l.id, l]));
const TARGET_BY_ID = Object.fromEntries(TARGETS.map((t) => [t.id, t]));
const PLANETS_SHOWN = [["venus", "Venus", "#fff1b8"], ["mars", "Mars", "#ff8a6b"], ["jupiter", "Jupiter", "#ffd9a0"], ["saturn", "Saturn", "#f3e3a2"]];

const loadEdits = () => store.get(EDITS_KEY, {}) || {};
const saveEdits = (e) => { store.set(EDITS_KEY, e); return e; };
const applyEdits = (base, edits) => { const out = { ...(base || {}) }; for (const [id, d] of Object.entries(edits || {})) { if (d === null) delete out[id]; else out[id] = d; } return out; };
const countEdits = (e) => ["sites", "places", "log"].reduce((n, k) => n + Object.keys((e && e[k]) || {}).length, 0) + (e && e.loadout ? 1 : 0);
// Same call shape as the shared database, but writes to this device only
function offlineDb(setEdits) {
  return {
    doc(path) {
      const [col, id] = path.split("/");
      const put = (v) => { setEdits((e) => saveEdits({ ...e, [col]: { ...((e && e[col]) || {}), [id]: v } })); return Promise.resolve(); };
      return { set: (d) => put(d), delete: () => put(null) };
    },
  };
}
const nowIso = () => new Date().toISOString();
const kmBetween = (a, b) => {
  const dLat = (b.lat - a.lat) * RAD, dLon = (b.lon - a.lon) * RAD;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * RAD) * Math.cos(b.lat * RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
};
const getGps = () => new Promise((res, rej) => {
  if (!navigator.geolocation) return rej(new Error("unavailable"));
  navigator.geolocation.getCurrentPosition((p) => res(p.coords), rej, { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
});
const stampGT = (iso) => { if (!iso) return "—"; const d = new Date(iso); if (isNaN(d)) return "—"; const g = gt(d); return `${g.getUTCFullYear()}-${String(g.getUTCMonth() + 1).padStart(2, "0")}-${String(g.getUTCDate()).padStart(2, "0")} ${hhmm(d)}`; };

const AMENITIES = [
  ["lodging", "Lodging", "Hospedaje"], ["camping", "Camping OK", "Se acampa"], ["toilets", "Toilets", "Baños"],
  ["water", "Water", "Agua"], ["food", "Food", "Comida"], ["shop", "Shop", "Tienda"], ["fuel", "Fuel", "Gasolina"],
  ["power", "Power", "Electricidad"], ["signal", "Cell signal", "Señal"], ["wifi", "Wi-Fi", "Wi-Fi"],
  ["parking", "Safe parking", "Parqueo seguro"], ["guard", "Caretaker", "Guardián"], ["fee", "Entry fee", "Cobran entrada"],
  ["firewood", "Firewood", "Leña"], ["4x4", "4×4 only", "Solo 4×4"],
];
const AMEN_LABEL = Object.fromEntries(AMENITIES.map(([k, en, es]) => [k, { en, es }]));
const PLACE_KINDS = [
  ["hotel", "Hotel", "Hotel", "▣"], ["cabins", "Cabins", "Cabañas", "⌂"], ["hostel", "Guesthouse", "Hostal", "▤"],
  ["camp", "Campground", "Camping", "▲"], ["food", "Food", "Comedor", "◆"], ["fuel", "Fuel", "Gasolinera", "▮"],
  ["shop", "Shop", "Tienda", "▪"], ["health", "Clinic / pharmacy", "Clínica / farmacia", "✚"], ["other", "Other", "Otro", "●"],
];
const KIND = Object.fromEntries(PLACE_KINDS.map(([k, en, es, icon]) => [k, { en, es, icon }]));

// Strings for the field-kit additions (amenities, places, offline copy)
const UX = {
  en: {
    amen: "Amenities", nearby: "Nearby", noneNearby: "No saved places within 60 km yet.", edit: "Edit", cancel: "Cancel", save: "Save",
    editTitle: "Edit spot", placesTitle: "Lodging & services", placesHelp: "Hotels, cabins, comedores, fuel — anything useful near a spot. Distances are straight-line.",
    addPlace: "Add a place", editPlace: "Edit place", placeKind: "Type", phone: "Phone", price: "Price / night", placeNotes: "Notes: check-in, parking, sky view…",
    gps: "Use my GPS", gpsBusy: "Locating…", gpsFail: "No GPS in this view. Paste coordinates or a map link (GPS works in the offline copy).",
    coordsHelp: "Coordinates, or a Google Maps link with coordinates in it.", savedPlace: "Saved.", noPlaces: "No places saved yet.",
    fromActive: (km, name) => `${km} km from ${name}`, call: "Call", map: "Map", del: "Delete", confirmDel: "Tap again to delete",
    offTitle: "Offline copy", offDesc: "Saves this app as one file with the latest forecasts, your spots, places and log. It opens with no signal in a laptop browser or Chrome on Android. Changes made in it stay on that device until you import them here.",
    offSave: "Save offline copy", offPhotos: (kb) => `Include photos (+${kb} KB)`, offBusy: "Building the file…", offSaved: "Saved — open it from your downloads.", offDeclined: "Save cancelled.",
    offNoHtml: "This view can't save HTML files. Ask Claude in the chat for a fresh offline copy.", offFail: "Couldn't build the file. Try again, or ask Claude in the chat.", offNoCap: "Saving files isn't available in this view. Ask Claude in the chat for a fresh offline copy.",
    importTitle: "Bring back field notes", importDesc: "Import the notes file exported from an offline copy. New spots, places, edits and log entries merge in; newer changes here win.", importBtn: "Choose notes file",
    importDone: (n) => `Imported ${n} change${n === 1 ? "" : "s"}.`, importNone: "Nothing new in that file.", importBad: "That file isn't a field-notes export.",
    banner: (w) => `OFFLINE COPY · saved ${w}`, bannerSub: "Forecast refresh and the session planner need the live app. Edits stay on this device: export them from Expedition.",
    exportTitle: "Field notes", exportDesc: (n) => `${n} change${n === 1 ? "" : "s"} saved on this device since this copy was made.`, exportBtn: "Export field notes", exportDone: "Exported. Import the file in the live app: Expedition → Offline copy.",
  },
  es: {
    amen: "Servicios", nearby: "Cerca", noneNearby: "Aún no hay lugares guardados a menos de 60 km.", edit: "Editar", cancel: "Cancelar", save: "Guardar",
    editTitle: "Editar sitio", placesTitle: "Hospedaje y servicios", placesHelp: "Hoteles, cabañas, comedores, gasolineras: todo lo útil cerca de un sitio. Distancias en línea recta.",
    addPlace: "Agregar un lugar", editPlace: "Editar lugar", placeKind: "Tipo", phone: "Teléfono", price: "Precio / noche", placeNotes: "Notas: horario, parqueo, vista del cielo…",
    gps: "Usar mi GPS", gpsBusy: "Ubicando…", gpsFail: "No hay GPS en esta vista. Pega coordenadas o un enlace de mapa (el GPS funciona en la copia sin conexión).",
    coordsHelp: "Coordenadas, o un enlace de Google Maps que las incluya.", savedPlace: "Guardado.", noPlaces: "Aún no hay lugares guardados.",
    fromActive: (km, name) => `${km} km de ${name}`, call: "Llamar", map: "Mapa", del: "Borrar", confirmDel: "Toca otra vez para borrar",
    offTitle: "Copia sin conexión", offDesc: "Guarda la app en un solo archivo con los pronósticos más recientes, tus sitios, lugares y bitácora. Abre sin señal en el navegador de una laptop o en Chrome de Android. Lo que cambies ahí se queda en ese dispositivo hasta que lo importes aquí.",
    offSave: "Guardar copia sin conexión", offPhotos: (kb) => `Incluir fotos (+${kb} KB)`, offBusy: "Armando el archivo…", offSaved: "Guardado: ábrelo desde tus descargas.", offDeclined: "Guardado cancelado.",
    offNoHtml: "Esta vista no puede guardar archivos HTML. Pídele a Claude en el chat una copia nueva.", offFail: "No se pudo armar el archivo. Intenta de nuevo o pídelo a Claude en el chat.", offNoCap: "Guardar archivos no está disponible en esta vista. Pídele a Claude en el chat una copia nueva.",
    importTitle: "Traer notas de campo", importDesc: "Importa el archivo de notas exportado desde una copia sin conexión. Sitios, lugares, cambios y bitácora se combinan; gana lo más reciente de aquí.", importBtn: "Elegir archivo de notas",
    importDone: (n) => `${n} cambio${n === 1 ? "" : "s"} importado${n === 1 ? "" : "s"}.`, importNone: "Nada nuevo en ese archivo.", importBad: "Ese archivo no es una exportación de notas de campo.",
    banner: (w) => `COPIA SIN CONEXIÓN · guardada ${w}`, bannerSub: "Actualizar el pronóstico y el planificador requieren la app en vivo. Tus cambios se quedan en este dispositivo: expórtalos desde Expedición.",
    exportTitle: "Notas de campo", exportDesc: (n) => `${n} cambio${n === 1 ? "" : "s"} guardado${n === 1 ? "" : "s"} en este dispositivo desde que se hizo esta copia.`, exportBtn: "Exportar notas de campo", exportDone: "Exportado. Impórtalo en la app en vivo: Expedición → Copia sin conexión.",
  },
};

// ── UI STRINGS ──────────────────────────────────────────────────────────────
const UI = {
  en: {
    eyebrow: "Stargazing · Astrophotography · Dark skies",
    sub: "The night sky over Guatemala from 15°N — what's up tonight, where to look, and how to keep it dark",
    tabs: { tonight: "Tonight", sky: "Sky", targets: "Targets", gear: "Gear", calendar: "Calendar", sites: "Sites", dark: "Dark Skies", mentor: "Mentor", field: "Field", log: "Log" },
    site: "Site", night: "Night of", tonightBtn: "Tonight",
    statTargets: "TARGETS", statSites: "SITES VERIFIED",
    sunset: "Sunset", fullDark: "Full dark", darkEnds: "Dark ends", sunrise: "Sunrise",
    darkHrs: "h full dark", moon: "Moon", moonrise: "rises", moonset: "sets", moonInDark: "h of moonlight in full dark",
    forecast: "Cloud forecast", updated: "Updated", ago: "ago", via: "via",
    noFcNight: "No stored forecast covers this night. Forecasts reach a few days ahead.",
    noFcSite: "No forecast stored for this spot yet. The next scheduled refresh picks it up.",
    fcSignedOut: "Forecasts and your saved spots load when this page is open in Claude while signed in.",
    refresh: "Refresh forecast now", refreshing: "Refresh started. New data in a few minutes.",
    refreshFail: { approval_required: "Allow the connector when Claude asks, then tap again.", not_in_manifest: "The refresh connector isn't allowed for this page. Allow it in the page's permissions.", server_not_connected: "The Claude Code Remote connector isn't available on this account.", default: "Couldn't start the refresh. Try again later." },
    rows: { sky: "Sky", moon: "Moon", total: "Cloud", low: "Low", mid: "Mid", high: "High" },
    hourTable: { h: "Hour", c: "Cloud", lo: "Low", mi: "Mid", hi: "High", hum: "Hum", wind: "Wind", fog: "Fog", rain: "Rain" },
    verdict: { go: "GO", maybe: "MAYBE", nogo: "NO-GO", none: "NO DATA" },
    verdictWhy: (c, h) => `Avg cloud ${c}% during full dark · humidity up to ${h}%`,
    dewRisk: "High humidity: run the dew heaters from dusk.",
    links: { co: "Clear Outside", windy: "Windy", lp: "Light pollution", maps: "Map" },
    best: "Best targets this night", window: "Window", max: "max", fromMoon: "from Moon", moonDown: "Moon down",
    notUp: "Not up during full dark from here", showAll: "Show all", showTop: "Show top 10", openSky: "Find in sky",
    rigSplit: "Two-rig split", plannerTitle: "Session planner",
    plannerDesc: "Claude builds an hour-by-hour plan for both rigs from this night's computed windows, moon and cloud forecast.",
    planBtn: "Plan this night", planning: "Planning…", stop: "Stop",
    planErr: { not_granted: "Claude isn't allowed for this page.", rate_limited: "Too many requests. Try again in a while.", invalid_json: "The plan came back malformed. Try again.", default: "Couldn't build a plan. Try again." },
    skyTitle: "Sky from", time: "Time", target: "Target", now: "Now",
    pos: (az, dir, alt, f) => `Azimuth ${az}° (${dir}) · Altitude ${alt}° ≈ ${f} fists above the horizon`,
    belowHorizon: "Below the horizon at this time",
    rises: "Rises", transits: "Highest", sets: "Sets", findIt: "How to find it", about: "About",
    facts: { type: "Type", mag: "Magnitude", size: "Size", dist: "Distance", con: "Constellation", lenses: "Lenses" },
    stelLink: "Open in Stellarium Web", telLink: "Search Telescopius",
    gotoTip: (n) => `GTi: search “${n}” in SynScan Pro after alignment.`,
    fistNote: "A fist held at arm's length covers about 10°.",
    chartHelp: "Looking up with north at the top: east is on the left. Tap a target to select it.",
    tonightAt: "This night here", filters: { lens: "Lens", month: "Month", type: "Type" },
    clear: "Clear filters", count: (n) => `${n} targets`, markCaptured: "Mark captured", captured: "Captured", undo: "Undo",
    notePh: "Session note: lens, subs, conditions…", stcEss: "STC essential", stcRec: "STC recommended", ndReq: "ND100000 required",
    siteActive: "Active", setActive: "Use this site", verified: "VERIFIED", scouting: "SCOUTING", truck: "TRUCK", pack: "PACK-IN",
    markVerified: "Mark verified — I shot here", markScouting: "Move back to scouting", del: "Delete spot", confirmDel: "Tap again to delete",
    addTitle: "Add a scouting spot", addHelp: "Paste coordinates from Google Maps (long-press the spot, copy the numbers). New spots get forecasts from the next refresh.",
    f: { name: "Name", coords: "Coordinates (lat, lon)", elev: "Elevation (m)", bortle: "Bortle (1–9)", notes: "Notes: access, horizon, camping", truck: "Truck can reach it" },
    addBtn: "Save spot", added: "Saved. Forecast arrives with the next refresh.", badCoords: "Enter coordinates like 15.52, -91.55.", needName: "Give the spot a name.",
    tonightFc: "Cloud this night", exclTitle: "Only from low latitudes", seasonLbl: "Season", accessLbl: "Access",
    loadout: "Truck loadout", packed: "packed", reset: "Reset for next trip", prep: "Site prep — arrival to first frame", logi: "Guatemala logistics",
    logTitle: "Capture log", logEmpty: "Nothing logged yet. Open a target and mark it captured.", remove: "remove",
    gear: "Current kit", wf: "Session workflow", readOnly: "View only: changes are saved by the page owner.", noDb: "Saving is off in this view.",
    coordsNote: "Coordinates are approximate: refine them when you scout.",
  },
  es: {
    eyebrow: "Observación · Astrofotografía · Cielos oscuros",
    sub: "El cielo nocturno de Guatemala desde 15°N: qué hay esta noche, dónde mirar y cómo mantenerlo oscuro",
    tabs: { tonight: "Esta noche", sky: "Cielo", targets: "Objetivos", gear: "Equipo", calendar: "Calendario", sites: "Sitios", dark: "Cielos oscuros", mentor: "Mentor", field: "Campo", log: "Bitácora" },
    site: "Sitio", night: "Noche del", tonightBtn: "Hoy",
    statTargets: "OBJETIVOS", statSites: "SITIOS VERIFICADOS",
    sunset: "Ocaso", fullDark: "Oscuridad total", darkEnds: "Fin de oscuridad", sunrise: "Amanecer",
    darkHrs: "h de oscuridad total", moon: "Luna", moonrise: "sale", moonset: "se pone", moonInDark: "h de luz lunar en oscuridad total",
    forecast: "Pronóstico de nubes", updated: "Actualizado", ago: "atrás", via: "vía",
    noFcNight: "Ningún pronóstico guardado cubre esta noche. Llegan a unos pocos días.",
    noFcSite: "Aún no hay pronóstico para este sitio. La próxima actualización programada lo incluye.",
    fcSignedOut: "Los pronósticos y tus sitios guardados cargan cuando abres la página en Claude con tu sesión iniciada.",
    refresh: "Actualizar pronóstico ahora", refreshing: "Actualización iniciada. Datos nuevos en unos minutos.",
    refreshFail: { approval_required: "Permite el conector cuando Claude lo pida y vuelve a tocar.", not_in_manifest: "El conector de actualización no está permitido en esta página. Permítelo en los permisos.", server_not_connected: "El conector Claude Code Remote no está disponible en esta cuenta.", default: "No se pudo iniciar la actualización. Intenta más tarde." },
    rows: { sky: "Cielo", moon: "Luna", total: "Nubes", low: "Bajas", mid: "Medias", high: "Altas" },
    hourTable: { h: "Hora", c: "Nubes", lo: "Bajas", mi: "Medias", hi: "Altas", hum: "Hum", wind: "Viento", fog: "Niebla", rain: "Lluvia" },
    verdict: { go: "SALIR", maybe: "QUIZÁS", nogo: "NO SALIR", none: "SIN DATOS" },
    verdictWhy: (c, h) => `Nubes prom. ${c}% en oscuridad total · humedad hasta ${h}%`,
    dewRisk: "Humedad alta: enciende las bandas antivaho desde el anochecer.",
    links: { co: "Clear Outside", windy: "Windy", lp: "Contaminación lumínica", maps: "Mapa" },
    best: "Mejores objetivos esta noche", window: "Ventana", max: "máx", fromMoon: "de la Luna", moonDown: "Luna abajo",
    notUp: "No sube en oscuridad total desde aquí", showAll: "Ver todos", showTop: "Ver top 10", openSky: "Buscar en el cielo",
    rigSplit: "División de dos monturas", plannerTitle: "Planificador de sesión",
    plannerDesc: "Claude arma un plan hora por hora para ambas monturas con las ventanas calculadas, la luna y el pronóstico de esta noche.",
    planBtn: "Planificar esta noche", planning: "Planificando…", stop: "Detener",
    planErr: { not_granted: "Claude no está permitido en esta página.", rate_limited: "Demasiadas solicitudes. Intenta en un rato.", invalid_json: "El plan llegó mal formado. Intenta de nuevo.", default: "No se pudo armar el plan. Intenta de nuevo." },
    skyTitle: "Cielo desde", time: "Hora", target: "Objetivo", now: "Ahora",
    pos: (az, dir, alt, f) => `Acimut ${az}° (${dir}) · Altura ${alt}° ≈ ${f} puños sobre el horizonte`,
    belowHorizon: "Bajo el horizonte a esta hora",
    rises: "Sale", transits: "Más alto", sets: "Se pone", findIt: "Cómo encontrarlo", about: "Qué es",
    facts: { type: "Tipo", mag: "Magnitud", size: "Tamaño", dist: "Distancia", con: "Constelación", lenses: "Lentes" },
    stelLink: "Abrir en Stellarium Web", telLink: "Buscar en Telescopius",
    gotoTip: (n) => `GTi: busca “${n}” en SynScan Pro después de alinear.`,
    fistNote: "Un puño con el brazo estirado cubre unos 10°.",
    chartHelp: "Mirando hacia arriba con el norte arriba: el este queda a la izquierda. Toca un objetivo para elegirlo.",
    tonightAt: "Esta noche aquí", filters: { lens: "Lente", month: "Mes", type: "Tipo" },
    clear: "Limpiar filtros", count: (n) => `${n} objetivos`, markCaptured: "Marcar capturado", captured: "Capturado", undo: "Deshacer",
    notePh: "Nota de sesión: lente, subs, condiciones…", stcEss: "STC esencial", stcRec: "STC recomendado", ndReq: "Requiere ND100000",
    siteActive: "Activo", setActive: "Usar este sitio", verified: "VERIFICADO", scouting: "EXPLORAR", truck: "PICOP", pack: "A PIE",
    markVerified: "Marcar verificado — ya fotografié aquí", markScouting: "Regresar a explorar", del: "Borrar sitio", confirmDel: "Toca otra vez para borrar",
    addTitle: "Agregar un sitio por explorar", addHelp: "Pega coordenadas de Google Maps (mantén presionado el punto y copia los números). Los sitios nuevos reciben pronóstico en la próxima actualización.",
    f: { name: "Nombre", coords: "Coordenadas (lat, lon)", elev: "Altitud (m)", bortle: "Bortle (1–9)", notes: "Notas: acceso, horizonte, camping", truck: "El picop llega" },
    addBtn: "Guardar sitio", added: "Guardado. El pronóstico llega con la próxima actualización.", badCoords: "Escribe coordenadas como 15.52, -91.55.", needName: "Ponle nombre al sitio.",
    tonightFc: "Nubes esta noche", exclTitle: "Solo desde latitudes bajas", seasonLbl: "Temporada", accessLbl: "Acceso",
    loadout: "Carga del picop", packed: "empacado", reset: "Reiniciar para el próximo viaje", prep: "Preparación del sitio — de la llegada al primer disparo", logi: "Logística de Guatemala",
    logTitle: "Bitácora de capturas", logEmpty: "Nada registrado aún. Abre un objetivo y márcalo capturado.", remove: "quitar",
    gear: "Equipo actual", wf: "Flujo de sesión", readOnly: "Solo lectura: los cambios los guarda el dueño de la página.", noDb: "Guardar está desactivado en esta vista.",
    coordsNote: "Coordenadas aproximadas: afínalas al explorar.",
  },
};

// ── HELPERS ─────────────────────────────────────────────────────────────────
const typeLabel = (t, lang) => (lang === "es" ? TYPE_ES[t] || t : t);
const monthLabel = (m, lang) => (lang === "es" ? MONTH_ES[m] : m);
const rigTags = (t) => {
  const g = t.lenses.some((l) => RIGS.gti.lenses.includes(l));
  const s = t.lenses.some((l) => RIGS.sa2i.lenses.includes(l));
  return [g && "GTi", s && "SA2i"].filter(Boolean);
};
const fcDate = (t) => new Date(`${t}:00-06:00`);
const toKmh = (v, u) => (u === "mph" ? Math.round(v * 1.609) : Math.round(v));
const agoText = (iso, lang) => {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return lang === "es" ? `hace ${m} min` : `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return lang === "es" ? `hace ${h} h` : `${h} h ago`;
  return lang === "es" ? `hace ${Math.round(h / 24)} días` : `${Math.round(h / 24)} days ago`;
};
const parseCoords = (s) => {
  const str = String(s || "").trim();
  const ok = (lat, lon) => (isFinite(lat) && isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : null);
  let m = str.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/) || str.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/)
    || str.match(/[?&](?:q|query|ll|destination|center|sll)=(-?\d+(?:\.\d+)?)(?:,|%2C)\s*(-?\d+(?:\.\d+)?)/i);
  if (m) return ok(Number(m[1]), Number(m[2]));
  const dms = str.match(/(\d+(?:\.\d+)?)°\s*(?:(\d+(?:\.\d+)?)['′]\s*)?(?:(\d+(?:\.\d+)?)["″]\s*)?([NS])[\s,]+(\d+(?:\.\d+)?)°\s*(?:(\d+(?:\.\d+)?)['′]\s*)?(?:(\d+(?:\.\d+)?)["″]\s*)?([EWO])/i);
  if (dms) {
    const v = (d, mi, se, h) => (Number(d) + Number(mi || 0) / 60 + Number(se || 0) / 3600) * (/[SWO]/i.test(h) ? -1 : 1);
    return ok(v(dms[1], dms[2], dms[3], dms[4]), v(dms[5], dms[6], dms[7], dms[8]));
  }
  m = str.replace(/[°NSEW]/gi, " ").match(/(-?\d+(?:\.\d+)?)[,\s]+(-?\d+(?:\.\d+)?)/);
  return m ? ok(Number(m[1]), Number(m[2])) : null;
};
const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "spot";

function forecastNight(fc, night) {
  if (!fc || !Array.isArray(fc.hours) || !night.sunset || !night.sunrise) return null;
  const a = night.sunset.getTime() - 3600000, b = night.sunrise.getTime() + 3600000;
  const rows = fc.hours.map((h) => ({ ...h, d: fcDate(h.t) })).filter((h) => !isNaN(h.d) && h.d.getTime() >= a && h.d.getTime() <= b);
  if (!rows.length) return null;
  const d0 = night.astroDusk ? night.astroDusk.getTime() - 3600000 : a, d1 = night.astroDawn ? night.astroDawn.getTime() : b;
  const dark = rows.filter((h) => h.d.getTime() >= d0 && h.d.getTime() <= d1);
  const use = dark.length ? dark : rows;
  const avg = (k) => Math.round(use.reduce((s, h) => s + (Number(h[k]) || 0), 0) / use.length);
  const c = avg("c"), maxHum = Math.max(...use.map((h) => Number(h.hum) || 0));
  const verdict = c <= 25 && maxHum < 95 ? "go" : c <= 55 ? "maybe" : "nogo";
  return { rows, dark: use, c, lo: avg("lo"), mi: avg("mi"), hi: avg("hi"), maxHum, verdict };
}

function scoreTarget(t, tn) {
  if (!tn || !tn.winStart) return -1;
  return t.priority + Math.min(tn.winHours, 6) * 0.55 + (tn.best.alt / 90) * 2 - tn.moonFactor * 3;
}

// ── SMALL PIECES ────────────────────────────────────────────────────────────
const STAR_FIELD = Array.from({ length: 80 }, (_, i) => ({
  x: (i * 37.7) % 100, y: (i * 53.3) % 100, s: i % 4 === 0 ? 3 : 2, d: 2.5 + (i % 7) * 0.8, dl: (i % 5) * 0.9,
  c: i % 13 === 0 ? "var(--gold)" : i % 7 === 0 ? "var(--blue-soft)" : "#cfd6ff",
}));
function StarField() {
  return (
    <div className="pixel-stars" aria-hidden="true">
      {STAR_FIELD.map((s, i) => (
        <span key={i} className="pstar" style={{ left: s.x + "%", top: s.y + "%", width: s.s, height: s.s, background: s.c, animationDuration: s.d + "s", animationDelay: s.dl + "s" }} />
      ))}
    </div>
  );
}
const Pri = ({ p }) => <span className="priority">{p === 3 ? "★★★" : p === 2 ? "★★" : "★"}</span>;
const RigTag = ({ r }) => <span className={`rig-tag ${r === "GTi" ? "gti" : "sa2i"}`}>{r}</span>;
function Links({ items }) {
  return <div className="link-row">{items.map(([href, label]) => <a key={href} className="link-btn" href={href} target="_blank" rel="noopener noreferrer">{label} ↗</a>)}</div>;
}

// ── NIGHT TIMELINE ──────────────────────────────────────────────────────────
function Timeline({ night, fcn, u }) {
  if (!night.sunset || !night.sunrise) return null;
  const x0 = night.sunset.getTime() - 1800000, x1 = night.sunrise.getTime() + 1800000, span = x1 - x0;
  const pct = (t) => Math.max(0, Math.min(100, ((t - x0) / span) * 100));
  const skyCat = (alt) => (alt > -0.833 ? "day" : alt > -6 ? "civil" : alt > -12 ? "naut" : alt > -18 ? "astro" : "dark");
  const runs = (samples, fn) => {
    const out = [];
    for (const smp of samples) {
      const t = smp.t.getTime();
      if (t + 300000 < x0 || t > x1) continue;
      const k = fn(smp.v), last = out[out.length - 1];
      if (last && last.k === k) last.e = t + 300000; else out.push({ k, s: t, e: t + 300000 });
    }
    return out;
  };
  const sky = runs(night.sunSamples, skyCat);
  const moon = runs(night.moonSamples, (v) => (v > 0 ? "up" : "down"));
  const ticks = [];
  for (let t = Math.ceil(x0 / 3600000) * 3600000; t <= x1; t += 3600000) ticks.push(t);
  const cloudRow = (key) => (fcn ? fcn.rows.map((h) => {
    const v = Number(h[key]) || 0, t = h.d.getTime();
    return <span key={key + t} className="tl-cell" title={`${hhmm(h.d)} · ${v}%`} style={{ left: pct(t) + "%", width: (100 * 3600000) / span + "%", background: `color-mix(in srgb, var(--cloud) ${v}%, var(--clear))` }} />;
  }) : null);
  return (
    <div className="timeline">
      <div className="tl-row"><span className="tl-lab">{u.rows.sky}</span><div className="tl-track">
        {sky.map((r, i) => <span key={i} className={`tl-cell sky-${r.k}`} style={{ left: pct(r.s) + "%", width: pct(r.e) - pct(r.s) + "%" }} />)}
      </div></div>
      <div className="tl-row"><span className="tl-lab">{u.rows.moon}</span><div className="tl-track">
        {moon.filter((r) => r.k === "up").map((r, i) => <span key={i} className="tl-cell moon-up" style={{ left: pct(r.s) + "%", width: pct(r.e) - pct(r.s) + "%", opacity: 0.25 + 0.75 * night.moon.illum / 100 }} />)}
      </div></div>
      {fcn && [["c", u.rows.total], ["lo", u.rows.low], ["mi", u.rows.mid], ["hi", u.rows.high]].map(([k, lab]) => (
        <div key={k} className={`tl-row ${k === "c" ? "" : "tl-thin"}`}><span className="tl-lab">{lab}</span><div className="tl-track">{cloudRow(k)}</div></div>
      ))}
      <div className="tl-row tl-ticks"><span className="tl-lab" /><div className="tl-track">
        {ticks.map((t, i) => (i % 2 === 0 ? <span key={t} className="tl-tick" style={{ left: pct(t) + "%" }}>{hhmm(new Date(t)).slice(0, 2)}h</span> : null))}
      </div></div>
    </div>
  );
}

// ── SKY CHART ───────────────────────────────────────────────────────────────
function SkyChart({ site, jd, items, selectedId, onSelect, canSelect, track, lang }) {
  const S = 340, C = S / 2, R = 150;
  const proj = (alt, az) => { const r = R * (90 - alt) / 90; return [C - r * Math.sin(az * Math.PI / 180), C - r * Math.cos(az * Math.PI / 180)]; };
  const hopText = selectedId ? `${(CATALOG[selectedId] && CATALOG[selectedId].hop) || (HL_BY_ID[selectedId] && HL_BY_ID[selectedId].find) || ""}` : "";
  const stars = GUIDE_STARS.map(([n, ra, dec, mag]) => {
    const p = precess(ra * 15, dec, jd), h = altAz(p.ra, p.dec, site.lat, site.lon, jd);
    return { n, mag, ...h };
  }).filter((s) => s.alt > 0);
  const bodyName = (b) => (PLANET_INFO[b] ? tr(PLANET_INFO[b], "name", lang) : b);
  const bodies = [...PLANETS_SHOWN.map(([b, , col]) => ({ b, col })), { b: "moon", col: "#efe6c2" }]
    .map((p) => ({ ...p, n: bodyName(p.b), ...bodyAltAz({ body: p.b }, site, jd) })).filter((p) => p.alt > 0);
  const marks = items.filter((it) => it.obj && !it.obj.body && it.obj.body !== "sun").map((it) => {
    const h = bodyAltAz(it.obj, site, jd);
    return h.alt > 0 ? { ...it, xy: proj(h.alt, h.az) } : null;
  }).filter(Boolean);
  // Labels: the selected object first, then planets, bright and hop stars, then other marks — skipping any that would collide
  const boxes = [];
  const free = (x, y, w, h) => x >= 2 && x + w <= S - 2 && y - h >= 2 && y <= S - 2 && !boxes.some((q) => x < q.x + q.w && x + w > q.x && y - h < q.y && y > q.y - q.h);
  const place = (text, [x, y], cls, fs, gap, force) => {
    const w = text.length * fs * 0.56, h = fs;
    const spots = [[gap, -gap / 2], [gap, fs + gap / 2], [-gap - w, -gap / 2], [-gap - w, fs + gap / 2], [-w / 2, -gap - 2], [-w / 2, fs + gap + 2]];
    for (const [dx, dy] of spots) {
      const lx = x + dx, ly = y + dy;
      if (free(lx, ly, w, h)) { boxes.push({ x: lx, y: ly, w, h }); return { text, x: lx, y: ly, cls }; }
    }
    if (!force) return null;
    boxes.push({ x: x + gap, y: y - gap / 2, w, h });
    return { text, x: x + gap, y: y - gap / 2, cls };
  };
  // markers themselves are obstacles, so labels never cover a star, planet or cross
  stars.forEach((st) => { const [x, y] = proj(st.alt, st.az); boxes.push({ x: x - 2.5, y: y + 2.5, w: 5, h: 5 }); });
  marks.forEach((m) => boxes.push({ x: m.xy[0] - 5, y: m.xy[1] + 5, w: 10, h: 10 }));
  bodies.forEach((p) => { const [x, y] = proj(p.alt, p.az); boxes.push({ x: x - 6, y: y + 6, w: 12, h: 12 }); });
  const labels = [];
  const selBody = bodies.find((p) => p.b === selectedId);
  const selMark = marks.find((m) => m.id === selectedId);
  if (selBody) labels.push(place(selBody.n, proj(selBody.alt, selBody.az), "sc-lab sc-lab-sel", 12, 9, true));
  if (selMark) labels.push(place(selMark.label, selMark.xy, "sc-lab sc-lab-sel", 12, 9, true));
  bodies.filter((p) => p !== selBody).forEach((p) => labels.push(place(p.n, proj(p.alt, p.az), "sc-lab sc-planet", 10.5, 6, true)));
  stars.filter((st) => st.mag < 1.0 || hopText.includes(st.n)).sort((x, y) => x.mag - y.mag)
    .forEach((st) => labels.push(place(st.n, proj(st.alt, st.az), hopText.includes(st.n) ? "sc-lab sc-lab-hop" : "sc-lab", 10.5, 4, hopText.includes(st.n))));
  marks.filter((m) => m !== selMark).forEach((m) => labels.push(place(m.label, m.xy, "sc-lab sc-lab-mark", 9.5, 6, false)));
  const cards = lang === "es" ? ["N", "E", "S", "O"] : ["N", "E", "S", "W"];
  const pick = (id) => (canSelect ? canSelect(id) : true) && onSelect(id);
  const key = (id) => (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(id); } };
  return (
    <svg className="sky-chart" viewBox={`0 0 ${S} ${S}`} role="img" aria-label={lang === "es" ? "Mapa del cielo" : "Sky chart"}>
      <circle cx={C} cy={C} r={R} className="sc-disc" />
      {[30, 60].map((a) => <circle key={a} cx={C} cy={C} r={R * (90 - a) / 90} className="sc-ring" />)}
      <line x1={C - R} y1={C} x2={C + R} y2={C} className="sc-ring" /><line x1={C} y1={C - R} x2={C} y2={C + R} className="sc-ring" />
      {[[0, cards[0]], [90, cards[1]], [180, cards[2]], [270, cards[3]]].map(([az, l]) => {
        const [x, y] = proj(-9, az); return <text key={l} x={x} y={y + 4} className="sc-card">{l}</text>;
      })}
      <text x={C + 3} y={C - R * 60 / 90 + 10} className="sc-ringlab">30°</text>
      <text x={C + 3} y={C - R * 30 / 90 + 10} className="sc-ringlab">60°</text>
      {track && track.length > 1 && <polyline className="sc-track" points={track.filter((p) => p.alt > 0).map((p) => proj(p.alt, p.az).join(",")).join(" ")} />}
      {stars.map((st) => {
        const [x, y] = proj(st.alt, st.az); const w = st.mag < 0.5 ? 4 : st.mag < 1.6 ? 3 : 2;
        return <rect key={st.n} x={x - w / 2} y={y - w / 2} width={w} height={w} className="sc-star" />;
      })}
      {marks.map((m) => {
        const [x, y] = m.xy; const on = m.id === selectedId;
        return (
          <g key={m.id} className="sc-target" onClick={() => pick(m.id)} role="button" tabIndex={0} aria-label={m.label} onKeyDown={key(m.id)}>
            <rect x={x - 9} y={y - 9} width={18} height={18} fill="transparent" />
            <path d={`M${x - (on ? 7 : 4)} ${y}H${x + (on ? 7 : 4)}M${x} ${y - (on ? 7 : 4)}V${y + (on ? 7 : 4)}`} className={on ? "sc-cross sc-cross-on" : "sc-cross"} />
          </g>
        );
      })}
      {bodies.map((p) => {
        const [x, y] = proj(p.alt, p.az); const on = p.b === selectedId, moonB = p.b === "moon", sz = moonB ? 12 : 6;
        const clickable = canSelect ? canSelect(p.b) : true;
        return (
          <g key={p.b} className={clickable ? "sc-target" : ""} onClick={clickable ? () => pick(p.b) : undefined} role={clickable ? "button" : undefined} tabIndex={clickable ? 0 : undefined} aria-label={p.n} onKeyDown={clickable ? key(p.b) : undefined}>
            <rect x={x - 10} y={y - 10} width={20} height={20} fill="transparent" />
            {moonB ? <circle cx={x} cy={y} r={6} className="sc-moon" /> : <rect x={x - sz / 2} y={y - sz / 2} width={sz} height={sz} fill={p.col} />}
            {on && <circle cx={x} cy={y} r={moonB ? 10 : 7} className="sc-ring-on" />}
          </g>
        );
      })}
      {labels.filter(Boolean).map((l, i) => <text key={i} x={l.x} y={l.y} className={l.cls}>{l.text}</text>)}
    </svg>
  );
}

// ── TARGET DETAIL (shared by Sky and Targets) ───────────────────────────────
function ObjectFacts({ t, lang, u }) {
  const c = CATALOG[t.id] || {};
  const L = objLinks(c);
  return (
    <div className="obj-facts">
      <div className="facts-grid">
        <span>{u.facts.type}</span><b>{typeLabel(t.type, lang)}</b>
        <span>{u.facts.mag}</span><b>{factText(c.mag, lang)}</b>
        <span>{u.facts.size}</span><b>{factText(c.size, lang)}</b>
        <span>{u.facts.dist}</span><b>{factText(c.dist, lang)}</b>
        <span>{u.facts.con}</span><b>{factText(c.con, lang)}</b>
      </div>
      <p className="obj-p"><span className="obj-h">{u.about}</span>{tr(c, "info", lang)}</p>
      <p className="obj-p"><span className="obj-h">{u.findIt}</span>{tr(c, "hop", lang)}</p>
      <p className="obj-note">{u.fistNote} {!c.body && rigTags(t).includes("GTi") ? u.gotoTip(c.stel) : ""}</p>
      <Links items={[[L.stellarium, u.stelLink], [L.telescopius, u.telLink]]} />
    </div>
  );
}

// ── WEB FORECASTS (Open-Meteo, straight from the browser) ───────────────────
const OM_TTL = 60 * 60000;
async function fetchOpenMeteo(list) {
  const lat = list.map((s) => s.lat.toFixed(4)).join(","), lon = list.map((s) => s.lon.toFixed(4)).join(",");
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,relative_humidity_2m,dew_point_2m,temperature_2m,wind_speed_10m,visibility,precipitation_probability&timezone=America%2FGuatemala&forecast_days=4&wind_speed_unit=kmh`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Open-Meteo ${r.status}`);
  const j = await r.json();
  const arr = Array.isArray(j) ? j : [j];
  return arr.map((d, i) => {
    const h = d.hourly || {}, n = (h.time || []).length;
    const hours = Array.from({ length: n }, (_, k) => ({
      t: h.time[k], c: h.cloud_cover[k], lo: h.cloud_cover_low[k], mi: h.cloud_cover_mid[k], hi: h.cloud_cover_high[k],
      hum: h.relative_humidity_2m[k], dew: h.dew_point_2m[k], temp: h.temperature_2m[k], wind: h.wind_speed_10m[k],
      vis: h.visibility[k] != null ? Math.round(h.visibility[k] / 100) / 10 : null, rain: h.precipitation_probability[k], fog: null,
    }));
    return { siteId: list[i].id, lat: list[i].lat, lon: list[i].lon, source: "Open-Meteo", url: "https://open-meteo.com/", fetchedAt: nowIso(), windUnit: "km/h", visUnit: "km", tempUnit: "C", hours };
  });
}
function useWebForecasts(sites, enabled) {
  const [fc, setFc] = useState(() => (enabled ? store.get("cg-fc", {}) : {}));
  const [state, setState] = useState("idle");
  const key = sites.map((s) => `${s.id}:${s.lat.toFixed(3)},${s.lon.toFixed(3)}`).join("|");
  const load = async (force) => {
    if (!enabled) return;
    const now = Date.now();
    const need = sites.filter((s) => {
      const d = fc[s.id];
      return force || !d || now - new Date(d.fetchedAt).getTime() > OM_TTL || Math.abs(d.lat - s.lat) > 0.005 || Math.abs(d.lon - s.lon) > 0.005;
    });
    if (!need.length) return;
    setState("busy");
    try {
      const next = { ...fc };
      for (let i = 0; i < need.length; i += 40) (await fetchOpenMeteo(need.slice(i, i + 40))).forEach((d) => { next[d.siteId] = d; });
      setFc(next); store.set("cg-fc", next); setState("ok");
    } catch { setState("error"); }
  };
  useEffect(() => { load(false); }, [key, enabled]);
  return [fc, state, () => load(true)];
}

// ── APP ─────────────────────────────────────────────────────────────────────
const TABS_STAR = ["tonight", "sky", "calendar", "sites", "dark", "mentor"];
const TABS_PHOTO = ["tonight", "sky", "targets", "gear", "calendar", "sites", "field", "log", "dark", "mentor"];
function App() {
  const [lang, setLangState] = useState(() => store.get("cg-lang", PLATFORM === "web" ? "es" : "en"));
  const u = UI[lang];
  const setLang = (v) => { setLangState(v); store.set("cg-lang", v); try { document.documentElement.lang = v; } catch {} };
  const [mode, setMode] = useMode();
  const [theme] = useTheme();
  const tabs = mode === "photo" ? TABS_PHOTO : TABS_STAR;
  useEffect(() => { try { document.documentElement.lang = lang; } catch {} }, [lang]);
  const [tabSel, setTab] = useState(() => location.hash.slice(1) || "tonight");
  const tab = tabs.includes(tabSel) ? tabSel : "tonight";
  const [siteId, setSiteIdState] = useState(() => store.get("cg-site", (SNAPSHOT && SNAPSHOT.siteId) || (PLATFORM === "web" ? "antigua" : "cuch")));
  const setSiteId = (v) => { setSiteIdState(v); store.set("cg-site", v); };
  const [dateStr, setDateStr] = useState(todayGT);

  // capabilities + data
  const [caps, setCaps] = useState({ db: null, sample: null, mcp: null, downloads: null, ready: false });
  const [canEdit, setCanEdit] = useState(true);
  const [liveSites, setLiveSites] = useState(null);
  const [liveForecasts, setLiveForecasts] = useState({});
  const [liveLog, setLiveLog] = useState({});
  const [liveLoadout, setLiveLoadout] = useState({});
  const [livePlaces, setLivePlaces] = useState({});
  const [edits, setEdits] = useState(() => (LOCAL ? loadEdits() : {}));
  useEffect(() => {
    let alive = true; const unsubs = [];
    if (LOCAL) { setCaps({ db: offlineDb(setEdits), sample: null, mcp: null, downloads: null, ready: true }); return () => {}; }
    (async () => {
      const c = window.claude;
      if (!c || typeof c.use !== "function") { setCaps((s) => ({ ...s, ready: true })); return; }
      const [db, user, sample, mcp, downloads] = await Promise.all(["db", "user", "sample", "mcp", "downloads"].map((n) => c.use(n).catch(() => null)));
      if (!alive) return;
      setCaps({ db, sample, mcp, downloads, ready: true });
      if (user) user.canEdit().then((v) => alive && setCanEdit(v !== false)).catch(() => {});
      if (db) {
        const docs = (s) => Object.fromEntries(s.docs.map((d) => [d.id, d.data()]));
        unsubs.push(db.collection("sites").onSnapshot((s) => setLiveSites(docs(s)), () => {}));
        unsubs.push(db.collection("forecasts").onSnapshot((s) => setLiveForecasts(docs(s)), () => {}));
        unsubs.push(db.collection("log").onSnapshot((s) => setLiveLog(docs(s)), () => {}));
        unsubs.push(db.collection("places").onSnapshot((s) => setLivePlaces(docs(s)), () => {}));
        unsubs.push(db.doc("loadout/state").onSnapshot((d) => setLiveLoadout((d.exists && d.data().checked) || {}), () => {}));
        unsubs.push(db.doc("config/app").onSnapshot((d) => {
          const cfg = (d.exists && d.data()) || {};
          CONFIG_REF.appJs = typeof cfg.appJs === "string" ? cfg.appJs : null;
          CONFIG_REF.photos = typeof cfg.photos === "string" ? cfg.photos : null;
          if (CONFIG_REF.photos && /^[0-9a-f]{32}$/.test(CONFIG_REF.photos) && !PHOTOS.url) {
            PHOTOS.url = "/_blob/" + CONFIG_REF.photos;
            if (PHOTOS.status === "unavailable") PHOTOS.status = "idle";
            if (store.get("cg-photos", false)) loadPhotos(); else photosNotify();
          }
        }, () => {}));
      }
    })();
    return () => { alive = false; unsubs.forEach((f) => f()); };
  }, []);
  const db = caps.db;
  const writable = !!db && (LOCAL || canEdit);
  const dbSites = LOCAL ? applyEdits(BASE.sites, edits.sites) : liveSites;
  const log = useMemo(() => (LOCAL ? applyEdits(BASE.log, edits.log) : liveLog), [edits, liveLog]);
  const places = useMemo(() => (LOCAL ? applyEdits(BASE.places, edits.places) : livePlaces), [edits, livePlaces]);
  const loadout = LOCAL ? ((edits.loadout && edits.loadout.state) || BASE.loadout || {}).checked || {} : liveLoadout;

  const sites = useMemo(() => {
    const base = Object.fromEntries(DEFAULT_SITES.map((s) => [s.id, s]));
    if (dbSites) for (const [id, d] of Object.entries(dbSites)) base[id] = { ...(base[id] || {}), ...(PLATFORM === "web" ? publicSite(d) : d), id };
    return Object.values(base).filter((s) => typeof s.lat === "number" && typeof s.lon === "number");
  }, [LOCAL ? edits : liveSites]);
  const site = sites.find((s) => s.id === siteId) || sites[0];
  const [webFc, webFcState, refreshWebFc] = useWebForecasts(sites, PLATFORM === "web");
  const forecasts = PLATFORM === "web" ? webFc : OFFLINE ? BASE.forecasts || {} : liveForecasts;

  // night computations
  const night = useMemo(() => nightInfo(site, dateStr), [site.lat, site.lon, dateStr]);
  const monthKey = monthKeyGT(dateStr);
  const nights = useMemo(() => {
    const out = {};
    for (const t of TARGETS) { if (t.type === "Solar") continue; const c = CATALOG[t.id]; if (c) out[t.id] = targetNight(c, site, night, t.type); }
    return out;
  }, [night]);
  const ranked = useMemo(() => TARGETS.filter((t) => t.type !== "Solar" && showerOk(t, dateStr))
    .map((t) => ({ t, tn: nights[t.id], score: scoreTarget(t, nights[t.id]) + (t.window.includes(monthKey) ? 0.4 : 0) }))
    .filter((x) => x.score > 0).sort((a, b) => b.score - a.score), [nights, monthKey, dateStr]);
  const fc = forecasts[site.id];
  const fcn = useMemo(() => forecastNight(fc, night), [fc, night]);
  const hl = useMemo(() => highlightsTonight(site, night, dateStr), [site.lat, site.lon, site.bortle, night]);

  const collectSnapshot = () => ({
    kind: "cg-snapshot", version: APP_VERSION, savedAt: nowIso(), lang, siteId: site.id,
    sites: dbSites || {}, forecasts, log, places, loadout: { checked: loadout },
  });
  const mentorContext = () => {
    const [kit] = [KIT_S.v]; const K = kitInfo(kit);
    const up = hl.evening.slice(0, 8).map((x) => `${x.name} (${x.how.join("/")}, best ${hhmm(x.best.t)} ${compass(x.best.az, "en")} ${Math.round(x.best.alt)}°)`).join("; ");
    return [`Date: ${dateStr} (Guatemala time). Site: ${site.name}, ${site.lat.toFixed(2)}, ${site.lon.toFixed(2)}, Bortle ${site.bortle ?? "?"}, ${site.elevM || "?"} m.`,
      `Sun sets ${hhmm(night.sunset)}, full dark ${hhmm(night.astroDusk)}–${hhmm(night.astroDawn)}. Moon ${night.moon.phase} ${night.moon.illum}%, rises ${hhmm(night.moonrise)}, sets ${hhmm(night.moonset)}.`,
      fcn ? `Cloud forecast during darkness: average ${fcn.c}%, humidity up to ${fcn.maxHum}%.` : "No cloud forecast loaded.",
      `Visible this evening: ${up || "nothing notable"}.`,
      `User mode: ${mode === "photo" ? "astrophotographer" : "stargazer"}. Kit: ${K.body.name}; trackers: ${kit.trackers.map((t) => TRACKERS[t].name).join(", ")}.`].join("\n");
  };

  const [skyTarget, setSkyTarget] = useState(null);
  const goSky = (id) => { setSkyTarget(id); pickTab("sky"); window.scrollTo({ top: 0 }); };
  const pickTab = (k) => { setTab(k); try { history.replaceState(null, "", "#" + k); } catch {} };
  const goTab = (k) => {
    if (!tabs.includes(k) && TABS_PHOTO.includes(k)) setMode("photo"); // photo lessons open the photographer tabs
    pickTab(tabs.includes(k) || TABS_PHOTO.includes(k) ? k : "tonight"); window.scrollTo({ top: 0 });
  };

  const [prog] = useProgress();
  const capturedCount = Object.keys(log).length;
  const verifiedCount = sites.filter((s) => s.status === "verified").length;
  const lessonsDone = LESSONS.filter((l) => prog.lessons[l.id]).length;

  return (
    <>
      {theme === "pixel" ? <StarField /> : <SkyBackdrop lat={site.lat} lon={site.lon} />}
      <div className="app">
        <header className="header">
          <TopControls lang={lang} setLang={setLang} />
          <div className="header-eyebrow">{OFFLINE ? (lang === "es" ? "Copia sin conexión" : "Offline copy") : u.eyebrow}</div>
          <h1 className="header-title">{theme === "pixel" ? "CIELOS DE GUATEMALA" : APP_NAME}<span className="blink">_</span></h1>
          <div className="header-sub">{u.sub}</div>
          <div className="stats-strip">
            {mode === "photo" && <div className="stat"><span className="stat-label">{u.statTargets} <b>{capturedCount}</b>/{TARGETS.length}</span><div className="pbar"><div className="pbar-fill" style={{ width: `${Math.round(capturedCount / TARGETS.length * 100)}%` }} /></div></div>}
            {mode === "photo" && PLATFORM !== "web" && <div className="stat"><span className="stat-label">{u.statSites} <b>{verifiedCount}</b>/{sites.length}</span><div className="pbar"><div className="pbar-fill green" style={{ width: `${Math.round(verifiedCount / sites.length * 100)}%` }} /></div></div>}
            <div className="stat"><span className="stat-label">{MENTOR_TEXT[lang].progress(lessonsDone, LESSONS.length)}</span><div className="pbar"><div className="pbar-fill green" style={{ width: `${Math.round(lessonsDone / LESSONS.length * 100)}%` }} /></div></div>
          </div>
        </header>

        <nav className="tabs">{tabs.map((k) => <button key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => pickTab(k)}>{u.tabs[k]}{k === "log" && capturedCount > 0 && <span className="badge">{capturedCount}</span>}</button>)}</nav>
        {OFFLINE && <div className="offline-banner"><b>▣ {UX[lang].banner(stampGT(SNAPSHOT.savedAt))}</b><span>{UX[lang].bannerSub}</span></div>}

        {["tonight", "sky", "targets", "sites"].includes(tab) && (
          <div className="control-bar">
            <label className="ctl"><span className="control-label">{u.site}</span>
              <select id="site-select" className="input" value={site.id} onChange={(e) => setSiteId(e.target.value)}>
                {sites.map((s) => <option key={s.id} value={s.id}>{PLATFORM === "web" ? "" : s.status === "verified" ? "⛺ " : "⌖ "}{siteName(s, lang)} · B{s.bortle ?? "?"}</option>)}
              </select></label>
            <label className="ctl"><span className="control-label">{u.night}</span>
              <span className="date-wrap"><input id="night-date" className="input" type="date" value={dateStr} onChange={(e) => e.target.value && setDateStr(e.target.value)} />
                <button className="mini-btn" onClick={() => setDateStr(todayGT())}>{u.tonightBtn}</button></span></label>
          </div>
        )}

        {tab === "tonight" && <TonightTab {...{ u, lang, mode, site, night, fc, fcn, ranked, nights, log, caps, dateStr, goSky, hl, webFcState, refreshWebFc }} />}
        {tab === "sky" && <SkyTab {...{ u, lang, mode, site, night, ranked, nights, skyTarget, setSkyTarget, hl, goGear: () => goTab("gear") }} />}
        {tab === "targets" && <TargetsTab {...{ u, lang, site, night, nights, log, db, writable, goSky, monthKey, goGear: () => goTab("gear") }} />}
        {tab === "gear" && <GearTab lang={lang} />}
        {tab === "calendar" && <CalendarTab {...{ lang, site, mode, goSky }} />}
        {tab === "sites" && <SitesTab {...{ u, lang, sites, site, setSiteId, forecasts, db, writable, dateStr, places }} />}
        {tab === "dark" && <DarkSkyTab {...{ lang, site }} />}
        {tab === "mentor" && <MentorTab {...{ lang, mode, caps, goTab, goSky, context: mentorContext }} />}
        {tab === "field" && <ExpeditionTab {...{ u, lang, loadout, db, writable, caps, collectSnapshot, edits, current: { sites: dbSites || {}, places, log } }} />}
        {tab === "log" && <LogTab {...{ u, lang, log, db, writable }} />}
        {PLATFORM === "claude" && caps.ready && !db && <p className="foot-note">{u.fcSignedOut}</p>}
        <Footer lang={lang} />
      </div>
      {theme === "red" && <div className="red-filter" aria-hidden="true" />}
    </>
  );
}

function Footer({ lang }) {
  const es = lang === "es";
  return (
    <footer className="app-footer">
      {PLATFORM === "web" && <InstallLine lang={lang} />}
      <p>{APP_NAME} · {es ? "Cielo calculado para Guatemala (UTC-6)" : "Sky computed for Guatemala (UTC-6)"}{PLATFORM === "web" ? <> · {es ? "Pronóstico" : "Weather data by"} <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo.com</a> (CC BY 4.0)</> : null}</p>
      <p className="dim small">{es ? "Estrellas y Vía Láctea: d3-celestial (HYG, J. R. Vieira). Fotos de referencia con crédito en cada imagen." : "Stars and Milky Way: d3-celestial (HYG, J. R. Vieira). Reference photos credited on each image."}</p>
    </footer>
  );
}

// ── TONIGHT ─────────────────────────────────────────────────────────────────
function TonightTab({ u, lang, mode, site, night, fc, fcn, ranked, nights, log, caps, dateStr, goSky, hl, webFcState, refreshWebFc }) {
  const [showAll, setShowAll] = useState(false);
  const [kit] = useKit();
  const L = siteLinks(site);
  const list = showAll ? ranked : ranked.slice(0, 10);
  const mp = night.moon;
  return (
    <>
      <div className="tonight-grid">
        <section className="sky-card">
          <h3>{siteName(site, lang)}</h3>
          <div className="night-facts">
            <div><span>{u.sunset}</span><b>{hhmm(night.sunset)}</b></div>
            <div><span>{u.fullDark}</span><b>{hhmm(night.astroDusk)}</b></div>
            <div><span>{u.darkEnds}</span><b>{hhmm(night.astroDawn)}</b></div>
            <div><span>{u.sunrise}</span><b>{hhmm(night.sunrise)}</b></div>
          </div>
          <p className="dim">{night.darkHours.toFixed(1)} {u.darkHrs} · Bortle {site.bortle ?? "?"} · {site.elevM ? `${site.elevM} m` : site.elev}</p>
          <div className="moon-row">
            <div className="moon-disc"><div className="moon-lit" style={{ clipPath: mp.waxing ? `inset(0 0 0 ${100 - mp.illum}%)` : `inset(0 ${100 - mp.illum}% 0 0)` }} /></div>
            <div>
              <div className="moon-big">{mp.illum}%</div>
              <div className="moon-phase">{lang === "es" ? MOON_PHASE_ES[mp.phase] || mp.phase : mp.phase}</div>
              <div className="moon-phase">{u.moon} {u.moonrise} {hhmm(night.moonrise)} · {u.moonset} {hhmm(night.moonset)}</div>
              <div className="moon-phase">{night.moonDarkHours.toFixed(1)} {u.moonInDark}</div>
            </div>
          </div>
          <div className={`advice ${mp.illum <= 15 || night.moonDarkHours < 1 ? "good" : mp.illum <= 40 ? "ok" : "warn"}`}>
            {mode === "photo" ? adviceText(lang, night.moonDarkHours < 1 ? "dark" : mp.illum <= 15 ? "dark" : mp.illum <= 40 ? "mod" : mp.illum <= 75 ? "bright" : "full") : SKY_ADVICE[lang][night.moonDarkHours < 1 || mp.illum <= 15 ? "dark" : mp.illum <= 60 ? "mod" : "bright"]}
          </div>
        </section>

        <section className="sky-card">
          <div className="fc-head">
            <h3>{u.forecast}</h3>
            {fcn ? <span className={`verdict v-${fcn.verdict}`}>{u.verdict[fcn.verdict]}</span> : <span className="verdict v-none">{u.verdict.none}</span>}
          </div>
          {fcn && <p className="dim">{u.verdictWhy(fcn.c, fcn.maxHum)}{fcn.maxHum >= 90 ? ` · ${u.dewRisk}` : ""}</p>}
          <Timeline night={night} fcn={fcn} u={u} />
          {fc && fc.fetchedAt && <p className="dim small">{u.updated} {agoText(fc.fetchedAt, lang)} · {u.via} {fc.source || "Clear Outside"}</p>}
          {PLATFORM === "claude" && !caps.db && caps.ready && <p className="dim small">{u.fcSignedOut}</p>}
          {PLATFORM === "web" && webFcState === "busy" && !fc && <p className="dim small">{lang === "es" ? "Cargando pronóstico…" : "Loading forecast…"}</p>}
          {PLATFORM === "web" && webFcState === "error" && <p className="dim small">{lang === "es" ? "Sin conexión al pronóstico: se muestra el último guardado." : "Couldn't reach the forecast — showing the last saved one."}</p>}
          {PLATFORM === "claude" && caps.db && !fc && <p className="dim small">{u.noFcSite}</p>}
          {caps.db && fc && !fcn && <p className="dim small">{u.noFcNight}</p>}
          {fcn && (mode === "photo" ? <HourTable rows={fcn.rows} fc={fc} u={u} /> : <details className="hour-details"><summary>{lang === "es" ? "Ver hora por hora" : "Hour by hour"}</summary><HourTable rows={fcn.rows} fc={fc} u={u} /></details>)}
          <Links items={[[L.clearOutside, u.links.co], [L.windy, u.links.windy], [L.lightPollution, u.links.lp]]} />
          {PLATFORM === "web" ? <div className="refresh"><button className="plan-btn small-btn" disabled={webFcState === "busy"} onClick={refreshWebFc}>{webFcState === "busy" ? "…" : u.refresh}</button></div> : <RefreshButton u={u} mcp={caps.mcp} />}
        </section>
      </div>
      {mode !== "photo" && <StargazerTonight lang={lang} hl={hl} goSky={goSky} />}
      {mode === "photo" && <>

      <section className="sky-card">
        <h3>{u.best}</h3>
        <div className="best-list">
          {list.map(({ t, tn }) => (
            <button key={t.id} className="best-row" onClick={() => goSky(t.id)}>
              <span className="best-main">
                <span className="best-name">{tr(t, "name", lang)}{log[t.id] ? " ✓" : ""}</span>
                <span className="best-sub">{u.window} {hhmm(tn.winStart)}–{hhmm(tn.winEnd)} · {u.max} {Math.round(tn.best.alt)}° {hhmm(tn.best.t)} {t.type === "Lunar" ? "" : ` · ${tn.moonUp ? `${tn.moonSep}° ${u.fromMoon}` : u.moonDown}`}</span>
              </span>
              <span className="best-side">{PLATFORM === "web" ? <span className="tag lens-hint">{kitLensesFor(t, kit).slice(0, 1).map((id) => gearName((lensById(kit.sys, id) || {}).name, lang)).join("")}</span> : rigTags(t).map((r) => <RigTag key={r} r={r} />)}<Pri p={t.priority} /></span>
            </button>
          ))}
        </div>
        {ranked.length > 10 && <button className="mini-btn" onClick={() => setShowAll(!showAll)}>{showAll ? u.showTop : `${u.showAll} (${ranked.length})`}</button>}
      </section>

      {PLATFORM !== "web" && <><div className="section-title">{u.rigSplit}</div>
      <div className="rig-grid">
        {[RIGS.gti, RIGS.sa2i].map((r) => (
          <div key={r.id} className={`rig-card ${r.id}`}>
            <div className="rig-name">{tr(r, "name", lang)}</div>
            <div className="rig-role">{tr(r, "role", lang)}</div>
            <div className="rig-notes">{tr(r, "notes", lang)}</div>
          </div>
        ))}
      </div></>}

      {PLATFORM === "claude" && <Planner {...{ u, lang, site, night, fcn, ranked, log, sample: caps.sample, dateStr, ready: caps.ready }} />}
      </>}
    </>
  );
}
const SKY_ADVICE = {
  en: { dark: "Dark sky tonight — a great night for the Milky Way and faint sights from a dark site.", mod: "Some moonlight — bright stars, planets and clusters are easy; the Milky Way is faint.", bright: "Bright Moon tonight — enjoy the Moon itself and the planets; save the Milky Way for a darker night." },
  es: { dark: "Cielo oscuro esta noche: gran noche para la Vía Láctea y objetos tenues desde un sitio oscuro.", mod: "Algo de luz lunar: estrellas brillantes, planetas y cúmulos se ven fácil; la Vía Láctea, tenue.", bright: "Luna brillante esta noche: disfruta la Luna y los planetas; deja la Vía Láctea para una noche más oscura." },
};

function HourTable({ rows, fc, u }) {
  const rainCol = rows.length && rows[0].fog == null && rows[0].rain != null;
  return (
    <div className="hour-table-wrap">
      <table className="hour-table">
        <thead><tr><th>{u.hourTable.h}</th><th>{u.hourTable.c}</th><th>{u.hourTable.lo}</th><th>{u.hourTable.mi}</th><th>{u.hourTable.hi}</th><th>{u.hourTable.hum}</th><th>{rainCol ? u.hourTable.rain : u.hourTable.fog}</th><th>{u.hourTable.wind}</th></tr></thead>
        <tbody>{rows.map((h) => (
          <tr key={h.t}><td>{h.t.slice(11, 16)}</td>
            {["c", "lo", "mi", "hi"].map((k) => <td key={k} className={Number(h[k]) <= 20 ? "good" : Number(h[k]) >= 70 ? "bad" : ""}>{h[k] ?? "—"}</td>)}
            <td className={Number(h.hum) >= 90 ? "bad" : ""}>{h.hum ?? "—"}</td><td>{rainCol ? (h.rain != null ? `${h.rain}%` : "—") : h.fog ?? "—"}</td>
            <td>{h.wind != null ? `${toKmh(Number(h.wind), fc.windUnit)} km/h` : "—"}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}

function RefreshButton({ u, mcp }) {
  const [state, setState] = useState("idle");
  const [msg, setMsg] = useState("");
  if (!mcp || !TRIGGER_ID || TRIGGER_ID.startsWith("__")) return null;
  const run = async () => {
    setState("busy"); setMsg("");
    try {
      await mcp.callTool("Claude Code Remote", "fire_trigger", { trigger_id: TRIGGER_ID }, { cache: false });
      setState("done"); setMsg(u.refreshing);
    } catch (e) {
      setState("idle"); setMsg(u.refreshFail[e && e.code] || u.refreshFail.default);
    }
  };
  return (
    <div className="refresh">
      <button className="plan-btn small-btn" disabled={state !== "idle"} onClick={run}>{state === "busy" ? "…" : u.refresh}</button>
      {msg && <p className="dim small">{msg}</p>}
    </div>
  );
}

function quickExposure(t, site, night, tn) {
  const kit = KIT_S.v, K = kitInfo(kit);
  const lens = lensById(kit.sys, lensDefault(t, kit));
  if (!lens) return "n/a";
  const cat = CATALOG[t.id] || {}, size = cat.body ? null : OBJ_SIZE[t.id];
  const f = autoFocal(lens, size, expClass(t), K.sw, K.sh), N = lens.N[0];
  const p = exposurePlan({ t, cat, lens, f, N, kit: K, bortle: site.bortle, nb: t.filter === "essential", moon: tn ? { up: tn.moonUp, illum: night.moon.illum } : null, phaseIllum: night.moon.illum });
  const r = p.rows.find((x) => x.role) || p.rows[p.rows.length - 1];
  const mount = r.mount === "none" ? "tripod" : (TRACKERS[r.mount] || {}).name || r.mount;
  return `${lens.name} at ${Math.round(f)}mm f/${N}${p.nb ? " + dual-band filter" : ""}: ${fmtRange(r.min, r.max)} ISO ${r.iso} on ${mount}`;
}

function Planner({ u, lang, site, night, fcn, ranked, log, sample, dateStr, ready }) {
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ctl = useRef(null);
  if (ready && !sample) return null;
  const run = async () => {
    if (!sample) return;
    setBusy(true); setErr(""); setPlan(null);
    ctl.current = new AbortController();
    const cands = ranked.slice(0, 14).map(({ t, tn }) => `- ${t.name} | ${t.type} | window ${hhmm(tn.winStart)}-${hhmm(tn.winEnd)} | max ${Math.round(tn.best.alt)}° at ${hhmm(tn.best.t)} | moon ${tn.moonUp ? tn.moonSep + "° away" : "down"} | lenses: ${t.lenses.map((l) => LENS_BY_ID[l]?.name).filter(Boolean).join(", ")} | filter ${t.filter} | modelled: ${quickExposure(t, site, night, tn)} | captured: ${log[t.id] ? "yes" : "no"} | priority ${t.priority}`).join("\n");
    const clouds = fcn ? fcn.rows.map((h) => `${h.t.slice(11, 16)} cloud ${h.c}% (low ${h.lo}/mid ${h.mi}/high ${h.hi}) hum ${h.hum}%`).join("\n") : "No cloud forecast available.";
    const prompt = `Plan one astrophotography night in Guatemala for a Micro Four Thirds shooter who runs two tracking mounts in parallel.
Rig GTi (goto, attended): Nocticron 42.5mm f/1.2, Olympus 75mm f/1.8, 40-150mm f/2.8, 300mm f/4 (MC-14 ok). IS/OIS must be OFF on the tracker.
Rig SA2i (single-axis, unattended wide field): Laowa 7.5mm f/2, 7-14mm f/2.8 (no filter possible), 17mm f/1.2, 25mm f/1.2.
Filter: STC Astro Duo narrowband clip-in. Bodies: OM-1 Mk II and E-M1 Mk II.
Site: ${site.name} (${site.lat.toFixed(2)}, ${site.lon.toFixed(2)}), Bortle ${site.bortle ?? "unknown"}, ${site.elevM || site.elev} m, horizon: ${site.horizon || "unknown"}, ${site.truck === false ? "PACK-IN site: plan ONE rig only (SA2i or untracked) with one body and a wide lens, and say so in warnings." : "truck basecamp: both rigs."}
Night of ${dateStr} (Guatemala time, UTC-6): sunset ${hhmm(night.sunset)}, full dark ${hhmm(night.astroDusk)}-${hhmm(night.astroDawn)}, sunrise ${hhmm(night.sunrise)}. Moon ${night.moon.phase} ${night.moon.illum}%, rises ${hhmm(night.moonrise)}, sets ${hhmm(night.moonset)}.
Hourly cloud forecast (Clear Outside):
${clouds}
Candidate targets computed for this site and night (use only these, only inside their windows):
${cands}
Rules: prefer uncaptured targets; avoid faint nebulae and galaxies while a bright moon is up unless the STC narrowband filter suits them; schedule SA2i as 1-2 long unattended sequences and GTi as 2-4 targets in window order; use the modelled sub range and ISO given per candidate (shorten broadband subs while a bright moon is up); 60-100+ frames. If the cloud forecast is mostly above 60% during full dark, set verdict "no-go" and suggest a better use of the night.
Write every text value in ${lang === "es" ? "Spanish" : "English"}; keep target names exactly as listed.
Reply with only JSON: {"verdict":"go|maybe|no-go","summary":"one or two sentences","blocks":[{"start":"HH:MM","end":"HH:MM","rig":"GTi|SA2i","target":"name","lens":"lens","settings":"aperture, ISO, sub x frames","tip":"one short field tip"}],"warnings":["short"]}. At most 7 blocks, ordered by start time.`;
    try {
      const out = await sample.json(prompt, { signal: ctl.current.signal });
      setPlan(out && typeof out === "object" ? out : null);
      if (!out || !Array.isArray(out.blocks)) setErr(u.planErr.invalid_json);
    } catch (e) {
      if (e && e.code !== "cancelled") setErr(u.planErr[e && e.code] || u.planErr.default);
    } finally { setBusy(false); }
  };
  return (
    <section className="planner">
      <h3 className="planner-title">{u.plannerTitle}</h3>
      <p className="dim">{u.plannerDesc}</p>
      <div className="planner-controls">
        <button className="plan-btn" onClick={run} disabled={busy || !sample}>{busy ? u.planning : u.planBtn}</button>
        {busy && <button className="mini-btn" onClick={() => ctl.current && ctl.current.abort()}>{u.stop}</button>}
      </div>
      {err && <p className="plan-error">{err}</p>}
      {plan && Array.isArray(plan.blocks) && (
        <div>
          <p className="plan-summary">{plan.verdict && <span className={`verdict v-${plan.verdict === "no-go" ? "nogo" : plan.verdict}`}>{u.verdict[plan.verdict === "no-go" ? "nogo" : plan.verdict] || plan.verdict}</span>} {String(plan.summary || "")}</p>
          {plan.blocks.map((b, i) => (
            <div key={i} className="plan-block">
              <div className="plan-time">{String(b.start || "")}–{String(b.end || "")}</div>
              <div>
                <div className="plan-target">{b.rig && <RigTag r={b.rig === "SA2i" ? "SA2i" : "GTi"} />} {String(b.target || "")}</div>
                <div className="plan-lens">{String(b.lens || "")}</div>
                <div className="plan-settings">{String(b.settings || "")}</div>
                {b.tip && <div className="plan-tip">{String(b.tip)}</div>}
              </div>
            </div>
          ))}
          {(plan.warnings || []).map((w, i) => <div key={i} className="plan-warning">⚠ {String(w)}</div>)}
        </div>
      )}
    </section>
  );
}

// ── SKY ─────────────────────────────────────────────────────────────────────
function SkyTab({ u, lang, mode, site, night, ranked, nights, skyTarget, setSkyTarget, hl, goGear }) {
  const steps = useMemo(() => {
    if (!night.sunset || !night.sunrise) return [];
    const out = [];
    for (let t = Math.ceil(night.sunset.getTime() / 600000) * 600000; t <= night.sunrise.getTime(); t += 600000) out.push(new Date(t));
    return out;
  }, [night]);
  const defaultIdx = useMemo(() => {
    const now = Date.now();
    const i = steps.findIndex((d) => d.getTime() >= now);
    if (i > 0 && now >= steps[0].getTime()) return i;
    const ad = night.astroDusk ? night.astroDusk.getTime() + 3600000 : steps[0]?.getTime();
    const j = steps.findIndex((d) => d.getTime() >= ad);
    return j >= 0 ? j : 0;
  }, [steps]);
  const [idx, setIdx] = useState(defaultIdx);
  useEffect(() => setIdx(defaultIdx), [defaultIdx]);
  const when = steps[Math.min(idx, steps.length - 1)] || new Date();
  const jd = jdOf(when);
  const star = mode !== "photo";
  const known = (id) => !!TARGET_BY_ID[id] || !!HL_BY_ID[id] || !!PLANET_INFO[id];
  const defaultId = star ? (hl.evening[0] && hl.evening[0].id) || (hl.late[0] && hl.late[0].id) || "jupiter" : (ranked[0] && ranked[0].t.id) || "moon";
  const selId = skyTarget && known(skyTarget) ? skyTarget : defaultId;
  // Stargazers get the plain-language card for highlights and planets; photographers get the target card
  const sel = star && (HL_BY_ID[selId] || PLANET_INFO[selId]) ? null : TARGET_BY_ID[selId] || null;
  const cat = sel ? CATALOG[sel.id] : null;
  const selObj = cat || (HL_BY_ID[selId] ? { ra: HL_BY_ID[selId].ra, dec: HL_BY_ID[selId].dec } : PLANET_INFO[selId] ? { body: selId } : null);
  const pos = cat ? bodyAltAz(cat, site, jd) : null;
  const tn = sel ? nights[sel.id] : null;
  const rts = useMemo(() => (cat ? riseTransitSet(cat, site, night) : null), [cat, site, night]);
  const track = useMemo(() => {
    if (tn && tn.track) return tn.track;
    if (!selObj) return null;
    return steps.filter((_, i) => i % 2 === 0).map((d) => bodyAltAz(selObj, site, jdOf(d)));
  }, [selId, steps, tn]);
  const items = useMemo(() => {
    if (star) {
      const ids = new Set([...hl.evening, ...hl.late].map((x) => x.id)); ids.add(selId);
      return HIGHLIGHTS.filter((h) => ids.has(h.id)).map((h) => ({ id: h.id, label: tr(h, "name", lang), obj: { ra: h.ra, dec: h.dec } }))
        .concat(sel && !HL_BY_ID[selId] ? [{ id: sel.id, label: tr(sel, "name", lang), obj: cat }] : []);
    }
    const ids = new Set(ranked.slice(0, 16).map((r) => r.t.id)); ids.add(selId);
    return TARGETS.filter((t) => ids.has(t.id)).map((t) => ({ id: t.id, label: tr(t, "name", lang), obj: CATALOG[t.id] }));
  }, [star, hl, ranked, selId, lang]);
  const canSelect = (id) => (star ? known(id) : !!TARGET_BY_ID[id]);
  const dir = pos ? compass(pos.az, lang) : "";
  return (
    <>
      <section className="sky-card">
        <h3>{u.skyTitle} {siteName(site, lang)} · {hhmm(when)}</h3>
        <div className="sky-layout">
          <div className="sky-chart-wrap">
            <SkyChart site={site} jd={jd} items={items} selectedId={selId} onSelect={setSkyTarget} canSelect={canSelect} track={track} lang={lang} />
            <label className="ctl slider-ctl" htmlFor="sky-time"><span className="control-label">{u.time} {hhmm(when)}</span>
              <input id="sky-time" type="range" min={0} max={Math.max(0, steps.length - 1)} value={Math.min(idx, steps.length - 1)} onChange={(e) => setIdx(Number(e.target.value))} />
            </label>
            <p className="dim small">{u.chartHelp}</p>
          </div>
          <div className="finder">
            <label className="ctl"><span className="control-label">{u.target}</span>
              <select id="sky-target" className="input" value={selId || ""} onChange={(e) => setSkyTarget(e.target.value)}>
                {star
                  ? [...HIGHLIGHTS.map((h) => <option key={h.id} value={h.id}>{hl.evening.some((x) => x.id === h.id) ? "● " : "○ "}{tr(h, "name", lang)}</option>),
                    ...["moon", "venus", "mars", "jupiter", "saturn"].map((b) => <option key={b} value={b}>{tr(PLANET_INFO[b], "name", lang)}</option>)]
                  : TARGETS.filter((t) => t.type !== "Solar").map((t) => <option key={t.id} value={t.id}>{nights[t.id]?.winStart ? "● " : "○ "}{tr(t, "name", lang)}</option>)}
              </select></label>
            {sel && cat ? (
              <div className="finder-card">
                <div className="target-name">{tr(sel, "name", lang)} <span className="target-catalog">{factText(sel.catalog, lang)}</span></div>
                <div className={`pos-line ${pos.alt > 0 ? "" : "below"}`}>{pos.alt > 0 ? u.pos(Math.round(pos.az), dir, Math.round(pos.alt), fists(pos.alt)) : u.belowHorizon}</div>
                {rts && <div className="rts"><span>{u.rises} <b>{hhmm(rts.rise)}</b></span><span>{u.transits} <b>{hhmm(rts.transit)} · {Math.round(rts.transitAlt)}°</b></span><span>{u.sets} <b>{hhmm(rts.set)}</b></span></div>}
                {tn && (tn.winStart ? <div className="dim small">{u.window} {hhmm(tn.winStart)}–{hhmm(tn.winEnd)} (≥{Math.round(tn.thr)}°)</div> : <div className="dim small">{u.notUp}</div>)}
                {!star && PLATFORM !== "web" && <div className="rig-tags">{rigTags(sel).map((r) => <RigTag key={r} r={r} />)}</div>}
                <ObjectFacts t={sel} lang={lang} u={u} />
                {!star && <FrameExposure key={sel.id} t={sel} u={u} lang={lang} site={site} night={night} tn={tn} jd={jd} goGear={goGear} />}
              </div>
            ) : <HighlightCard id={selId} lang={lang} site={site} night={night} jd={jd} u={u} />}
          </div>
        </div>
      </section>
    </>
  );
}

// ── TARGETS ─────────────────────────────────────────────────────────────────
function TargetsTab({ u, lang, site, night, nights, log, db, writable, goSky, monthKey, goGear }) {
  const [kit] = useKit();
  const K = kitInfo(kit);
  const [lensSel, setLens] = useState(null);
  const lens = lensSel && K.sys.lenses.some((l) => l.id === lensSel) ? lensSel : null;
  const [types, setTypes] = useState([]);
  const [months, setMonths] = useState([]);
  const [open, setOpen] = useState(null);
  const list = TARGETS.filter((t) => (!lens || kitLensesFor(t, kit).includes(lens)) && (!types.length || types.includes(t.type)) && (!months.length || months.some((m) => t.window.includes(m))))
    .sort((a, b) => b.priority - a.priority);
  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const lensData = lens ? K.sys.lenses.find((l) => l.id === lens) : null;
  const legacy = lens && kit.sys === "mft" ? LENS_BY_ID[lens] : null;
  return (
    <>
      <div className="controls">
        <div className="control-group">
          <span className="control-label">{u.filters.lens} · {gearName(K.body.name, lang)} <button className="link-inline" onClick={goGear}>{EXP_TEXT[lang].changeKit}</button></span>
          <div className="lens-grid">{K.sys.lenses.map((l) => <button key={l.id} className={`lens-btn ${lens === l.id ? "active" : ""} ${isFuture(l.id) ? "future" : ""}`} onClick={() => setLens(lens === l.id ? null : l.id)}>{gearName(l.name, lang)}</button>)}</div>
          {lensData && <div className="lens-warn">{Math.round(lensData.f[0] * K.crop)}{lensData.f[1] !== lensData.f[0] ? `–${Math.round(lensData.f[1] * K.crop)}` : ""} mm FF · f/{Math.min(...lensData.N)} · {tr(lensData, "note", lang)}{legacy ? <><br />⚠ {tr(legacy, "warn", lang)}</> : null}</div>}
        </div>
        <div className="control-group">
          <span className="control-label">{u.filters.month}</span>
          <div className="month-strip">{MONTHS.map((m) => <button key={m} className={`month-btn ${months.includes(m) ? "active" : ""} ${!SEASON_DATA[m].dry ? "rainy" : ""} ${m === monthKey ? "now" : ""}`} onClick={() => toggle(months, setMonths, m)}>{monthLabel(m, lang)}</button>)}</div>
          <span className="control-label" style={{ marginTop: 12 }}>{u.filters.type}</span>
          <div className="filter-row">{TYPES.filter((t) => t !== "All Types").map((t) => <button key={t} className={`filter-btn ${types.includes(t) ? "active" : ""}`} onClick={() => toggle(types, setTypes, t)}>{typeLabel(t, lang)}</button>)}</div>
        </div>
      </div>
      <div className="results-header"><span className="results-count"><span>{list.length}</span> · {u.count(list.length)}</span>
        {(lens || types.length || months.length) ? <button className="clear-btn" onClick={() => { setLens(null); setTypes([]); setMonths([]); }}>{u.clear}</button> : null}</div>
      <div className="targets-grid">
        {list.map((t) => {
          const isOpen = open === t.id, tn = nights[t.id], cap = log[t.id];
          return (
            <div key={t.id} className={`target-card ${isOpen ? "expanded" : ""} ${cap ? "captured" : ""}`}>
              <button className="target-top" onClick={() => setOpen(isOpen ? null : t.id)} aria-expanded={isOpen}>
                <span><span className="target-name">{tr(t, "name", lang)}</span><span className="target-catalog">{factText(t.catalog, lang)}</span></span>
                <Pri p={t.priority} />
              </button>
              <div className="target-meta">
                <span className="tag tag-type">{typeLabel(t.type, lang)}</span>
                <span className="tag tag-window">{tr(t, "windowLabel", lang)}</span>
                {t.filter === "essential" && <span className="tag tag-filter essential">{PLATFORM === "web" ? (lang === "es" ? "Filtro dual esencial" : "Dual-band filter essential") : u.stcEss}</span>}
                {t.filter === "recommended" && <span className="tag tag-filter">{PLATFORM === "web" ? (lang === "es" ? "Filtro dual recomendado" : "Dual-band filter recommended") : u.stcRec}</span>}
                {t.filter === "nd100000" && <span className="tag tag-filter">{u.ndReq}</span>}
                {PLATFORM !== "web" && rigTags(t).map((r) => <RigTag key={r} r={r} />)}
                {cap && <span className="tag tag-captured">✓ {cap.capturedAt}</span>}
              </div>
              <div className="target-notes">{tr(t, "notes", lang)}</div>
              {tn !== undefined && <div className="tonight-line">{u.tonightAt}: {tn && tn.winStart ? `${hhmm(tn.winStart)}–${hhmm(tn.winEnd)} · ${u.max} ${Math.round(tn.best.alt)}°` : u.notUp}</div>}
              {isOpen && (
                <div className="target-lenses">
                  <ObjectFacts t={t} lang={lang} u={u} />
                  <FrameExposure key={t.id} t={t} u={u} lang={lang} site={site} night={night} tn={tn} goGear={goGear} />
                  <div className="log-actions">
                    {t.type !== "Solar" && <button className="log-btn" onClick={() => goSky(t.id)}>{u.openSky}</button>}
                    {writable && (cap
                      ? <button className="log-btn done" onClick={() => db.doc(`log/${t.id}`).delete().catch(() => {})}>✓ {u.captured} · {u.undo}</button>
                      : <button className="log-btn" onClick={() => db.doc(`log/${t.id}`).set({ capturedAt: todayGT(), note: "", updatedAt: nowIso() }).catch(() => {})}>{u.markCaptured}</button>)}
                  </div>
                  {writable && cap && <NoteInput key={t.id + (cap.note || "")} initial={cap.note || ""} placeholder={u.notePh} onSave={(note) => db.doc(`log/${t.id}`).set({ ...cap, note, updatedAt: nowIso() }).catch(() => {})} />}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function NoteInput({ initial, placeholder, onSave }) {
  const [v, setV] = useState(initial);
  return <input className="input log-note-input" value={v} placeholder={placeholder} onChange={(e) => setV(e.target.value)} onBlur={() => v !== initial && onSave(v)} />;
}

// ── SITES ───────────────────────────────────────────────────────────────────
const amenText = (k, lang) => (AMEN_LABEL[k] ? AMEN_LABEL[k][lang] : k);
function AmenChips({ list, lang }) {
  if (!list || !list.length) return null;
  return <div className="amen-row">{list.map((k) => <span key={k} className="amen-chip">{amenText(k, lang)}</span>)}</div>;
}
function AmenPicker({ value, onChange, lang }) {
  const on = new Set(value || []);
  return (
    <div className="amen-row amen-pick">
      {AMENITIES.map(([k]) => (
        <button type="button" key={k} className={`amen-chip pick ${on.has(k) ? "on" : ""}`} aria-pressed={on.has(k)}
          onClick={() => { const n = new Set(on); if (n.has(k)) n.delete(k); else n.add(k); onChange(AMENITIES.map(([a]) => a).filter((a) => n.has(a))); }}>{amenText(k, lang)}</button>
      ))}
    </div>
  );
}
function CoordsField({ id, value, onChange, onElev, lang }) {
  const x = UX[lang];
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const parsed = value ? parseCoords(value) : null;
  const gps = async () => {
    setBusy(true); setMsg("");
    try {
      const c = await getGps();
      onChange(`${c.latitude.toFixed(5)}, ${c.longitude.toFixed(5)}`);
      if (onElev && c.altitude != null) onElev(String(Math.round(c.altitude)));
    } catch { setMsg(x.gpsFail); } finally { setBusy(false); }
  };
  return (
    <label className="wide">
      <span className="control-label">{UI[lang].f.coords}</span>
      <span className="coords-row">
        <input id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)} placeholder="15.5200, -91.5500" />
        <button type="button" className="mini-btn gps-btn" onClick={gps} disabled={busy}>{busy ? x.gpsBusy : `⌖ ${x.gps}`}</button>
      </span>
      <span className="dim small">{parsed ? `✓ ${parsed.lat.toFixed(5)}, ${parsed.lon.toFixed(5)}` : x.coordsHelp}</span>
      {msg && <span className="dim small warn-text">{msg}</span>}
    </label>
  );
}

function SitesTab({ u, lang, sites, site, setSiteId, forecasts, db, writable, dateStr, places }) {
  const x = UX[lang];
  const [confirm, setConfirm] = useState(null);
  const [editing, setEditing] = useState(null);
  const perSite = useMemo(() => Object.fromEntries(sites.map((s) => [s.id, forecastNight(forecasts[s.id], nightInfo(s, dateStr))])), [sites, forecasts, dateStr]);
  const placeList = useMemo(() => Object.entries(places || {}).map(([id, p]) => ({ ...p, id })).filter((p) => typeof p.lat === "number" && typeof p.lon === "number"), [places]);
  const sorted = [...sites].sort((a, b) => (a.id === site.id ? -1 : b.id === site.id ? 1 : (a.status === b.status ? 0 : a.status === "verified" ? -1 : 1)));
  const setStatus = (s, status) => {
    const { id, ...rest } = s;
    db.doc(`sites/${id}`).set({ ...rest, status, updatedAt: nowIso() }).catch(() => {});
  };
  return (
    <>
      <div className="locations-grid">
        {sorted.map((s) => {
          const L = siteLinks(s);
          const fcn = perSite[s.id];
          const verified = s.status === "verified";
          const near = placeList.map((p) => ({ p, km: kmBetween(s, p) })).filter((q) => q.km <= 60).sort((a, b) => a.km - b.km).slice(0, 3);
          return (
            <div key={s.id} className={`loc-card ${verified ? "" : "scouting"} ${s.id === site.id ? "active" : ""}`}>
              <div className="loc-name">{s.icon || "⌖"} {siteName(s, lang)}
                <span className={`status-badge ${verified ? "verified" : "scouting"}`}>{verified ? `⛺ ${u.verified}` : `⌖ ${u.scouting}`}</span>
              </div>
              <div className="loc-dept">{s.dept || ""} <span className={`rig-tag ${s.truck === false ? "sa2i" : "gti"}`}>{s.truck === false ? u.pack : u.truck}</span></div>
              <div className="loc-stats">
                <span><span className="loc-bortle">Bortle {s.bortle ?? "?"}</span> · {s.elevM ? `${s.elevM} m` : s.elev} · {s.lat.toFixed(3)}, {s.lon.toFixed(3)}</span>
                {s.season && <span>{u.seasonLbl}: {tr(s, "season", lang)}</span>}
                {s.access && <span>{u.accessLbl}: {tr(s, "access", lang)}</span>}
                {s.horizon && <span className="loc-text">{tr(s, "horizon", lang)}</span>}
                {s.camp && <span className="loc-camp">⛺ {tr(s, "camp", lang)}</span>}
                {s.notes && <span className="loc-text">{s.notes}</span>}
                <AmenChips list={s.amen} lang={lang} />
                {near.length > 0 && <span className="loc-near">{x.nearby}: {near.map(({ p, km }) => `${(KIND[p.kind] || KIND.other).icon} ${p.name} ${km < 10 ? km.toFixed(1) : Math.round(km)} km`).join(" · ")}</span>}
                <span className="loc-fc">{u.tonightFc} ({dateStr.slice(5)}): {fcn ? <><b className={`v-text v-${fcn.verdict}`}>{fcn.c}%</b> · {u.verdict[fcn.verdict]}</> : "—"}</span>
              </div>
              <Links items={[[L.clearOutside, u.links.co], [L.windy, u.links.windy], [L.lightPollution, u.links.lp], [L.maps, u.links.maps]]} />
              <div className="site-actions">
                {s.id === site.id ? <span className="tag tag-captured">{u.siteActive}</span> : <button className="verify-btn" onClick={() => setSiteId(s.id)}>{u.setActive}</button>}
                {writable && <button className="verify-btn" onClick={() => setStatus(s, verified ? "scouting" : "verified")}>{verified ? u.markScouting : `★ ${u.markVerified}`}</button>}
                {writable && <button className="verify-btn" onClick={() => setEditing(editing === s.id ? null : s.id)}>{editing === s.id ? x.cancel : `✎ ${x.edit}`}</button>}
                {writable && s.custom && <button className="verify-btn danger" onClick={() => { if (confirm === s.id) { db.doc(`sites/${s.id}`).delete().catch(() => {}); db.doc(`forecasts/${s.id}`).delete().catch(() => {}); setConfirm(null); } else setConfirm(s.id); }}>{confirm === s.id ? u.confirmDel : u.del}</button>}
              </div>
              {editing === s.id && <SpotForm u={u} lang={lang} db={db} sites={sites} initial={s} onDone={() => setEditing(null)} />}
            </div>
          );
        })}
      </div>
      <p className="dim small">{u.coordsNote}</p>
      {writable ? <SpotForm u={u} lang={lang} db={db} sites={sites} /> : <p className="dim small">{db ? u.readOnly : u.noDb}</p>}
      <PlacesSection u={u} lang={lang} places={placeList} site={site} sites={sites} db={db} writable={writable} />
      <div className="section-title">{u.exclTitle}</div>
      <ul className="plain-list">{EXCLUSIVES[lang].map((x2) => <li key={x2}>◎ {x2}</li>)}</ul>
    </>
  );
}

function SpotForm({ u, lang, db, sites, initial, onDone }) {
  const x = UX[lang];
  const blank = { name: "", coords: "", elev: "", bortle: "", notes: "", truck: true, amen: [] };
  const fromSite = (s) => ({ name: s.name || "", coords: `${s.lat}, ${s.lon}`, elev: s.elevM != null ? String(s.elevM) : "", bortle: s.bortle != null ? String(s.bortle) : "", notes: s.notes || "", truck: s.truck !== false, amen: s.amen || [] });
  const [f, setF] = useState(() => (initial ? fromSite(initial) : blank));
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return setMsg(u.needName);
    const c = parseCoords(f.coords); if (!c) return setMsg(u.badCoords);
    const fields = { name: f.name.trim().slice(0, 80), lat: c.lat, lon: c.lon, elevM: f.elev ? Number(f.elev) || null : null, bortle: f.bortle ? Math.max(1, Math.min(9, Number(f.bortle) || 0)) || null : null,
      notes: f.notes.trim().slice(0, 600), truck: !!f.truck, amen: f.amen, updatedAt: nowIso() };
    setBusy(true);
    try {
      if (initial) {
        const { id, ...rest } = initial;
        await db.doc(`sites/${id}`).set({ ...rest, ...fields });
        setMsg(x.savedPlace); if (onDone) onDone();
      } else {
        let id = slug(f.name); if (sites.some((s) => s.id === id)) id = `${id}-${Math.random().toString(36).slice(2, 6)}`;
        await db.doc(`sites/${id}`).set({ ...fields, status: "scouting", custom: true, icon: "⌖", addedAt: nowIso() });
        setF(blank); setMsg(u.added);
      }
    } catch (err) { setMsg(String((err && err.message) || err)); } finally { setBusy(false); }
  };
  const p = initial ? `edit-${initial.id}` : "spot";
  return (
    <form className={`add-spot ${initial ? "edit-spot" : ""}`} onSubmit={submit}>
      <div className="section-title">{initial ? x.editTitle : u.addTitle}</div>
      {!initial && <p className="dim small">{u.addHelp}</p>}
      <div className="form-grid">
        <label><span className="control-label">{u.f.name}</span><input id={`${p}-name`} className="input" value={f.name} onChange={set("name")} /></label>
        <CoordsField id={`${p}-coords`} value={f.coords} onChange={(v) => setF((o) => ({ ...o, coords: v }))} onElev={(v) => setF((o) => ({ ...o, elev: o.elev || v }))} lang={lang} />
        <label><span className="control-label">{u.f.elev}</span><input id={`${p}-elev`} className="input" value={f.elev} onChange={set("elev")} inputMode="numeric" /></label>
        <label><span className="control-label">{u.f.bortle}</span><input id={`${p}-bortle`} className="input" value={f.bortle} onChange={set("bortle")} inputMode="numeric" /></label>
        <label className="wide"><span className="control-label">{u.f.notes}</span><input id={`${p}-notes`} className="input" value={f.notes} onChange={set("notes")} /></label>
        <div className="wide"><span className="control-label">{x.amen}</span><AmenPicker value={f.amen} onChange={(v) => setF((o) => ({ ...o, amen: v }))} lang={lang} /></div>
        <label className="check"><input id={`${p}-truck`} type="checkbox" checked={f.truck} onChange={set("truck")} /> {u.f.truck}</label>
      </div>
      <div className="form-actions">
        <button className="plan-btn" type="submit" disabled={busy}>{initial ? x.save : u.addBtn}</button>
        {initial && <button type="button" className="mini-btn" onClick={onDone}>{x.cancel}</button>}
      </div>
      {msg && <p className="dim small">{msg}</p>}
    </form>
  );
}

function PlacesSection({ u, lang, places, site, sites, db, writable }) {
  const x = UX[lang];
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const rows = places.map((p) => {
    const nearest = sites.reduce((b, s) => { const km = kmBetween(s, p); return !b || km < b.km ? { s, km } : b; }, null);
    return { p, km: kmBetween(site, p), nearest };
  }).sort((a, b) => a.km - b.km);
  return (
    <>
      <div className="section-title">{x.placesTitle}</div>
      <p className="dim small">{x.placesHelp}</p>
      {!rows.length && <p className="dim">{x.noPlaces}</p>}
      <div className="places-list">
        {rows.map(({ p, km, nearest }) => {
          const k = KIND[p.kind] || KIND.other;
          return (
            <div key={p.id} className="place-row">
              <div className="place-top">
                <span className="place-name">{k.icon} {p.name} <span className="tag place-kind">{k[lang]}</span></span>
                <span className="place-km">{x.fromActive(km < 10 ? km.toFixed(1) : Math.round(km), siteName(site, lang))}</span>
              </div>
              {nearest && nearest.s.id !== site.id && <div className="dim small">{x.fromActive(nearest.km < 10 ? nearest.km.toFixed(1) : Math.round(nearest.km), siteName(nearest.s, lang))}</div>}
              {(p.price || p.phone) && <div className="place-meta">{p.price && <span>{p.price}</span>}{p.phone && <a className="link-btn" href={`tel:${String(p.phone).replace(/[^+\d]/g, "")}`}>☎ {p.phone}</a>}</div>}
              {p.notes && <div className="loc-text">{p.notes}</div>}
              <AmenChips list={p.amen} lang={lang} />
              <div className="site-actions">
                <a className="link-btn" href={siteLinks(p).maps} target="_blank" rel="noopener noreferrer">{x.map} ↗</a>
                {writable && <button className="verify-btn" onClick={() => setEditing(editing === p.id ? null : p.id)}>{editing === p.id ? x.cancel : `✎ ${x.edit}`}</button>}
                {writable && <button className="verify-btn danger" onClick={() => { if (confirm === p.id) { db.doc(`places/${p.id}`).delete().catch(() => {}); setConfirm(null); } else setConfirm(p.id); }}>{confirm === p.id ? x.confirmDel : x.del}</button>}
              </div>
              {editing === p.id && <PlaceForm lang={lang} db={db} initial={p} onDone={() => setEditing(null)} />}
            </div>
          );
        })}
      </div>
      {writable && (adding ? <PlaceForm lang={lang} db={db} onDone={() => setAdding(false)} defaultCoords="" />
        : <button className="mini-btn" onClick={() => setAdding(true)}>+ {x.addPlace}</button>)}
    </>
  );
}

function PlaceForm({ lang, db, initial, onDone }) {
  const x = UX[lang], u = UI[lang];
  const blank = { name: "", kind: "hotel", coords: "", phone: "", price: "", notes: "", amen: [] };
  const [f, setF] = useState(() => (initial ? { name: initial.name || "", kind: initial.kind || "other", coords: `${initial.lat}, ${initial.lon}`, phone: initial.phone || "", price: initial.price || "", notes: initial.notes || "", amen: initial.amen || [] } : blank));
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return setMsg(u.needName);
    const c = parseCoords(f.coords); if (!c) return setMsg(u.badCoords);
    const data = { name: f.name.trim().slice(0, 80), kind: KIND[f.kind] ? f.kind : "other", lat: c.lat, lon: c.lon, phone: f.phone.trim().slice(0, 40), price: f.price.trim().slice(0, 40), notes: f.notes.trim().slice(0, 600), amen: f.amen, updatedAt: nowIso() };
    setBusy(true);
    try {
      if (initial) { const { id, ...rest } = initial; await db.doc(`places/${id}`).set({ ...rest, ...data }); }
      else await db.doc(`places/${slug(f.name)}-${Math.random().toString(36).slice(2, 6)}`).set({ ...data, addedAt: nowIso() });
      setMsg(x.savedPlace); if (onDone) onDone();
    } catch (err) { setMsg(String((err && err.message) || err)); } finally { setBusy(false); }
  };
  const p = initial ? `place-${initial.id}` : "place";
  return (
    <form className="add-spot" onSubmit={submit}>
      <div className="section-title">{initial ? x.editPlace : x.addPlace}</div>
      <div className="form-grid">
        <label><span className="control-label">{u.f.name}</span><input id={`${p}-name`} className="input" value={f.name} onChange={set("name")} /></label>
        <label><span className="control-label">{x.placeKind}</span><select id={`${p}-kind`} className="input" value={f.kind} onChange={set("kind")}>{PLACE_KINDS.map(([k, en, es]) => <option key={k} value={k}>{lang === "es" ? es : en}</option>)}</select></label>
        <CoordsField id={`${p}-coords`} value={f.coords} onChange={(v) => setF((o) => ({ ...o, coords: v }))} lang={lang} />
        <label><span className="control-label">{x.phone}</span><input id={`${p}-phone`} className="input" value={f.phone} onChange={set("phone")} inputMode="tel" /></label>
        <label><span className="control-label">{x.price}</span><input id={`${p}-price`} className="input" value={f.price} onChange={set("price")} placeholder="Q250" /></label>
        <label className="wide"><span className="control-label">{x.placeNotes}</span><input id={`${p}-notes`} className="input" value={f.notes} onChange={set("notes")} /></label>
        <div className="wide"><span className="control-label">{x.amen}</span><AmenPicker value={f.amen} onChange={(v) => setF((o) => ({ ...o, amen: v }))} lang={lang} /></div>
      </div>
      <div className="form-actions">
        <button className="plan-btn" type="submit" disabled={busy}>{x.save}</button>
        {onDone && <button type="button" className="mini-btn" onClick={onDone}>{x.cancel}</button>}
      </div>
      {msg && <p className="dim small">{msg}</p>}
    </form>
  );
}

// ── EXPEDITION / LOG / GEAR / WORKFLOW ──────────────────────────────────────
// ── OFFLINE COPY + FIELD NOTES ─────────────────────────────────────────────
async function buildOfflineHtml({ snapshot, includePhotos, lang }) {
  let js = "";
  if (CONFIG_REF.appJs && /^[0-9a-f]{32}$/.test(CONFIG_REF.appJs)) {
    try { const r = await fetch("/_blob/" + CONFIG_REF.appJs, { cache: "no-store" }); if (r.ok) { const t = await r.text(); if (t.includes(APP_VERSION) && t.includes(APP_MARKER)) js = t; } } catch {}
  }
  if (!js && __SELF_JS.includes(APP_VERSION) && __SELF_JS.includes(APP_MARKER)) js = __SELF_JS;
  if (!js) throw Object.assign(new Error("no app source"), { code: "source" });
  const css = (document.getElementById("cg-css") || {}).textContent || "";
  let photos = null;
  if (includePhotos) {
    if (PHOTOS.raw) photos = PHOTOS.raw;
    else if (PHOTOS.embedded) photos = PHOTOS.embedded;
    else if (PHOTOS.url) { try { const r = await fetch(PHOTOS.url); if (r.ok) photos = await r.json(); } catch {} }
  }
  const json = (o) => JSON.stringify(o).replace(/</g, "\\u003c");
  const end = "</" + "script>";
  return "<!doctype html>\n<html lang=\"" + lang + "\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">"
    + "<title>Cielos de Guatemala · Offline</title><style id=\"cg-css\">" + css + "</style></head><body><div id=\"root\"></div>"
    + "<script id=\"cg-snapshot\" type=\"application/json\">" + json(snapshot) + end
    + (photos ? "<script id=\"cg-photos\" type=\"application/json\">" + json(photos) + end : "")
    + "<script>" + js + end + "</body></html>";
}

function OfflineCard({ lang, caps, collectSnapshot, edits, current, db, writable }) {
  const x = UX[lang];
  const ph = usePhotos();
  const [incl, setIncl] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [imsg, setImsg] = useState("");
  const fileRef = useRef(null);
  const photoKb = ph.raw ? Math.round(JSON.stringify(ph.raw).length / 1024) : PHOTOS.url ? 430 : 0;

  if (OFFLINE) {
    const n = countEdits(edits);
    const exportNotes = () => {
      const data = { kind: "cg-field-notes", version: 1, exportedAt: nowIso(), from: SNAPSHOT.savedAt, sites: edits.sites || {}, places: edits.places || {}, log: edits.log || {}, loadout: edits.loadout || null };
      try {
        const blob = new Blob([JSON.stringify(data, null, 1)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob); a.download = `cielos-field-notes-${todayGT()}.json`;
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
        setMsg(x.exportDone);
      } catch { setMsg(x.offFail); }
    };
    return (
      <section className="sky-card offline-card">
        <h3>{x.exportTitle}</h3>
        <p className="dim">{x.exportDesc(n)}</p>
        <button className="plan-btn" onClick={exportNotes} disabled={!n}>{x.exportBtn}</button>
        {msg && <p className="dim small">{msg}</p>}
      </section>
    );
  }

  const save = async () => {
    if (!caps.downloads) return;
    setBusy(true); setMsg(x.offBusy);
    try {
      const html = await buildOfflineHtml({ snapshot: collectSnapshot(), includePhotos: incl, lang });
      await caps.downloads.save({ filename: `cielos-de-guatemala-offline-${todayGT()}.html`, data: html });
      setMsg(x.offSaved);
    } catch (e) {
      const c = e && e.code;
      setMsg(c === "declined" ? x.offDeclined : c === "rejected_extension" || c === "extension_not_enabled" ? x.offNoHtml : x.offFail);
    } finally { setBusy(false); }
  };
  const importNotes = async (file) => {
    setImsg("");
    let j = null;
    try { j = JSON.parse(await file.text()); } catch { j = null; }
    if (!j || j.kind !== "cg-field-notes") return setImsg(x.importBad);
    const okId = (id) => /^[A-Za-z0-9_\-.~:@+]{1,200}$/.test(id);
    let n = 0;
    try {
      for (const col of ["sites", "places", "log"]) {
        for (const [id, d] of Object.entries(j[col] || {})) {
          if (!okId(id)) continue;
          const cur = current[col] && current[col][id];
          if (d === null) {
            if (cur && (col !== "sites" || cur.custom)) { await db.doc(`${col}/${id}`).delete(); n++; }
            continue;
          }
          if (!d || typeof d !== "object") continue;
          if ((col === "sites" || col === "places") && !(typeof d.lat === "number" && typeof d.lon === "number")) continue;
          if (cur && cur.updatedAt && d.updatedAt && String(cur.updatedAt) >= String(d.updatedAt)) continue;
          await db.doc(`${col}/${id}`).set(d); n++;
        }
      }
      const lo = j.loadout && j.loadout.state && j.loadout.state.checked;
      if (lo && typeof lo === "object") { await db.doc("loadout/state").set({ checked: lo }); n++; }
      setImsg(n ? x.importDone(n) : x.importNone);
    } catch { setImsg(x.offFail); }
  };
  return (
    <section className="sky-card offline-card">
      <h3>{x.offTitle}</h3>
      <p className="dim">{x.offDesc}</p>
      {caps.downloads ? (
        <>
          <label className="check fx-nb"><input type="checkbox" checked={incl} onChange={(e) => setIncl(e.target.checked)} /> {x.offPhotos(photoKb || 430)}</label>
          <button className="plan-btn" onClick={save} disabled={busy}>{busy ? x.offBusy : x.offSave}</button>
        </>
      ) : caps.ready ? <p className="dim small">{x.offNoCap}</p> : null}
      {msg && <p className="dim small">{msg}</p>}
      {writable && (
        <div className="import-box">
          <div className="obj-h">{x.importTitle}</div>
          <p className="dim small">{x.importDesc}</p>
          <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) importNotes(f); e.target.value = ""; }} />
          <button className="mini-btn" onClick={() => fileRef.current && fileRef.current.click()}>{x.importBtn}</button>
          {imsg && <p className="dim small">{imsg}</p>}
        </div>
      )}
    </section>
  );
}

// Install prompt (Chrome/Edge/Android): kept here so any component can offer it once the browser allows
const INSTALL = { evt: null, subs: new Set() };
try {
  window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); INSTALL.evt = e; INSTALL.subs.forEach((f) => f()); });
  window.addEventListener("appinstalled", () => { INSTALL.evt = null; INSTALL.subs.forEach((f) => f()); });
} catch {}
function useInstall() {
  const [, force] = useState(0);
  useEffect(() => { const f = () => force((x) => x + 1); INSTALL.subs.add(f); return () => { INSTALL.subs.delete(f); }; }, []);
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent || "");
  const standalone = !!((window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || navigator.standalone);
  const prompt = async () => {
    const e = INSTALL.evt; if (!e) return null;
    e.prompt();
    let r = null; try { r = await e.userChoice; } catch {}
    INSTALL.evt = null; INSTALL.subs.forEach((f) => f());
    return r && r.outcome;
  };
  return { ready: !!INSTALL.evt, ios, standalone, prompt };
}
const INSTALL_TEXT = {
  en: { title: "Take it offline", done: "Installed: it works offline with the last saved forecast.", ios: "On iPhone: tap Share, then 'Add to Home Screen'. Open it once with signal to save the forecast.",
    any: "Install it on your phone or computer: it works offline with the last saved forecast.", btn: "Install app", grey: "If the button stays grey, use your browser menu: 'Install app' or 'Add to Home Screen'.", ok: "Installed.", short: "Works offline too —" },
  es: { title: "Llévala sin señal", done: "Ya está instalada: funciona sin conexión con el último pronóstico guardado.", ios: "En iPhone: toca Compartir y luego 'Agregar a inicio'. Ábrela una vez con señal para guardar el pronóstico.",
    any: "Instálala en tu teléfono o computadora: funciona sin conexión con el último pronóstico guardado.", btn: "Instalar app", grey: "Si el botón no se activa, usa el menú del navegador: 'Instalar app' o 'Agregar a inicio'.", ok: "Instalada.", short: "También funciona sin señal:" },
};
function InstallCard({ lang }) {
  const T = INSTALL_TEXT[lang];
  const I = useInstall();
  const [msg, setMsg] = useState("");
  return (
    <section className="sky-card install-card">
      <h3>{T.title}</h3>
      <p className="dim">{I.standalone ? T.done : I.ios ? T.ios : T.any}</p>
      {!I.standalone && !I.ios && <button className="plan-btn" onClick={async () => { const r = await I.prompt(); if (r === "accepted") setMsg(T.ok); }} disabled={!I.ready}>{T.btn}</button>}
      {!I.standalone && !I.ios && !I.ready && <p className="dim small">{T.grey}</p>}
      {msg && <p className="dim small">{msg}</p>}
    </section>
  );
}
// One-line version for the footer of the public site
function InstallLine({ lang }) {
  const T = INSTALL_TEXT[lang];
  const I = useInstall();
  if (I.standalone) return null;
  return (
    <p className="install-line">{T.short} {I.ready ? <button className="link-inline" onClick={I.prompt}>{T.btn}</button> : <span>{I.ios ? T.ios : T.grey}</span>}</p>
  );
}

function ExpeditionTab({ u, lang, loadout, db, writable, caps, collectSnapshot, edits, current }) {
  const pending = useRef(null), writing = useRef(false);
  const [local, setLocal] = useState(loadout);
  useEffect(() => { if (!writing.current) setLocal(loadout); }, [loadout]);
  const flush = async () => {
    if (writing.current || !pending.current) return;
    writing.current = true;
    const next = pending.current; pending.current = null;
    try { await db.doc("loadout/state").set({ checked: next }); } catch {}
    writing.current = false;
    if (pending.current) flush();
  };
  const toggle = (k) => {
    if (!writable) return;
    const next = { ...local }; if (next[k]) delete next[k]; else next[k] = true;
    setLocal(next); pending.current = next; flush();
  };
  const reset = () => { setLocal({}); pending.current = {}; flush(); };
  const total = LOADOUT_USE.reduce((s, c) => s + c.items.length, 0), done = Object.keys(local).length;
  return (
    <>
      {PLATFORM === "web" ? <InstallCard lang={lang} /> : <OfflineCard {...{ lang, caps, collectSnapshot, edits, current, db, writable }} />}
      <div className="loadout-header"><div className="section-title" style={{ margin: 0, border: "none" }}>{u.loadout}</div>
        <div className="loadout-progress"><span>{done}</span> / {total} {u.packed} {writable && done > 0 && <button className="reset-btn" onClick={reset}>{u.reset}</button>}</div></div>
      {!writable && <p className="dim small">{db ? u.readOnly : u.noDb}</p>}
      <div className="loadout-grid">
        {LOADOUT_USE.map((cat) => {
          const keys = cat.items.map((_, i) => `${cat.cat}-${i}`), complete = keys.every((k) => local[k]);
          return (
            <div key={cat.cat} className={`loadout-cat ${complete ? "complete" : ""}`}>
              <div className="loadout-cat-name"><span>{lang === "es" ? cat.cat_es : cat.cat}</span><span>{keys.filter((k) => local[k]).length}/{keys.length}</span></div>
              {cat.items.map((item, i) => {
                const k = keys[i], on = !!local[k];
                return <button key={k} className={`check-item ${on ? "checked" : ""}`} onClick={() => toggle(k)} aria-pressed={on}><span className="check-box">{on ? "✓" : ""}</span><span className="check-label">{lang === "es" && cat.items_es ? cat.items_es[i] : item}</span></button>;
              })}
            </div>
          );
        })}
      </div>
      <div className="section-title">{u.prep}</div>
      <div className="workflow-steps">{SITE_PREP_USE.map((s) => <div key={s.n} className="workflow-step"><div className="step-num">{s.n}</div><div><div className="step-title">{tr(s, "t", lang)}</div><div className="step-desc">{tr(s, "d", lang)}</div></div></div>)}</div>
      <div className="section-title">{u.logi}</div>
      <ul className="plain-list">{LOGISTICS_USE[lang].map((x) => <li key={x}>◎ {x}</li>)}</ul>
    </>
  );
}

function LogTab({ u, lang, log, db, writable }) {
  const rows = Object.entries(log).sort((a, b) => String(b[1].capturedAt || "").localeCompare(String(a[1].capturedAt || "")));
  return (
    <>
      <div className="section-title">{u.logTitle} — {rows.length}/{TARGETS.length}</div>
      {!rows.length ? <p className="empty">{u.logEmpty}</p> : (
        <div className="log-list">{rows.map(([id, e]) => {
          const t = TARGET_BY_ID[id]; if (!t) return null;
          return (
            <div key={id} className="log-row"><div className="log-row-top"><span><b>{tr(t, "name", lang)}</b> <span className="dim small">{factText(t.catalog, lang)}</span></span>
              <span><span className="log-date">{e.capturedAt}</span> {writable && <button className="log-remove" onClick={() => db.doc(`log/${id}`).delete().catch(() => {})}>{u.remove}</button>}</span></div>
              {e.note && <div className="log-note">{e.note}</div>}</div>
          );
        })}</div>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
