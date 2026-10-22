// Interaction checks: switches, kit choice, mentor links, calendar → sky, offline (service worker), Claude-only features.
//   node test/flow.js
const fs = require("fs"), path = require("path"), http = require("http");
const { chromium } = (() => { try { return require("playwright"); } catch { return require(require("child_process").execSync("npm root -g").toString().trim() + "/playwright"); } })();
const ROOT = path.resolve(__dirname, "..");
const HEADLESS = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const SNAP = process.env.CG_SNAPSHOT || path.join(__dirname, "fixtures"); // optional: sites/ and forecasts/ JSON documents to seed the Claude build
const readCol = (c) => { const d = `${SNAP}/${c}`; const o = {}; if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) o[f.slice(0, -5)] = JSON.parse(fs.readFileSync(`${d}/${f}`, "utf8")); return o; };
let fails = 0;
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) { fails++; process.exitCode = 1; } };

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
const fakeOM = (url) => {
  const u = new URL(url); const lats = u.searchParams.get("latitude").split(",");
  const time = [], z = []; const start = Date.UTC(2026, 9, 21);
  for (let h = 0; h < 96; h++) { time.push(new Date(start + h * 3600000).toISOString().slice(0, 13) + ":00"); z.push(h % 24 > 12 ? 10 : 60); }
  const one = () => ({ hourly: { time, cloud_cover: z, cloud_cover_low: z, cloud_cover_mid: z, cloud_cover_high: z, relative_humidity_2m: z, dew_point_2m: z, temperature_2m: z, wind_speed_10m: z, visibility: z.map(() => 20000), precipitation_probability: z.map(() => 0) } });
  return lats.length === 1 ? one() : lats.map(one);
};
const tabByText = async (page, re) => { for (const t of await page.$$(".tab")) if (re.test((await t.innerText()).trim())) { await t.click(); await page.waitForTimeout(400); return true; } return false; };

(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : fs.existsSync(HEADLESS) ? { executablePath: HEADLESS } : {});
  const errs = [];
  const watch = (page, tag) => { page.on("pageerror", (e) => errs.push(`${tag}: ${e.message}`)); page.on("console", (m) => { if (m.type() === "error") errs.push(`${tag} console: ${m.text()}`); }); };

  // ── public website ──
  const srv = await serve(path.join(ROOT, "dist/web"));
  const URL0 = `http://127.0.0.1:${srv.address().port}/`;
  let ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  await ctx.route("https://api.open-meteo.com/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fakeOM(r.request().url())) }));
  let page = await ctx.newPage(); watch(page, "web");
  await page.goto(URL0); await page.waitForTimeout(1200);
  ok((await page.$$(".tab")).length === 6, "web opens in stargazer mode (6 tabs)");
  ok(await page.evaluate(() => document.documentElement.lang) === "es", "web defaults to Spanish");
  ok(await page.isVisible("text=Qué hay esta noche"), "tonight shows the stargazer list");
  ok((await page.$$(".hl-row")).length >= 6, "at least 6 highlights tonight");

  await page.click(".top-controls >> text=8-bit"); await page.waitForTimeout(300);
  ok(await page.evaluate(() => document.documentElement.getAttribute("data-sky")) === "pixel", "8-bit theme applies");
  ok(await page.evaluate(() => getComputedStyle(document.querySelector(".header-title")).fontFamily.includes("Press Start")), "8-bit uses the pixel font");
  await page.click(".top-controls >> text=Rojo"); await page.waitForTimeout(300);
  ok(await page.isVisible(".red-filter") || (await page.$(".red-filter")) !== null, "red theme adds the night-vision filter");
  await page.click(".top-controls >> text=Noche"); await page.waitForTimeout(300);
  ok((await page.$(".red-filter")) === null && (await page.$("canvas.sky-backdrop")) !== null, "night theme shows the moving sky backdrop");

  await page.click(".top-controls >> text=EN"); await page.waitForTimeout(300);
  ok(await page.isVisible("text=What's up tonight"), "switches to English");
  await page.click(".top-controls >> text=ES"); await page.waitForTimeout(300);

  // mentor lesson link to a photographer tab switches mode
  await tabByText(page, /mentor/i);
  const exp = await page.$("article.lesson:has-text('Exposición para estrellas') >> text=Abrir →");
  await exp.click(); await page.waitForTimeout(500);
  ok((await page.$$(".tab")).length === 10 && (await page.innerText(".tab.active")).includes("Equipo"), "photo lesson opens Gear in photographer mode");

  // kit choice drives the exposure tables
  await page.click(".kit-card >> text=Nikon"); await page.waitForTimeout(300);
  await page.click(".sys-card:has-text('Nikon Z f')"); await page.waitForTimeout(300);
  const kit = await page.evaluate(() => JSON.parse(localStorage.getItem("cg-kit")));
  ok(kit.sys === "nikon" && kit.body === "zf", "kit saved (Nikon Z f)");
  await tabByText(page, /^cielo$/i);
  ok((await page.innerText(".fx-kit")).includes("Nikon Z f"), "frame & exposure follows the kit");
  ok((await page.$$(".fx-chip")).length >= 2, "kit lenses offered as chips");
  const firstChip = await page.innerText(".fx-chip.on");
  ok(/Nikon|Nikkor|Laowa|Sigma|Samyang|Viltrox|NIKKOR/i.test(firstChip), "suggested lens is a Nikon-mount lens (" + firstChip + ")");

  // calendar → sky
  await tabByText(page, /calendario/i);
  const card = (await page.$$(".hl-row"))[0]; const name = (await card.innerText()).split("\n")[0];
  await card.click(); await page.waitForTimeout(500);
  ok((await page.innerText(".tab.active")).includes("Cielo") && (await page.innerText(".finder")).includes(name.slice(0, 8)), "calendar card opens it in the sky (" + name + ")");

  // sky chart: clicking a planet selects it (stargazer mode)
  await page.click(".top-controls >> text=Observador"); await page.waitForTimeout(400);
  await tabByText(page, /^cielo$/i);
  const planet = await page.$(".sky-chart g.sc-target[aria-label='Saturno'], .sky-chart g.sc-target[aria-label='Júpiter'], .sky-chart g.sc-target[aria-label='Luna']");
  if (planet) { const lab = await planet.getAttribute("aria-label"); await planet.click(); await page.waitForTimeout(300); ok((await page.innerText(".finder-card")).includes(lab), "clicking " + lab + " on the chart selects it"); }
  else ok(false, "a planet or the Moon is clickable on the chart");

  // footer install line + field install card
  ok(await page.isVisible(".install-line"), "footer offers install / offline");
  await page.close(); await ctx.close();

  // offline: service worker caches the shell; the site reloads with no network
  ctx = await browser.newContext({ viewport: { width: 400, height: 800 } });
  await ctx.route("https://api.open-meteo.com/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fakeOM(r.request().url())) }));
  page = await ctx.newPage(); watch(page, "sw");
  await page.goto(URL0); await page.waitForTimeout(800);
  const swReady = await page.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
  ok(swReady, "service worker active");
  await page.waitForTimeout(800);
  const cached = await page.evaluate(async () => { const ks = await caches.keys(); const c = await caches.open(ks[0]); return (await c.keys()).length; });
  ok(cached >= 15, `shell cached (${cached} files)`);
  await page.reload(); await page.waitForTimeout(600);
  await ctx.setOffline(true);
  await page.reload(); await page.waitForTimeout(1200);
  ok((await page.$$(".tab")).length >= 6 && await page.isVisible("text=Qué hay esta noche"), "reloads offline from the cache");
  ok((await page.$$(".hl-row")).length >= 6, "offline still computes tonight's sky");
  await ctx.setOffline(false);
  await page.close(); await ctx.close();
  srv.close();

  // ── Claude build (mock runtime) ──
  const seed = { sites: readCol("sites"), forecasts: readCol("forecasts"), log: {}, places: {}, loadout: {}, config: {} };
  ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
  await ctx.addInitScript((seedJson) => {
    const S = JSON.parse(seedJson); const subs = []; const fire = () => subs.forEach((f) => f());
    const colSnap = (c) => ({ docs: Object.entries(S[c] || {}).map(([id, d]) => ({ id, data: () => d })) });
    const db = {
      collection: (c) => ({ onSnapshot: (cb) => { const f = () => cb(colSnap(c)); subs.push(f); f(); return () => {}; } }),
      doc: (p) => { const [c, id] = p.split("/"); return {
        onSnapshot: (cb) => { const f = () => { const d = (S[c] || {})[id]; cb({ exists: !!d, data: () => d }); }; subs.push(f); f(); return () => {}; },
        set: async (d) => { S[c] = S[c] || {}; S[c][id] = JSON.parse(JSON.stringify(d)); fire(); }, delete: async () => { if (S[c]) delete S[c][id]; fire(); } }; },
    };
    window.__prompts = [];
    const sample = async (input, opts) => {
      window.__prompts.push(typeof input === "string" ? input : JSON.stringify(input));
      const text = "From 15°N, Fomalhaut sits low in the south after dusk.\n\nTry this: find it two fists above the southern horizon at 20:00.";
      if (opts && opts.onText) opts.onText({ text, delta: text });
      return { text, truncated: false };
    };
    sample.json = async (input) => { window.__prompts.push(String(input).slice(0, 200)); return { summary: "Moon-dominated night: lunar and planetary work, then Orion after moonset.", verdict: "maybe", blocks: [{ start: "19:00", end: "21:00", rig: "gti", target: "moon", lens: "300f4", note: "Terminator series" }], warnings: [] }; };
    window.__saved = null;
    const caps = { db, sample, user: { canEdit: async () => true }, downloads: { save: async ({ filename, data }) => { window.__saved = { filename, data }; return { status: "saved" }; } } };
    window.claude = { use: async (n) => caps[n] || null };
  }, JSON.stringify(seed));
  page = await ctx.newPage(); watch(page, "claude");
  await page.goto("file://" + path.join(ROOT, "dist/claude/cielos_de_guatemala.html")); await page.waitForTimeout(1200);
  ok((await page.$$(".tab")).length === 10, "Claude build opens in photographer mode");
  ok(await page.evaluate(() => document.documentElement.lang) === "en", "Claude build defaults to English");
  await tabByText(page, /mentor/i);
  await page.click(".mentor-chat .amen-chip >> nth=0"); await page.waitForTimeout(500);
  ok((await page.innerText(".mentor-answer")).includes("Fomalhaut"), "ask-your-mentor streams an answer");
  const prompt = await page.evaluate(() => window.__prompts[0] || "");
  ok(/15°N/.test(prompt) && /Site: /.test(prompt) && /Kit: /.test(prompt), "mentor prompt carries tonight's context");
  await tabByText(page, /field/i);
  await page.click("text=Save offline copy"); await page.waitForTimeout(1200);
  const saved = await page.evaluate(() => window.__saved && { filename: window.__saved.filename, size: window.__saved.data.length, data: window.__saved.data });
  ok(saved && /^cielos-de-guatemala-offline-.*\.html$/.test(saved.filename) && saved.size > 400000, "offline copy generated (" + (saved ? `${saved.filename}, ${saved.size} bytes` : "none") + ")");
  await page.close();
  if (saved) {
    const off = path.join(ROOT, "test", "generated_offline.html"); fs.writeFileSync(off, saved.data);
    const ctx2 = await browser.newContext({ viewport: { width: 1000, height: 800 } });
    const p2 = await ctx2.newPage(); watch(p2, "offline-copy");
    await p2.goto("file://" + off); await p2.waitForTimeout(1200);
    ok(await p2.isVisible(".offline-banner"), "offline copy opens with its banner");
    ok((await p2.$$(".tab")).length >= 6, "offline copy renders tabs");
    await ctx2.close();
  }
  await ctx.close();
  await browser.close();
  ok(!errs.length, "no page errors" + (errs.length ? "\n   " + [...new Set(errs)].slice(0, 10).join("\n   ") : ""));
  console.log(fails ? `${fails} FAILED` : "ALL PASS");
})();
