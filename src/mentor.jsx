// ── MENTOR: learning path, monthly missions, ask-your-mentor ────────────────
const MENTOR_TEXT = {
  en: {
    title: "Your astronomy mentor", intro: "Learn the sky from first principles, one step at a time. Each lesson ends with something to try under the real sky; tick it off when you have.",
    progress: (a, b) => `${a} of ${b} lessons done`, done: "Done", markDone: "Mark done", open: "Open",
    missionsTitle: (m) => `This month's missions · ${m}`, missionsHelp: "Seasonal challenges for the sky above Guatemala right now.",
    askTitle: "Ask your mentor", askHelp: "Ask anything — from 'what is that bright star?' to processing questions. Answers use tonight's sky at your selected site.",
    askPh: "Type a question…", ask: "Ask", asking: "Thinking…", stop: "Stop",
    askErr: { not_granted: "Claude isn't allowed for this page yet.", rate_limited: "Too many questions for now. Try again in a little while.", default: "Couldn't get an answer. Try again." },
    suggestions: ["What can I see tonight with just my eyes?", "How do I polar align when Polaris is so low?", "Plan my first Milky Way photo", "Why are my stars trailing?"],
    workflowTitle: "Session workflow", levels: "Level",
    mEye: (n) => `See ${n}`, mBino: (n) => `Find ${n} in binoculars`, mPhoto: (n) => `Photograph ${n}`, mCount: "Count the stars once near new moon (Dark Skies → Globe at Night)",
  },
  es: {
    title: "Tu mentor de astronomía", intro: "Aprende el cielo desde los principios, paso a paso. Cada lección termina con algo para probar bajo el cielo real; márcala cuando lo hagas.",
    progress: (a, b) => `${a} de ${b} lecciones hechas`, done: "Hecha", markDone: "Marcar hecha", open: "Abrir",
    missionsTitle: (m) => `Misiones del mes · ${m}`, missionsHelp: "Retos de temporada para el cielo de Guatemala ahora mismo.",
    askTitle: "Pregúntale a tu mentor", askHelp: "Pregunta lo que sea: desde '¿qué es esa estrella brillante?' hasta dudas de procesado. Las respuestas usan el cielo de esta noche en tu sitio elegido.",
    askPh: "Escribe una pregunta…", ask: "Preguntar", asking: "Pensando…", stop: "Detener",
    askErr: { not_granted: "Claude aún no está permitido en esta página.", rate_limited: "Demasiadas preguntas por ahora. Intenta en un rato.", default: "No se pudo obtener respuesta. Intenta de nuevo." },
    suggestions: ["¿Qué puedo ver esta noche a simple vista?", "¿Cómo alineo al polo si Polaris está tan baja?", "Planea mi primera foto de la Vía Láctea", "¿Por qué mis estrellas salen movidas?"],
    workflowTitle: "Flujo de sesión", levels: "Nivel",
    mEye: (n) => `Ver ${n}`, mBino: (n) => `Encontrar ${n} con binoculares`, mPhoto: (n) => `Fotografiar ${n}`, mCount: "Cuenta las estrellas una vez cerca de luna nueva (Cielos oscuros → Globe at Night)",
  },
};
const PROGRESS_S = makeStore("cg-progress", { lessons: {}, missions: {} }, (v) => v && typeof v === "object" && v.lessons && v.missions);
const useProgress = () => useGlobal(PROGRESS_S);

function monthlyMissions(lang, mode, kit) {
  const now = new Date(), key = MONTHS[gt(now).getUTCMonth()], ym = todayGT().slice(0, 7);
  const M = MENTOR_TEXT[lang];
  const eye = HIGHLIGHTS.filter((h) => h.months.includes(key));
  const out = eye.slice(0, 3).map((h) => ({ id: `${ym}:${h.id}`, text: h.how[0] === "bino" ? M.mBino(tr(h, "name", lang)) : M.mEye(tr(h, "name", lang)), go: h.id }));
  if (mode === "photo") {
    const tg = TARGETS.filter((t) => t.window.includes(key) && !["Solar", "Planet", "Lunar"].includes(t.type) && kitLensesFor(t, kit).length)
      .sort((a, b) => b.priority - a.priority).slice(0, 3);
    tg.forEach((t) => out.push({ id: `${ym}:${t.id}`, text: M.mPhoto(tr(t, "name", lang)), go: t.id }));
  }
  out.push({ id: `${ym}:count`, text: M.mCount, go: null, tab: "dark" });
  return out;
}

function AskMentor({ lang, sample, context }) {
  const M = MENTOR_TEXT[lang];
  const [q, setQ] = useState("");
  const [ans, setAns] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const ctl = useRef(null);
  const run = async (question) => {
    const text = (question || q).trim(); if (!text || !sample) return;
    setQ(text); setBusy(true); setErr(""); setAns("");
    ctl.current = new AbortController();
    const prompt = `You are a warm, precise astronomy mentor for someone learning stargazing and astrophotography from first principles in Guatemala (latitude about 15°N). Explain simply, correct misconceptions gently, and always end with one concrete thing to try. Answer in ${lang === "es" ? "Spanish" : "English"}, in under 170 words, plain text with short paragraphs (no markdown headings).
Context right now:
${context()}
Question: ${text}`;
    try {
      await sample(prompt, { signal: ctl.current.signal, onText: ({ text: t }) => setAns(t) });
    } catch (e) {
      if (e && e.code !== "cancelled") setErr(M.askErr[e && e.code] || M.askErr.default);
    } finally { setBusy(false); }
  };
  return (
    <section className="sky-card mentor-chat">
      <h3>{M.askTitle}</h3>
      <p className="dim">{M.askHelp}</p>
      <div className="amen-row">{M.suggestions.map((s) => <button key={s} className="amen-chip pick" onClick={() => run(s)} disabled={busy}>{s}</button>)}</div>
      <form className="ask-row" onSubmit={(e) => { e.preventDefault(); run(); }}>
        <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={M.askPh} aria-label={M.askTitle} />
        {busy ? <button type="button" className="mini-btn" onClick={() => ctl.current && ctl.current.abort()}>{M.stop}</button> : <button className="plan-btn" type="submit">{M.ask}</button>}
      </form>
      {busy && !ans && <p className="dim small">{M.asking}</p>}
      {err && <p className="plan-error">{err}</p>}
      {ans && <div className="mentor-answer">{ans.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}</div>}
    </section>
  );
}

function MentorTab({ lang, mode, caps, goTab, goSky, context }) {
  const M = MENTOR_TEXT[lang];
  const [prog, setProg] = useProgress();
  const [kit] = useKit();
  const missions = useMemo(() => monthlyMissions(lang, mode, kit), [lang, mode, kit.sys, kit.body]);
  const doneCount = LESSONS.filter((l) => prog.lessons[l.id]).length;
  const toggle = (kind, id) => setProg({ ...prog, [kind]: { ...prog[kind], [id]: !prog[kind][id] } });
  const monthName = MONTH_LONG[lang][gt(new Date()).getUTCMonth()];
  return (
    <>
      <section className="sky-card">
        <h3>{M.title}</h3>
        <p className="obj-p">{M.intro}</p>
        <div className="stat" style={{ marginTop: 12 }}><span className="stat-label">{M.progress(doneCount, LESSONS.length)}</span>
          <div className="pbar"><div className="pbar-fill green" style={{ width: `${Math.round((doneCount / LESSONS.length) * 100)}%` }} /></div></div>
      </section>

      {PLATFORM === "claude" && caps.sample && <AskMentor lang={lang} sample={caps.sample} context={context} />}

      <div className="section-title">{M.missionsTitle(monthName)}</div>
      <p className="dim small">{M.missionsHelp}</p>
      <div className="mission-list">{missions.map((m) => {
        const on = !!prog.missions[m.id];
        return (
          <div key={m.id} className={`mission ${on ? "done" : ""}`}>
            <button className={`check-item ${on ? "checked" : ""}`} onClick={() => toggle("missions", m.id)} aria-pressed={on}>
              <span className="check-box">{on ? "✓" : ""}</span><span className="check-label">{m.text}</span></button>
            {m.go && <button className="mini-btn" onClick={() => goSky(m.go)}>{M.open}</button>}
            {m.tab && <button className="mini-btn" onClick={() => goTab(m.tab)}>{M.open}</button>}
          </div>
        );
      })}</div>

      {LEVELS.map((lv) => (
        <div key={lv.id}>
          <div className="section-title">{M.levels} {lv.id} · {tr(lv, "name", lang)}</div>
          <div className="lesson-grid">{LESSONS.filter((l) => l.level === lv.id).map((l) => {
            const on = !!prog.lessons[l.id];
            return (
              <article key={l.id} className={`lesson ${on ? "done" : ""}`}>
                <h4>{tr(l, "title", lang)}</h4>
                <p>{tr(l, "body", lang)}</p>
                <p className="lesson-try">✦ {tr(l, "try", lang)}</p>
                <div className="lesson-actions">
                  <button className={`mini-btn ${on ? "on" : ""}`} onClick={() => toggle("lessons", l.id)} aria-pressed={on}>{on ? `✓ ${M.done}` : M.markDone}</button>
                  {l.link && <button className="mini-btn" onClick={() => goTab(l.link)}>{M.open} →</button>}
                </div>
              </article>
            );
          })}</div>
        </div>
      ))}

      {mode === "photo" && (
        <>
          <div className="section-title">{M.workflowTitle}</div>
          <div className="workflow-steps">{WORKFLOW.map((s) => <div key={s.n} className="workflow-step"><div className="step-num">{s.n}</div><div><div className="step-title">{tr(s, "t", lang)}</div><div className="step-desc">{tr(s, "d", lang)}</div></div></div>)}</div>
        </>
      )}
    </>
  );
}
