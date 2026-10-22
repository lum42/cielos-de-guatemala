// ── GEAR: camera system, body, trackers, lenses ─────────────────────────────
const GEAR_TEXT = {
  en: {
    title: "Your kit", help: "Pick your camera and trackers: every frame preview and exposure table in the app follows this choice.",
    system: "System", body: "Camera", trackers: "Trackers (up to two)", lenses: "Popular astro lenses", wide: "Wide field — Milky Way, meteors, nightscapes", deep: "Deep sky — tracked galaxies, nebulae, clusters, Moon and planets",
    sensor: (b) => `${b.w} × ${b.h} mm · ${Math.round((b.pxW * b.pxH) / 1e5) / 10} MP · ${b.pitch} µm pixels · ${b.crop}× crop`,
    eq: (a, b) => (a === b ? `${a} mm FF` : `${a}–${b} mm FF`), tripod: (s, n) => `Tripod limit ≈ ${s} at f/${n}`, myGear: "Everything else in your bag",
    examples: "e.g.", note: "Specs from the manufacturers; lens notes summarise what astrophotographers report. Stop down a little if your corners show coma.",
  },
  es: {
    title: "Tu equipo", help: "Elige tu cámara y rastreadores: cada vista de encuadre y tabla de exposición de la app sigue esta elección.",
    system: "Sistema", body: "Cámara", trackers: "Rastreadores (hasta dos)", lenses: "Lentes populares para astro", wide: "Campo amplio — Vía Láctea, meteoros, paisajes nocturnos", deep: "Cielo profundo — galaxias, nebulosas, cúmulos, Luna y planetas con montura",
    sensor: (b) => `${b.w} × ${b.h} mm · ${Math.round((b.pxW * b.pxH) / 1e5) / 10} MP · píxeles de ${b.pitch} µm · recorte ${b.crop}×`,
    eq: (a, b) => (a === b ? `${a} mm FF` : `${a}–${b} mm FF`), tripod: (s, n) => `Límite en trípode ≈ ${s} a f/${n}`, myGear: "Todo lo demás de tu mochila",
    examples: "p. ej.", note: "Datos de los fabricantes; las notas de lentes resumen lo que reportan los astrofotógrafos. Cierra un poco si las esquinas muestran coma.",
  },
};
function GearTab({ lang }) {
  const G = GEAR_TEXT[lang];
  const [kit, setKit] = useKit();
  const K = kitInfo(kit);
  const trackerChoices = PLATFORM === "web" ? TRACKER_PUBLIC : ["sa2i", "gti", ...TRACKER_PUBLIC];
  const setSys = (sys) => setKit({ ...kit, sys, body: SYSTEMS[sys].bodies[0].id });
  const toggleTracker = (id) => {
    const has = kit.trackers.includes(id);
    let next = has ? kit.trackers.filter((x) => x !== id) : [...kit.trackers, id].slice(-2);
    if (!next.length) next = [id];
    setKit({ ...kit, trackers: next });
  };
  const row = (l) => {
    const [a, b] = lensEq(l, K.crop).map((x) => Math.round(x));
    const u = npf(l.f[0], l.N[0], 0, K.pitch);
    return (
      <div key={l.id} className="lens-row">
        <div className="lens-row-top"><b>{gearName(l.name, lang)}</b><span className="dim small">{G.eq(a, b)} · f/{Math.min(...l.N)}</span></div>
        <p className="dim small">{tr(l, "note", lang)}</p>
        <span className="lens-npf">{G.tripod(fmtSec(niceSec(u.pin, -1)), l.N[0])}</span>
      </div>
    );
  };
  return (
    <>
      <section className="sky-card kit-card">
        <h3>{G.title}</h3>
        <p className="dim">{G.help}</p>
        <span className="control-label">{G.system}</span>
        <Seg label={G.system} value={kit.sys} onChange={setSys} options={SYSTEM_ORDER.map((s) => [s, SYSTEMS[s].short])} />
        <span className="control-label" style={{ marginTop: 14 }}>{G.body}</span>
        <div className="body-grid">{K.sys.bodies.map((b) => (
          <button key={b.id} className={`sys-card ${b.id === K.body.id ? "on" : ""}`} onClick={() => setKit({ ...kit, body: b.id })} aria-pressed={b.id === K.body.id}>
            <b>{gearName(b.name, lang)}</b><span className="dim small">{G.sensor(b)}</span><span className="small">{tr(b, "note", lang)}</span>
          </button>
        ))}</div>
        <span className="control-label" style={{ marginTop: 14 }}>{G.trackers}</span>
        <div className="body-grid">{trackerChoices.map((id) => {
          const tk = TRACKERS[id], on = kit.trackers.includes(id);
          return (
            <button key={id} className={`sys-card ${on ? "on" : ""}`} onClick={() => toggleTracker(id)} aria-pressed={on}>
              <b>{tr(tk, "name", lang)}</b>{tk.ex && <span className="dim small">{G.examples} {tk.ex}</span>}
            </button>
          );
        })}</div>
      </section>

      <div className="section-title">{G.lenses} · {K.sys.name}</div>
      <p className="dim small">{G.note}</p>
      <h4 className="lens-group">{G.wide}</h4>
      <div className="lens-grid">{K.sys.lenses.filter((l) => l.role === "wide").map(row)}</div>
      <h4 className="lens-group">{G.deep}</h4>
      <div className="lens-grid">{K.sys.lenses.filter((l) => l.role === "deep").map(row)}</div>

      {PLATFORM === "claude" && (
        <>
          <div className="section-title">{G.myGear}</div>
          <div className="gear-grid">{GEAR.map((g) => (
            <div key={g.cat} className="gear-item"><div className="gear-cat">{lang === "es" ? GEAR_CAT_ES[g.cat] || g.cat : g.cat}</div>
              {g.items.map((it) => <div key={it} className={`gear-name ${it.includes("future") ? "future" : ""}`}>{it}</div>)}</div>
          ))}</div>
        </>
      )}
    </>
  );
}
