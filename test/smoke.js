// Smoke test: every tab × mode × theme, desktop + phone, both builds.
// Fails on page errors, console errors, or horizontal overflow. Saves a few screenshots for review.
//   node test/smoke.js [web|claude|all] [--shots]
const fs = require("fs"), path = require("path"), http = require("http");
const { chromium } = (() => { try { return require("playwright"); } catch { return require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright"); } })();
const ROOT = path.resolve(__dirname, "..");
const HEADLESS = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const SNAP = process.env.CG_SNAPSHOT || path.join(__dirname, "fixtures"); // optional: sites/ and forecasts/ JSON documents to seed the Claude build
const SHOTS = path.join(ROOT, "test", "shots");
const which = process.argv[2] || "all";
const wantShots = process.argv.includes("--shots");
fs.mkdirSync(SHOTS, { recursive: true });

const readCol = (c) => { const d = `${SNAP}/${c}`; const o = {}; if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) o[f.slice(0, -5)] = JSON.parse(fs.readFileSync(`${d}/${f}`, "utf8")); return o; };
let failures = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) { failures++; process.exitCode = 1; } };

// Open-Meteo stand-in: plausible hourly data for each requested coordinate (times in Guatemala local time)
function fakeOpenMeteo(url) {
  const u = new URL(url);
  const lats = u.searchParams.get("latitude").split(","), lons = u.searchParams.get("longitude").split(",");
  const days = +(u.searchParams.get("forecast_days") || 4);
  const now = new Date(Date.now() - 6 * 3600000);
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const out = lats.map((la, i) => {
    const time = [], cc = [], lo = [], mi = [], hi = [], rh = [], dp = [], tt = [], ws = [], vis = [], pp = [];
    for (let h = 0; h < days * 24; h++) {
      const d = new Date(start + h * 3600000);
      time.push(d.toISOString().slice(0, 13) + ":00");
      const c = Math.round(50 + 45 * Math.sin((h + i * 3) / 7));
      cc.push(Math.max(0, Math.min(100, c))); lo.push(Math.max(0, c - 30)); mi.push(Math.max(0, c - 20)); hi.push(Math.max(0, Math.min(100, c + 5)));
      rh.push(70 + (h % 24 > 18 || h % 24 < 6 ? 20 : 0)); dp.push(8); tt.push(12 - (h % 24 < 7 ? 6 : 0)); ws.push(9); vis.push(24000); pp.push(h % 24 > 13 && h % 24 < 19 ? 40 : 5);
    }
    return { latitude: +la, longitude: +lons[i], timezone: "America/Guatemala", hourly: { time, cloud_cover: cc, cloud_cover_low: lo, cloud_cover_mid: mi, cloud_cover_high: hi, relative_humidity_2m: rh, dew_point_2m: dp, temperature_2m: tt, wind_speed_10m: ws, visibility: vis, precipitation_probability: pp } };
  });
  return out.length === 1 ? out[0] : out;
}

function serve(dir) {
  const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const f = path.join(dir, p);
    if (!f.startsWith(dir) || !fs.existsSync(f)) { res.writeHead(404); return res.end("nf"); }
    res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
    fs.createReadStream(f).pipe(res);
  });
  return new Promise((r) => srv.listen(0, "127.0.0.1", () => r(srv)));
}

// Mock of the claude.ai runtime for the artifact build
function claudeMock(seedJson) {
  const S = JSON.parse(seedJson); const subs = [];
  const fire = () => subs.forEach((f) => f());
  const colSnap = (c) => ({ docs: Object.entries(S[c] || {}).map(([id, d]) => ({ id, data: () => d })) });
  const db = {
    collection: (c) => ({ onSnapshot: (cb) => { const f = () => cb(colSnap(c)); subs.push(f); f(); return () => {}; } }),
    doc: (p) => { const [c, id] = p.split("/"); return {
      onSnapshot: (cb) => { const f = () => { const d = (S[c] || {})[id]; cb({ exists: !!d, data: () => d }); }; subs.push(f); f(); return () => {}; },
      set: async (d) => { S[c] = S[c] || {}; S[c][id] = JSON.parse(JSON.stringify(d)); fire(); },
      delete: async () => { if (S[c]) delete S[c][id]; fire(); } }; },
  };
  const sample = async (input, opts) => {
    const text = "Look south-east after 8 pm: Fomalhaut sits alone, low and bright.\n\nTry this: hold your fist at arm's length and count.";
    for (let i = 10; i <= text.length; i += 25) { if (opts && opts.onText) opts.onText({ text: text.slice(0, i), delta: "" }); await new Promise((r) => setTimeout(r, 5)); }
    if (opts && opts.onText) opts.onText({ text, delta: "" });
    return { text, truncated: false };
  };
  sample.json = async () => ({});
  const caps = { db, sample, user: { canEdit: async () => true, isOwner: async () => true }, downloads: { save: async ({ filename, data }) => { window.__saved = { filename, size: data.length }; return { status: "saved" }; } }, mcp: null };
  window.claude = { use: async (n) => caps[n] || null };
}

const TABS = { stargazer: ["tonight", "sky", "calendar", "sites", "dark", "mentor"], photo: ["tonight", "sky", "targets", "gear", "calendar", "sites", "field", "log", "dark", "mentor"] };

async function run(browser, build, url, init) {
  for (const vp of [{ width: 1280, height: 900, tag: "desk" }, { width: 390, height: 844, tag: "phone", mobile: true }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.mobile ? 2 : 1, isMobile: !!vp.mobile, hasTouch: !!vp.mobile, serviceWorkers: "block" });
    await ctx.route("https://api.open-meteo.com/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fakeOpenMeteo(r.request().url())) }));
    if (init) await ctx.addInitScript(init.fn, init.arg);
    for (const theme of ["night", "red", "pixel"]) {
      for (const mode of ["stargazer", "photo"]) {
        for (const lang of ["es", "en"]) {
          if (theme !== "night" && lang === "en" && vp.tag === "phone") continue; // keep the matrix reasonable
          const page = await ctx.newPage();
          const errs = [];
          page.on("pageerror", (e) => errs.push(`pageerror: ${e.message}`));
          page.on("console", (m) => { if (m.type() === "error" && !/favicon|ERR_FILE_NOT_FOUND/.test(m.text())) errs.push(`console: ${m.text()}`); });
          await page.addInitScript(([t, m, l]) => { localStorage.setItem("cg-theme", JSON.stringify(t)); localStorage.setItem("cg-mode", JSON.stringify(m)); localStorage.setItem("cg-lang", JSON.stringify(l)); }, [theme, mode, lang]);
          await page.goto(url); await page.waitForTimeout(900);
          const tabs = await page.$$(".tab");
          ok(tabs.length === TABS[mode].length, `${build} ${vp.tag} ${theme}/${mode}/${lang}: ${tabs.length} tabs`);
          for (let i = 0; i < TABS[mode].length; i++) {
            const k = TABS[mode][i];
            await (await page.$$(".tab"))[i].click();
            await page.waitForTimeout(k === "sky" || k === "dark" ? 900 : 350);
            const ov = await page.evaluate(() => {
              const W = document.documentElement.clientWidth;
              const wide = [...document.querySelectorAll("body *")].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > W + 1 && getComputedStyle(e).position !== "fixed"; })
                .filter((e) => !e.closest(".hour-table-wrap, .fx-table-wrap, .table-wrap, .tabs, .core-strip-wrap")).slice(0, 3).map((e) => `${e.tagName.toLowerCase()}.${[...e.classList].join(".")}`);
              return { sw: document.documentElement.scrollWidth, W, wide };
            });
            if (ov.sw > ov.W + 1 || ov.wide.length) errs.push(`overflow on ${k}: scrollWidth ${ov.sw} > ${ov.W} ${ov.wide.join(" ")}`);
            if (wantShots && lang === "es" && (theme === "night" || k === "tonight")) await page.screenshot({ path: `${SHOTS}/${build}-${vp.tag}-${theme}-${mode}-${k}.png`, fullPage: vp.tag === "phone" ? false : true });
          }
          ok(!errs.length, `${build} ${vp.tag} ${theme}/${mode}/${lang}: no errors${errs.length ? "\n   " + [...new Set(errs)].slice(0, 8).join("\n   ") : ""}`);
          await page.close();
        }
      }
    }
    await ctx.close();
  }
}

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : fs.existsSync(HEADLESS) ? { executablePath: HEADLESS } : {});
  if (which === "all" || which === "web") {
    const srv = await serve(path.join(ROOT, "dist/web"));
    await run(browser, "web", `http://127.0.0.1:${srv.address().port}/`);
    srv.close();
  }
  if (which === "all" || which === "claude") {
    const seed = { sites: readCol("sites"), forecasts: readCol("forecasts"), log: {}, places: {}, loadout: {}, config: {} };
    await run(browser, "claude", "file://" + path.join(ROOT, "dist/claude/cielos_de_guatemala.html"), { fn: claudeMock, arg: JSON.stringify(seed) });
  }
  await browser.close();
  console.log(failures ? `${failures} FAILED` : "ALL PASS");
})();
