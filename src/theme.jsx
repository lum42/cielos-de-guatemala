// ── THEMES: backdrop, switches ───────────────────────────────────────────────
// Night/Red: the real sky above the chosen site, drifting slowly (40× sidereal),
// still for anyone who prefers reduced motion. 8-bit: twinkling pixel stars.
function SkyBackdrop({ lat, lon }) {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return () => {};
    const ctx = cv.getContext("2d");
    const st = getStars();
    const idx = []; for (let i = 0; i < st.n; i++) if (st.mag[i] < 5.3) idx.push(i);
    const reduce = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const f = (lat || 15) * RAD, sf = Math.sin(f), cf = Math.cos(f);
    const t0 = performance.now(), jd0 = jdOf(new Date());
    let raf = 0, last = -1e9;
    const draw = (now) => {
      raf = requestAnimationFrame(draw);
      if (now - last < (reduce ? 60000 : 70)) return;
      last = now;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = cv.clientWidth, H = cv.clientHeight;
      if (!W || !H) return;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const jd = jd0 + (reduce ? 0 : ((now - t0) / 1000) * 40 / 86400);
      const lst = (gmstDeg(jd) + (lon || -90.5)) * RAD;
      const R = Math.hypot(W, H) * 0.55, cx = W / 2, cy = H * 0.42;
      const tw = now / 1000;
      for (const i of idx) {
        const ra = st.ra[i] * RAD, dec = st.dec[i] * RAD, Hh = lst - ra;
        const sd = Math.sin(dec), cd = Math.cos(dec), ch = Math.cos(Hh);
        const sinAlt = sf * sd + cf * cd * ch;
        if (sinAlt < 0.03) continue;
        const alt = Math.asin(sinAlt);
        const az = Math.atan2(-cd * Math.sin(Hh), sd * cf - cd * ch * sf);
        const r = R * Math.tan((Math.PI / 2 - alt) / 2);
        const x = cx - r * Math.sin(az), y = cy - r * Math.cos(az);
        if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;
        const m = st.mag[i];
        const a = Math.max(0.12, Math.min(0.85, (5.6 - m) / 5)) * (reduce ? 1 : 0.86 + 0.14 * Math.sin(tw * 1.3 + i));
        const s = m < 1 ? 1.9 : m < 2.5 ? 1.4 : 1;
        ctx.globalAlpha = a;
        ctx.fillStyle = STAR_COL(st.bv[i]);
        ctx.beginPath(); ctx.arc(x, y, s, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);
    const vis = () => { cancelAnimationFrame(raf); if (!document.hidden) { last = -1e9; raf = requestAnimationFrame(draw); } };
    document.addEventListener("visibilitychange", vis);
    return () => { cancelAnimationFrame(raf); document.removeEventListener("visibilitychange", vis); };
  }, [lat, lon]);
  return <canvas ref={ref} className="sky-backdrop" aria-hidden="true" />;
}

const THEME_LABEL = { en: { night: "Night", red: "Red", pixel: "8-bit" }, es: { night: "Noche", red: "Rojo", pixel: "8-bit" } };
const MODE_LABEL = { en: { stargazer: "Stargazer", photo: "Photographer" }, es: { stargazer: "Observador", photo: "Fotógrafo" } };
function Seg({ value, options, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, text]) => <button key={v} className={value === v ? "on" : ""} aria-pressed={value === v} onClick={() => onChange(v)}>{text}</button>)}
    </div>
  );
}
function TopControls({ lang, setLang }) {
  const [theme, setTheme] = useTheme();
  const [mode, setMode] = useMode();
  useEffect(() => { document.documentElement.setAttribute("data-sky", theme); }, [theme]);
  return (
    <div className="top-controls">
      <Seg label="Mode" value={mode} onChange={setMode} options={[["stargazer", MODE_LABEL[lang].stargazer], ["photo", MODE_LABEL[lang].photo]]} />
      <Seg label="Theme" value={theme} onChange={setTheme} options={THEMES.map((t) => [t, THEME_LABEL[lang][t]])} />
      <Seg label="Language" value={lang} onChange={setLang} options={[["es", "ES"], ["en", "EN"]]} />
    </div>
  );
}
