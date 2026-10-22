// ── STARGAZER: what's up tonight, in plain language ─────────────────────────
const SG_TEXT = {
  en: {
    title: "What's up tonight", late: "Later tonight (after midnight)", none: "Nothing bright enough above the horizon this evening — check later tonight.",
    eye: "Eye", bino: "Binoculars", darkNeeded: "needs a darker sky", moonWash: "washed out by the Moon",
    best: (t, dir, f) => `Best ~${t} · ${dir} · ${f} fist${f === 1 ? "" : "s"} up`, event: "Tonight's event", showerNow: (n, z) => `${n} meteor shower peak — up to ~${z}/h under dark skies, best before dawn.`,
    howTo: "How to read this: face the compass direction, then count fists held at arm's length up from the horizon.",
  },
  es: {
    title: "Qué hay esta noche", late: "Más tarde (después de medianoche)", none: "Nada suficientemente brillante sobre el horizonte esta noche — revisa más tarde.",
    eye: "A simple vista", bino: "Binoculares", darkNeeded: "requiere un cielo más oscuro", moonWash: "lo opaca la Luna",
    best: (t, dir, f) => `Mejor ~${t} · ${dir} · ${f} puño${f === 1 ? "" : "s"} arriba`, event: "Evento de esta noche", showerNow: (n, z) => `Pico de las ${n} — hasta ~${z}/h con cielo oscuro, mejor antes del amanecer.`,
    howTo: "Cómo leerlo: mira hacia el punto cardinal y cuenta puños con el brazo estirado desde el horizonte.",
  },
};

function daysToPeak(sh, dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const t = Date.UTC(y, m - 1, d);
  let best = 999;
  for (const yy of [y - 1, y, y + 1]) best = Math.min(best, Math.abs(Date.UTC(yy, sh.peak[0] - 1, sh.peak[1]) - t) / 86400000);
  return best;
}
// Meteor-shower targets only rank near their peak
function showerOk(t, dateStr) {
  if (t.type !== "Meteor Shower") return true;
  const sh = METEOR_SHOWERS.find((s) => s.target === t.id);
  return !sh || daysToPeak(sh, dateStr) <= 3;
}

function highlightsTonight(site, night, dateStr) {
  const t0 = night.nautDusk || night.sunset, midnight = new Date(night.start.getTime() + 12.5 * 3600000);
  const t1 = night.astroDawn || night.nautDawn || night.sunrise;
  if (!t0 || !t1) return { evening: [], late: [], events: [] };
  const moonBright = night.moon.illum >= 55;
  const items = [
    ...HIGHLIGHTS.map((h) => ({ id: h.id, name: h.name, name_es: h.name_es, obj: { ra: h.ra, dec: h.dec }, how: h.how, dark: h.dark, text: h.text, text_es: h.text_es, kind: h.kind, months: h.months })),
    ...["venus", "mars", "jupiter", "saturn", "moon"].map((b) => ({ id: b, name: PLANET_INFO[b].name, name_es: PLANET_INFO[b].name_es, obj: { body: b }, how: b === "moon" ? ["eye", "bino"] : ["eye", "bino"], dark: null, text: PLANET_INFO[b].text, text_es: PLANET_INFO[b].text_es, kind: b === "moon" ? "moon" : "planet", planet: true })),
  ];
  const month = monthKeyGT(dateStr);
  const scan = (from, to) => items.map((it) => {
    let best = { alt: -90, t: null, az: 0 };
    for (let t = from.getTime(); t <= to.getTime(); t += 15 * 60000) {
      const h = bodyAltAz(it.obj, site, jdOf(new Date(t)));
      if (h.alt > best.alt) best = { alt: h.alt, t: new Date(t), az: h.az };
    }
    const maxPossible = it.obj.body ? 90 : 90 - Math.abs(site.lat - it.obj.dec);
    const thr = it.planet ? 5 : Math.max(2, Math.min(12, maxPossible - 3));
    const needsDark = it.dark != null && (site.bortle || 4) > it.dark;
    const washed = !it.planet && it.dark != null && moonBright && (it.kind === "galaxy" || it.kind === "nebula" || it.kind === "milkyway");
    const score = (it.planet ? 3.2 : 2) + (it.months && it.months.includes(month) ? 1 : 0) + best.alt / 45 - (needsDark ? 1.2 : 0) - (washed ? 1 : 0) + (it.how.includes("eye") ? 0.3 : 0);
    return { ...it, best, ok: best.alt >= thr, needsDark, washed, score };
  }).filter((x) => x.ok);
  const evening = scan(t0, new Date(Math.min(midnight.getTime(), t1.getTime()))).sort((a, b) => b.score - a.score);
  const seen = new Set(evening.map((x) => x.id));
  const late = midnight < t1 ? scan(midnight, t1).filter((x) => !seen.has(x.id)).sort((a, b) => b.score - a.score) : [];
  const events = METEOR_SHOWERS.filter((sh) => daysToPeak(sh, dateStr) <= 1).map((sh) => ({ ...sh, moon: showerMoon(site, night) }));
  return { evening, late, events };
}

function HlRow({ x, lang, onOpen }) {
  const S = SG_TEXT[lang];
  return (
    <button className="hl-row" onClick={() => onOpen(x.id)}>
      <span className="hl-top">
        <span className="hl-name">{tr(x, "name", lang)}</span>
        <span className="hl-how">{x.how.map((h) => <span key={h} className={`tag hl-${h}`}>{S[h]}</span>)}</span>
      </span>
      <span className="hl-pos">{S.best(hhmm(x.best.t), compass(x.best.az, lang), fists(x.best.alt))}{x.needsDark ? ` · ${S.darkNeeded}` : x.washed ? ` · ${S.moonWash}` : ""}</span>
      <span className="dim small">{tr(x, "text", lang)}</span>
    </button>
  );
}

function StargazerTonight({ lang, hl, goSky }) {
  const S = SG_TEXT[lang];
  return (
    <>
      {hl.events.length > 0 && (
        <section className="sky-card event-card">
          <h3>{S.event}</h3>
          {hl.events.map((sh) => (
            <div key={sh.id}>
              <p className="obj-p">☄ {S.showerNow(tr(sh, "name", lang), sh.zhr)}</p>
              <span className={`v-text v-${sh.moon.v === "good" ? "go" : sh.moon.v === "fair" ? "maybe" : "nogo"}`}>{CAL_TEXT[lang].moonAt(sh.moon.illum)} · {showerMoonText(sh.moon, CAL_TEXT[lang])}</span>
            </div>
          ))}
        </section>
      )}
      <section className="sky-card">
        <h3>{S.title}</h3>
        <p className="dim small">{S.howTo}</p>
        {hl.evening.length ? <div className="hl-grid">{hl.evening.slice(0, 12).map((x) => <HlRow key={x.id} x={x} lang={lang} onOpen={goSky} />)}</div> : <p className="dim">{S.none}</p>}
        {hl.late.length > 0 && (
          <>
            <div className="obj-h" style={{ marginTop: 14 }}>{S.late}</div>
            <div className="hl-grid">{hl.late.slice(0, 6).map((x) => <HlRow key={x.id} x={x} lang={lang} onOpen={goSky} />)}</div>
          </>
        )}
      </section>
    </>
  );
}

// Sky-tab card for a highlight (stargazer mode)
function HighlightCard({ id, lang, site, night, jd, u }) {
  const h = HL_BY_ID[id];
  const pl = !h && PLANET_INFO[id] ? { id, ...PLANET_INFO[id], obj: { body: id } } : null;
  const x = h ? { ...h, obj: { ra: h.ra, dec: h.dec } } : pl;
  if (!x) return null;
  const S = SG_TEXT[lang];
  const pos = bodyAltAz(x.obj, site, jd);
  const rts = riseTransitSet(x.obj, site, night);
  const stel = `https://stellarium-web.org/skysource/${encodeURIComponent(x.obj.body ? (x.obj.body.charAt(0).toUpperCase() + x.obj.body.slice(1)) : x.name.replace(/\s*\(.*\)/, ""))}`;
  return (
    <div className="finder-card">
      <div className="target-name">{tr(x, "name", lang)} {x.how && <span className="hl-how">{x.how.map((k) => <span key={k} className={`tag hl-${k}`}>{S[k]}</span>)}</span>}</div>
      <div className={`pos-line ${pos.alt > 0 ? "" : "below"}`}>{pos.alt > 0 ? u.pos(Math.round(pos.az), compass(pos.az, lang), Math.round(pos.alt), fists(pos.alt)) : u.belowHorizon}</div>
      {rts && <div className="rts"><span>{u.rises} <b>{hhmm(rts.rise)}</b></span><span>{u.transits} <b>{hhmm(rts.transit)} · {Math.round(rts.transitAlt)}°</b></span><span>{u.sets} <b>{hhmm(rts.set)}</b></span></div>}
      <p className="obj-p"><span className="obj-h">{u.about}</span>{tr(x, "text", lang)}</p>
      {x.find && <p className="obj-p"><span className="obj-h">{u.findIt}</span>{tr(x, "find", lang)}</p>}
      {x.dark != null && <p className="obj-note">{lang === "es" ? `Fácil con cielo Bortle ${x.dark} o más oscuro.` : `Easy under Bortle ${x.dark} skies or darker.`}</p>}
      <p className="obj-note">{u.fistNote}</p>
      <Links items={[[stel, u.stelLink]]} />
    </div>
  );
}
