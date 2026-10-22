// ── LENS OPTICS + EXPOSURE MODEL ─────────────────────────────────────────────
// Sub-exposure ranges for one lens setting × object class × mount.
// Untracked: NPF rule (pinpoint k=1 → web-sharp k=2), corrected for declination.
// Tracked:   tracking limit K/f (mm·s) from the established field limits
//            (GTi 300mm ≤30 s safe; SA2i reticle approximate → lower until drift-tested),
//            capped by sky glow (aperture, Bortle, filter) and class rules.
// Floor:     ~1/8 of the sky-limited length — shorter subs add read noise.
const PITCH_REF = 3.34; // µm — the field limits below were measured with 3.3 µm MFT pixels
const TC_LABEL = {
  en: { none: "No TC", mc14: "MC-14 (1.4×)", int: "Built-in 1.25×", both: "1.25× + MC-14" },
  es: { none: "Sin TC", mc14: "MC-14 (1.4×)", int: "1.25× integrado", both: "1.25× + MC-14" },
};
const TRACK_RANK = { none: 0, sa2i: 1, single: 1, gti: 2, goto: 2, guided: 3 };

const EXP = {
  tRef: 240,     // s — sky at ~1/3 histogram: f/2.8, ISO 800, Bortle 2, no filter
  nbGain: 10,    // STC Astro Duo: sky ~10× darker
  cap: 300,      // s — practical ceiling (wind gusts, aircraft, satellites, dew)
};
const BORTLE_SKY = [1, 0.85, 1, 1.4, 2.5, 4.5, 7, 10, 14, 20];
const SHUTTER = [8000, 6400, 5000, 4000, 3200, 2500, 2000, 1600, 1250, 1000, 800, 640, 500, 400, 320, 250, 200, 160, 125, 100, 80, 60, 50, 40, 30, 25, 20, 15, 13, 10, 8, 6, 5, 4, 3, 2.5, 2, 1.6, 1.3];
const ISO_STOPS = [100, 200, 400, 800, 1600, 3200, 6400];

function expClass(t) {
  switch (t.type) {
    case "Lunar": return "moon";
    case "Solar": return "sun";
    case "Planet": return "planet";
    case "Meteor Shower": return "meteor";
    case "Globular Cluster": return "globular";
    case "Open Cluster": return "open";
    case "Milky Way": case "Star Field": return "wide";
    case "Galaxy": return "galaxy";
    default: return "nebula";
  }
}
const HDR_TARGETS = new Set(["orion_ctx", "orion_detail", "andromeda_core", "andromeda_full"]);

const snapIso = (v, lo, hi) => {
  const x = Math.max(lo, Math.min(hi, v));
  return ISO_STOPS.reduce((b, s) => (Math.abs(Math.log2(s / x)) < Math.abs(Math.log2(b / x)) ? s : b), ISO_STOPS[0]);
};
function npf(f, N, dec, pitch) {
  const cosd = Math.max(0.34, Math.cos((dec || 0) * Math.PI / 180));
  const pin = (16.856 * N + 0.0997 * f + 13.713 * (pitch || PITCH_REF)) / (f * cosd);
  return { pin, loose: 2 * pin };
}
const skyLimit = (N, bortle, nb) => EXP.tRef * (N / 2.8) ** 2 / (BORTLE_SKY[Math.max(1, Math.min(9, Math.round(bortle || 3)))]) * (nb ? EXP.nbGain : 1);

// "nice" rounding: down for maxima, up for minima
function niceSec(t, dir) {
  if (!(t > 0)) return 0;
  if (t < 0.9) {
    const xs = SHUTTER.map((d) => 1 / d);
    if (dir < 0) { let b = xs[0]; for (const x of xs) if (x <= t) b = x; return b; }
    for (const x of xs) if (x >= t) return x; return xs[xs.length - 1];
  }
  const step = t < 10 ? 1 : t < 30 ? 1 : t < 120 ? 5 : 30;
  const r = dir < 0 ? Math.floor(t / step) * step : Math.ceil(t / step) * step;
  return Math.max(step === 1 && t < 1 ? 1 : step, r);
}
function fmtSec(t) {
  if (!(t > 0)) return "—";
  if (t < 0.9) { const d = 1 / t; const s = SHUTTER.reduce((b, x) => (Math.abs(Math.log(x / d)) < Math.abs(Math.log(b / d)) ? x : b), SHUTTER[0]); return `1/${s}`; }
  if (t < 120) return `${Math.round(t)} s`;
  const m = Math.round(t / 30) / 2;
  return `${m} min`;
}
function fmtRange(a, b) {
  if (!(b > 0)) return "—";
  if (Math.abs(a - b) / b < 0.08) return fmtSec(b);
  const fa = fmtSec(a), fb = fmtSec(b);
  if (fa.endsWith(" s") && fb.endsWith(" s")) return `${fa.slice(0, -2)}–${fb}`;
  if (fa.endsWith(" min") && fb.endsWith(" min")) return `${fa.slice(0, -4)}–${fb}`;
  if (!fa.includes(" ") && !fb.includes(" ")) return `${fa}–${fb} s`;
  return `${fa} – ${fb}`;
}

// Brightness of bright bodies relative to the full Moon's surface ("Looney 11")
const BODY_FACTOR = { jupiter: 6, saturn: 22, venus: 1 / 11, mars: 1.6 };
const BODY_ISO = { jupiter: 400, saturn: 800, venus: 100, mars: 200 };

/**
 * opts: { t, cat, lens, f, N, kit: {pitch, crop, trackers}, bortle, nb, moon: {illum, up}, phaseIllum, frameShortDeg }
 * returns { cls, rows:[{mount,min,max,iso,limit,stretch,read,role}], notes:[keys], nbAllowed, sky }
 */
function exposurePlan(o) {
  const { t, cat, f, N } = o;
  const lens = o.lens || {};
  const kit = o.kit || { pitch: PITCH_REF, crop: 2, trackers: ["single", "goto"] };
  const pitch = kit.pitch || PITCH_REF, kScale = pitch / PITCH_REF;
  const trackers = (kit.trackers && kit.trackers.length ? kit.trackers : ["single"]).filter((id) => TRACKERS[id] && TRACKERS[id].K);
  const cls = expClass(t);
  const nbAllowed = !lens.noFilter && ["nebula", "galaxy", "wide"].includes(cls) && t.filter !== "nd100000";
  const nb = !!o.nb && nbAllowed && cls === "nebula";
  const dec = cat && typeof cat.dec === "number" ? cat.dec : 0;
  const fEq = f * (kit.crop || 2);
  const ranked = [...trackers].sort((a, b) => TRACK_RANK[a] - TRACK_RANK[b]);
  const roleRig = ranked.length ? (fEq <= 100 ? ranked[0] : ranked[ranked.length - 1]) : null;
  const notes = [];
  const rows = [];

  if (cls === "moon" || cls === "planet" || cls === "sun") {
    let iso = 200, base;
    if (cls === "sun") { iso = 100; base = (N * N * 12.5) / (1.6e4 * iso); notes.push("sunFilter"); }
    else if (cls === "moon") {
      const il = (o.phaseIllum ?? 60) / 100;
      const k = il >= 0.9 ? 1 : il >= 0.6 ? 2 : il >= 0.35 ? 4 : 8;
      base = ((N / 11) ** 2 / iso) * k; notes.push("moonBracket");
    } else {
      const b = cat && cat.body;
      iso = BODY_ISO[b] || 400;
      base = ((N / 11) ** 2 / iso) * (BODY_FACTOR[b] || 6); notes.push("planetVideo");
    }
    const mn = niceSec(base / 2, 1), mx = niceSec(cls === "planet" ? base * 1.5 : base * 2, -1);
    for (const m of ["none", ...trackers]) rows.push({ mount: m, min: mn, max: mx, iso, limit: "bright", role: m === "none" ? false : m === roleRig });
    if (o.frameShortDeg && cls !== "sun") {
      const bodyDeg = cls === "moon" ? 0.52 : 0.02;
      const drift = ((o.frameShortDeg - bodyDeg) / 2) * 3600 / (15 * Math.max(0.3, Math.cos(dec * Math.PI / 180)));
      if (drift < 600) notes.push(["recenter", Math.max(1, Math.round(drift / 60))]);
    }
    notes.push(cls === "sun" ? "solarRate" : cls === "moon" ? "lunarRate" : "planetRate");
    return { cls, rows, notes, nbAllowed: false, nb: false };
  }

  const bortle = o.bortle || 3;
  const sky = skyLimit(N, bortle, nb);
  const floor = (sky / 8) * (PITCH_REF / pitch) ** 2; // bigger pixels collect more light per pixel

  // untracked tripod
  const u = npf(f, N, cls === "meteor" ? 0 : dec, pitch);
  const uMax = Math.min(u.loose, sky);
  const uMin = Math.min(u.pin, uMax);
  rows.push({ mount: "none", min: niceSec(uMin, 1), max: niceSec(uMax, -1), iso: snapIso(800 * sky / uMax, 800, 3200), limit: uMax < u.loose ? "sky" : "trail", poor: cls !== "meteor" && cls !== "wide" && uMax < 2, role: false });

  for (const m of trackers) {
    const [k1, k2] = TRACKERS[m].K.map((k) => k * kScale);
    const tTrack = k1 / f;
    let max = Math.min(tTrack, sky, EXP.cap);
    let limit = max === tTrack ? "track" : max === sky ? "sky" : "cap";
    if (cls === "globular" && sky * 0.5 < max) { max = sky * 0.5; limit = "core"; }
    if (cls === "open" && sky * 0.6 < max) { max = sky * 0.6; limit = "stars"; }
    if (cls === "meteor" && max > 30) { max = 30; limit = "meteor"; }
    let min = Math.max(floor, cls === "meteor" ? 8 : 1);
    let read = false;
    if (min > max * 0.7) { read = min > max; min = max * 0.5; }
    const stretch = limit === "track" && k2 / f > max * 1.15 ? Math.min(k2 / f, sky, EXP.cap) : null;
    rows.push({ mount: m, min: niceSec(min, 1), max: niceSec(max, -1), iso: snapIso(800 * sky / max, 400, nb ? 3200 : 1600), limit, stretch: stretch ? niceSec(stretch, -1) : null, read, role: m === roleRig });
  }

  if (rows.some((r) => r.read)) notes.push("readNoise");
  if (nb) notes.push("nbOn");
  else if (nbAllowed && t.filter === "essential") notes.push("nbSuggest");
  if (cls === "wide") notes.push("foreground");
  if (cls === "meteor") notes.push("meteorRun");
  if (cls === "globular") notes.push("globCore");
  if (HDR_TARGETS.has(t.id)) notes.push("hdr");
  if (o.moon && o.moon.up && o.moon.illum >= 35 && !nb) notes.push(["moonUp", o.moon.illum, Math.round(1 + 3 * o.moon.illum / 100)]);
  if (bortle >= 4) notes.push("brightSite");
  if (rows[0].poor) notes.push("untrackedPoor");
  return { cls, rows, notes, nbAllowed, nb, sky };
}

const EXP_TEXT = {
  en: {
    title: "Frame & exposure", lens: "Lens", focal: "Focal length", tc: "Teleconverter", ap: "Aperture",
    allLenses: "All lenses", recLenses: "Recommended", photos: "Photos", lines: "Lines", level: "Tripod level", eq: "Tracker (N up)",
    rotate: "Camera angle", align: "Align to object", portrait: "90°", reset: "0°",
    loadingPhotos: "Loading photos…", photosOff: "Photos unavailable here — the sky preview still works.",
    frame: (w, h) => `Frame ${w} × ${h}`, ff: (x) => `${x} mm FF`, object: (s) => `object ${s}`,
    fill: { tiny: "Tiny in this frame — go longer", small: "Small — expect a heavy crop", room: "Plenty of context around it", good: "Good fill", tight: "Tight — rotate the camera to fit", over: (a, b) => `Doesn't fit — mosaic ${a}×${b} panels` },
    field: "Wide field: frame shows how much sky you get",
    table: { mount: "Mount", sub: "Sub length", iso: "ISO", why: "Limited by" },
    mounts: { none: "Tripod (no tracking)", sa2i: "SA2i", gti: "GTi" },
    role: "suggested mount for this lens", changeKit: "change camera", stretch: (s) => `up to ${s} after a drift test`,
    limit: { trail: "star trailing (NPF)", track: "tracking accuracy", sky: "sky glow", cap: "practical cap", core: "bright core", stars: "star colour", meteor: "meteor contrast", bright: "bright object" },
    nbToggle: "Dual-band filter (H-alpha + O-III)", nbNo: "No front filter fits this lens",
    notes: {
      readNoise: "Subs are shorter than the sky needs at this focal length: use the longest safe sub at the ISO shown and stack more frames, or go shorter on focal length.",
      nbOn: "A dual-band filter darkens the sky ~10×, so longer subs pay off; refocus after fitting it.",
      nbSuggest: "This target is an emission nebula: try a dual-band filter.",
      foreground: "On a tracker the ground blurs: take a separate untracked frame for the foreground and blend.",
      meteorRun: "Shoot continuously with the intervalometer and aim 30–40° away from the radiant.",
      globCore: "Globular cores saturate fast: add a few half-length subs if the core blows out.",
      hdr: "Very bright core: add a set of 3–10 s subs and blend for HDR.",
      moonUp: (i, k) => `Moon up (${i}%): sky about ${k}× brighter, so use roughly 1/${k} of these lengths or a dual-band filter.`,
      brightSite: "Bortle 4+: the sky caps your subs sooner; stack more frames.",
      untrackedPoor: "Untracked, stars trail in under 2 s at this focal length: use a tracker.",
      sunFilter: "ND100000 on BEFORE you point at the Sun. Never aim without it.",
      moonBracket: "Bracket ±1 stop; the terminator needs the longer end.",
      planetVideo: "Shoot 4K video or long bursts; stack the sharpest 10–20%. Keep shutter fast to freeze seeing.",
      recenter: (m) => `Untracked it drifts out of frame in ~${m} min: re-centre often.`,
      lunarRate: "Tracker at lunar rate (SA2i: Lunar · SynScan: Lunar).",
      solarRate: "Tracker at solar rate.",
      planetRate: "Sidereal rate is fine for a planet.",
    },
    credit: "Photo",
  },
  es: {
    title: "Encuadre y exposición", lens: "Lente", focal: "Focal", tc: "Teleconvertidor", ap: "Apertura",
    allLenses: "Todos los lentes", recLenses: "Recomendados", photos: "Fotos", lines: "Líneas", level: "Trípode nivelado", eq: "Montura (N arriba)",
    rotate: "Ángulo de cámara", align: "Alinear al objeto", portrait: "90°", reset: "0°",
    loadingPhotos: "Cargando fotos…", photosOff: "Fotos no disponibles aquí — la vista del cielo sí funciona.",
    frame: (w, h) => `Cuadro ${w} × ${h}`, ff: (x) => `${x} mm FF`, object: (s) => `objeto ${s}`,
    fill: { tiny: "Diminuto en este cuadro — usa más focal", small: "Pequeño — habrá que recortar mucho", room: "Mucho contexto alrededor", good: "Buen llenado", tight: "Justo — gira la cámara para que quepa", over: (a, b) => `No cabe — mosaico de ${a}×${b} paneles` },
    field: "Campo amplio: el cuadro muestra cuánto cielo cabe",
    table: { mount: "Montura", sub: "Duración del sub", iso: "ISO", why: "Lo limita" },
    mounts: { none: "Trípode (sin seguimiento)", sa2i: "SA2i", gti: "GTi" },
    role: "montura sugerida para este lente", changeKit: "cambiar cámara", stretch: (s) => `hasta ${s} tras prueba de deriva`,
    limit: { trail: "trazos estelares (NPF)", track: "precisión de seguimiento", sky: "brillo del cielo", cap: "tope práctico", core: "núcleo brillante", stars: "color estelar", meteor: "contraste de meteoros", bright: "objeto brillante" },
    nbToggle: "Filtro de banda dual (H-alfa + O-III)", nbNo: "Ningún filtro frontal cabe en este lente",
    notes: {
      readNoise: "A esta focal los subs quedan más cortos de lo que pide el cielo: usa el sub seguro más largo con el ISO indicado y apila más cuadros, o baja la focal.",
      nbOn: "Un filtro de banda dual oscurece el cielo ~10×, así que conviene alargar los subs; reenfoca después de ponerlo.",
      nbSuggest: "Este objetivo es una nebulosa de emisión: prueba un filtro de banda dual.",
      foreground: "En la montura el suelo sale movido: toma un cuadro aparte sin seguimiento para el primer plano y combínalos.",
      meteorRun: "Dispara continuo con el intervalómetro y apunta a 30–40° del radiante.",
      globCore: "Los núcleos globulares se saturan rápido: agrega algunos subs de la mitad si el núcleo se quema.",
      hdr: "Núcleo muy brillante: agrega una serie de subs de 3–10 s y combina en HDR.",
      moonUp: (i, k) => `Luna arriba (${i}%): cielo unas ${k}× más brillante; usa más o menos 1/${k} de estas duraciones o un filtro de banda dual.`,
      brightSite: "Bortle 4+: el cielo limita antes los subs; apila más cuadros.",
      untrackedPoor: "Sin seguimiento, las estrellas se arrastran en menos de 2 s a esta focal: usa montura.",
      sunFilter: "El ND100000 va puesto ANTES de apuntar al Sol. Nunca apuntes sin él.",
      moonBracket: "Haz horquilla de ±1 paso; el terminador pide el extremo largo.",
      planetVideo: "Graba video 4K o ráfagas largas; apila el 10–20% más nítido. Obturación rápida para congelar el seeing.",
      recenter: (m) => `Sin seguimiento sale del cuadro en ~${m} min: recentra seguido.`,
      lunarRate: "Montura a velocidad lunar (SA2i: Lunar · SynScan: Lunar).",
      solarRate: "Montura a velocidad solar.",
      planetRate: "La velocidad sideral sirve para un planeta.",
    },
    credit: "Foto",
  },
};
