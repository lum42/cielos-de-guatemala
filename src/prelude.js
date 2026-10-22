// ── BUNDLE PRELUDE ───────────────────────────────────────────────────────────
import React from "react";
import { createRoot } from "react-dom/client";
const ReactDOM = { createRoot };
const { useState, useEffect, useMemo, useRef } = React;
// The running script's own text: lets the Claude build write a standalone offline copy of itself.
const __SELF_JS = (document.currentScript && document.currentScript.textContent) || "";
const APP_VERSION = "__APP_VERSION__";
const PLATFORM = "__PLATFORM__"; // "claude" (artifact, shared database) | "web" (public site, this device only)
const APP_NAME = "Cielos de Guatemala";

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
// Tiny app-wide stores (theme, mode, kit) that any component can subscribe to
function makeStore(key, def, valid) {
  const v = store.get(key, def);
  return { key, v: valid && !valid(v) ? def : v, subs: new Set() };
}
function useGlobal(s) {
  const [, force] = useState(0);
  useEffect(() => { const g = () => force((x) => x + 1); s.subs.add(g); return () => { s.subs.delete(g); }; }, [s]);
  const set = (nv) => { s.v = nv; store.set(s.key, nv); s.subs.forEach((g) => g()); };
  return [s.v, set];
}
const THEMES = ["night", "red", "pixel"];
const THEME_S = makeStore("cg-theme", "night", (v) => THEMES.includes(v));
const useTheme = () => useGlobal(THEME_S);
const MODE_S = makeStore("cg-mode", PLATFORM === "web" ? "stargazer" : "photo", (v) => v === "stargazer" || v === "photo");
const useMode = () => useGlobal(MODE_S);
try { document.documentElement.setAttribute("data-sky", THEME_S.v); } catch {}
