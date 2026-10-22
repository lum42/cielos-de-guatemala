// ── DARK SKIES: light-pollution simulator + why it matters ──────────────────
const SIM_BG = [null, [5, 7, 16], [6, 8, 18], [9, 11, 22], [16, 17, 30], [27, 26, 38], [40, 36, 44], [55, 46, 48], [72, 58, 52], [92, 72, 60]];
const SIM_MW = [0, 1, 1, 0.8, 0.5, 0.26, 0.1, 0, 0, 0];
const SIM_PLACES = { 2: "Cuchumatanes", 4: "Antigua", 5: "Antigua", 8: "Guatemala City", 9: "Guatemala City" };
const SIM_PLACES_ES = { 2: "Cuchumatanes", 4: "Antigua", 5: "Antigua", 8: "Ciudad de Guatemala", 9: "Ciudad de Guatemala" };

function SimSky({ bortle, scene, lang }) {
  const [theme] = useTheme();
  // Scene "core": a July evening looking south at the Milky Way; "tonight": now, looking south
  const jd = useMemo(() => (scene === "core" ? jdOf(new Date(Date.UTC(2026, 6, 16, 3, 0))) : jdOf(new Date())), [scene]);
  const lat = 15, lon = -91;
  const view = useMemo(() => raDecFromAltAz(34, 180, lat, lon, jd), [jd]);
  const b = BORTLE[bortle - 1];
  return (
    <FrameCanvas ra0={view.ra} dec0={view.dec} f={7.4} sw={17.3} sh={13.0} rot={levelRot(view, lat, lon, jd)} level lat={lat} lon={lon} jd={jd}
      bortle={bortle} bare showLines={false} showPhotos={false} photos={null} size={null} bodyCentered={null} neighbours={[]}
      compass={FRAME_COMPASS[lang]} bodyNames={BODY_NAMES[lang]} font={canvasFont(theme)} fontBig={canvasFont(theme, true)}
      sim={{ nelm: b.nelm, mw: SIM_MW[bortle], bg: SIM_BG[bortle], glow: (bortle - 1) / 8 }} aria={`Sky at Bortle ${bortle}`} />
  );
}
// rotation that puts the zenith straight up for a view centre
function levelRot(c, lat, lon, jd) {
  const h = altAz(c.ra, c.dec, lat, lon, jd);
  const up = raDecFromAltAz(Math.min(89.5, h.alt + 0.5), h.az, lat, lon, jd);
  const a0 = c.ra * RAD, d0 = c.dec * RAD, a = up.ra * RAD, d = up.dec * RAD;
  const Xs = -(Math.cos(d) * Math.sin(a - a0)), Ys = -(Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(a - a0));
  return -90 - Math.atan2(Ys, Xs) * DEG;
}

function DarkSkyTab({ lang, site }) {
  const D = DARK[lang];
  const [bortle, setBortle] = useState(() => Math.max(1, Math.min(9, Math.round(site.bortle || 4))));
  const [scene, setScene] = useState("core");
  const b = BORTLE[bortle - 1];
  const place = (lang === "es" ? SIM_PLACES_ES : SIM_PLACES)[bortle];
  return (
    <>
      <section className="sky-card dark-hero">
        <h3>{D.title}</h3>
        <p className="obj-p">{D.intro}</p>
      </section>

      <section className="sky-card">
        <h3>{D.simTitle}</h3>
        <p className="dim">{D.simHelp}</p>
        <div className="sim-wrap"><SimSky bortle={bortle} scene={scene} lang={lang} /></div>
        <label className="fx-ctl"><span className="control-label">Bortle {bortle} · {tr(b, "name", lang)}{place ? ` · ${place}` : ""}</span>
          <input type="range" min={1} max={9} step={1} value={bortle} onChange={(e) => setBortle(Number(e.target.value))} aria-label="Bortle" /></label>
        <p className="sim-read"><b>{D.stars(starsVisible(b.nelm))}</b> · {D.nelm(b.nelm)} · {tr(b, "see", lang)}</p>
        <Seg label="Scene" value={scene} onChange={setScene} options={[["core", lang === "es" ? "Vía Láctea (julio, 9 pm, al sur)" : "Milky Way (July, 9 pm, south)"], ["tonight", lang === "es" ? "Esta noche, al sur" : "Tonight, looking south"]]} />
      </section>

      <div className="section-title">{D.whyTitle}</div>
      <div className="dark-grid">{D.why.map(([t, d]) => <div key={t} className="dark-card"><b>{t}</b><p>{d}</p></div>)}</div>

      <div className="section-title">{D.principlesTitle}</div>
      <div className="dark-grid five">{D.principles.map(([t, d], i) => <div key={t} className="dark-card"><span className="dark-num">{i + 1}</span><b>{t}</b><p>{d}</p></div>)}</div>
      <p className="dim small">{D.principlesSrc}</p>

      <div className="section-title">{D.doTitle}</div>
      <ul className="plain-list do-list">{D.doList.map((x) => <li key={x}>✦ {x}</li>)}</ul>

      <div className="section-title">{D.gaanTitle}</div>
      <p className="obj-p">{D.gaan}</p>
      <Links items={[["https://globeatnight.org/", D.gaanLink], ["https://www.lightpollutionmap.info/#zoom=7.00&lat=15.5&lon=-90.4", D.mapLink]]} />

      <div className="section-title">{D.scaleTitle}</div>
      <div className="hour-table-wrap">
        <table className="fx-table bortle-table"><tbody>{BORTLE.map((r) => (
          <tr key={r.b} className={r.b === bortle ? "fx-role" : ""} onClick={() => setBortle(r.b)}>
            <td><b>{r.b}</b></td><td>{tr(r, "name", lang)}</td><td>≈ {r.nelm}</td><td className="fx-why">{tr(r, "see", lang)}</td>
          </tr>
        ))}</tbody></table>
      </div>
    </>
  );
}
