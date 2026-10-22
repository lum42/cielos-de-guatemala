// ── PUBLIC (WEB) VARIANTS OF PERSONAL CONTENT ───────────────────────────────
const LOADOUT_PUBLIC = [
  { cat: "Power & light", cat_es: "Energía y luz", items: ["Power bank or power station, charged", "Spare camera batteries (cold drains them fast)", "Dew heater band or hand warmers for the lens", "Red headlamp + spare batteries"],
    items_es: ["Batería externa o estación de energía, cargada", "Baterías de cámara de repuesto (el frío las agota rápido)", "Banda antivaho o calentadores de manos para el lente", "Linterna frontal roja + pilas de repuesto"] },
  { cat: "Camera & tracking", cat_es: "Cámara y seguimiento", items: ["Camera + tonight's lenses", "Sturdy tripod (+ tracker if you have one)", "Memory cards, formatted", "Remote / intervalometer", "Lens cloth and tape to fix focus"],
    items_es: ["Cámara + lentes de esta noche", "Trípode firme (+ rastreador si tienes)", "Tarjetas de memoria formateadas", "Disparador / intervalómetro", "Paño para el lente y cinta para fijar el enfoque"] },
  { cat: "Observing", cat_es: "Observación", items: ["Binoculars (7×50 or 10×50)", "This app saved offline (install it or save the page)", "Reclining chair or a mat to lie on"],
    items_es: ["Binoculares (7×50 o 10×50)", "Esta app guardada sin conexión (instálala o guarda la página)", "Silla reclinable o un petate para acostarte"] },
  { cat: "Comfort & safety", cat_es: "Comodidad y seguridad", items: ["Warm layers, hat and gloves — the highlands reach 0°C", "Water, hot drink, food", "First-aid kit", "Charged phone; tell someone where you are going", "Trash bag — pack everything out"],
    items_es: ["Capas de abrigo, gorro y guantes: el altiplano llega a 0°C", "Agua, bebida caliente, comida", "Botiquín", "Teléfono cargado; avisa a alguien a dónde vas", "Bolsa de basura: llévate todo"] },
  { cat: "Getting there", cat_es: "Para llegar", items: ["Full tank before mountain roads", "Offline maps downloaded", "Cash for community or park fees", "Volcano bulletin checked (INSIVUMEH) for volcanic areas"],
    items_es: ["Tanque lleno antes de los caminos de montaña", "Mapas sin conexión descargados", "Efectivo para cuotas comunitarias o de parques", "Boletín volcánico revisado (INSIVUMEH) en zonas volcánicas"] },
];
const SITE_PREP_PUBLIC = [
  { n: "01", t: "Arrive before dark", t_es: "Llega antes de oscurecer", d: "Scout in daylight: a clear view south and north, firm ground, a safe place to park facing the exit.", d_es: "Explora con luz: vista despejada al sur y al norte, suelo firme, un lugar seguro para estacionar mirando a la salida." },
  { n: "02", t: "Say hello", t_es: "Saluda", d: "Greet the community or caretaker, pay any fee and ask where it is fine to set up. A friendly daylight introduction is the best security.", d_es: "Saluda a la comunidad o al guardián, paga la cuota y pregunta dónde está bien instalarte. Una presentación amistosa de día es la mejor seguridad." },
  { n: "03", t: "Set up while you can see", t_es: "Instálate mientras ves", d: "Tripods level, dew protection on before the humidity rises, everything in reach.", d_es: "Trípodes nivelados, protección antivaho puesta antes de que suba la humedad, todo a la mano." },
  { n: "04", t: "Align at twilight", t_es: "Alinea al crepúsculo", d: "Rough polar alignment at dusk, fine-tune once Polaris shows (only 15° up from Guatemala).", d_es: "Alineación polar aproximada al anochecer y afínala cuando aparezca Polaris (a solo 15° desde Guatemala)." },
  { n: "05", t: "Red light only", t_es: "Solo luz roja", d: "Switch this app to Red, headlamps on red, car lights off. Your eyes — and everyone else's — need 30 minutes to adapt.", d_es: "Cambia la app a Rojo, frontales en rojo, luces del carro apagadas. Tus ojos —y los de todos— necesitan 30 minutos para adaptarse." },
  { n: "06", t: "Check every 45 minutes", t_es: "Revisa cada 45 minutos", d: "Dew, batteries, focus, framing — and yourself: layers, water, snack.", d_es: "Rocío, baterías, enfoque, encuadre y tú: abrigo, agua, refacción." },
];
const LOGISTICS_PUBLIC = {
  en: ["Fuel up before mountain roads; stations get scarce in the highlands.", "Sites above 3,000 m drop to freezing even in the dry season — and batteries die faster in the cold.", "Budget double the map time on dirt roads, and arrive in daylight.", "Rainy season (Jun–Oct): afternoons cloud over but some nights clear after midnight — check the forecast and be flexible.", "Volcanic areas: check the INSIVUMEH bulletin before you go.", "Respect sacred and community sites: ask permission, pay fees gladly, leave no trace."],
  es: ["Llena el tanque antes de los caminos de montaña; las gasolineras escasean en el altiplano.", "Los sitios a más de 3,000 m bajan a congelación incluso en época seca, y las baterías se agotan más rápido con el frío.", "Calcula el doble del tiempo del mapa en caminos de terracería y llega de día.", "Época lluviosa (jun–oct): las tardes se nublan pero algunas noches despejan después de medianoche; revisa el pronóstico y sé flexible.", "Zonas volcánicas: revisa el boletín de INSIVUMEH antes de ir.", "Respeta los sitios sagrados y comunitarios: pide permiso, paga las cuotas con gusto y no dejes rastro."],
};
// Strip review scores and prices from site notes (they go stale and come from third parties)
const scrubNote = (s) => (typeof s === "string" ? s.replace(/\s*\((?:\d\.\d★)[^)]*\)/g, "").replace(/\s*~Q\d+(?:\s*(?:entry|de entrada))?/g, "").replace(/\s+([,.;:])/g, "$1").replace(/,\s*\./g, ".").replace(/\s{2,}/g, " ").trim() : s);
const publicSite = (l) => ({ ...l, camp: scrubNote(l.camp), camp_es: scrubNote(l.camp_es), notes: scrubNote(l.notes) });

const PLANET_INFO = {
  venus: { name: "Venus", name_es: "Venus", text: "The brightest point after the Moon — the 'evening star' or 'morning star'. Binoculars show its phase.", text_es: "El punto más brillante después de la Luna: el 'lucero' de la tarde o de la mañana. Con binoculares se ve su fase." },
  mars: { name: "Mars", name_es: "Marte", text: "A steady orange-red point that slowly wanders among the stars.", text_es: "Un punto rojo-anaranjado fijo que se desplaza despacio entre las estrellas." },
  jupiter: { name: "Jupiter", name_es: "Júpiter", text: "A brilliant, steady 'star'. Steady binoculars show up to four of its moons in a line.", text_es: "Una 'estrella' brillante y fija. Con binoculares bien apoyados se ven hasta cuatro de sus lunas en línea." },
  saturn: { name: "Saturn", name_es: "Saturno", text: "A steady, slightly golden point. Its rings need a small telescope.", text_es: "Un punto fijo, algo dorado. Sus anillos requieren un telescopio pequeño." },
  moon: { name: "Moon", name_es: "Luna", text: "Binoculars show craters and mountains along the terminator, the line between day and night.", text_es: "Con binoculares se ven cráteres y montañas a lo largo del terminador, la línea entre el día y la noche." },
};

// ── SPANISH LABELS FOR DATA FIELDS ──────────────────────────────────────────
const SITE_NAME_ES = {
  cuch: "Altiplano de los Cuchumatanes", tajumulco: "Faldas altas del Tajumulco", chicabal: "Borde de la Laguna Chicabal",
  minas: "Sierra de las Minas", antigua: "Alrededores de Antigua", ipala: "Cráter del Volcán de Ipala", brava: "Laguna Brava (Yolnabaj)",
  magdalena: "Laguna Magdalena", acatenango: "Campamento del Acatenango", uaxactun: "Uaxactún (observatorio maya)", ayarza: "Laguna de Ayarza",
};
const siteName = (s, lang) => (s ? (lang === "es" && (s.name_es || (!s.custom && SITE_NAME_ES[s.id]))) || s.name || "" : "");
// Catalog facts are written in English; this swaps the handful of words they use.
const FACT_ES = [
  [/\bMly\b/g, "millones a. l."], [/\bly\b/g, "a. l."], [/\bAU\b/g, "UA"], [/ to /g, " a "], [/\brings\b/g, "anillos"],
  [/comet (.+) debris/, "restos del cometa $1"], [/asteroid Phaethon debris/, "restos del asteroide Faetón"], [/^Halley debris$/, "Restos del Halley"],
  [/bright core/, "núcleo brillante"], [/wide field/, "campo amplio"], [/all-sky/, "todo el cielo"], [/\bgroup\b/, "grupo"], [/\bchain\b/, "cadena"],
  [/\bpair\b/, "par"], [/\(nebula\)/, "(nebulosa)"], [/\bcore\b/, "núcleo"], [/\+ belt/, "+ cinturón"], [/\(cluster\)/, "(cúmulo)"], [/\(full\)/, "(llena)"],
  [/^Planet$/, "Planeta"], [/^Sun$/, "Sol"], [/^Radiant: Perseus$/, "Radiante: Perseo"], [/^Radiant: Lyra$/, "Radiante: Lira"], [/^Radiant: Gemini$/, "Radiante: Géminis"],
  [/^Nightscape$/, "Paisaje nocturno"], [/^Lunar surface$/, "Superficie lunar"], [/^Full arch$/, "Arco completo"], [/^Cygnus region$/, "Región del Cisne"],
  [/^(.+) region$/, "Región de $1"], [/^M31 center$/, "Centro de M31"], [/^Virgo Cluster$/, "Cúmulo de Virgo"], [/^Sagittarius$/, "Sagitario"], [/Trapezium/, "Trapecio"],
];
const factText = (s, lang) => (lang === "es" && typeof s === "string" ? FACT_ES.reduce((a, [re, r]) => a.replace(re, r), s) : s);
// Camera and lens names stay in English except a few descriptive words
const gearName = (n, lang) => (lang === "es" && typeof n === "string" ? n.replace(/\badapted\b/, "adaptado").replace(/\bdiscontinued\b/, "descontinuada") : n);
