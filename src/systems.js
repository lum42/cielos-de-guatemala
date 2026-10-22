// ── CAMERA SYSTEMS, LENSES, TRACKERS ────────────────────────────────────────
// Reference bodies (sensor size → crop and pixel pitch) and lenses that astro
// photographers commonly use. `f` is [min, max] focal length in mm, `N` the
// working apertures offered (first = suggested), `tc` optional teleconverters.
// role: "wide" (Milky Way, nightscapes, meteors) or "deep" (tracked deep sky, Moon, planets).
const body = (id, name, w, h, pxW, pxH, note, note_es) => ({ id, name, w, h, pxW, pxH, pitch: Math.round((w / pxW) * 1e5) / 100, crop: Math.round((43.27 / Math.hypot(w, h)) * 100) / 100, note, note_es });

const SYSTEMS = {
  mft: {
    id: "mft", name: "OM System · Olympus · Panasonic", short: "MFT", fmt: "Micro Four Thirds",
    bodies: [
      body("om1ii", "OM System OM-1 Mark II", 17.4, 13.0, 5184, 3888, "Stacked 20 MP sensor; Starry Sky AF and Live Composite for star trails.", "Sensor apilado de 20 MP; AF Cielo Estrellado y Live Composite para trazos estelares."),
      body("em1ii", "Olympus E-M1 Mark II", 17.4, 13.0, 5184, 3888, "20 MP; Live Composite. A great second body.", "20 MP; Live Composite. Excelente segundo cuerpo."),
      body("g9ii", "Panasonic Lumix G9 II", 17.3, 13.0, 5776, 4336, "25 MP Micro Four Thirds body.", "Cuerpo Micro Cuatro Tercios de 25 MP."),
    ],
    lenses: [
      { id: "laowa75", name: "Laowa 7.5mm f/2", f: [7.5, 7.5], N: [2.8, 2], role: "wide", note: "Tiny rectilinear ultra-wide; f/2.8 for clean corners.", note_es: "Ultra gran angular rectilíneo diminuto; f/2.8 para esquinas limpias." },
      { id: "oly714", name: "Olympus 7-14mm f/2.8 PRO", f: [7, 14], N: [2.8, 4], role: "wide", noFilter: true, note: "Widest zoom; bulbous front, no front filter.", note_es: "El zoom más amplio; frontal bulboso, sin filtro frontal." },
      { id: "pl1025", name: "Panasonic Leica 10-25mm f/1.7", f: [10, 25], N: [1.7, 2.8], role: "wide", note: "Fast zoom: a whole kit of f/1.7 primes in one.", note_es: "Zoom luminoso: un kit de fijos f/1.7 en uno." },
      { id: "sam12mft", name: "Samyang 12mm f/2 NCS CS", f: [12, 12], N: [2, 2.8], role: "wide", note: "Manual-focus favourite with low coma at f/2.", note_es: "Favorito de enfoque manual con poca coma a f/2." },
      { id: "oly17", name: "Olympus 17mm f/1.2 PRO", f: [17, 17], N: [1.8, 1.2, 2.8], role: "wide", note: "Milky Way + foreground; f/1.8 for clean edges.", note_es: "Vía Láctea + primer plano; f/1.8 para bordes limpios." },
      { id: "oly25", name: "Olympus 25mm f/1.2 PRO", f: [25, 25], N: [1.8, 1.2, 2.8], role: "wide", note: "Regional nebula fields (Orion, Rho Ophiuchi).", note_es: "Campos regionales de nebulosas (Orión, Rho Ophiuchi)." },
      { id: "nocticron", name: "Panasonic Leica Nocticron 42.5mm f/1.2", f: [42.5, 42.5], N: [1.2, 1.4, 2], role: "deep", note: "OIS off on a tracker; no infinity stop — tape the focus.", note_es: "OIS apagado en montura; sin tope de infinito: marca el enfoque." },
      { id: "oly75", name: "Olympus 75mm f/1.8", f: [75, 75], N: [1.8, 2.8], role: "deep", note: "Benchmark sharpness; superb on star fields.", note_es: "Nitidez de referencia; excelente en campos estelares." },
      { id: "zoom40150", name: "Olympus 40-150mm f/2.8 PRO", f: [40, 150], N: [2.8, 4], role: "deep", note: "Versatile deep-sky zoom; Andromeda at ~135mm.", note_es: "Zoom versátil de cielo profundo; Andrómeda a ~135mm." },
      { id: "zoom50200", name: "OM System 50-200mm f/2.8 IS PRO", f: [50, 200], N: [2.8, 4], role: "deep", note: "IS off on a tracker.", note_es: "IS apagado en montura." },
      { id: "sam135mft", name: "Samyang 135mm f/2 ED UMC", f: [135, 135], N: [2, 2.8], role: "deep", note: "Classic manual deep-sky lens (270mm equivalent).", note_es: "Clásico manual de cielo profundo (equivale a 270mm)." },
      { id: "300f4", name: "OM System 300mm f/4 IS PRO", f: [300, 300], N: [4, 5.6, 8], role: "deep", tc: [["none", 1], ["mc14", 1.4]], note: "IS off on a tracker; MC-14 fine, avoid MC-20.", note_es: "IS apagado en montura; MC-14 bien, evita MC-20." },
      { id: "pl100400", name: "Panasonic Leica 100-400mm f/4-6.3", f: [100, 400], N: [6.3], role: "deep", note: "Moon and planets; slow for faint targets.", note_es: "Luna y planetas; lento para objetos tenues." },
      { id: "zoom150400", name: "OM System 150-400mm f/4.5 TC1.25x IS PRO", f: [150, 400], N: [4.5, 5.6, 8], role: "deep", tc: [["none", 1], ["int", 1.25], ["mc14", 1.4], ["both", 1.75]], note: "Built-in 1.25× converter; check the mount's payload.", note_es: "Convertidor 1.25× integrado; revisa la carga de la montura." },
    ],
  },
  canon: {
    id: "canon", name: "Canon", short: "Canon", fmt: "RF · EF",
    bodies: [
      body("r6ii", "Canon EOS R6 Mark II", 35.9, 23.9, 6000, 4000, "24 MP full frame with large pixels; a favourite night-sky all-rounder.", "Full frame de 24 MP con píxeles grandes; favorita para cielo nocturno."),
      body("r8", "Canon EOS R8", 35.9, 23.9, 6000, 4000, "Light, affordable full frame with the R6 II sensor class.", "Full frame ligera y accesible, de la clase de sensor de la R6 II."),
      body("r5", "Canon EOS R5", 36.0, 24.0, 8192, 5464, "45 MP: more detail, smaller pixels (trails show sooner).", "45 MP: más detalle, píxeles más chicos (los trazos aparecen antes)."),
      body("r7", "Canon EOS R7", 22.3, 14.8, 6960, 4640, "APS-C 32.5 MP; 1.6× crop reaches deeper.", "APS-C de 32.5 MP; el recorte 1.6× llega más profundo."),
      body("ra", "Canon EOS Ra (discontinued)", 36.0, 24.0, 6720, 4480, "Astro edition: passes much more H-alpha red. Used market only.", "Edición astro: deja pasar mucho más rojo H-alfa. Solo usada."),
      body("6dii", "Canon EOS 6D Mark II (DSLR)", 35.9, 24.0, 6240, 4160, "Popular used full-frame DSLR for the night sky.", "DSLR full frame usada muy popular para el cielo nocturno."),
    ],
    lenses: [
      { id: "rf1535", name: "Canon RF 15-35mm f/2.8L IS USM", f: [15, 35], N: [2.8, 3.2], role: "wide", note: "Top Milky Way zoom; ~18–20mm at f/2.8–3.2 tames corner coma.", note_es: "El mejor zoom para la Vía Láctea; ~18–20mm a f/2.8–3.2 controla la coma." },
      { id: "rf1435", name: "Canon RF 14-35mm f/4L IS USM", f: [14, 35], N: [4], role: "wide", note: "Light 14mm; f/4 wants tracking or stacking.", note_es: "14mm ligero; f/4 pide seguimiento o apilado." },
      { id: "rf16", name: "Canon RF 16mm f/2.8 STM", f: [16, 16], N: [3.5, 2.8], role: "wide", note: "Budget entry; stop to ~f/3.5 for tighter stars.", note_es: "Entrada económica; cierra a ~f/3.5 para estrellas más finas." },
      { id: "laowa15rf", name: "Laowa 15mm f/2 Zero-D (RF)", f: [15, 15], N: [2.2, 2, 2.8], role: "wide", note: "Fast and compact; stop down ⅓–1 stop if corners smear.", note_es: "Luminoso y compacto; cierra ⅓–1 paso si las esquinas se corren." },
      { id: "sigma14ef", name: "Sigma 14mm f/1.8 DG HSM Art (EF, adapted)", f: [14, 14], N: [1.8, 2.8], role: "wide", note: "Very fast ultra-wide; heavy.", note_es: "Ultra gran angular muy luminoso; pesado." },
      { id: "sam14c", name: "Samyang 14mm f/2.8 (manual)", f: [14, 14], N: [2.8], role: "wide", note: "Classic budget ultra-wide (EF and RF versions).", note_es: "Clásico ultra gran angular económico (versiones EF y RF)." },
      { id: "ef24l", name: "Canon EF 24mm f/1.4L II (adapted)", f: [24, 24], N: [1.4, 2], role: "wide", note: "Very fast for tighter Milky Way frames.", note_es: "Muy luminoso para encuadres más cerrados de la Vía Láctea." },
      { id: "rf135", name: "Canon RF 135mm f/1.8L IS USM", f: [135, 135], N: [1.8, 2.8], role: "deep", note: "Fast tracked wide-field deep sky; IS off on a tracker.", note_es: "Cielo profundo de campo amplio con montura; IS apagado." },
      { id: "ef135l", name: "Canon EF 135mm f/2L USM (adapted)", f: [135, 135], N: [2.8, 2], role: "deep", note: "A classic deep-sky lens; f/2.8 for round stars.", note_es: "Clásico de cielo profundo; f/2.8 para estrellas redondas." },
      { id: "sam135c", name: "Samyang 135mm f/2 ED UMC (EF)", f: [135, 135], N: [2.8, 2], role: "deep", note: "Manual-focus deep-sky favourite at a fair price.", note_es: "Favorito manual de cielo profundo a buen precio." },
      { id: "ef200", name: "Canon EF 200mm f/2.8L II (adapted)", f: [200, 200], N: [2.8, 4], role: "deep", note: "Light 200mm prime for galaxies and nebulae.", note_es: "Fijo de 200mm ligero para galaxias y nebulosas." },
      { id: "rf70200", name: "Canon RF 70-200mm f/2.8L IS USM", f: [70, 200], N: [2.8], role: "deep", note: "Flexible framing; IS off on a tracker.", note_es: "Encuadre flexible; IS apagado en montura." },
      { id: "rf100500", name: "Canon RF 100-500mm f/4.5-7.1L IS USM", f: [100, 500], N: [7.1], role: "deep", note: "Moon and planets; slow for faint targets.", note_es: "Luna y planetas; lento para objetos tenues." },
    ],
  },
  nikon: {
    id: "nikon", name: "Nikon", short: "Nikon", fmt: "Z · F",
    bodies: [
      body("z6iii", "Nikon Z6 III", 35.9, 23.9, 6048, 4032, "24.5 MP full frame; large pixels, great at high ISO.", "Full frame de 24.5 MP; píxeles grandes, excelente a ISO alto."),
      body("zf", "Nikon Z f", 35.9, 23.9, 6048, 4032, "24.5 MP full frame in a classic body.", "Full frame de 24.5 MP en cuerpo clásico."),
      body("z8", "Nikon Z8", 35.9, 23.9, 8256, 5504, "45.7 MP: detail for big prints; smaller pixels.", "45.7 MP: detalle para impresiones grandes; píxeles más chicos."),
      body("z50ii", "Nikon Z50 II", 23.5, 15.7, 5568, 3712, "APS-C 20.9 MP; 1.5× crop.", "APS-C de 20.9 MP; recorte 1.5×."),
      body("d850", "Nikon D850 (DSLR)", 35.9, 23.9, 8256, 5504, "45.7 MP DSLR; adapts to Z with the FTZ.", "DSLR de 45.7 MP; se adapta a Z con el FTZ."),
    ],
    lenses: [
      { id: "z1424", name: "Nikkor Z 14-24mm f/2.8 S", f: [14, 24], N: [2.8], role: "wide", note: "Slight coma, good corners — a reference wide zoom.", note_es: "Poca coma, buenas esquinas: zoom amplio de referencia." },
      { id: "z20", name: "Nikkor Z 20mm f/1.8 S", f: [20, 20], N: [2.2, 1.8, 2.8], role: "wide", note: "Excellent centre; f/2.2–2.8 cleans up corner coma.", note_es: "Centro excelente; f/2.2–2.8 limpia la coma de las esquinas." },
      { id: "z1430", name: "Nikkor Z 14-30mm f/4 S", f: [14, 30], N: [4], role: "wide", note: "Light; f/4 wants tracking or stacking.", note_es: "Ligero; f/4 pide seguimiento o apilado." },
      { id: "laowa15z", name: "Laowa 15mm f/2 Zero-D (Z)", f: [15, 15], N: [2.2, 2, 2.8], role: "wide", note: "Fast and compact; stop down a little for the corners.", note_es: "Luminoso y compacto; cierra un poco por las esquinas." },
      { id: "sam14n", name: "Samyang 14mm f/2.8 (manual)", f: [14, 14], N: [2.8], role: "wide", note: "Classic budget ultra-wide (Z and F versions).", note_es: "Clásico ultra gran angular económico (versiones Z y F)." },
      { id: "sigma14f", name: "Sigma 14mm f/1.8 DG HSM Art (F, adapted)", f: [14, 14], N: [1.8, 2.8], role: "wide", note: "Very fast ultra-wide; heavy.", note_es: "Ultra gran angular muy luminoso; pesado." },
      { id: "f1424g", name: "Nikon AF-S 14-24mm f/2.8G (F, adapted)", f: [14, 24], N: [2.8], role: "wide", note: "The classic DSLR-era astro zoom.", note_es: "El zoom astro clásico de la era DSLR." },
      { id: "vilt13z", name: "Viltrox AF 13mm f/1.4 (APS-C)", f: [13, 13], N: [1.4, 2], role: "wide", note: "Fast ultra-wide for Z50-class bodies.", note_es: "Ultra gran angular luminoso para cuerpos tipo Z50." },
      { id: "z85", name: "Nikkor Z 85mm f/1.8 S", f: [85, 85], N: [1.8, 2.8], role: "deep", note: "Very good centre and corners; light.", note_es: "Muy buen centro y esquinas; ligero." },
      { id: "z135", name: "Nikkor Z 135mm f/1.8 S Plena", f: [135, 135], N: [1.8, 2.8], role: "deep", note: "Essentially coma-free and sharp to the corners — a standout.", note_es: "Prácticamente sin coma y nítido hasta las esquinas: sobresaliente." },
      { id: "sam135n", name: "Samyang 135mm f/2 ED UMC (F)", f: [135, 135], N: [2.8, 2], role: "deep", note: "Manual-focus deep-sky favourite at a fair price.", note_es: "Favorito manual de cielo profundo a buen precio." },
      { id: "z70200", name: "Nikkor Z 70-200mm f/2.8 VR S", f: [70, 200], N: [2.8], role: "deep", note: "Best-rated zoom for stars; VR off on a tracker.", note_es: "El zoom mejor calificado para estrellas; VR apagado en montura." },
      { id: "z100400", name: "Nikkor Z 100-400mm f/4.5-5.6 VR S", f: [100, 400], N: [5.6], role: "deep", note: "Galaxies, clusters, the Moon.", note_es: "Galaxias, cúmulos, la Luna." },
      { id: "z180600", name: "Nikkor Z 180-600mm f/5.6-6.3 VR", f: [180, 600], N: [6.3], role: "deep", note: "Moon and planets.", note_es: "Luna y planetas." },
    ],
  },
  fuji: {
    id: "fuji", name: "Fujifilm", short: "Fujifilm", fmt: "X (APS-C)",
    bodies: [
      body("xt5", "Fujifilm X-T5", 23.5, 15.6, 7728, 5152, "40 MP APS-C: small pixels, so stars trail sooner.", "APS-C de 40 MP: píxeles chicos, los trazos aparecen antes."),
      body("xs20", "Fujifilm X-S20", 23.5, 15.6, 6240, 4160, "26 MP; compact and light for treks.", "26 MP; compacta y ligera para caminatas."),
      body("xh2s", "Fujifilm X-H2S", 23.5, 15.6, 6240, 4160, "26 MP stacked sensor.", "Sensor apilado de 26 MP."),
      body("xt30ii", "Fujifilm X-T30 II", 23.5, 15.6, 6240, 4160, "26 MP; a budget way into the night sky.", "26 MP; una entrada económica al cielo nocturno."),
    ],
    lenses: [
      { id: "sam12x", name: "Samyang 12mm f/2 NCS CS", f: [12, 12], N: [2, 2.8], role: "wide", note: "Very good coma even at f/2 — a Fuji night-sky favourite.", note_es: "Muy buena coma incluso a f/2: favorito nocturno en Fuji." },
      { id: "xf816", name: "Fujinon XF 8-16mm f/2.8 R LM WR", f: [8, 16], N: [2.8], role: "wide", note: "Ultra-wide zoom; bulbous front.", note_es: "Zoom ultra gran angular; frontal bulboso." },
      { id: "xf14", name: "Fujinon XF 14mm f/2.8 R", f: [14, 14], N: [2.8], role: "wide", note: "Sharp with no coma even wide open.", note_es: "Nítido y sin coma incluso a plena apertura." },
      { id: "xf16", name: "Fujinon XF 16mm f/1.4 R WR", f: [16, 16], N: [2, 1.4], role: "wide", note: "Fast; corners improve by f/2.", note_es: "Luminoso; las esquinas mejoran a f/2." },
      { id: "vilt13x", name: "Viltrox AF 13mm f/1.4 XF", f: [13, 13], N: [1.4, 2], role: "wide", note: "Fast autofocus ultra-wide.", note_es: "Ultra gran angular luminoso con AF." },
      { id: "xf18", name: "Fujinon XF 18mm f/2 R", f: [18, 18], N: [2], role: "wide", note: "Compact pancake; good wide open.", note_es: "Pancake compacto; bien a plena apertura." },
      { id: "xf23", name: "Fujinon XF 23mm f/1.4 R", f: [23, 23], N: [2, 1.4], role: "wide", note: "Some extreme-corner coma at f/1.4; best at f/2.", note_es: "Algo de coma en las esquinas a f/1.4; mejor a f/2." },
      { id: "xf90", name: "Fujinon XF 90mm f/2 R LM WR", f: [90, 90], N: [2, 2.8], role: "deep", note: "Popular tracked deep-sky prime (≈137mm full-frame).", note_es: "Fijo popular de cielo profundo con montura (≈137mm FF)." },
      { id: "sam135x", name: "Samyang 135mm f/2 ED UMC (X)", f: [135, 135], N: [2.8, 2], role: "deep", note: "Manual deep-sky favourite (≈206mm full-frame).", note_es: "Favorito manual de cielo profundo (≈206mm FF)." },
      { id: "xf50140", name: "Fujinon XF 50-140mm f/2.8 R LM OIS WR", f: [50, 140], N: [2.8], role: "deep", note: "Flexible deep-sky zoom; OIS off on a tracker.", note_es: "Zoom flexible de cielo profundo; OIS apagado en montura." },
      { id: "xf100400", name: "Fujinon XF 100-400mm f/4.5-5.6", f: [100, 400], N: [5.6], role: "deep", note: "Galaxies, clusters, the Moon.", note_es: "Galaxias, cúmulos, la Luna." },
      { id: "xf150600", name: "Fujinon XF 150-600mm f/5.6-8", f: [150, 600], N: [8], role: "deep", note: "Moon and planets.", note_es: "Luna y planetas." },
    ],
  },
};
const SYSTEM_ORDER = ["mft", "canon", "nikon", "fuji"];

// Tracking classes. K = focal length × safe sub (mm·s) for 3.34 µm pixels;
// scaled by pixel pitch. Second value: after a good drift test (expect some rejects).
const TRACKERS = {
  none:   { id: "none", name: "Tripod (no tracking)", name_es: "Trípode (sin seguimiento)", K: null },
  single: { id: "single", name: "Star tracker (single-axis)", name_es: "Rastreador (un eje)", K: [7500, 12000], ex: "Star Adventurer 2i / Mini, iOptron SkyGuider Pro, Move Shoot Move" },
  goto:   { id: "goto", name: "GoTo tracker (two-axis)", name_es: "Rastreador GoTo (dos ejes)", K: [9000, 15000], ex: "Sky-Watcher Star Adventurer GTi" },
  guided: { id: "guided", name: "Guided mount", name_es: "Montura con autoguiado", K: [60000, 120000], ex: "Mount + guide scope + guide camera" },
  sa2i:   { id: "sa2i", name: "Star Adventurer 2i", name_es: "Star Adventurer 2i", K: [6000, 9000], ex: "Reassembled reticle: approximate until a drift test confirms" },
  gti:    { id: "gti", name: "Star Adventurer GTi", name_es: "Star Adventurer GTi", K: [9000, 15000], ex: "Two-axis GoTo" },
};
const TRACKER_PUBLIC = ["single", "goto", "guided"];

const lensById = (sys, id) => (SYSTEMS[sys] || SYSTEMS.mft).lenses.find((l) => l.id === id);
const bodyById = (sys, id) => (SYSTEMS[sys] || SYSTEMS.mft).bodies.find((b) => b.id === id) || (SYSTEMS[sys] || SYSTEMS.mft).bodies[0];
const lensEq = (lens, crop) => [lens.f[0] * crop, lens.f[1] * crop];

// Recommended full-frame-equivalent focal range per target, from its MFT lens list
const MFT_FF = Object.fromEntries(SYSTEMS.mft.lenses.map((l) => [l.id, [l.f[0] * 2, l.f[1] * 2 * (l.tc ? Math.max(...l.tc.map((x) => x[1])) : 1)]]));
function targetFF(t) {
  const ranges = (t.lenses || []).map((id) => MFT_FF[id]).filter(Boolean);
  if (!ranges.length) return [14, 1200];
  return [Math.min(...ranges.map((r) => r[0])), Math.max(...ranges.map((r) => r[1]))];
}
// Lenses in a kit that suit a target. The target lists MFT lenses in order of preference; each kit lens is
// scored by how close its full-frame-equivalent range comes to those, so the best match is listed first.
function kitLensesFor(t, kit) {
  const sys = SYSTEMS[kit.sys] || SYSTEMS.mft, crop = bodyById(kit.sys, kit.body).crop;
  if (kit.sys === "mft") {
    const direct = (t.lenses || []).filter((id) => sys.lenses.some((l) => l.id === id));
    if (direct.length) return direct;
  }
  const prefs = (t.lenses || []).map((id) => MFT_FF[id]).filter(Boolean);
  if (!prefs.length) return sys.lenses.filter((l) => l.role === "wide").map((l) => l.id);
  return sys.lenses.map((l, order) => {
    const [x, y] = lensEq(l, crop);
    let cost = Infinity;
    prefs.forEach(([a, b], i) => {
      const gap = y < a ? Math.log(a / y) : x > b ? Math.log(x / b) : 0;
      cost = Math.min(cost, i * 0.35 + gap * 3);
    });
    return { id: l.id, cost, order };
  }).filter((r) => r.cost < 1.6).sort((p, q) => p.cost - q.cost || p.order - q.order).map((r) => r.id);
}

// The chosen kit (camera system, body, up to two trackers), remembered on this device
const KIT_DEFAULT = PLATFORM === "web" ? { sys: "canon", body: "r6ii", trackers: ["single", "goto"] } : { sys: "mft", body: "om1ii", trackers: ["sa2i", "gti"] };
const KIT_S = makeStore("cg-kit", KIT_DEFAULT, (v) => v && SYSTEMS[v.sys] && Array.isArray(v.trackers));
const useKit = () => useGlobal(KIT_S);
function kitInfo(kit) {
  const sys = SYSTEMS[kit.sys] || SYSTEMS.mft, b = bodyById(kit.sys, kit.body);
  return { sys, body: b, pitch: b.pitch, crop: b.crop, sw: b.w, sh: b.h, trackers: kit.trackers };
}
