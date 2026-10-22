// ── CALENDAR: moon phases, meteor showers, planets, Milky Way season ────────
const CAL_TEXT = {
  en: {
    title: "Sky calendar", moonTitle: "Moon phases — next 3 months", showerTitle: "Meteor showers — next 12 months", planetTitle: "Planets — next 12 months",
    coreTitle: "Milky Way core season", coreHelp: (s) => `Hours the galactic core is more than 15° up in full darkness, mid-month, from ${s}.`,
    seasonTitle: "In season now", phases: { new: "New moon", first: "First quarter", full: "Full moon", last: "Last quarter" },
    peak: "Peak", rate: (z) => `up to ~${z}/h under ideal dark skies`, moonAt: (i) => `Moon ${i}%`,
    good: "Good — dark skies", fair: "Fair — some moonlight", poor: "Poor — bright Moon",
    goodAfter: (t) => `Good after ${t}, once the Moon sets`, goodUntil: (t) => `Good until ${t}, when the Moon rises`,
    opposition: (p) => `${p} at opposition — biggest and brightest, up all night`, evening: (p) => `${p} at greatest evening elongation — highest after sunset`, morning: (p) => `${p} at greatest morning elongation — highest before sunrise`,
    none: "No events in range.", hrs: (h) => (h ? `${h.toFixed(1)} h` : "—"), darkNote: "Dark-site trips: aim for the week around each new moon.",
    shift: "Peak dates shift by about a day from year to year.",
  },
  es: {
    title: "Calendario del cielo", moonTitle: "Fases de la Luna — próximos 3 meses", showerTitle: "Lluvias de meteoros — próximos 12 meses", planetTitle: "Planetas — próximos 12 meses",
    coreTitle: "Temporada del centro de la Vía Láctea", coreHelp: (s) => `Horas en que el centro galáctico está a más de 15° en oscuridad total, a mitad de mes, desde ${s}.`,
    seasonTitle: "En temporada ahora", phases: { new: "Luna nueva", first: "Cuarto creciente", full: "Luna llena", last: "Cuarto menguante" },
    peak: "Pico", rate: (z) => `hasta ~${z}/h con cielo oscuro ideal`, moonAt: (i) => `Luna ${i}%`,
    good: "Bueno — cielo oscuro", fair: "Regular — algo de luz lunar", poor: "Malo — Luna brillante",
    goodAfter: (t) => `Bueno después de las ${t}, cuando se pone la Luna`, goodUntil: (t) => `Bueno hasta las ${t}, cuando sale la Luna`,
    opposition: (p) => `${p} en oposición — más grande y brillante, visible toda la noche`, evening: (p) => `${p} en máxima elongación vespertina — más alto tras el ocaso`, morning: (p) => `${p} en máxima elongación matutina — más alto antes del amanecer`,
    none: "No hay eventos en el rango.", hrs: (h) => (h ? `${h.toFixed(1)} h` : "—"), darkNote: "Salidas a sitios oscuros: apunta a la semana alrededor de cada luna nueva.",
    shift: "Las fechas del pico cambian alrededor de un día de un año a otro.",
  },
};
const MONTH_LONG = { en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"] };
const PLANET_NAME = { en: { venus: "Venus", mars: "Mars", jupiter: "Jupiter", saturn: "Saturn" }, es: { venus: "Venus", mars: "Marte", jupiter: "Júpiter", saturn: "Saturno" } };
const fmtDateGT = (d, lang) => { const g = gt(d); return `${g.getUTCDate()} ${MONTH_LONG[lang][g.getUTCMonth()]} ${g.getUTCFullYear()}`; };
const dateStrOf = (d) => { const g = gt(d); return `${g.getUTCFullYear()}-${String(g.getUTCMonth() + 1).padStart(2, "0")}-${String(g.getUTCDate()).padStart(2, "0")}`; };
const PHASE_ICON = { new: "●", first: "◐", full: "○", last: "◑" };

// Moonlight during the hours most showers are best (local midnight → end of astronomical darkness)
function showerMoon(site, night) {
  const il = night.moon.illum;
  const t0 = new Date(night.start.getTime() + 12 * 3600000), t1 = night.astroDawn || night.nautDawn || night.sunrise;
  let best = null, cur = null;
  if (t1) for (let t = t0.getTime(); t <= t1.getTime(); t += 15 * 60000) {
    const down = bodyAltAz({ body: "moon" }, site, jdOf(new Date(t))).alt < -0.5;
    if (down) { cur = cur ? { a: cur.a, b: t } : { a: t, b: t }; if (!best || cur.b - cur.a > best.b - best.a) best = cur; } else cur = null;
  }
  const darkH = best ? (best.b - best.a) / 3600000 : 0;
  if (il <= 35) return { v: "good", illum: il };
  if (darkH >= 1.5) {
    // quote the actual moonset / moonrise when it falls at the edge of the dark stretch
    const near = (x, t) => x && Math.abs(x.getTime() - t) <= 30 * 60000;
    if (best.a > t0.getTime() + 15 * 60000) return { v: "good", illum: il, after: near(night.moonset, best.a) ? night.moonset : new Date(best.a) };
    if (t1 && best.b < t1.getTime() - 15 * 60000) return { v: "good", illum: il, until: near(night.moonrise, best.b) ? night.moonrise : new Date(best.b) };
    return { v: "good", illum: il };
  }
  return { v: darkH >= 1 || il <= 65 ? "fair" : "poor", illum: il };
}
const showerMoonText = (m, C) => (m.after ? C.goodAfter(hhmm(m.after)) : m.until ? C.goodUntil(hhmm(m.until)) : C[m.v]);

function showerDates(from) {
  const y = gt(from).getUTCFullYear();
  const out = [];
  for (const sh of METEOR_SHOWERS) {
    for (const yy of [y, y + 1]) {
      // peak night: local evening before the peak morning
      const d = new Date(Date.UTC(yy, sh.peak[0] - 1, sh.peak[1], 12 - GT_OFFSET_H));
      if (d >= new Date(from.getTime() - 2 * 86400000) && d <= new Date(from.getTime() + 366 * 86400000)) { out.push({ sh, d }); break; }
    }
  }
  return out.sort((a, b) => a.d - b.d);
}

function CalendarTab({ lang, site, mode, goSky }) {
  const C = CAL_TEXT[lang];
  const now = useMemo(() => new Date(), []);
  const phases = useMemo(() => moonPhaseEvents(now, 92), [now]);
  const planets = useMemo(() => planetEvents(now, 365), [now]);
  const showers = useMemo(() => showerDates(now).map(({ sh, d }) => {
    const ds = dateStrOf(d);
    return { sh, d, ds, m: showerMoon(site, nightInfo(site, ds)) };
  }), [now, site.lat, site.lon]);
  const core = useMemo(() => {
    const y = gt(now).getUTCFullYear(), m0 = gt(now).getUTCMonth();
    return Array.from({ length: 12 }, (_, i) => {
      const m = (m0 + i) % 12, yy = y + Math.floor((m0 + i) / 12);
      const w = coreWindow(site, `${yy}-${String(m + 1).padStart(2, "0")}-15`);
      return { m, yy, w };
    });
  }, [now, site.lat, site.lon]);
  const monthKey = MONTHS[gt(now).getUTCMonth()];
  const season = mode === "photo"
    ? TARGETS.filter((t) => t.window.includes(monthKey) && t.type !== "Solar" && t.type !== "Planet" && t.type !== "Lunar").sort((a, b) => b.priority - a.priority).slice(0, 10).map((t) => ({ id: t.id, name: tr(t, "name", lang), note: tr(t, "windowLabel", lang) }))
    : HIGHLIGHTS.filter((h) => h.months.includes(monthKey)).map((h) => ({ id: h.id, name: tr(h, "name", lang), note: tr(h, "text", lang) }));
  const maxCore = Math.max(1, ...core.map((c) => (c.w ? c.w.hours : 0)));
  return (
    <>
      <div className="section-title">{C.seasonTitle} · {MONTH_LONG[lang][gt(now).getUTCMonth()]}</div>
      <div className="hl-grid">{season.map((s) => (
        <button key={s.id} className="hl-row" onClick={() => goSky(s.id)}>
          <span className="hl-name">{s.name}</span><span className="dim small">{s.note}</span>
        </button>
      ))}</div>

      <div className="section-title">{C.moonTitle}</div>
      <div className="phase-grid">{phases.map((p, i) => (
        <div key={i} className={`phase-cell ph-${p.kind}`}><span className="phase-icon" aria-hidden="true">{PHASE_ICON[p.kind]}</span>
          <span><b>{C.phases[p.kind]}</b><span className="dim small">{fmtDateGT(p.t, lang)} · {hhmm(p.t)}</span></span></div>
      ))}</div>
      <p className="dim small">{C.darkNote}</p>

      <div className="section-title">{C.showerTitle}</div>
      <div className="event-list">{showers.map(({ sh, d, m }) => (
        <div key={sh.id} className="event-row">
          <div className="event-date"><b>{fmtDateGT(d, lang)}</b><span className="dim small">{C.peak}</span></div>
          <div className="event-main"><span className="event-name">{tr(sh, "name", lang)}</span>
            <span className="dim small">{C.rate(sh.zhr)} · {tr(sh, "note", lang)}</span>
            <span className={`v-text v-${m.v === "good" ? "go" : m.v === "fair" ? "maybe" : "nogo"}`}>{C.moonAt(m.illum)} · {showerMoonText(m, C)}</span></div>
        </div>
      ))}</div>
      <p className="dim small">{C.shift}</p>

      <div className="section-title">{C.planetTitle}</div>
      <div className="event-list">{planets.length ? planets.map((e, i) => (
        <div key={i} className="event-row">
          <div className="event-date"><b>{fmtDateGT(e.t, lang)}</b></div>
          <div className="event-main"><span className="event-name">{C[e.kind](PLANET_NAME[lang][e.body])}</span></div>
        </div>
      )) : <p className="dim">{C.none}</p>}</div>

      <div className="section-title">{C.coreTitle}</div>
      <p className="dim small">{C.coreHelp(siteName(site, lang))}</p>
      <div className="core-strip">{core.map(({ m, yy, w }) => (
        <div key={`${yy}-${m}`} className="core-cell" title={w && w.start ? `${hhmm(w.start)}–${hhmm(w.end)}` : ""}>
          <div className="core-bar"><span style={{ height: `${Math.round(((w ? w.hours : 0) / maxCore) * 100)}%` }} /></div>
          <b>{MONTH_LONG[lang][m]}</b><span className="dim small">{C.hrs(w && w.hours)}</span>
          {w && w.start && <span className="dim small core-time">{hhmm(w.start)}–{hhmm(w.end)}</span>}
        </div>
      ))}</div>
    </>
  );
}
