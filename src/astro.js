// ── SKY ENGINE ───────────────────────────────────────────────────────────────
// Low-precision positions good to a few arcminutes (Sun, planets) and ~0.3°
// (Moon) — plenty for planning, finder charts and rise/set times.
// All times are Date objects (UTC instants). Display uses Guatemala time (UTC-6).

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;
const norm360 = (x) => ((x % 360) + 360) % 360;
const GT_OFFSET_H = -6;

const jdOf = (date) => date.getTime() / 86400000 + 2440587.5;
const centuries = (jd) => (jd - 2451545.0) / 36525;

function gmstDeg(jd) {
  const T = centuries(jd);
  return norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T);
}

const OBLIQ = 23.4392911 * RAD;

function eclToEq(lonDeg, latDeg) {
  const l = lonDeg * RAD, b = latDeg * RAD;
  const x = Math.cos(b) * Math.cos(l);
  const y = Math.cos(b) * Math.sin(l) * Math.cos(OBLIQ) - Math.sin(b) * Math.sin(OBLIQ);
  const z = Math.cos(b) * Math.sin(l) * Math.sin(OBLIQ) + Math.sin(b) * Math.cos(OBLIQ);
  return { ra: norm360(Math.atan2(y, x) * DEG), dec: Math.asin(z) * DEG };
}

function sunPos(jd) {
  const n = jd - 2451545.0;
  const L = norm360(280.460 + 0.9856474 * n);
  const g = norm360(357.528 + 0.9856003 * n) * RAD;
  const lam = L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g);
  return { ...eclToEq(lam, 0), lon: norm360(lam) };
}

function moonPos(jd) {
  const T = centuries(jd);
  const s = (a, b) => Math.sin((a + b * T) * RAD);
  const c = (a, b) => Math.cos((a + b * T) * RAD);
  const lam = 218.32 + 481267.881 * T
    + 6.29 * s(135.0, 477198.87) - 1.27 * s(259.3, -413335.36) + 0.66 * s(235.7, 890534.22)
    + 0.21 * s(269.9, 954397.74) - 0.19 * s(357.5, 35999.05) - 0.11 * s(186.5, 966404.03);
  const bet = 5.13 * s(93.3, 483202.02) + 0.28 * s(228.2, 960400.89)
    - 0.28 * s(318.3, 6003.15) - 0.17 * s(217.6, -407332.21);
  const par = 0.9508 + 0.0518 * c(135.0, 477198.87) + 0.0095 * c(259.3, -413335.36)
    + 0.0078 * c(235.7, 890534.22) + 0.0028 * c(269.9, 954397.74);
  return { ...eclToEq(norm360(lam), bet), lon: norm360(lam), parallax: par };
}

// JPL approximate Keplerian elements, valid 1800–2050 (a, e, I, L, varpi, Omega + rates per century)
const PLANET_EL = {
  venus:   [0.72333566, 0.00000390, 0.00677672, -0.00004107, 3.39467605, -0.00078890, 181.97909950, 58517.81538729, 131.60246718, 0.00268329, 76.67984255, -0.27769418],
  earth:   [1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668, 100.46457166, 35999.37244981, 102.93768193, 0.32327364, 0.0, 0.0],
  mars:    [1.52371034, 0.00001847, 0.09339410, 0.00007882, 1.84969142, -0.00813131, -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343],
  jupiter: [5.20288700, -0.00011607, 0.04838624, -0.00013253, 1.30439695, -0.00183714, 34.39644051, 3034.74612775, 14.72847983, 0.21252668, 100.47390909, 0.20469106],
  saturn:  [9.53667594, -0.00125060, 0.05386179, -0.00050991, 2.48599187, 0.00193609, 49.95424423, 1222.49362201, 92.59887831, -0.41897216, 113.66242448, -0.28867794],
};

function helio(name, T) {
  const p = PLANET_EL[name];
  const a = p[0] + p[1] * T, e = p[2] + p[3] * T, I = (p[4] + p[5] * T) * RAD;
  const L = p[6] + p[7] * T, varpi = p[8] + p[9] * T, Om = p[10] + p[11] * T;
  const w = (varpi - Om) * RAD, O = Om * RAD;
  let M = norm360(L - varpi); if (M > 180) M -= 360; M *= RAD;
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 8; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(w), sw = Math.sin(w), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(I), sI = Math.sin(I);
  return [
    (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp,
    (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp,
    (sw * sI) * xp + (cw * sI) * yp,
  ];
}

function planetPos(name, jd) {
  const T = centuries(jd);
  const p = helio(name, T), e = helio("earth", T);
  const x = p[0] - e[0], y = p[1] - e[1], z = p[2] - e[2];
  const ye = y * Math.cos(OBLIQ) - z * Math.sin(OBLIQ);
  const ze = y * Math.sin(OBLIQ) + z * Math.cos(OBLIQ);
  const r = Math.sqrt(x * x + ye * ye + ze * ze);
  return { ra: norm360(Math.atan2(ye, x) * DEG), dec: Math.asin(ze / r) * DEG, dist: r };
}

// Rough precession from J2000 to date (good to <1′ for a few decades)
function precess(raDeg, decDeg, jd) {
  const yrs = (jd - 2451545.0) / 365.25;
  const ra = raDeg * RAD, dec = decDeg * RAD;
  const dRa = (3.075 + 1.336 * Math.sin(ra) * Math.tan(dec)) * 15 / 3600 * yrs;
  const dDec = 20.04 * Math.cos(ra) / 3600 * yrs;
  return { ra: norm360(raDeg + dRa), dec: decDeg + dDec };
}

function altAz(raDeg, decDeg, lat, lon, jd) {
  const H = (gmstDeg(jd) + lon - raDeg) * RAD;
  const d = decDeg * RAD, f = lat * RAD;
  const sinAlt = Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const az = Math.atan2(-Math.cos(d) * Math.sin(H), Math.sin(d) * Math.cos(f) - Math.cos(d) * Math.cos(H) * Math.sin(f));
  return { alt: alt * DEG, az: norm360(az * DEG) };
}

function angSep(ra1, dec1, ra2, dec2) {
  const a = Math.sin(dec1 * RAD) * Math.sin(dec2 * RAD) + Math.cos(dec1 * RAD) * Math.cos(dec2 * RAD) * Math.cos((ra1 - ra2) * RAD);
  return Math.acos(Math.max(-1, Math.min(1, a))) * DEG;
}

function moonPhase(jd) {
  const s = sunPos(jd), m = moonPos(jd);
  const elong = angSep(s.ra, s.dec, m.ra, m.dec);
  const illum = (1 - Math.cos(elong * RAD)) / 2;
  const waxing = norm360(m.lon - s.lon) < 180;
  const age = norm360(m.lon - s.lon) / 360 * 29.530588;
  let phase;
  if (age < 1.85 || age > 27.7) phase = "New moon";
  else if (age < 6.5) phase = "Waxing crescent";
  else if (age < 8.4) phase = "First quarter";
  else if (age < 13.9) phase = "Waxing gibbous";
  else if (age < 15.7) phase = "Full moon";
  else if (age < 21.1) phase = "Waning gibbous";
  else if (age < 23.0) phase = "Last quarter";
  else phase = "Waning crescent";
  return { illum: Math.round(illum * 100), waxing, age: Math.round(age * 10) / 10, phase };
}

// Position of any catalog entry at an instant: {ra, dec} in degrees (of date)
function bodyRaDec(obj, jd) {
  if (obj.body === "moon") return moonPos(jd);
  if (obj.body === "sun") return sunPos(jd);
  if (obj.body) return planetPos(obj.body, jd);
  return precess(obj.ra * 15, obj.dec, jd);
}

function bodyAltAz(obj, site, jd) {
  const p = bodyRaDec(obj, jd);
  const h = altAz(p.ra, p.dec, site.lat, site.lon, jd);
  if (obj.body === "moon") h.alt -= p.parallax * Math.cos(h.alt * RAD); // topocentric
  return { ...h, ra: p.ra, dec: p.dec };
}

// ── NIGHT TIMELINE ───────────────────────────────────────────────────────────
// The "night of" a calendar date (GT): from local noon that day to noon the next.
function localNoonUTC(dateStr) {
  // dateStr "YYYY-MM-DD" in Guatemala local; noon GT = 18:00 UTC
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12 - GT_OFFSET_H, 0, 0));
}

function crossings(samples, threshold) {
  const out = [];
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i];
    if ((a.v - threshold) * (b.v - threshold) < 0) {
      const f = (threshold - a.v) / (b.v - a.v);
      out.push({ t: new Date(a.t.getTime() + f * (b.t - a.t)), rising: b.v > a.v });
    }
  }
  return out;
}

function nightInfo(site, dateStr) {
  const start = localNoonUTC(dateStr);
  const step = 5 * 60000;
  const sun = [], moon = [];
  for (let i = 0; i <= 288; i++) {
    const t = new Date(start.getTime() + i * step);
    const jd = jdOf(t);
    const s = sunPos(jd);
    sun.push({ t, v: altAz(s.ra, s.dec, site.lat, site.lon, jd).alt });
    moon.push({ t, v: bodyAltAz({ body: "moon" }, site, jd).alt });
  }
  const first = (arr, rising) => (arr.find((c) => c.rising === rising) || {}).t || null;
  const sunset = first(crossings(sun, -0.833), false);
  const sunrise = first(crossings(sun, -0.833), true);
  const civilDusk = first(crossings(sun, -6), false), civilDawn = first(crossings(sun, -6), true);
  const nautDusk = first(crossings(sun, -12), false), nautDawn = first(crossings(sun, -12), true);
  const astroDusk = first(crossings(sun, -18), false), astroDawn = first(crossings(sun, -18), true);
  const mc = crossings(moon, 0.125);
  const midnight = new Date(start.getTime() + 12 * 3600000);
  const mp = moonPhase(jdOf(midnight));
  // Moon-up hours during astronomical darkness
  let moonDarkMin = 0, darkMin = 0;
  for (let i = 0; i < sun.length; i++) {
    if (sun[i].v < -18) { darkMin += 5; if (moon[i].v > 0) moonDarkMin += 5; }
  }
  return {
    start, end: new Date(start.getTime() + 24 * 3600000),
    sunset, sunrise, civilDusk, civilDawn, nautDusk, nautDawn, astroDusk, astroDawn,
    moonrise: (mc.find((c) => c.rising) || {}).t || null,
    moonset: (mc.find((c) => !c.rising) || {}).t || null,
    moon: mp, darkHours: darkMin / 60, moonDarkHours: moonDarkMin / 60,
    sunSamples: sun, moonSamples: moon,
  };
}

const MOON_SENSITIVITY = {
  "Nebula": 1, "Galaxy": 1, "Milky Way": 1, "Star Field": 0.8, "Meteor Shower": 0.8,
  "Open Cluster": 0.45, "Globular Cluster": 0.35, "Planet": 0, "Lunar": 0, "Solar": 0,
};

// Altitude track and observing window for one catalog object on one night
function targetNight(obj, site, night, type) {
  const t0 = night.astroDusk || night.nautDusk || night.sunset;
  const t1 = night.astroDawn || night.nautDawn || night.sunrise;
  if (!t0 || !t1) return null;
  const decNow = obj.body ? null : obj.dec;
  const maxPossible = decNow == null ? 90 : 90 - Math.abs(site.lat - decNow);
  const thr = Math.max(2, Math.min(25, maxPossible - 4));
  const track = [];
  let best = { alt: -90, t: null, az: 0 }, winStart = null, winEnd = null, winMin = 0;
  for (let t = t0.getTime(); t <= t1.getTime(); t += 10 * 60000) {
    const d = new Date(t), jd = jdOf(d);
    const h = bodyAltAz(obj, site, jd);
    track.push({ t: d, alt: h.alt, az: h.az });
    if (h.alt > best.alt) best = { alt: h.alt, t: d, az: h.az };
    if (h.alt >= thr) { if (!winStart) winStart = d; winEnd = d; winMin += 10; }
  }
  // Moon interference at mid-window
  let moonSep = null, moonUp = false;
  if (winStart) {
    const mid = new Date((winStart.getTime() + winEnd.getTime()) / 2), jd = jdOf(mid);
    const p = bodyRaDec(obj, jd), m = moonPos(jd);
    moonSep = Math.round(angSep(p.ra, p.dec, m.ra, m.dec));
    moonUp = bodyAltAz({ body: "moon" }, site, jd).alt > 0;
  }
  const sens = MOON_SENSITIVITY[type] ?? 0.7;
  const moonFactor = moonUp ? (night.moon.illum / 100) * sens * (moonSep != null && moonSep < 45 ? 1.3 : 1) : 0;
  return { track, best, thr, winStart, winEnd, winHours: winMin / 60, moonSep, moonUp, moonFactor, maxPossible };
}

// Fixed-sky rise / transit / set (ignores the night window) for the card
function riseTransitSet(obj, site, night) {
  const out = { rise: null, transit: null, set: null, transitAlt: null };
  let prev = null, best = { alt: -90 };
  for (let t = night.start.getTime(); t <= night.end.getTime(); t += 5 * 60000) {
    const d = new Date(t);
    const h = bodyAltAz(obj, site, jdOf(d));
    if (prev) {
      if (prev.alt < 0 && h.alt >= 0 && !out.rise) out.rise = d;
      if (prev.alt >= 0 && h.alt < 0 && !out.set) out.set = d;
    }
    if (h.alt > best.alt) best = { alt: h.alt, t: d };
    prev = h;
  }
  out.transit = best.t; out.transitAlt = best.alt;
  return out;
}

// ── FORMATTING (Guatemala time) ─────────────────────────────────────────────
const gt = (d) => new Date(d.getTime() + GT_OFFSET_H * 3600000);
const hhmm = (d) => (d ? `${String(gt(d).getUTCHours()).padStart(2, "0")}:${String(gt(d).getUTCMinutes()).padStart(2, "0")}` : "—");
const todayGT = () => { const d = gt(new Date()); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`; };
const monthKeyGT = (dateStr) => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(dateStr.split("-")[1]) - 1];

const COMPASS = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
const COMPASS_ES = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSO","SO","OSO","O","ONO","NO","NNO"];
const compass = (az, lang) => (lang === "es" ? COMPASS_ES : COMPASS)[Math.round(norm360(az) / 22.5) % 16];
const fists = (alt) => Math.max(0, Math.round(alt / 10 * 2) / 2); // fist at arm's length ≈ 10°

// Horizontal → equatorial (degrees, of date)
function raDecFromAltAz(alt, az, lat, lon, jd) {
  const A = az * RAD, h = alt * RAD, f = lat * RAD;
  const sinDec = Math.sin(f) * Math.sin(h) + Math.cos(f) * Math.cos(h) * Math.cos(A);
  const dec = Math.asin(Math.max(-1, Math.min(1, sinDec)));
  const H = Math.atan2(-Math.sin(A) * Math.cos(h), Math.cos(f) * Math.sin(h) - Math.sin(f) * Math.cos(h) * Math.cos(A));
  return { ra: norm360(gmstDeg(jd) + lon - H * DEG), dec: dec * DEG };
}
// Position angle (deg, N through E) of point 2 seen from point 1
function posAngle(ra1, dec1, ra2, dec2) {
  const da = (ra2 - ra1) * RAD, d1 = dec1 * RAD, d2 = dec2 * RAD;
  return norm360(Math.atan2(Math.cos(d2) * Math.sin(da), Math.sin(d2) * Math.cos(d1) - Math.cos(d2) * Math.sin(d1) * Math.cos(da)) * DEG);
}
// Apparent angular radius (deg) of bright bodies
const BODY_KM = { jupiter: 142984, saturn: 120536, venus: 12104, mars: 6779 };
function bodyRadiusDeg(body, jd) {
  if (body === "moon") return 0.2725 * moonPos(jd).parallax;
  if (body === "sun") return 0.2666;
  const p = planetPos(body, jd);
  return Math.atan(BODY_KM[body] / 2 / (p.dist * 1.495978707e8)) * DEG;
}
// Illuminated fraction of a planet (0..1) from Sun–planet–Earth geometry
function planetPhase(body, jd) {
  const T = centuries(jd), p = helio(body, T), e = helio("earth", T);
  const r = Math.hypot(...p), R = Math.hypot(...e), d = Math.hypot(p[0] - e[0], p[1] - e[1], p[2] - e[2]);
  const cosi = (r * r + d * d - R * R) / (2 * r * d);
  return (1 + cosi) / 2;
}

// ── CALENDAR EVENTS ─────────────────────────────────────────────────────────
// Moon phases: times when (Moon − Sun) ecliptic longitude crosses 0/90/180/270°
function moonPhaseEvents(from, days) {
  const out = [], step = 3600000;
  let prevT = from.getTime(), prev = norm360(moonPos(jdOf(from)).lon - sunPos(jdOf(from)).lon);
  for (let t = prevT + step; t <= from.getTime() + days * 86400000; t += step) {
    const jd = jdOf(new Date(t));
    const e = norm360(moonPos(jd).lon - sunPos(jd).lon);
    for (const [k, ang] of [["new", 0], ["first", 90], ["full", 180], ["last", 270]]) {
      const a = norm360(prev - ang), b = norm360(e - ang);
      if (a > 300 && b < 60) {
        const fr = (360 - a) / ((360 - a) + b);
        out.push({ kind: k, t: new Date(prevT + fr * step) });
      }
    }
    prev = e; prevT = t;
  }
  return out;
}
// Planet events in the next `days`: oppositions (outer planets), greatest elongations (Venus)
function planetEvents(from, days) {
  const out = [];
  for (const p of ["venus", "mars", "jupiter", "saturn"]) {
    const el = [];
    for (let d = -1; d <= days + 1; d++) {
      const t = new Date(from.getTime() + d * 86400000), jd = jdOf(t);
      const s = sunPos(jd), q = planetPos(p, jd);
      el.push({ t, e: angSep(s.ra, s.dec, q.ra, q.dec), east: norm360(q.ra - s.ra) < 180 });
    }
    for (let i = 1; i < el.length - 1; i++) {
      if (el[i].e >= el[i - 1].e && el[i].e > el[i + 1].e && el[i].t >= from) {
        if (p === "venus" && el[i].e > 40) out.push({ kind: el[i].east ? "evening" : "morning", body: p, t: el[i].t, e: Math.round(el[i].e) });
        else if (p !== "venus" && el[i].e > 165) out.push({ kind: "opposition", body: p, t: el[i].t, e: Math.round(el[i].e) });
      }
    }
  }
  return out.sort((a, b) => a.t - b.t);
}
// When the Milky Way core is above `minAlt` during astronomical darkness on a given night
function coreWindow(site, dateStr, minAlt = 15) {
  const night = nightInfo(site, dateStr);
  if (!night.astroDusk || !night.astroDawn) return null;
  let a = null, b = null, best = -90;
  for (let t = night.astroDusk.getTime(); t <= night.astroDawn.getTime(); t += 10 * 60000) {
    const h = altAz(266.4, -29.0, site.lat, site.lon, jdOf(new Date(t)));
    if (h.alt > best) best = h.alt;
    if (h.alt >= minAlt) { if (!a) a = new Date(t); b = new Date(t); }
  }
  return { start: a, end: b, best, hours: a ? (b - a) / 3600000 : 0 };
}
