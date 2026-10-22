const LENSES = [
  { id: "laowa75", role_es: "Paisaje nocturno amplio", filter_es: "Rosca 46mm — STC directo", warn_es: "Cierra a f/2.8 para esquinas limpias. El modo High Res no sirve para astro — la deriva estelar supera el beneficio del pixel-shift.", name: "Laowa 7.5mm f/2", ff: "15mm", ap: "f/2 – f/2.8", role: "Wide Nightscape", filter: "46mm thread — direct STC fit", tracker: "optional", coma: "low",
    warn: "Stop to f/2.8 for clean corner stars. High Res mode not useful for astro — star drift exceeds pixel-shift benefit." },
  { id: "oly714", role_es: "Paisaje ultra-amplio", filter_es: "SIN FILTRO — frontal bulboso", warn_es: "Elemento frontal bulboso — STC físicamente imposible. Usa el Laowa para trabajo con filtro; este para máxima amplitud sin filtro.", name: "7-14mm f/2.8 PRO", ff: "14–28mm", ap: "f/2.8 – f/4", role: "Ultra-wide Nightscape", filter: "NO FILTER — bulbous front", tracker: "optional", coma: "moderate",
    warn: "Bulbous front element — STC physically impossible. Use Laowa for filtered work, this lens for maximum width unfiltered." },
  { id: "oly17", role_es: "Vía Láctea + primer plano", filter_es: "Clip-in", warn_es: "Coma leve a f/1.2 — cierra a f/1.8 para bordes limpios. El lente nocturno más práctico del kit.", name: "17mm f/1.2 PRO", ff: "34mm", ap: "f/1.8", role: "Milky Way + Foreground", filter: "Clip-in", tracker: "optional", coma: "low",
    warn: "Mild coma at f/1.2 — stop to f/1.8 for clean edge stars. Most practical nightscape lens in the kit." },
  { id: "oly25", role_es: "Campos regionales de nebulosas", filter_es: "Clip-in", warn_es: "Coma leve + viñeteo moderado a f/1.2. Cierra a f/1.8. FOV perfecto para Rho Ophiuchi y Orión.", name: "25mm f/1.2 PRO", ff: "50mm", ap: "f/1.8", role: "Regional Nebula Fields", filter: "Clip-in", tracker: "recommended", coma: "low",
    warn: "Mild coma + moderate vignette at f/1.2. Stop to f/1.8. Perfect FOV for Rho Ophiuchi and Orion regions." },
  { id: "nocticron", role_es: "Globulares y galaxias", filter_es: "Clip-in — OIS APAGADO", warn_es: "OIS APAGADO en la montura — verificar cada sesión. Enfoque electrónico sin tope de infinito: marca con cinta y confirma en live view. Flats esenciales a f/1.2.", name: "Nocticron 42.5mm f/1.2", ff: "85mm", ap: "f/1.2 usable", role: "Globulars & Galaxies", filter: "Clip-in — OIS OFF", tracker: "recommended", coma: "none",
    warn: "OIS MUST be OFF on tracker — verify every session. Electronic focus, no hard infinity stop: mark with tape, confirm via live view. Flat frames essential at f/1.2." },
  { id: "oly75", role_es: "Objetivos de precisión", filter_es: "Clip-in", warn_es: "Aberraciones insignificantes — lente MFT de referencia. Si las estrellas se ven mal es seeing o enfoque, no el lente.", name: "75mm f/1.8", ff: "150mm", ap: "f/1.8 – f/2", role: "Precision Targets", filter: "Clip-in", tracker: "essential", coma: "very low",
    warn: "Negligible aberrations — benchmark MFT lens. If stars look poor it's seeing or focus, not the lens." },
  { id: "zoom40150", role_es: "Cielo profundo versátil", filter_es: "Clip-in", warn_es: "Viñeteo leve en 40mm — cierra a f/4 en la focal corta. De 80mm en adelante, sin compromisos. Tu lente definitivo para Andrómeda a 135mm.", name: "40-150mm f/2.8 PRO", ff: "80–300mm", ap: "f/2.8 – f/4", role: "Versatile Deep Sky", filter: "Clip-in", tracker: "essential", coma: "low",
    warn: "Mild vignette at 40mm end — stop to f/4 at shortest FL. At 80mm+ essentially no compromise. Your definitive Andromeda lens at 135mm." },
  { id: "zoom50200", role_es: "Cielo profundo rápido", filter_es: "Clip-in — IS APAGADO", warn_es: "IS APAGADO en la montura. Esquinas suaves a f/2.8 — cierra a f/4 para campos estelares. Sin probar en astro — territorio pionero.", name: "50-200mm f/2.8 IS PRO", ff: "100–400mm", ap: "f/2.8 – f/4", role: "High-Speed Deep Sky", filter: "Clip-in — IS OFF", tracker: "essential", coma: "low", future: true,
    warn: "IS OFF on tracker. Corner softness at f/2.8 — stop to f/4 for star fields. Untested for astro — pioneer territory." },
  { id: "300f4", role_es: "Detalle de cielo profundo", filter_es: "Clip-in — IS APAGADO", warn_es: "IS APAGADO en la montura. MC-14 (→840mm f/5.6) aceptable. MC-20 (→f/8) evitar — muy oscuro. Subs de 20–30s máx sin guiado; apilar 60–100 tomas.", name: "300mm f/4 IS PRO", ff: "600mm equiv", ap: "f/4 wide open", role: "Deep Sky Detail", filter: "Clip-in — IS OFF", tracker: "essential", coma: "none",
    warn: "IS OFF on tracker. MC-14 (→840mm f/5.6) acceptable for astro. MC-20 (→f/8) avoid — too dim. 20–30s max unguided sub, stack 60–100 frames." },
  { id: "zoom150400", role_es: "Planetaria y lunar", filter_es: "Clip-in — IS APAGADO", warn_es: "TC 1.25x integrado → 375–1000mm FF equiv. MC-14 → hasta 1400mm. MC-20 evitar en cielo profundo. El lente más pesado — verifica la carga del GTi. Subs 15–25s en focal larga; apilar 80–120.", name: "150-400mm f/4.5 IS PRO", ff: "300–800mm equiv", ap: "f/4.5 wide open", role: "Planetary & Lunar", filter: "Clip-in — IS OFF", tracker: "essential", coma: "none", future: true,
    warn: "Built-in 1.25x TC → 375–1000mm FF equiv. MC-14 → up to 1400mm. MC-20 avoid for deep sky. Heaviest lens in kit — verify GTi payload. Subs 15–25s at long end, stack 80–120." },
];

// Full merge of PDF guide + original app data
const TARGETS = [
  // ── MILKY WAY / WIDE FIELD ──
  { id: "mw_arch", name_es: "Arco de la Vía Láctea", windowLabel_es: "May–Ago madrugada → noche", notes_es: "Arco completo del horizonte al cenit, casi vertical a 15°N — ventaja única.", name: "Milky Way Arch", type: "Milky Way", catalog: "Full arch", window: ["May","Jun","Jul","Aug"], windowLabel: "May–Aug pre-dawn → evening", lenses: ["laowa75","oly714","oly17"], priority: 3, notes: "Full arch horizon to zenith, nearly vertical at 15°N — unique advantage.", filter: "optional", bortle: "3+" },
  { id: "mw_core", name_es: "Centro Galáctico", windowLabel_es: "May–Ago · cenital Jul–Ago", notes_es: "Casi cenital (75° alt) Jul–Ago a 15°N. Nube estelar densa + carriles oscuros — extraordinario a f/1.2.", name: "Galactic Center", type: "Milky Way", catalog: "Sagittarius", window: ["May","Jun","Jul","Aug"], windowLabel: "May–Aug · overhead Jul–Aug", lenses: ["laowa75","oly714","oly17","oly25","nocticron"], priority: 3, notes: "Nearly overhead (75° alt) Jul–Aug at 15°N. Dense star cloud + dark lane structure — extraordinary at f/1.2.", filter: "optional", bortle: "2+" },
  { id: "mw_volcano", name_es: "Vía Láctea + Volcán", windowLabel_es: "May (seca) — borde del Chicabal", notes_es: "Erupción del Santiaguito como primer plano desde el cráter del Chicabal. Paisaje nocturno insignia de Guatemala.", name: "Milky Way + Volcano", type: "Milky Way", catalog: "Nightscape", window: ["Apr","May"], windowLabel: "May (dry) — Chicabal rim", lenses: ["laowa75","oly17"], priority: 2, notes: "Santiaguito eruption foreground from Chicabal crater rim. Signature Guatemala nightscape.", filter: "optional", bortle: "3+" },
  { id: "rho_oph", name_es: "Complejo Rho Ophiuchi", windowLabel_es: "May madrugada — PRIORIDAD", notes_es: "El campo amplio más colorido del cielo. Antares brilla rojo-naranja. Más alto a 15°N que en EE.UU./Europa. Mejor lente: Nocticron f/1.2.", name: "Rho Ophiuchi Complex", type: "Nebula", catalog: "IC 4604 region", window: ["May","Jun"], windowLabel: "May pre-dawn — PRIORITY", lenses: ["oly25","oly17","nocticron","zoom40150"], priority: 3, notes: "Most colorful wide-field in the sky. Antares glows red-orange. Higher at 15°N than any US/EU site. Best lens: Nocticron f/1.2.", filter: "optional", bortle: "2+" },
  { id: "scorpius", name_es: "Campo Rico de Escorpio", windowLabel_es: "May–Ago", notes_es: "Escorpio alto y dramático a 15°N. Campo rico en cúmulos, el globular M4 junto a la gigante coloreada.", name: "Scorpius Rich Field", type: "Star Field", catalog: "M6 / M7 / M4 / Antares", window: ["May","Jun","Jul","Aug"], windowLabel: "May–Aug", lenses: ["laowa75","oly17","oly25"], priority: 2, notes: "Scorpius high and dramatic at 15°N. Cluster-rich field, globular M4 + colored giant together.", filter: "optional", bortle: "2+" },
  { id: "cygnus", name_es: "Vía Láctea en el Cisne", windowLabel_es: "Jul–Sep", notes_es: "Vía Láctea densa con la región de la Nebulosa Norteamérica. Ideal para panorámicas.", name: "Cygnus Milky Way", type: "Star Field", catalog: "Cygnus region", window: ["Jul","Aug","Sep"], windowLabel: "Jul–Sep", lenses: ["laowa75","oly714","oly17","oly25"], priority: 2, notes: "Dense Milky Way with North America Nebula region. Panorama-friendly.", filter: "optional", bortle: "3+" },
  // ── METEOR SHOWERS ──
  { id: "lyrids", name_es: "Meteoros Líridas", windowLabel_es: "Pico 21–22 abr", notes_es: "Pico de 18/h después de medianoche. Luna nueva el 17 abr — cielos oscuros en el pico.", name: "Lyrid Meteors", type: "Meteor Shower", catalog: "Radiant: Lyra", window: ["Apr"], windowLabel: "Apr 21–22 peak", lenses: ["laowa75","oly714","oly17"], priority: 3, notes: "18/hr peak, after midnight. New moon Apr 17 — dark skies at peak.", filter: "none", bortle: "any" },
  { id: "eta_aq", name_es: "Meteoros Eta Acuáridas", windowLabel_es: "Pico 6–7 may", notes_es: "30/h a 15°N — el doble que a 45°N. Restos del Halley. Radiante en Acuario de madrugada.", name: "Eta Aquarid Meteors", type: "Meteor Shower", catalog: "Halley debris", window: ["May"], windowLabel: "May 6–7 peak", lenses: ["laowa75","oly714","oly17"], priority: 3, notes: "30/hr at 15°N — double the 45°N rate. Pre-dawn Aquarius radiant.", filter: "none", bortle: "any" },
  { id: "perseids", name_es: "Meteoros Perseidas", windowLabel_es: "Pico 12–13 ago", notes_es: "Pico de 100/h, multicolores. Verifica la fase lunar; sitio oscuro muy recomendado.", name: "Perseid Meteors", type: "Meteor Shower", catalog: "Radiant: Perseus", window: ["Aug"], windowLabel: "Aug 12–13 peak", lenses: ["laowa75","oly714","oly17"], priority: 2, notes: "100/hr peak, multi-colored. Check moon phase; dark site strongly preferred.", filter: "none", bortle: "any" },
  { id: "geminids", name_es: "Meteoros Gemínidas", windowLabel_es: "Pico 13–14 dic", notes_es: "La mejor lluvia anual — 120/h, toda la noche, multicolores.", name: "Geminid Meteors", type: "Meteor Shower", catalog: "Radiant: Gemini", window: ["Dec"], windowLabel: "Dec 13–14 peak", lenses: ["laowa75","oly714","oly17"], priority: 3, notes: "Best annual shower — 120/hr, all night, multi-colored.", filter: "none", bortle: "any" },
  // ── SPRING GALAXIES ──
  { id: "leo_triplet", name_es: "Triplete de Leo", windowLabel_es: "Abr–May noches", notes_es: "Las tres en un cuadro a 100mm equiv; cerca del cenit en abril. f/1.2 revela estructura externa débil.", name: "Leo Triplet", type: "Galaxy", catalog: "M65 / M66 / NGC 3628", window: ["Apr","May"], windowLabel: "Apr–May evenings", lenses: ["oly25","nocticron","oly75","zoom40150","zoom50200"], priority: 3, notes: "All three in one frame at 100mm equiv; near zenith in April. f/1.2 reveals faint outer structure.", filter: "optional", bortle: "4+" },
  { id: "sombrero", name_es: "Galaxia del Sombrero", windowLabel_es: "Abr–May", notes_es: "Franja de polvo claramente visible con apilado. Bulbo + franja resueltos a 800mm equiv.", name: "Sombrero Galaxy", type: "Galaxy", catalog: "M104", window: ["Apr","May"], windowLabel: "Apr–May", lenses: ["oly75","zoom40150","zoom50200","300f4","zoom150400"], priority: 2, notes: "Dust lane clearly visible with stacking. Fully resolved bulge + lane at 800mm equiv.", filter: "optional", bortle: "3+" },
  { id: "m64", name_es: "Galaxia Ojo Negro", windowLabel_es: "Abr–May · 10pm–medianoche", notes_es: "Franja de polvo oscura sobre el núcleo a 85–150mm equiv con apilado.", name: "Black Eye Galaxy", type: "Galaxy", catalog: "M64 / NGC 4826", window: ["Apr","May"], windowLabel: "Apr–May · 10pm–midnight", lenses: ["nocticron","oly75","zoom40150"], priority: 2, notes: "Dark dust lane across nucleus at 85–150mm equiv with stacking.", filter: "optional", bortle: "3+" },
  { id: "m51", name_es: "Galaxia Remolino", windowLabel_es: "Abr–Jun", notes_es: "Par en interacción — exposiciones largas revelan el puente de marea.", name: "Whirlpool Galaxy", type: "Galaxy", catalog: "M51 + NGC 5195", window: ["Apr","May","Jun"], windowLabel: "Apr–Jun", lenses: ["oly75","zoom40150","zoom50200"], priority: 2, notes: "Interacting pair — long exposures reveal the tidal bridge.", filter: "optional", bortle: "3+" },
  { id: "virgo", name_es: "Cadena de Markarian", windowLabel_es: "Abr–May", notes_es: "Cadena de galaxias en un solo cuadro amplio — 50–100mm equiv ideal.", name: "Markarian's Chain", type: "Galaxy", catalog: "Virgo Cluster", window: ["Apr","May"], windowLabel: "Apr–May", lenses: ["oly25","oly17","zoom40150"], priority: 2, notes: "Chain of galaxies in a single wide frame — 50–100mm equiv ideal.", filter: "optional", bortle: "3+" },
  { id: "m33", name_es: "Galaxia del Triángulo", windowLabel_es: "Oct–Nov", notes_es: "Galaxia grande y difusa — brazos espirales con apilado; f/1.2 revela estructura débil.", name: "Triangulum Galaxy", type: "Galaxy", catalog: "M33 / NGC 598", window: ["Oct","Nov"], windowLabel: "Oct–Nov", lenses: ["zoom40150","zoom50200","nocticron"], priority: 2, notes: "Large diffuse galaxy — spiral arms with stacking; f/1.2 reveals faint structure.", filter: "optional", bortle: "3+" },
  // ── SOUTHERN EXCLUSIVES ──
  { id: "omega_cen", name_es: "Omega Centauri", windowLabel_es: "Noches de mayo — JOYA DE LA CORONA", notes_es: "30° de altitud — invisible desde EE.UU./Europa. Miles de estrellas individuales resueltas. Sin equivalente en el hemisferio norte.", name: "Omega Centauri", type: "Globular Cluster", catalog: "NGC 5139", window: ["Apr","May"], windowLabel: "May evenings — CROWN JEWEL", lenses: ["oly75","zoom40150","zoom50200","300f4","zoom150400","nocticron"], priority: 3, notes: "30° altitude — invisible from USA/Europe. Resolve thousands of individual stars. No northern-hemisphere equivalent.", filter: "optional", bortle: "2+" },
  { id: "cen_a", name_es: "Centaurus A", windowLabel_es: "May — solo sitio oscuro", notes_es: "Franja de polvo que biseca la galaxia — icónica desde 15°N. Muy al sur: se necesita el borde sur de los Cuchumatanes. f/1.2 compensa la extinción.", name: "Centaurus A", type: "Galaxy", catalog: "NGC 5128", window: ["May"], windowLabel: "May — dark site only", lenses: ["oly75","zoom40150","zoom50200","300f4"], priority: 2, notes: "Dark dust lane bisecting the galaxy — iconic from 15°N. Low south: Cuchumatanes south edge needed. f/1.2 offsets extinction.", filter: "optional", bortle: "2+" },
  { id: "lmc", name_es: "Gran Nube de Magallanes", windowLabel_es: "Dic–Feb — solo noches excepcionales (máx ~5°)", notes_es: "RARA desde 15°N — apenas supera un horizonte sur plano y perfecto. Un intento por temporada.", name: "Large Magellanic Cloud", type: "Galaxy", catalog: "LMC", window: ["Dec","Jan","Feb"], windowLabel: "Dec–Feb — exceptional nights only (max ~5°)", lenses: ["laowa75","oly714","oly17","oly25"], priority: 1, notes: "RARE from 15°N — barely clears a perfect flat southern horizon. Once-a-season attempt.", filter: "none", bortle: "1+" },
  { id: "tuc47", name_es: "47 Tucanae", windowLabel_es: "Oct–Dic al anochecer — máx ~3°", notes_es: "Objetivo del extremo sur — solo en noches excepcionales desde 15°N.", name: "47 Tucanae", type: "Globular Cluster", catalog: "NGC 104", window: ["Oct","Nov","Dec"], windowLabel: "Oct–Dec evenings — max ~3°", lenses: ["oly75"], priority: 1, notes: "Extreme southern target — only on exceptional nights from 15°N.", filter: "none", bortle: "1+" },
  { id: "eta_car", name_es: "Nebulosa Eta Carinae", windowLabel_es: "Feb–May — máx ~15°", notes_es: "Extremo sur, apenas accesible a 15°N. ~100mm equiv si el horizonte está perfecto.", name: "Eta Carinae Nebula", type: "Nebula", catalog: "NGC 3372", window: ["Feb","Mar","Apr","May"], windowLabel: "Feb–May — max ~15°", lenses: ["zoom40150"], priority: 1, notes: "Extreme south, barely accessible at 15°N. ~100mm equiv if horizon perfectly clear.", filter: "recommended", bortle: "2+" },
  // ── SUMMER NEBULAE ──
  { id: "lagoon_trifid", name_es: "Par Laguna + Trífida", windowLabel_es: "May madrugada → Jun+ noches", notes_es: "Ambas en cuadro a ~110mm equiv — pareja perfecta. Filtro STC esencial.", name: "Lagoon + Trifid Pair", type: "Nebula", catalog: "M8 + M20", window: ["May","Jun","Jul","Aug"], windowLabel: "May pre-dawn → Jun+ evenings", lenses: ["zoom40150","zoom50200","oly25"], priority: 3, notes: "Both in frame at ~110mm equiv — perfect pairing. STC filter essential.", filter: "essential", bortle: "3+" },
  { id: "lagoon_detail", name_es: "Detalle de la Nebulosa Laguna", windowLabel_es: "Jun–Ago noches", notes_es: "Cuadro completo a 600mm equiv. Región del reloj de arena + cúmulo embebido.", name: "Lagoon Nebula Detail", type: "Nebula", catalog: "M8 / NGC 6523", window: ["Jun","Jul","Aug"], windowLabel: "Jun–Aug evenings", lenses: ["300f4","zoom150400","zoom50200"], priority: 3, notes: "Full frame at 600mm equiv. Hourglass region + embedded cluster.", filter: "recommended", bortle: "3+" },
  { id: "eagle_omega", name_es: "Par Águila + Omega", windowLabel_es: "Jul–Ago", notes_es: "Ambas caben a 100mm equiv. El filtro STC revela la estructura H-alfa.", name: "Eagle + Omega Pair", type: "Nebula", catalog: "M16 + M17", window: ["Jul","Aug"], windowLabel: "Jul–Aug", lenses: ["zoom40150","zoom50200"], priority: 3, notes: "Both fit at 100mm equiv. STC filter reveals H-alpha structure.", filter: "recommended", bortle: "3+" },
  { id: "eagle_pillars", name_es: "Pilares del Águila", windowLabel_es: "Jul–Ago", notes_es: "Región de los Pilares de la Creación a máxima focal. STC esencial.", name: "Eagle Nebula Pillars", type: "Nebula", catalog: "M16 region", window: ["Jul","Aug"], windowLabel: "Jul–Aug", lenses: ["300f4","zoom150400"], priority: 2, notes: "Pillars of Creation region at longest focal lengths. STC essential.", filter: "essential", bortle: "3+" },
  { id: "omega_neb", name_es: "Nebulosa Omega (Cisne)", windowLabel_es: "Jul–Ago", notes_es: "Forma de cisne bien definida a 600mm equiv. STC revela H-alfa.", name: "Omega (Swan) Nebula", type: "Nebula", catalog: "M17 / NGC 6618", window: ["Jul","Aug"], windowLabel: "Jul–Aug", lenses: ["300f4","zoom50200"], priority: 2, notes: "Swan shape clearly defined at 600mm equiv. STC reveals H-alpha.", filter: "recommended", bortle: "3+" },
  { id: "north_am", name_es: "Nebulosa Norteamérica", windowLabel_es: "Jul–Sep", notes_es: "Complejo completo a 100mm; Muro del Cisne aislado a 150mm. STC esencial.", name: "North America Nebula", type: "Nebula", catalog: "NGC 7000", window: ["Jul","Aug","Sep"], windowLabel: "Jul–Sep", lenses: ["zoom40150","zoom50200","oly25"], priority: 2, notes: "Full complex at 100mm; Cygnus Wall isolated at 150mm. STC essential.", filter: "essential", bortle: "3+" },
  { id: "m57", name_es: "Nebulosa del Anillo", windowLabel_es: "Jun–Sep", notes_es: "Anillo resuelto a 600mm+; con MC-14 en el 300mm (→840mm f/5.6) la forma queda clara. Estrella central detectable con apilado.", name: "Ring Nebula", type: "Nebula", catalog: "M57 / NGC 6720", window: ["Jun","Jul","Aug","Sep"], windowLabel: "Jun–Sep", lenses: ["oly75","300f4","zoom150400"], priority: 2, notes: "Ring resolved at 600mm+; with MC-14 on the 300mm (→840mm f/5.6) the shape is clearly defined. Central star detectable with stacking.", filter: "none", bortle: "3+" },
  // ── GLOBULAR CLUSTERS ──
  { id: "m13", name_es: "Cúmulo de Hércules M13", windowLabel_es: "May–Ago — sale hacia las 11pm", notes_es: "El mejor globular del norte. Estrellas individuales a f/1.2; núcleo profundo a 800mm equiv.", name: "M13 Hercules Cluster", type: "Globular Cluster", catalog: "NGC 6205", window: ["May","Jun","Jul","Aug"], windowLabel: "May–Aug — rises by 11pm", lenses: ["nocticron","oly75","zoom40150","300f4","zoom150400"], priority: 3, notes: "Finest northern globular. Individual stars resolve at f/1.2; deep core at 800mm equiv.", filter: "none", bortle: "3+" },
  { id: "m3", name_es: "Globular M3", windowLabel_es: "Abr–Jun · 10–11pm", notes_es: "Rivaliza con M13 y suele ignorarse. Bien ubicado temprano Abr–May.", name: "M3 Globular", type: "Globular Cluster", catalog: "NGC 5272", window: ["Apr","May","Jun"], windowLabel: "Apr–Jun · 10–11pm", lenses: ["nocticron","oly75","zoom40150","300f4","zoom150400"], priority: 3, notes: "Rivals M13, often overlooked. Well placed early evening Apr–May.", filter: "none", bortle: "3+" },
  { id: "m5", name_es: "Globular M5 (Serpens)", windowLabel_es: "May–Jun desde medianoche", notes_es: "Uno de los cúmulos más antiguos del cielo. Núcleo denso resuelto a focal larga.", name: "M5 Serpens Globular", type: "Globular Cluster", catalog: "NGC 5904", window: ["May","Jun"], windowLabel: "May–Jun from midnight", lenses: ["nocticron","oly75","zoom40150","300f4","zoom150400"], priority: 3, notes: "One of the sky's oldest clusters. Dense core resolves at long FL.", filter: "none", bortle: "3+" },
  { id: "m92", name_es: "M92 en Hércules", windowLabel_es: "Jun–Ago", notes_es: "Segundo globular de Hércules, junto a M13 — misma sesión. Premia focales largas.", name: "M92 in Hercules", type: "Globular Cluster", catalog: "NGC 6341", window: ["Jun","Jul","Aug"], windowLabel: "Jun–Aug", lenses: ["nocticron","oly75","300f4","zoom150400"], priority: 2, notes: "Second Hercules globular near M13 — shoot in the same session. Rewards long focal lengths.", filter: "none", bortle: "3+" },
  { id: "m53", name_es: "M53 en Coma Berenices", windowLabel_es: "Abr–May · 10pm–medianoche", notes_es: "Cerca de M3 en el cielo. Objetivo subestimado.", name: "M53 Coma Berenices", type: "Globular Cluster", catalog: "NGC 5024", window: ["Apr","May"], windowLabel: "Apr–May · 10pm–midnight", lenses: ["oly75","nocticron","300f4"], priority: 2, notes: "Near M3 in the sky. Underrated target.", filter: "none", bortle: "3+" },
  { id: "m68", name_es: "Globular M68", windowLabel_es: "Abr–May noches", notes_es: "Poco fotografiado — buen reto, bien ubicado en noches de primavera.", name: "M68 Globular", type: "Globular Cluster", catalog: "NGC 4590 · Hydra", window: ["Apr","May"], windowLabel: "Apr–May evenings", lenses: ["oly75","300f4"], priority: 1, notes: "Less imaged — a good challenge, well placed spring evenings.", filter: "none", bortle: "3+" },
  // ── AUTUMN ──
  { id: "andromeda_full", name_es: "Andrómeda — Completa", windowLabel_es: "Oct–Nov — PRIORIDAD", notes_es: "Galaxia completa + compañeras a 135–150mm equiv. Balanceada y detallada también a 85mm.", name: "Andromeda — Full", type: "Galaxy", catalog: "M31 + M32 + M110", window: ["Oct","Nov"], windowLabel: "Oct–Nov — PRIORITY", lenses: ["zoom40150","zoom50200","nocticron"], priority: 3, notes: "Full galaxy + companions at 135–150mm equiv. Balanced, detailed at 85mm too.", filter: "optional", bortle: "3+" },
  { id: "andromeda_core", name_es: "Núcleo de Andrómeda", windowLabel_es: "Oct–Nov", notes_es: "Franjas de polvo, nube estelar NE, región de núcleos P1/P2 — interpretación íntima.", name: "Andromeda Core", type: "Galaxy", catalog: "M31 center", window: ["Oct","Nov"], windowLabel: "Oct–Nov", lenses: ["300f4","zoom150400","oly75"], priority: 2, notes: "Dust lanes, NE star cloud, P1/P2 nuclei region — intimate interpretation.", filter: "optional", bortle: "3+" },
  { id: "double_cluster", name_es: "Cúmulo Doble", windowLabel_es: "Oct–Feb", notes_es: "Ambos cúmulos con campo rico a 80mm equiv.", name: "Double Cluster", type: "Open Cluster", catalog: "NGC 869 + 884", window: ["Oct","Nov","Dec","Jan","Feb"], windowLabel: "Oct–Feb", lenses: ["zoom40150","oly75"], priority: 2, notes: "Both clusters with rich field context at 80mm equiv.", filter: "none", bortle: "3+" },
  // ── WINTER ──
  { id: "orion_ctx", name_es: "Nebulosa de Orión + Contexto", windowLabel_es: "Nov–Ene — TEMPORADA PRIMA", notes_es: "M42 + Running Man + estrellas del cinturón en un cuadro a 50–100mm equiv.", name: "Orion Nebula + Context", type: "Nebula", catalog: "M42 + NGC 1977", window: ["Nov","Dec","Jan"], windowLabel: "Nov–Jan — PRIME", lenses: ["oly25","zoom40150","zoom50200"], priority: 3, notes: "M42 + Running Man + belt stars in one frame at 50–100mm equiv.", filter: "recommended", bortle: "3+" },
  { id: "orion_detail", name_es: "Detalle de la Nebulosa de Orión", windowLabel_es: "Nov–Ene", notes_es: "El mejor objetivo del año para el 300mm — Trapecio resuelto, frentes de choque, franjas de polvo.", name: "Orion Nebula Detail", type: "Nebula", catalog: "M42 / Trapezium", window: ["Nov","Dec","Jan"], windowLabel: "Nov–Jan", lenses: ["300f4","zoom150400","zoom50200"], priority: 3, notes: "Best 300mm target of the year — Trapezium resolved, shock fronts, dust lanes.", filter: "recommended", bortle: "3+" },
  { id: "rosette", name_es: "Nebulosa Roseta", windowLabel_es: "Dic–Ene", notes_es: "Llena el cuadro casi perfecto a 100mm equiv. STC esencial — objetivo espectacular.", name: "Rosette Nebula", type: "Nebula", catalog: "NGC 2237", window: ["Dec","Jan"], windowLabel: "Dec–Jan", lenses: ["zoom40150","zoom50200","300f4"], priority: 3, notes: "Near-perfect frame fill at 100mm equiv. STC essential — striking target.", filter: "essential", bortle: "3+" },
  { id: "crab", name_es: "Nebulosa del Cangrejo", windowLabel_es: "Nov–Ene", notes_es: "Remanente de supernova — filamentos de calidad casi telescópica a 800mm equiv con STC.", name: "Crab Nebula", type: "Nebula", catalog: "M1 / NGC 1952", window: ["Nov","Dec","Jan"], windowLabel: "Nov–Jan", lenses: ["300f4","zoom150400","zoom50200"], priority: 2, notes: "Supernova remnant — filament structure approaches telescope quality at 800mm equiv with STC.", filter: "recommended", bortle: "3+" },
  { id: "ngc1788", name_es: "NGC 1788 Murciélago Cósmico", windowLabel_es: "Nov–Ene", notes_es: "Nebulosa de reflexión + anillo H-alfa. Transita casi cenital a 15°N — objetivo raro.", name: "NGC 1788 Cosmic Bat", type: "Nebula", catalog: "NGC 1788", window: ["Nov","Dec","Jan"], windowLabel: "Nov–Jan", lenses: ["300f4","zoom40150","zoom50200","zoom150400"], priority: 2, notes: "Reflection nebula + H-alpha ring. Transits nearly overhead at 15°N — rare target.", filter: "recommended", bortle: "2+" },
  { id: "pleiades", name_es: "Pléyades + Nebulosidad", windowLabel_es: "Nov–Ene", notes_es: "Nebulosas azules de reflexión reveladas con apilado.", name: "Pleiades + Nebulosity", type: "Open Cluster", catalog: "M45", window: ["Nov","Dec","Jan"], windowLabel: "Nov–Jan", lenses: ["oly25","zoom40150","zoom50200"], priority: 2, notes: "Blue reflection nebulae revealed with stacking.", filter: "optional", bortle: "3+" },
  // ── LUNAR / PLANETARY / SOLAR ──
  { id: "moon", name_es: "Luna — Terminador", windowLabel_es: "Cualquier fase 40–80%", notes_es: "El terminador muestra la profundidad de los cráteres. Velocidad lunar en SynScan. Serie de cráteres: Tycho, Copérnico, Clavius.", name: "Moon — Terminator", type: "Lunar", catalog: "Lunar surface", window: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], windowLabel: "Any 40–80% phase", lenses: ["300f4","zoom150400","zoom50200"], priority: 3, notes: "Terminator shows crater depth. Lunar tracking rate on SynScan. Crater panel series: Tycho, Copernicus, Clavius.", filter: "none", bortle: "any" },
  { id: "jupiter", name_es: "Júpiter", windowLabel_es: "Cerca de oposición", notes_es: "Bandas de nubes + lunas galileanas. La mejor focal planetaria del kit a 800–1000mm equiv.", name: "Jupiter", type: "Planet", catalog: "Planet", window: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], windowLabel: "Near opposition", lenses: ["zoom150400","300f4"], priority: 2, notes: "Cloud bands + Galilean moons. Best planetary FL in the MFT kit at 800–1000mm equiv.", filter: "none", bortle: "any" },
  { id: "saturn", name_es: "Saturno + Anillos", windowLabel_es: "Cerca de oposición", notes_es: "Sistema de anillos + división de Cassini + Titán. Velocidad de seguimiento planetaria.", name: "Saturn + Rings", type: "Planet", catalog: "Planet", window: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], windowLabel: "Near opposition", lenses: ["zoom150400","300f4"], priority: 2, notes: "Ring system + Cassini division + Titan. Planetary tracking rate.", filter: "none", bortle: "any" },
  { id: "venus", name_es: "Fases de Venus", windowLabel_es: "Cerca de elongación", notes_es: "Fase claramente visible a 800mm+ equiv. Filtro ND de día.", name: "Venus Phases", type: "Planet", catalog: "Planet", window: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], windowLabel: "Near elongation", lenses: ["zoom150400"], priority: 1, notes: "Phase clearly visible at 800mm+ equiv. ND filter in daylight.", filter: "none", bortle: "any" },
  { id: "solar", name_es: "Solar — Manchas", windowLabel_es: "De día", notes_es: "Filtro ND100000 OBLIGATORIO (NiSi UV/IR Cut). Grupos de manchas + granulación a 300–400mm reales.", name: "Solar — Sunspots", type: "Solar", catalog: "Sun", window: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"], windowLabel: "Daytime", lenses: ["zoom150400","300f4","zoom50200"], priority: 2, notes: "ND100000 filter REQUIRED (NiSi UV/IR Cut). Sunspot groups + granulation at 300–400mm actual.", filter: "nd100000", bortle: "any" },
];

const LOCATIONS = [
  // ── Established sites ──
  { id: "cuch", season_es: "Abr–May, Nov–Ene", access_es: "Requiere 4WD", horizon_es: "Meseta abierta 360° — el mejor horizonte sur", camp_es: "Campamento libre — coordinar con pastores locales; instalación junto al picop", name: "Cuchumatanes Plateau", dept: "Huehuetenango", elev: "3,400–3,837m", bortle: 2, season: "Apr–May, Nov–Jan", access: "4WD required", truck: true, horizon: "360° open plateau — best south horizon", camp: "Wild camping — arrange with local herders; truck-side setup", icon: "▲" },
  { id: "tajumulco", season_es: "Solo Nov–Abr", access_es: "Caminata con pernocte", horizon_es: "Sobre la capa de nubes", camp_es: "Campamento de mochila — kit mínimo, sin base de picop", name: "Tajumulco Upper Slopes", dept: "San Marcos", elev: "~4,000m", bortle: 1, season: "Nov–Apr only", access: "Overnight trek required", truck: false, horizon: "Above the cloud layer", camp: "Pack-in trek camp — minimal kit only, no truck basecamp", icon: "◮" },
  { id: "chicabal", season_es: "Abr–May, Nov–Ene", access_es: "4WD + caminata", horizon_es: "Geometría de cuenca + Santiaguito de fondo", camp_es: "Acampar en el centro de visitantes / cabañas — sitio sagrado, con respeto", name: "Laguna Chicabal Rim", dept: "San Marcos", elev: "~2,700m", bortle: 2, season: "Apr–May, Nov–Jan", access: "4WD + hike", truck: false, horizon: "Bowl geometry + Santiaguito foreground", camp: "Visitor center camping/cabins recommended — sacred site, camp respectfully", icon: "◍" },
  { id: "minas", season_es: "Nov–Abr", access_es: "4WD — permiso de biosfera", horizon_es: "Cresta oriental — salida del centro galáctico", camp_es: "Camping con permiso en la biosfera — base de picop viable en brechas de cresta", name: "Sierra de las Minas", dept: "Alta Verapaz", elev: "2,000–3,000m", bortle: 2, season: "Nov–Apr", access: "4WD — biosphere permit", truck: true, horizon: "Eastern ridge — galactic center rising", camp: "Permit camping in biosphere — truck basecamp viable on ridge tracks", icon: "❋" },
  { id: "antigua", season_es: "Todo el año", access_es: "15–20 min del centro", horizon_es: "Sur bloqueado por el Agua — N/E abiertos", camp_es: "Sin camping — sesiones de práctica, a casa a las 2am", name: "Antigua Outskirts", dept: "Sacatepéquez", elev: "1,700–2,200m", bortle: 4, season: "Year-round", access: "15–20 min from centro", truck: true, horizon: "South blocked by Agua — N/E open", camp: "No camping — practice/test sessions, home by 2am", icon: "⌂" },
  // ── Researched additions (reviewed, camp-verified) ──
  { id: "ipala", season_es: "Nov–Abr primo · viable en ventanas de lluvia (corredor seco)", access_es: "4WD casi hasta el cráter — pedregoso pero transitable", horizon_es: "La cuenca del cráter bloquea el horizonte bajo junto a la laguna — dispara desde el borde exterior", camp_es: "Camping OFICIAL ~Q20 (4.8★, 1,100+ reseñas). Guías, caballos y comida en la base. Tu escape en época lluviosa — el corredor seco del oriente suele despejar cuando el altiplano no", name: "Volcán de Ipala Crater", dept: "Chiquimula / Jutiapa", elev: "1,650m", bortle: 3, season: "Nov–Apr prime · viable in rainy-season gaps (dry corridor)", access: "4WD nearly to crater — bumpy but driveable", truck: true, horizon: "Crater bowl blocks low horizon at the lagoon — shoot from the outer rim for open sky", camp: "OFFICIAL camping ~Q20 (4.8★, 1,100+ reviews). Guides, horses, food at the base. Your rainy-season escape — the eastern dry corridor often clears when the highlands don't", icon: "◉" },
  { id: "brava", season_es: "Nov–Abr", access_es: "4WD rudo hasta el sendero + caminata — entradas por Aguacate / Yolombojoch", horizon_es: "Lago kárstico entre montañas — buen cielo E–O, primer plano de oro", camp_es: "Camping establecido + cabañas comunitarias (4.7★). Zona fronteriza remota — oscuro de verdad, lejos de verdad. Coordinar con la comunidad", name: "Laguna Brava (Yolnabaj)", dept: "Nentón, Huehuetenango", elev: "~1,140m", bortle: 2, season: "Nov–Apr", access: "Rough 4WD to trailhead + hike in — entries at Aguacate / Yolombojoch", truck: false, horizon: "Karst lake in a mountain trough — good E–W sky, foreground gold", camp: "Established camping + community cabins (4.7★). Remote border country — genuinely dark, genuinely far. Coordinate with the community", icon: "◈" },
  { id: "magdalena", season_es: "Abr–May, Nov–Ene", access_es: "Brecha de un carril, solo 4WD — ~2h desde la ruta principal", horizon_es: "Valle de bosque nuboso — cielo enmarcado, no meseta abierta", camp_es: "Cabaña techada para acampar + guardián (vende leña y golosinas), ~Q15 (4.9★). Respaldo perfecto cuando la meseta de los Cuchumatanes está ventosa — es la misma subida. Sitio sagrado: no nadar, no dejar rastro", name: "Laguna Magdalena", dept: "Chiantla, Huehuetenango", elev: "~3,000m", bortle: 2, season: "Apr–May, Nov–Jan", access: "4WD single-lane dirt track — ~2h off the main road", truck: true, horizon: "Cloud-forest valley — framed sky, not open plateau", camp: "Covered camping cabin + caretaker (sells firewood, snacks), ~Q15 entry (4.9★). Perfect fallback when the Cuchumatanes plateau is windblown — same climb. Sacred site: no swimming, leave no trace", icon: "◍" },
  { id: "acatenango", season_es: "Nov–Abr", access_es: "Solo trek guiado — ~5h de subida, hay cargadores", horizon_es: "Orientado al oeste hacia el Fuego — algo de resplandor de Antigua/capital al NE", camp_es: "Campamentos guiados establecidos (4.8★). NO es viaje de picop: un cuerpo + Laowa/17mm. La foto: el Fuego en erupción bajo las estrellas", name: "Acatenango Base Camp", dept: "Chimaltenango", elev: "~3,700m", bortle: 3, season: "Nov–Apr", access: "Guided trek only — ~5h pack-in, porters available", truck: false, horizon: "West-facing to Fuego — some Antigua/capital glow NE", camp: "Established guided camps (4.8★). NOT a truck trip: one body + Laowa/17mm only. The shot: erupting Fuego under the stars — nowhere else like it", icon: "◮" },
  { id: "uaxactun", season_es: "Feb–May (la terracería se seca)", access_es: "23km sin asfalto pasando Tikal — el picop pasa bien en época seca", horizon_es: "Horizontes planos del Petén sobre la pista de aterrizaje — raro 360° a nivel del suelo", camp_es: "Camping comunitario en la aldea. Acampa junto al Grupo E — el observatorio astronómico maya más antiguo conocido. La bruma del Petén suaviza la transparencia; mejor tras frentes fríos", name: "Uaxactún (Maya Observatory)", dept: "Petén", elev: "~180m", bortle: 1, season: "Feb–May (dirt road dries out)", access: "23km unpaved past Tikal — truck fine in dry season", truck: true, horizon: "Flat Petén horizons over the airstrip clearing — rare 360° at ground level", camp: "Community-run camping in the village. Camp beside Group E — the oldest known Maya astronomical observatory. Petén haze softens transparency; best right after cold fronts", icon: "☼" },
  { id: "ayarza", season_es: "Nov–Abr", access_es: "~2h al oriente de la capital, último tramo malo", horizon_es: "Lago de doble cráter profundo — paredes que enmarcan el cielo, reflejos de espejo", camp_es: "Camping a la orilla junto a la playita (4.6★), casi sin desarrollo. El paso siguiente a las prácticas de Antigua — oscuridad real, logística fácil", name: "Laguna de Ayarza", dept: "Casillas, Santa Rosa", elev: "~1,400m", bortle: 3, season: "Nov–Apr", access: "~2h east of the capital, last stretch rough", truck: true, horizon: "Deep twin-crater lake — steep walls frame the sky, mirror-calm reflections", camp: "Lakeside camping by the small beach (4.6★), very little development. The step up from Antigua practice nights — real dark, easy logistics", icon: "◎" },
];

// ── DUAL-RIG STRATEGY ────────────────────────────────────────────────────────
// Two mounts run in parallel every session: the SA2i becomes a set-and-forget
// wide-field station while the GTi does precision goto deep-sky work.
const RIGS = {
  gti: {
    id: "gti", short: "GTi", name: "Rig A — Sky-Watcher GTi", name_es: "Montura A — Sky-Watcher GTi",
    role: "Precision deep sky · goto · attended", role_es: "Cielo profundo de precisión · goto · atendida",
    lenses: ["nocticron", "oly75", "zoom40150", "zoom50200", "300f4", "zoom150400"],
    notes: "Your active station for the night. Goto slews between globulars, galaxies and nebulae. Refocus every 45–60 min, verify IS/OIS OFF, drift-test before the first long sequence.", notes_es: "Tu estación activa de la noche. El goto salta entre globulares, galaxias y nebulosas. Reenfoca cada 45–60 min, verifica IS/OIS APAGADO, prueba de deriva antes de la primera secuencia larga.",
  },
  sa2i: {
    id: "sa2i", short: "SA2i", name: "Rig B — Star Adventurer 2i", name_es: "Montura B — Star Adventurer 2i",
    role: "Wide field · set-and-forget · unattended", role_es: "Campo amplio · dejar corriendo · desatendida",
    lenses: ["laowa75", "oly714", "oly17", "oly25"],
    notes: "Start one long wide-field sequence (Milky Way stack, timelapse, or meteor watch) and let it run. Check every 45–60 min for dew, battery, and framing drift. One good unattended sequence per night = a finished image you didn't have to babysit.", notes_es: "Lanza una secuencia larga de campo amplio (apilado de Vía Láctea, timelapse o vigilancia de meteoros) y déjala correr. Revisa cada 45–60 min: rocío, batería y encuadre. Una buena secuencia desatendida por noche = una imagen terminada sin niñera.",
  },
};
const rigForLens = (lensId) => (RIGS.gti.lenses.includes(lensId) ? RIGS.gti : RIGS.sa2i);

// ── TRUCK LOADOUT (persistent checklist) ─────────────────────────────────────
const LOADOUT = [
  { cat: "Power", cat_es: "Energía", items_es: ["Estación LiFePO4 — cargada, % verificado", "Cables USB-C PD + adaptadores 12V", "Bandas antivaho ×2 + controlador", "Baterías de cámara ×6 — cargadas", "Linterna frontal (modo rojo) + repuesto + pilas"], items: [
    "LiFePO4 power station — charged, verified %",
    "USB-C PD cables + 12V adapters",
    "Dew heater bands ×2 + controller",
    "Camera batteries ×6 — charged",
    "Headlamp (red mode) + spare + batteries",
  ]},
  { cat: "Mounts", cat_es: "Monturas", items_es: ["Cabezal GTi + trípode + contrapeso", "Cabezal SA2i + trípode + rótula + cuña", "Nivel de burbuja + llaves hex", "App SynScan actualizada · firmware del GTi OK"], items: [
    "GTi head + tripod + counterweight",
    "SA2i head + tripod + ball head + wedge",
    "Leveling bubble + hex keys",
    "SynScan app updated · GTi firmware OK",
  ]},
  { cat: "Optics & Camera", cat_es: "Óptica y cámara", items_es: ["Set de lentes de esta noche (según el plan)", "Filtro clip-in STC Astro", "NiSi ND100000 (si hay plan solar)", "Cuerpos OM-1 II + E-M1 II", "Tarjetas de memoria ×4 formateadas + lector", "Intervalómetro / disparador + repuesto", "Pera de aire, paños, cinta gaffer (marcas de infinito)"], items: [
    "Tonight's lens set (per session plan)",
    "STC Astro clip-in filter",
    "NiSi ND100000 (if solar planned)",
    "OM-1 II + E-M1 II bodies",
    "Memory cards ×4 formatted + reader",
    "Intervalometer / remote + spare",
    "Rocket blower, cloths, gaffer tape (infinity marks)",
  ]},
  { cat: "Camp", cat_es: "Campamento", items_es: ["Sistema para dormir (palangana del picop / carpa) + colchoneta aislante", "Bolsa de dormir para frío — el altiplano llega a 0°C incluso en seca", "Silla de campamento + mesa plegable (extensión de la palangana)", "Estufa + combustible + encendedor ×2", "Agua 6L+ · termo · comida + kit de café de medianoche", "Capas de abrigo, gorro, guantes sin dedos, capa de lluvia"], items: [
    "Sleeping setup (truck bed / tent) + insulated pad",
    "Cold-rated sleeping bag — highlands hit 0°C even in dry season",
    "Camp chair + folding table (tailgate workstation overflow)",
    "Stove + fuel + lighter ×2",
    "Water 6L+ · thermos · food + midnight coffee kit",
    "Warm layers, beanie, fingerless gloves, rain shell",
  ]},
  { cat: "Truck & Safety", cat_es: "Picop y seguridad", items_es: ["Tanque lleno + galón de reserva", "Compresor + kit de parches + eslinga + pala", "Botiquín + medicinas personales", "Mapas offline descargados + GPS", "Verificar señal / mensajero satelital para sitios remotos", "Lona de piso (bajo las monturas — seguro anti-tornillos-perdidos)", "Bolsas de basura — todo se saca"], items: [
    "Full fuel tank + reserve jerry can",
    "Tire compressor + plug kit + tow strap + shovel",
    "First aid kit + personal meds",
    "Offline maps downloaded + GPS",
    "Signal check / satellite messenger for remote sites",
    "Ground tarp (under rigs — dropped-screw insurance)",
    "Trash bags — pack everything out",
  ]},
  { cat: "Paper & People", cat_es: "Papeles y gente", items_es: ["Permiso de biosfera (viajes a Sierra de las Minas)", "DPI + efectivo para cuotas comunitarias", "Contacto local confirmado en el destino", "Boletín volcánico de INSIVUMEH revisado", "Captura del pronóstico de Windy.com guardada offline"], items: [
    "Biosphere permit (Sierra de las Minas trips)",
    "ID + cash for community access fees",
    "Local contact confirmed at destination",
    "INSIVUMEH volcanic bulletin checked",
    "Windy.com cloud forecast screenshot saved offline",
  ]},
];

// ── SITE PREP PROTOCOL ───────────────────────────────────────────────────────
const SITE_PREP = [
  { n: "01", t_es: "Llega 2h antes de oscurecer", d_es: "Explora con luz: verifica la línea de vista al sur (la temporada de Omega Cen vive o muere ahí), revisa la firmeza del suelo para ambos trípodes y nota la dirección del viento.", t: "Arrive 2h before dark", d: "Scout in daylight: verify the south sightline (Omega Cen season lives or dies on it), check ground firmness for both tripods, note wind direction." },
  { n: "02", t_es: "Estaciona con intención", d_es: "El picop como cortavientos para las monturas, trompa hacia la salida. La palangana es la estación de trabajo — energía, laptop, café. Nunca estaciones donde tendrías que retroceder junto a los trípodes a oscuras.", t: "Park with intent", d: "Truck as windbreak for the rigs, nose pointed at the exit route. Tailgate becomes the workstation — power, laptop, coffee. Never park where you'd need to reverse past tripods in the dark." },
  { n: "03", t_es: "Despliega ambas bases", d_es: "Lona al suelo, ambos trípodes nivelados mientras aún ves. El GTi contra el viento respecto al SA2i para no pasar junto a la montura desatendida toda la noche.", t: "Deploy both pads", d: "Tarp down, both tripods leveled while you can still see. GTi upwind of SA2i so you're not walking past the unattended rig all night." },
  { n: "04", t_es: "Energía + antivaho antes de la humedad", d_es: "Estación de energía en la palangana, cables pegados al suelo, bandas antivaho ENCENDIDAS en ambos lentes antes de que baje la temperatura — instalarlas con neblina a medianoche es miseria.", t: "Power + dew before humidity", d: "Power station in the truck bed, cable runs taped flat, dew heater bands ON both lenses before the temperature drops — retrofitting a heater at midnight fog is misery." },
  { n: "05", t_es: "Alineación al crepúsculo", d_es: "Alineación polar aproximada de ambas monturas en el crepúsculo civil (brújula + escala de 15°), afina en la oscuridad náutica. El GTi recibe SharpCap/buscador polar; para el SA2i, «suficientemente bien» es genuinamente suficiente a ≤50mm equiv.", t: "Twilight alignment", d: "Rough polar align both mounts at civil twilight (compass + 15° altitude scale), refine at nautical dark. GTi gets the SharpCap/polar-scope treatment; SA2i good-enough is genuinely good enough at ≤50mm equiv." },
  { n: "06", t_es: "Lanza primero la Montura B", d_es: "Pon a correr la secuencia amplia del SA2i antes que nada — cada minuto desatendido es integración gratis. Luego dale al GTi toda tu atención.", t: "Launch Rig B first", d: "Get the SA2i wide sequence running before anything else — every minute it runs unattended is free integration time. Then give the GTi your full attention." },
  { n: "07", t_es: "Disciplina de luz roja", d_es: "Desde el atardecer: solo frontal roja, teléfono en modo nocturno, brillo al mínimo. La adaptación a la oscuridad toma 30 min y un destello blanco la destruye.", t: "Red light lockdown", d: "From sunset: red headlamp only, phone in night mode, screen brightness minimum. Dark adaptation takes 30 min to build and one white flash to destroy." },
  { n: "08", t_es: "Campamento listo antes de oscurecer", d_es: "Cama lista, comida hecha o preparada. Desmontar a las 3am debe ser mecánico — estarás con frío, cansado y torpe.", t: "Camp done before dark", d: "Sleep setup ready, food eaten or prepped. A 3am teardown should be mechanical — you'll be cold, tired, and clumsy." },
  { n: "09", t_es: "Saluda a la comunidad", d_es: "Preséntate con quien esté, confirma que el picop está bien de noche, paga cualquier cuota por adelantado. Una presentación amistosa de día es el mejor sistema de seguridad en la Guatemala rural.", t: "Community check-in", d: "Greet whoever's around, confirm the truck is fine overnight, pay any access fee up front. A friendly daylight introduction is the best security system in rural Guatemala." },
  { n: "10", t_es: "El ciclo de 45 minutos", d_es: "Cada 45–60 min: revisar rocío/batería/encuadre de la Montura B → reenfocar el GTi (deriva térmica) → tus capas, agua, refacción. Pon un temporizador con vibración.", t: "The 45-minute loop", d: "Every 45–60 min: Rig B dew/battery/framing check → GTi refocus (temperature drift) → your own layers, water, snack. Set a vibrating timer." },
];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const SEASON_DATA = {
  Jan: { dry: true,  label: "Peak dry — Orion prime", label_es: "Plena época seca — Orión primo" },
  Feb: { dry: true,  label: "Dry", label_es: "Seca" },
  Mar: { dry: true,  label: "Transitional", label_es: "Transición" },
  Apr: { dry: true,  label: "Dry — galaxy season", label_es: "Seca — temporada de galaxias" },
  May: { dry: true,  label: "Last dry window — Omega Cen peak", label_es: "Última ventana seca — pico de Omega Cen" },
  Jun: { dry: false, label: "Rainy — opportunistic only", label_es: "Lluviosa — solo oportunista" },
  Jul: { dry: false, label: "Rainy — galactic zenith between fronts", label_es: "Lluviosa — cenit galáctico entre frentes" },
  Aug: { dry: false, label: "Rainy — opportunistic only", label_es: "Lluviosa — solo oportunista" },
  Sep: { dry: false, label: "Peak rainy", label_es: "Plena época lluviosa" },
  Oct: { dry: false, label: "Rainy tapering", label_es: "Lluvia disminuyendo" },
  Nov: { dry: true,  label: "Dry returns — Andromeda season", label_es: "Vuelve la seca — temporada de Andrómeda" },
  Dec: { dry: true,  label: "Dry — Geminids + Orion rising", label_es: "Seca — Gemínidas + Orión saliendo" },
};

// Seasonal lens priority matrix (PDF page 9). Periods keyed by month.
const PERIODS = [
  { id: "aprmay", label: "Apr–May · Galaxies rise", label_es: "Abr–May · Suben las galaxias", months: ["Apr","May"] },
  { id: "junaug", label: "Jun–Aug · Galactic zenith", label_es: "Jun–Ago · Cenit galáctico", months: ["Jun","Jul","Aug"] },
  { id: "sepoct", label: "Sep–Oct · Transitional", label_es: "Sep–Oct · Transición", months: ["Sep","Oct"] },
  { id: "novdec", label: "Nov–Dec · Dry returns", label_es: "Nov–Dic · Vuelve la seca", months: ["Nov","Dec"] },
  { id: "jan", label: "Jan · Orion peak", label_es: "Ene · Pico de Orión", months: ["Jan","Feb","Mar"] },
];
const MATRIX = {
  laowa75:    { aprmay: 3, junaug: 3, sepoct: 2, novdec: 2, jan: 2, sig: "Milky Way arch — May pre-dawn + Jul–Aug zenith overhead", sig_es: "Arco de la Vía Láctea — madrugadas de mayo + cenit Jul–Ago" },
  oly714:     { aprmay: 2, junaug: 2, sepoct: 1, novdec: 1, jan: 1, sig: "Widest nightscape — panorama segments + timelapse", sig_es: "El paisaje nocturno más amplio — panorámicas + timelapse" },
  oly17:      { aprmay: 3, junaug: 3, sepoct: 2, novdec: 3, jan: 3, sig: "Milky Way + foreground — most versatile nightscape lens", sig_es: "Vía Láctea + primer plano — el lente nocturno más versátil" },
  oly25:      { aprmay: 3, junaug: 3, sepoct: 2, novdec: 2, jan: 3, sig: "Rho Ophiuchi May · Cygnus Jul–Sep · Orion Nov–Jan", sig_es: "Rho Ophiuchi may · Cisne Jul–Sep · Orión Nov–Ene" },
  nocticron:  { aprmay: 3, junaug: 2, sepoct: 1, novdec: 3, jan: 2, sig: "M3 / M5 / Rho Oph May · Andromeda Oct–Nov · f/1.2 usable", sig_es: "M3 / M5 / Rho Oph may · Andrómeda Oct–Nov · f/1.2 usable" },
  oly75:      { aprmay: 3, junaug: 3, sepoct: 2, novdec: 3, jan: 3, sig: "Omega Cen May · M13 + M5 nights · galaxy cores", sig_es: "Omega Cen may · noches de M13 + M5 · núcleos de galaxias" },
  zoom40150:  { aprmay: 3, junaug: 3, sepoct: 2, novdec: 3, jan: 3, sig: "Andromeda @135mm Nov · nebula pairs Jul–Aug · Leo Apr–May", sig_es: "Andrómeda @135mm nov · pares de nebulosas Jul–Ago · Leo Abr–May" },
  zoom50200:  { aprmay: 3, junaug: 3, sepoct: 2, novdec: 3, jan: 3, sig: "High-speed deep sky — pioneer territory (future)", sig_es: "Cielo profundo rápido — territorio pionero (futuro)" },
  "300f4":    { aprmay: 3, junaug: 3, sepoct: 2, novdec: 3, jan: 3, sig: "Globular cores · Omega Cen May · Orion core Nov–Jan", sig_es: "Núcleos globulares · Omega Cen may · núcleo de Orión Nov–Ene" },
  zoom150400: { aprmay: 3, junaug: 3, sepoct: 2, novdec: 3, jan: 3, sig: "Moon any phase · planets near opposition · globular cores (future)", sig_es: "Luna en cualquier fase · planetas en oposición · núcleos globulares (futuro)" },
};

const TYPES = ["All Types","Milky Way","Galaxy","Nebula","Globular Cluster","Open Cluster","Meteor Shower","Star Field","Lunar","Planet","Solar"];

// ── i18n ─────────────────────────────────────────────────────────────────────
const tr = (o, f, lang) => (lang === "es" && o[f + "_es"] ? o[f + "_es"] : o[f]);

const MONTH_ES = { Jan: "Ene", Feb: "Feb", Mar: "Mar", Apr: "Abr", May: "May", Jun: "Jun", Jul: "Jul", Aug: "Ago", Sep: "Sep", Oct: "Oct", Nov: "Nov", Dec: "Dic" };
const TYPE_ES = { "All Types": "Todos", "Milky Way": "Vía Láctea", "Galaxy": "Galaxia", "Nebula": "Nebulosa", "Globular Cluster": "Cúmulo globular", "Open Cluster": "Cúmulo abierto", "Meteor Shower": "Lluvia de meteoros", "Star Field": "Campo estelar", "Lunar": "Lunar", "Planet": "Planeta", "Solar": "Solar" };
const WORD_ES = { optional: "opcional", recommended: "recomendado", essential: "esencial", none: "nula", "very low": "muy baja", low: "baja", moderate: "moderada" };
const MOON_PHASE_ES = { "New moon": "Luna nueva", "Waxing crescent": "Creciente", "First quarter": "Cuarto creciente", "Waxing gibbous": "Gibosa creciente", "Full moon": "Luna llena", "Waning gibbous": "Gibosa menguante", "Last quarter": "Cuarto menguante", "Waning crescent": "Menguante" };
const GEAR_CAT_ES = { Bodies: "Cuerpos", Mount: "Monturas", Wide: "Amplio", Standard: "Estándar", Telephoto: "Telefoto", "Super Tele": "Súper tele", Teleconverters: "Teleconvertidores", Filters: "Filtros", Software: "Software", "Polar Align": "Alineación polar", Location: "Ubicación", "Key Numbers": "Números clave" };

const ADVICE_TEXT = {
  en: {
    dark: "Dark skies — faint nebulae and galaxies are on the table.",
    mod: "Moderate moonlight — globulars, clusters and bright targets fine; save faint nebulae for a darker night or use the STC filter.",
    bright: "Bright moon — favor globulars, the Moon itself, planets, or narrowband work with the STC filter.",
    full: "Near-full moon — lunar and planetary night. Skip faint deep sky entirely.",
  },
  es: {
    dark: "Cielos oscuros — nebulosas y galaxias débiles están sobre la mesa.",
    mod: "Luz lunar moderada — globulares, cúmulos y objetivos brillantes bien; deja las nebulosas débiles para una noche más oscura o usa el filtro STC.",
    bright: "Luna brillante — prioriza globulares, la Luna misma, planetas o banda estrecha con el filtro STC.",
    full: "Luna casi llena — noche lunar y planetaria. Olvida el cielo profundo débil.",
  },
};

const EXCLUSIVES = {
  en: ["Omega Centauri NGC 5139 — 30° altitude, invisible from USA/Europe",
    "Centaurus A NGC 5128 — radio galaxy with dust lane",
    "Large Magellanic Cloud + 47 Tucanae — exceptional nights only",
    "Eta Carinae Nebula NGC 3372 — barely accessible",
    "Galactic center nearly overhead Jul–Aug — 75° altitude",
    "Eta Aquarids ~30/hr — double the 45°N rate",
    "Rho Ophiuchi higher in sky than any northern-hemisphere site"],
  es: ["Omega Centauri NGC 5139 — 30° de altitud, invisible desde EE.UU./Europa",
    "Centaurus A NGC 5128 — radiogalaxia con franja de polvo",
    "Gran Nube de Magallanes + 47 Tucanae — solo noches excepcionales",
    "Nebulosa Eta Carinae NGC 3372 — apenas accesible",
    "Centro galáctico casi cenital Jul–Ago — 75° de altitud",
    "Eta Acuáridas ~30/h — el doble que a 45°N",
    "Rho Ophiuchi más alto en el cielo que en cualquier sitio del hemisferio norte"],
};

const LOGISTICS_NOTES = {
  en: ["Fuel: fill up before the climbs — last reliable stations before the Cuchumatanes are in Chiantla; carry the reserve can for Tajumulco and Sierra de las Minas runs",
    "Cold: 3,400–3,800m sites drop to freezing even in dry season — batteries die 30–40% faster; keep spares in an inside pocket",
    "Roads: budget double the map time on 4WD tracks; a 2h-before-dark arrival means leaving surprisingly early",
    "Rainy season (Jun–Oct): highlands cloud in by afternoon and sometimes clear after midnight — if Windy shows a gap, sleep first and shoot the pre-dawn window instead of waiting up",
    "Volcanic: check INSIVUMEH before Chicabal trips — Santiaguito activity is your foreground but also your access risk",
    "Security: arrive in daylight, introduce yourself, pay community fees cheerfully — a known truck is a safe truck",
    "Dual-rig payoff: on a good dry-season night the SA2i's unattended wide stack + 3–4 GTi targets = 4–5 finished images per outing instead of 1–2"],
  es: ["Combustible: llena el tanque antes de las subidas — las últimas gasolineras confiables antes de los Cuchumatanes están en Chiantla; lleva la reserva para Tajumulco y Sierra de las Minas",
    "Frío: los sitios a 3,400–3,800m bajan a congelación incluso en época seca — las baterías se agotan 30–40% más rápido; lleva repuestos en un bolsillo interior",
    "Caminos: presupuesta el doble del tiempo del mapa en brechas 4WD; llegar 2h antes de oscurecer implica salir sorprendentemente temprano",
    "Época lluviosa (Jun–Oct): el altiplano se nubla por la tarde y a veces despeja después de medianoche — si Windy muestra una ventana, duerme primero y dispara la madrugada en vez de esperar despierto",
    "Volcánico: revisa INSIVUMEH antes de ir a Chicabal — la actividad del Santiaguito es tu primer plano pero también tu riesgo de acceso",
    "Seguridad: llega de día, preséntate, paga las cuotas comunitarias de buena gana — un picop conocido es un picop seguro",
    "Rendimiento de dos monturas: en una buena noche seca, el apilado amplio desatendido del SA2i + 3–4 objetivos del GTi = 4–5 imágenes terminadas por salida en vez de 1–2"],
};

const STR = {
  en: {
    eyebrow: "Field Reference System · v2", sub: "MFT Astrophotography · Interactive Target Explorer",
    tabTonight: "Tonight", tabTargets: "Targets", tabExpedition: "Expedition", tabLog: "Log", tabLocations: "Locations", tabGear: "Gear", tabWorkflow: "Workflow",
    moonTonight: "Moon · Tonight", cycleDay: "day", cycleOf: "of cycle", bestMonth: "Best this month",
    plannerTitle: "AI Session Planner",
    plannerDesc: "Builds an hour-by-hour plan for tonight from your kit, this month's targets, the moon phase, your chosen site — and skips what you've already captured.",
    planBtn: "Plan tonight", planning: "Planning…", planError: "Couldn't generate a plan — check your connection and try again.",
    rigSplit: "Tonight's two-rig split", matrixTitle: "Lens priority by season — current period highlighted", matrixLens: "Lens", matrixSig: "Signature target",
    rainyNow: "Rainy season", rainyNowTail: "Don't plan overnight highland trips. Watch Windy.com satellite cloud maps and go opportunistically between fronts; the galactic center is nearly overhead when it clears.",
    rainySel: "Rainy season selected (Jun–Oct) — targets may be up but weather is unreliable. Don't plan overnight highland trips; monitor satellite cloud maps (Windy.com) and go opportunistically.",
    selectLens: "Select lens", monthWindow: "Month window", targetType: "Target type",
    targetsWord: "targets", matched: "matched", total: "total", clearAll: "Clear all filters",
    emptyTitle: "No targets match this combination", emptyHint: "Try a different lens, month, or type",
    compatible: "Compatible lenses", markCaptured: "Mark captured", capturedUndo: "✓ Captured — undo",
    notePlaceholder: "Session note — lens, subs, conditions…", capturedTag: "✓ Captured",
    stcEss: "STC essential", stcRec: "STC recommended", ndReq: "ND100000 required", bortle: "Bortle",
    logTitle: "Capture log", of: "of", logLoading: "Loading your log…", logEmpty: "Nothing logged yet",
    logEmptyHint: "Open a target card and mark it captured — it saves between sessions", remove: "remove",
    locTitle: "Dark sky vantage points — chosen by terrain", exclTitle: "15°N latitude exclusive targets",
    seasonLbl: "Season", accessLbl: "Access", truckBadge: "TRUCK BASECAMP", packBadge: "PACK-IN",
    loadoutTitle: "Truck loadout — reset per trip, saves between sessions", packed: "packed", resetBtn: "Reset for next trip",
    prepTitle: "Site prep protocol — arrival to first frame", logiTitle: "Guatemala logistics — hard-won specifics",
    gearTitle: "Current kit", wfTitle: "Session workflow — field to finished image",
    recAp: "Rec. aperture", comaLbl: "Coma", filterLbl: "Filter", trackerLbl: "Tracker",
    equivalent: "equivalent", ridesOn: "rides on", future: "(future)",
  },
  es: {
    eyebrow: "Sistema de Referencia de Campo · v2", sub: "Astrofotografía MFT · Explorador Interactivo de Objetivos",
    tabTonight: "Esta noche", tabTargets: "Objetivos", tabExpedition: "Expedición", tabLog: "Bitácora", tabLocations: "Sitios", tabGear: "Equipo", tabWorkflow: "Flujo",
    moonTonight: "Luna · Esta noche", cycleDay: "día", cycleOf: "del ciclo", bestMonth: "Lo mejor del mes",
    plannerTitle: "Planificador IA de sesión",
    plannerDesc: "Arma un plan hora por hora para esta noche con tu kit, los objetivos del mes, la fase lunar y el sitio elegido — y omite lo que ya capturaste.",
    planBtn: "Planificar esta noche", planning: "Planificando…", planError: "No se pudo generar el plan — revisa tu conexión e intenta de nuevo.",
    rigSplit: "División de dos monturas esta noche", matrixTitle: "Prioridad de lentes por temporada — período actual resaltado", matrixLens: "Lente", matrixSig: "Objetivo insignia",
    rainyNow: "Época lluviosa", rainyNowTail: "No planifiques pernoctas en el altiplano. Vigila los mapas satelitales de nubes (Windy.com) y sal de forma oportunista entre frentes; el centro galáctico queda casi cenital cuando despeja.",
    rainySel: "Época lluviosa seleccionada (Jun–Oct) — los objetivos pueden estar arriba pero el clima es poco confiable. No planifiques pernoctas en el altiplano; monitorea Windy.com y sal de forma oportunista.",
    selectLens: "Elegir lente", monthWindow: "Ventana mensual", targetType: "Tipo de objetivo",
    targetsWord: "objetivos", matched: "coinciden", total: "en total", clearAll: "Limpiar filtros",
    emptyTitle: "Ningún objetivo coincide con esta combinación", emptyHint: "Prueba otro lente, mes o tipo",
    compatible: "Lentes compatibles", markCaptured: "Marcar capturado", capturedUndo: "✓ Capturado — deshacer",
    notePlaceholder: "Nota de sesión — lente, subs, condiciones…", capturedTag: "✓ Capturado",
    stcEss: "STC esencial", stcRec: "STC recomendado", ndReq: "Requiere ND100000", bortle: "Bortle",
    logTitle: "Bitácora de capturas", of: "de", logLoading: "Cargando tu bitácora…", logEmpty: "Nada registrado aún",
    logEmptyHint: "Abre una tarjeta de objetivo y márcalo capturado — se guarda entre sesiones", remove: "quitar",
    locTitle: "Sitios de cielo oscuro — elegidos por terreno", exclTitle: "Objetivos exclusivos de la latitud 15°N",
    seasonLbl: "Temporada", accessLbl: "Acceso", truckBadge: "BASE EN PICOP", packBadge: "A PIE",
    loadoutTitle: "Carga del picop — se reinicia por viaje, se guarda entre sesiones", packed: "empacado", resetBtn: "Reiniciar para el próximo viaje",
    prepTitle: "Protocolo de preparación del sitio — de la llegada al primer disparo", logiTitle: "Logística de Guatemala — detalles ganados a pulso",
    gearTitle: "Equipo actual", wfTitle: "Flujo de sesión — del campo a la imagen final",
    recAp: "Apertura rec.", comaLbl: "Coma", filterLbl: "Filtro", trackerLbl: "Montura",
    equivalent: "equivalente", ridesOn: "va en", future: "(futuro)",
  },
};

