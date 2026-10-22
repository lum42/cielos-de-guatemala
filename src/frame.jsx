// ── FRAME PREVIEW ────────────────────────────────────────────────────────────
// A rectilinear lens on the MFT sensor sees the sky through a gnomonic projection,
// so the preview projects stars, the Milky Way and reference photos onto the
// tangent plane at true scale, then draws the sensor frame on top.

// decoded sky data (lazy)
let _stars = null;
function getStars() {
  if (_stars) return _stars;
  const bin = atob(STARS_B64), n = Math.floor(bin.length / 6);
  const ra = new Float32Array(n), dec = new Float32Array(n), mag = new Float32Array(n), bv = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 6;
    let d = bin.charCodeAt(o + 2) | (bin.charCodeAt(o + 3) << 8); if (d > 32767) d -= 65536;
    let m = bin.charCodeAt(o + 4); if (m > 127) m -= 256;
    let c = bin.charCodeAt(o + 5); if (c > 127) c -= 256;
    ra[i] = (bin.charCodeAt(o) | (bin.charCodeAt(o + 1) << 8)) / 100; dec[i] = d / 100; mag[i] = m / 10; bv[i] = c / 10;
  }
  return (_stars = { n, ra, dec, mag, bv });
}
let _mw = null, _mwP = null;
function loadMw() {
  if (_mw) return Promise.resolve(_mw);
  if (!_mwP) _mwP = new Promise((res) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
        const x = c.getContext("2d"); x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, c.width, c.height).data, g = new Uint8Array(c.width * c.height);
        for (let i = 0; i < g.length; i++) g[i] = d[i * 4];
        _mw = { g, w: c.width, h: c.height };
      } catch { _mw = null; }
      res(_mw);
    };
    img.onerror = () => res(null);
    img.src = MW_URI;
  });
  return _mwP;
}

// reference photos: embedded (offline copy) or fetched once on demand (live app)
const PHOTOS = { list: null, status: "idle", url: null, embedded: null, subs: new Set() };
const photosNotify = () => PHOTOS.subs.forEach((f) => f());
function usePhotos() {
  const [, force] = useState(0);
  useEffect(() => { const f = () => force((x) => x + 1); PHOTOS.subs.add(f); return () => { PHOTOS.subs.delete(f); }; }, []);
  return PHOTOS;
}
function loadPhotos() {
  if (PHOTOS.status === "loading" || PHOTOS.status === "ready") return;
  if (PHOTOS.embedded) { PHOTOS.list = PHOTOS.embedded.tex || []; PHOTOS.status = "ready"; photosNotify(); return; }
  if (!PHOTOS.url) { PHOTOS.status = "unavailable"; photosNotify(); return; }
  PHOTOS.status = "loading"; photosNotify();
  fetch(PHOTOS.url).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then((j) => { PHOTOS.list = (j && j.tex) || []; PHOTOS.raw = j; PHOTOS.status = "ready"; photosNotify(); })
    .catch(() => { PHOTOS.status = "error"; photosNotify(); });
}
const _imgs = new Map();
function photoImage(p, onload) {
  let im = _imgs.get(p.id);
  if (!im) { im = new Image(); im.decoding = "async"; im.onload = onload; im.src = p.img; _imgs.set(p.id, im); }
  return im.complete && im.naturalWidth > 0 ? im : null;
}

const STAR_COL = (bv) => (bv < 0 ? "#b9d0ff" : bv < 0.4 ? "#eef2ff" : bv < 0.9 ? "#fff3d6" : bv < 1.4 ? "#ffd9a8" : "#ffbe8a");
let _off1 = null, _off2 = null;
const offCanvas = (which, w, h) => {
  let c = which === 1 ? _off1 : _off2;
  if (!c) { c = document.createElement("canvas"); if (which === 1) _off1 = c; else _off2 = c; }
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return c;
};

/** Draw the frame preview. Returns ids of photos drawn and whether the Moon is in frame. */
function drawFrame(cv, o) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = o.W, H = Math.round(W * 0.75);
  if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const ctx = cv.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  const cx = W / 2, cy = H / 2;
  const sw = o.sw || 17.3, sh = o.sh || 13.0;
  const hw = sw / 2 / o.f, hh = sh / 2 / o.f;
  const margin = hw > 0.9 ? 1.06 : 1.25;
  const S = W / 2 / (hw * margin);
  const fx = hw * S, fy = hh * S;
  const a0 = o.ra0 * RAD, d0 = o.dec0 * RAD, sd0 = Math.sin(d0), cd0 = Math.cos(d0);
  const cr = Math.cos(o.rot * RAD), sr = Math.sin(o.rot * RAD);
  const proj = (raDeg, decDeg) => {
    const a = raDeg * RAD, d = decDeg * RAD, sd = Math.sin(d), cd = Math.cos(d), da = a - a0, cda = Math.cos(da);
    const cc = sd0 * sd + cd0 * cd * cda;
    if (cc < 0.03) return null;
    const X = -(cd * Math.sin(da)) / cc, Y = -(cd0 * sd - sd0 * cd * cda) / cc;
    return [cx + S * (X * cr - Y * sr), cy + S * (X * sr + Y * cr)];
  };
  const inView = (p, pad = 0) => p && p[0] > -pad && p[0] < W + pad && p[1] > -pad && p[1] < H + pad;
  // screen angle for a sky position angle (N→E)
  const paAngle = (pa) => { const X = -Math.sin(pa * RAD), Y = -Math.cos(pa * RAD); return Math.atan2(X * sr + Y * cr, X * cr - Y * sr); };

  // ── pass 1: sky colour, Milky Way and ground mask (low resolution) ──
  const LW = Math.ceil(W / 2), LH = Math.ceil(H / 2);
  const c1 = offCanvas(1, LW, LH), c2 = offCanvas(2, LW, LH);
  const x1 = c1.getContext("2d"), x2 = c2.getContext("2d");
  const im1 = x1.createImageData(LW, LH), im2 = x2.createImageData(LW, LH);
  const mw = _mw, lat = o.lat * RAD, sl = Math.sin(lat), cl = Math.cos(lat);
  const lst = o.level ? (gmstDeg(o.jd) + o.lon) * RAD : 0;
  const glow = o.sim ? o.sim.glow : Math.min(1, Math.max(0, ((o.bortle || 3) - 1) / 6));
  const mwK = o.sim ? o.sim.mw : 1, bg = o.sim ? o.sim.bg : [6, 8, 20];
  for (let j = 0; j < LH; j++) {
    for (let i = 0; i < LW; i++) {
      const Xs = ((i + 0.5) * (W / LW) - cx) / S, Ys = ((j + 0.5) * (H / LH) - cy) / S;
      const Xu = Xs * cr + Ys * sr, Yu = -Xs * sr + Ys * cr;
      const x = -Xu, y = -Yu, rho = Math.hypot(x, y);
      let dec = d0, ra = a0;
      if (rho > 1e-9) {
        const c = Math.atan(rho), sc = Math.sin(c), cc = Math.cos(c);
        dec = Math.asin(cc * sd0 + (y * sc * cd0) / rho);
        ra = a0 + Math.atan2(x * sc, rho * cd0 * cc - y * sd0 * sc);
      }
      let I = 0;
      if (mw) {
        let u = ((ra * DEG) % 360 + 360) % 360 / 360 * mw.w, v = (90 - dec * DEG) / 180 * mw.h;
        const ui = Math.floor(u), vi = Math.min(mw.h - 2, Math.max(0, Math.floor(v))), fu = u - ui, fv = v - vi;
        const u0 = ui % mw.w, u1 = (ui + 1) % mw.w;
        I = ((mw.g[vi * mw.w + u0] * (1 - fu) + mw.g[vi * mw.w + u1] * fu) * (1 - fv) + (mw.g[(vi + 1) * mw.w + u0] * (1 - fu) + mw.g[(vi + 1) * mw.w + u1] * fu) * fv) / 255;
      }
      const k = (j * LW + i) * 4;
      let r = bg[0] + I * 120 * mwK, g = bg[1] + I * 128 * mwK, b = bg[2] + I * 150 * mwK;
      if (o.level) {
        const sinAlt = sl * Math.sin(dec) + cl * Math.cos(dec) * Math.cos(lst - ra);
        if (sinAlt < 0) {
          const dep = Math.min(1, -sinAlt * 6);
          im2.data[k] = 18 - dep * 8; im2.data[k + 1] = 16 - dep * 7; im2.data[k + 2] = 13 - dep * 6; im2.data[k + 3] = 255;
        } else if (sinAlt < 0.2) {
          const t = 1 - sinAlt / 0.2, gl = t * t * (10 + glow * (o.sim ? 120 : 40));
          r += gl * 1.2; g += gl; b += gl * 0.7;
        }
      }
      im1.data[k] = r; im1.data[k + 1] = g; im1.data[k + 2] = b; im1.data[k + 3] = 255;
    }
  }
  x1.putImageData(im1, 0, 0); x2.putImageData(im2, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(c1, 0, 0, W, H);

  // ── reference photos (screen-blended so their black backgrounds vanish) ──
  const drawn = [];
  const viewRad = Math.atan(hw * margin * 1.25) * DEG;
  if (o.photos && o.showPhotos) {
    for (const p of o.photos) {
      const c = p.c; if (!c || c.length < 4) continue;
      const mra = (c[0][0] + c[2][0]) / 2, mdec = (c[0][1] + c[2][1]) / 2;
      if (angSep(mra, mdec, o.ra0, o.dec0) > Math.min(80, viewRad + (p.w || 60) / 60 * 0.75)) continue;
      const mid = proj(mra, mdec);
      if (!mid) continue;
      const tl = proj(c[3][0], c[3][1]), tr = proj(c[2][0], c[2][1]), bl = proj(c[0][0], c[0][1]);
      if (!tl || !tr || !bl) continue;
      const span = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
      if (span < 2 || !inView(mid, span)) continue;
      const img = photoImage(p, o.onImage);
      if (!img) continue;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.setTransform(dpr * (tr[0] - tl[0]) / img.naturalWidth, dpr * (tr[1] - tl[1]) / img.naturalWidth, dpr * (bl[0] - tl[0]) / img.naturalHeight, dpr * (bl[1] - tl[1]) / img.naturalHeight, dpr * tl[0], dpr * tl[1]);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      drawn.push(p.id);
    }
  }

  // ── constellation lines ──
  if (o.showLines) {
    ctx.strokeStyle = "rgba(120,140,235,0.38)"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (const pl of CON_LINES) {
      let prev = null;
      for (let k = 0; k < pl.length; k += 2) {
        const p = proj(pl[k] / 10, pl[k + 1] / 10);
        if (p && prev && Math.hypot(p[0] - prev[0], p[1] - prev[1]) < W * 2) { ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); }
        prev = p;
      }
    }
    ctx.stroke();
  }

  // ── stars ──
  const st = getStars();
  const boost = Math.min(1.6, Math.max(0.8, Math.log10(o.f) * 0.6 + 0.5));
  for (let i = 0; i < st.n; i++) {
    if (o.sim && st.mag[i] > o.sim.nelm) continue;
    const p = proj(st.ra[i], st.dec[i]);
    if (!inView(p, 2)) continue;
    const s = Math.max(1, Math.min(4.5, (6.6 - st.mag[i]) * 0.55 * boost));
    ctx.fillStyle = STAR_COL(st.bv[i]);
    ctx.globalAlpha = Math.min(1, 0.45 + (6.5 - st.mag[i]) * 0.14) * (o.sim ? Math.max(0.25, Math.min(1, (o.sim.nelm - st.mag[i]) / 1.2)) : 1);
    ctx.fillRect(Math.round(p[0] - s / 2), Math.round(p[1] - s / 2), Math.round(s), Math.round(s));
  }
  ctx.globalAlpha = 1;

  // ── Sun, Moon and planets ──
  let moonIn = false;
  const sunP = sunPos(o.jd);
  for (const b of ["sun", "moon", "venus", "mars", "jupiter", "saturn"]) {
    if (b === "sun" && !o.allowSun) continue;
    const pos = bodyRaDec({ body: b }, o.jd);
    const p = proj(pos.ra, pos.dec);
    if (!p) continue;
    const rPx = Math.tan(bodyRadiusDeg(b, o.jd) * RAD) * S;
    if (!inView(p, rPx + 4)) continue;
    if (b === "moon" && o.bodyCentered !== "moon" && Math.abs(p[0] - cx) < fx + rPx && Math.abs(p[1] - cy) < fy + rPx) moonIn = true;
    if (rPx < 1.6) {
      ctx.fillStyle = b === "mars" ? "#ff9a7a" : "#fff2c8";
      ctx.fillRect(Math.round(p[0] - 2), Math.round(p[1] - 2), 4, 4);
    } else if (b === "sun") {
      ctx.fillStyle = "#ffcf7a"; ctx.beginPath(); ctx.arc(p[0], p[1], rPx, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(90,40,10,0.55)"; ctx.fillRect(p[0] - rPx * 0.35, p[1] + rPx * 0.12, rPx * 0.08, rPx * 0.08); ctx.fillRect(p[0] + rPx * 0.28, p[1] - rPx * 0.3, rPx * 0.06, rPx * 0.06);
    } else {
      const k = b === "moon" ? moonPhase(o.jd).illum / 100 : planetPhase(b, o.jd);
      const limb = paAngle(posAngle(pos.ra, pos.dec, sunP.ra, sunP.dec));
      ctx.save(); ctx.translate(p[0], p[1]);
      if (b === "saturn") {
        ctx.strokeStyle = "rgba(240,225,170,0.85)"; ctx.lineWidth = Math.max(1, rPx * 0.25);
        ctx.beginPath(); ctx.ellipse(0, 0, rPx * 2.2, rPx * 0.22, paAngle(84), 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = b === "moon" ? "#24252d" : "#3a3326";
      ctx.beginPath(); ctx.arc(0, 0, rPx, 0, Math.PI * 2); ctx.fill();
      ctx.rotate(limb);
      ctx.fillStyle = b === "moon" ? "#e9e5d3" : b === "jupiter" ? "#ead6ad" : b === "saturn" ? "#efe0b0" : b === "mars" ? "#f08a5f" : "#fff6dc";
      const e = rPx * (2 * k - 1);
      ctx.beginPath(); ctx.arc(0, 0, rPx, -Math.PI / 2, Math.PI / 2, false);
      if (e >= 0) ctx.ellipse(0, 0, Math.abs(e), rPx, 0, Math.PI / 2, (3 * Math.PI) / 2, false);
      else ctx.ellipse(0, 0, Math.abs(e), rPx, 0, Math.PI / 2, -Math.PI / 2, true);
      ctx.fill();
      ctx.restore();
      if (b === "jupiter" && rPx > 4) {
        ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(paAngle(90));
        ctx.fillStyle = "rgba(150,95,60,0.55)"; ctx.fillRect(-rPx * 0.9, -rPx * 0.28, rPx * 1.8, rPx * 0.14); ctx.fillRect(-rPx * 0.9, rPx * 0.16, rPx * 1.8, rPx * 0.14);
        ctx.restore();
      }
      if (b === "moon" && rPx > 12) {
        ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = "#555"; ctx.translate(p[0], p[1]);
        [[-0.3, -0.25, 0.22], [0.15, -0.35, 0.16], [0.25, 0.1, 0.2], [-0.1, 0.3, 0.13]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x * rPx, y * rPx, r * rPx, 0, Math.PI * 2); ctx.fill(); });
        ctx.restore();
      }
    }
    if (rPx < 30 && b !== o.bodyCentered && !o.bare) { ctx.fillStyle = "#ffe6a6"; ctx.font = o.font || "13px VT323, monospace"; ctx.fillText(o.bodyNames[b] || b, p[0] + rPx + 4, p[1] - 3); }
  }

  // ── ground (level mode) goes over stars and photos ──
  if (o.level) ctx.drawImage(c2, 0, 0, W, H);

  // horizon line + compass points
  if (o.level) {
    ctx.strokeStyle = "rgba(196,170,120,0.85)"; ctx.lineWidth = 1.2; ctx.beginPath();
    let prev = null; const labels = [];
    for (let az = 0; az <= 360; az += 2) {
      const e = raDecFromAltAz(0, az, o.lat, o.lon, o.jd);
      const p = proj(e.ra, e.dec);
      if (p && prev && Math.hypot(p[0] - prev[0], p[1] - prev[1]) < W) { ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); }
      prev = p;
      if (az % 45 === 0 && az < 360 && inView(p, -6)) labels.push([o.compass[az / 45], p]);
    }
    ctx.stroke();
    ctx.fillStyle = "#e8d39a"; ctx.font = o.fontBig || "14px VT323, monospace"; ctx.textAlign = "center";
    labels.forEach(([t, p]) => ctx.fillText(t, p[0], p[1] + 14));
    ctx.textAlign = "left";
  }

  if (o.bare) return { drawn, moonIn };
  // ── object outline, centre mark and neighbour labels ──
  ctx.font = o.font || "13px VT323, monospace";
  if (o.size && !o.bodyCentered) {
    const [maj, min, pa] = o.size;
    const rx = Math.tan((maj / 120) * RAD) * S, ry = Math.tan((min / 120) * RAD) * S;
    if (rx > 3) {
      ctx.setLineDash([4, 4]); ctx.strokeStyle = "rgba(255,213,107,0.85)"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, paAngle(pa), 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  if (!o.bodyCentered) {
    ctx.strokeStyle = "#ffd56b"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 6, cy); ctx.lineTo(cx - 2, cy); ctx.moveTo(cx + 2, cy); ctx.lineTo(cx + 6, cy); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy - 2); ctx.moveTo(cx, cy + 2); ctx.lineTo(cx, cy + 6); ctx.stroke();
  }
  const boxes = [[cx - 8, cy - 8, cx + 8, cy + 8]];
  const free = (b) => !boxes.some((q) => b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1]);
  for (const n of o.neighbours || []) {
    const p = proj(n.ra, n.dec); if (!inView(p, -4)) continue;
    if (o.level && sl * Math.sin(n.dec * RAD) + cl * Math.cos(n.dec * RAD) * Math.cos(lst - n.ra * RAD) < 0) continue;
    if (Math.hypot(p[0] - cx, p[1] - cy) < 10) continue;
    const tw = ctx.measureText(n.name).width, box = [p[0] + 4, p[1] - 14, p[0] + 6 + tw, p[1] - 1];
    if (!free(box)) continue;
    boxes.push(box);
    ctx.fillStyle = n.star ? "rgba(200,210,255,0.85)" : "rgba(255,213,107,0.9)";
    if (!n.star) ctx.fillRect(Math.round(p[0]) - 1, Math.round(p[1]) - 1, 3, 3);
    ctx.fillText(n.name, p[0] + 5, p[1] - 4);
  }

  // ── sensor frame: dim outside, outline, readouts ──
  ctx.fillStyle = "rgba(2,3,10,0.5)";
  ctx.fillRect(0, 0, W, cy - fy); ctx.fillRect(0, cy + fy, W, H - (cy + fy));
  ctx.fillRect(0, cy - fy, cx - fx, 2 * fy); ctx.fillRect(cx + fx, cy - fy, W - (cx + fx), 2 * fy);
  ctx.strokeStyle = "#ffd56b"; ctx.lineWidth = 1.5; ctx.strokeRect(cx - fx, cy - fy, 2 * fx, 2 * fy);
  ctx.fillStyle = "#ffd56b";
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { ctx.fillRect(cx + sx * fx - (sx > 0 ? 6 : 0), cy + sy * fy - (sy > 0 ? 3 : 0), 6, 3); ctx.fillRect(cx + sx * fx - (sx > 0 ? 3 : 0), cy + sy * fy - (sy > 0 ? 6 : 0), 3, 6); });

  // north arrow (and zenith when level)
  const arrow = (ang, label, col, ox) => {
    const ax = ox, ay = 22, L = 12;
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ax - Math.cos(ang) * L, ay - Math.sin(ang) * L); ctx.lineTo(ax + Math.cos(ang) * L, ay + Math.sin(ang) * L); ctx.stroke();
    ctx.beginPath(); ctx.arc(ax + Math.cos(ang) * L, ay + Math.sin(ang) * L, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.font = o.font || "13px VT323, monospace"; ctx.fillText(label, ax + Math.cos(ang) * (L + 6) - 3, ay + Math.sin(ang) * (L + 6) + 4);
  };
  arrow(paAngle(0), o.northLabel, "#9fb3ff", 22);
  return { drawn, moonIn };
}

const FRAME_COMPASS = { en: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"], es: ["N", "NE", "E", "SE", "S", "SO", "O", "NO"] };
const BODY_NAMES = { en: { moon: "Moon", sun: "Sun", venus: "Venus", mars: "Mars", jupiter: "Jupiter", saturn: "Saturn" }, es: { moon: "Luna", sun: "Sol", venus: "Venus", mars: "Marte", jupiter: "Júpiter", saturn: "Saturno" } };

function FrameCanvas(props) {
  const ref = useRef(null), wrap = useRef(null);
  const [w, setW] = useState(360);
  const [tick, setTick] = useState(0);
  const [mwReady, setMwReady] = useState(!!_mw);
  useEffect(() => { if (!_mw) loadMw().then(() => setMwReady(true)); }, []);
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const upd = () => setW(Math.max(240, Math.min(720, Math.floor(el.clientWidth))));
    upd();
    let ro = null;
    try { ro = new ResizeObserver(upd); ro.observe(el); } catch { window.addEventListener("resize", upd); }
    return () => { if (ro) ro.disconnect(); else window.removeEventListener("resize", upd); };
  }, []);
  const onImage = useRef(null);
  onImage.current = () => setTick((x) => x + 1);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    let res = { drawn: [], moonIn: false };
    try { res = drawFrame(cv, { ...props, W: w, onImage: () => onImage.current && onImage.current() }); } catch (e) { /* keep last frame */ }
    if (props.onDrawn) props.onDrawn(res);
  });
  return (
    <div ref={wrap} className="fx-canvas-wrap">
      <canvas ref={ref} className="fx-canvas" role="img" aria-label={props.aria || "Frame preview"} data-mw={mwReady ? 1 : 0} data-t={tick} />
    </div>
  );
}

// ── LENS PAIRING PANEL: frame preview + exposure ranges ─────────────────────
function lensDefault(t, kit) {
  const sys = SYSTEMS[kit.sys] || SYSTEMS.mft;
  const pick = kitLensesFor(t, kit).map((id) => sys.lenses.find((l) => l.id === id)).filter(Boolean);
  const owned = pick.filter((l) => !isFuture(l.id));
  return (owned[0] || pick[0] || sys.lenses[0]).id;
}
const isFuture = (id) => PLATFORM !== "web" && !!(LENS_BY_ID[id] && LENS_BY_ID[id].future);
function autoFocal(lens, size, cls, sw, sh) {
  const [fmin, fmax] = lens.f;
  if (fmin === fmax) return fmin;
  if (!size || cls === "wide" || cls === "meteor") return fmin;
  const fill = 0.65;
  const fl = (sw / 2) / Math.tan(((size[0] / 60) / fill / 2) * RAD);
  const fs = (sh / 2) / Math.tan(((size[1] / 60) / fill / 2) * RAD);
  return Math.max(fmin, Math.min(fmax, Math.round(Math.min(fl, fs) / 5) * 5));
}
const fmtDeg = (d) => (d >= 10 ? `${d.toFixed(0)}°` : d >= 1 ? `${d.toFixed(1)}°` : `${Math.round(d * 60)}′`);
const fmtAng = (m) => (m >= 60 ? `${(m / 60).toFixed(1)}°` : m >= 10 ? `${Math.round(m)}′` : m >= 1 ? `${Math.round(m * 10) / 10}′` : `${Math.round(m * 60)}″`);
const fmtSize = (s) => (Math.abs(s[0] - s[1]) < 0.01 * s[0] ? fmtAng(s[0]) : `${fmtAng(s[0])} × ${fmtAng(s[1])}`);
const canvasFont = (theme, big) => (theme === "pixel" ? `${big ? 14 : 13}px VT323, monospace` : `${big ? 12 : 11}px Inter, system-ui, sans-serif`);

function FrameExposure({ t, u, lang, site, night, tn, jd: jdProp, goGear }) {
  const X = EXP_TEXT[lang];
  const [kit] = useKit();
  const [theme] = useTheme();
  const K = kitInfo(kit);
  const cat = CATALOG[t.id] || {};
  const cls = expClass(t);
  const when = jdProp ? null : (tn && tn.best && tn.best.t) || (night.astroDusk && night.astroDawn ? new Date((night.astroDusk.getTime() + night.astroDawn.getTime()) / 2) : new Date());
  const jd = jdProp || jdOf(when);
  let size = OBJ_SIZE[t.id] || null;
  if (cat.body) { const d = bodyRadiusDeg(cat.body, jd) * 120; size = cat.body === "saturn" ? [d * 2.25, d, 90] : [d, d, 0]; }
  const ph = usePhotos();
  const recIds = useMemo(() => kitLensesFor(t, kit), [t.id, kit.sys, kit.body]);
  const [lensSel, setLensSel] = useState(null);
  const lensId = lensSel && K.sys.lenses.some((l) => l.id === lensSel) ? lensSel : lensDefault(t, kit);
  const lens = K.sys.lenses.find((l) => l.id === lensId) || K.sys.lenses[0];
  const [fSel, setFSel] = useState(null);
  const [tc, setTc] = useState("none");
  const [nSel, setNSel] = useState(null);
  const [cam, setCam] = useState(0);
  const [level, setLevel] = useState(cls === "wide" || cls === "meteor");
  const [lines, setLines] = useState(cls === "wide" || cls === "meteor");
  const [nb, setNb] = useState(t.filter === "essential");
  const [allLenses, setAllLenses] = useState(false);
  const [photosOn, setPhotosOnState] = useState(() => store.get("cg-photos", OFFLINE || PLATFORM === "web"));
  const [drawnIds, setDrawnIds] = useState([]);
  const [moonIn, setMoonIn] = useState(false);
  const setLens = (id) => { setLensSel(id); setFSel(null); setTc("none"); setNSel(null); };
  const setPhotosOn = (v) => { setPhotosOnState(v); store.set("cg-photos", v); if (v) loadPhotos(); };
  useEffect(() => { if (photosOn) loadPhotos(); }, [photosOn]);

  const tcK = (lens.tc || []).find((x) => x[0] === tc)?.[1] || 1;
  const fBase = fSel != null && fSel >= lens.f[0] && fSel <= lens.f[1] ? fSel : autoFocal(lens, size, cls, K.sw, K.sh);
  const f = fBase * tcK;
  const N0 = nSel != null && lens.N.includes(nSel) ? nSel : lens.N[0];
  const N = Math.round(N0 * tcK * 10) / 10;
  const center = cat.body ? bodyRaDec(cat, jd) : { ra: (cat.ra || 0) * 15, dec: cat.dec || 0 };
  const lvlOk = !!site && level;
  const baseRot = useMemo(() => {
    if (!lvlOk) return 0;
    const h = altAz(center.ra, center.dec, site.lat, site.lon, jd);
    if (h.alt > 89) return 0;
    const up = raDecFromAltAz(Math.min(89.5, h.alt + 0.5), h.az, site.lat, site.lon, jd);
    const a0 = center.ra * RAD, d0 = center.dec * RAD, a = up.ra * RAD, d = up.dec * RAD;
    const Xs = -(Math.cos(d) * Math.sin(a - a0)), Ys = -(Math.cos(d0) * Math.sin(d) - Math.sin(d0) * Math.cos(d) * Math.cos(a - a0));
    return -90 - Math.atan2(Ys, Xs) * DEG;
  }, [lvlOk, center.ra, center.dec, jd, site && site.lat, site && site.lon]);
  const rot = baseRot - cam;
  const align = () => {
    if (!size) return;
    const th = Math.atan2(-Math.cos(size[2] * RAD), -Math.sin(size[2] * RAD)) * DEG;
    let c = baseRot + th; c = ((c % 180) + 180) % 180; if (c > 90) c -= 180;
    setCam(Math.round(c));
  };
  const fw = 2 * Math.atan(K.sw / 2 / f) * DEG, fh = 2 * Math.atan(K.sh / 2 / f) * DEG;
  let fill = null;
  if (size && cls === "planet") {
    const px = Math.max(1, Math.round((size[0] * 60) / (206.265 * K.pitch / f)));
    fill = { k: "planet", txt: lang === "es" ? `Disco de ~${px} px — recorta y apila video` : `Disk ~${px} px across — crop and stack video` };
  } else if (size) {
    const r = Math.max(size[0] / 60 / fw, size[1] / 60 / fh);
    if (r > 0.95) {
      const nx = Math.max(1, Math.ceil((size[0] / 60 - fw * 0.2) / (fw * 0.8))), ny = Math.max(1, Math.ceil((size[1] / 60 - fh * 0.2) / (fh * 0.8)));
      fill = { k: "over", txt: X.fill.over(nx, ny), pct: Math.round(r * 100) };
    } else fill = { k: r < 0.05 ? "tiny" : r < 0.15 ? "small" : r < 0.35 ? "room" : r <= 0.8 ? "good" : "tight", pct: Math.round(r * 100) };
  }
  const neighbours = useMemo(() => {
    const out = [];
    for (const o of TARGETS) {
      const c = CATALOG[o.id]; if (!c || c.body || o.id === t.id || o.type === "Meteor Shower" || o.type === "Milky Way") continue;
      if (out.some((n) => Math.abs(n.ra - c.ra * 15) < 0.05 && Math.abs(n.dec - c.dec) < 0.05)) continue;
      out.push({ ra: c.ra * 15, dec: c.dec, name: tr(o, "name", lang) });
    }
    const hop = (cat.hop || "") + (cat.hop_es || "");
    for (const [n, ra, dec, mag] of GUIDE_STARS) if (mag < 2.6 || hop.includes(n)) out.push({ ra: ra * 15, dec, name: n, star: true });
    return out;
  }, [t.id, lang]);

  const plan = exposurePlan({ t, cat, lens, f, N, kit: { pitch: K.pitch, crop: K.crop, trackers: kit.trackers }, bortle: site && site.bortle, nb, moon: tn ? { up: tn.moonUp, illum: night.moon.illum } : null, phaseIllum: night.moon.illum, frameShortDeg: fh });
  const credits = useMemo(() => {
    if (!ph.list || !photosOn) return [];
    const by = new Map(ph.list.map((p) => [p.id, p]));
    return [...new Set(drawnIds.map((id) => by.get(id)?.cr).filter(Boolean))];
  }, [drawnIds, ph.list, photosOn]);
  const lensChoices = allLenses || !recIds.length ? K.sys.lenses.map((l) => l.id) : recIds;
  const zoom = lens.f[0] !== lens.f[1];
  const noteText = (n) => (Array.isArray(n) ? X.notes[n[0]](...n.slice(1)) : X.notes[n]);
  const mountName = (m) => (m === "none" ? X.mounts.none : tr(TRACKERS[m], "name", lang));

  return (
    <div className="fx">
      <div className="fx-title">▸ {X.title}</div>
      <div className="fx-kit dim small">{gearName(K.body.name, lang)} · {K.sys.short}{goGear && <> · <button className="link-inline" onClick={goGear}>{X.changeKit}</button></>}</div>
      <div className="fx-lenses">
        {lensChoices.map((id) => { const L = K.sys.lenses.find((l) => l.id === id); if (!L) return null; return <button key={id} className={`fx-chip ${id === lensId ? "on" : ""} ${isFuture(id) ? "future" : ""} ${recIds.includes(id) ? "rec" : ""}`} onClick={() => setLens(id)}>{gearName(L.name, lang)}</button>; })}
        <button className="fx-chip ghost" onClick={() => setAllLenses(!allLenses)}>{allLenses ? X.recLenses : X.allLenses}</button>
      </div>
      {lens.note && <p className="dim small fx-lensnote">{tr(lens, "note", lang)}</p>}
      <div className="fx-ctl-row">
        {zoom && <label className="fx-ctl fx-grow"><span className="control-label">{X.focal} · {Math.round(f)} mm ({Math.round(f * K.crop)} mm FF)</span>
          <input type="range" min={lens.f[0]} max={lens.f[1]} step={1} value={fBase} onChange={(e) => setFSel(Number(e.target.value))} /></label>}
        {!zoom && <span className="fx-ctl fx-static"><span className="control-label">{X.focal}</span><b>{Math.round(f * 10) / 10} mm · {Math.round(f * K.crop)} mm FF</b></span>}
        {lens.tc && <label className="fx-ctl"><span className="control-label">{X.tc}</span>
          <select className="input" value={tc} onChange={(e) => setTc(e.target.value)}>{lens.tc.map(([k]) => <option key={k} value={k}>{TC_LABEL[lang][k]}</option>)}</select></label>}
        <label className="fx-ctl"><span className="control-label">{X.ap}</span>
          <select className="input" value={N0} onChange={(e) => setNSel(Number(e.target.value))}>{lens.N.map((n) => <option key={n} value={n}>f/{Math.round(n * tcK * 10) / 10}</option>)}</select></label>
      </div>
      <FrameCanvas ra0={center.ra} dec0={center.dec} f={f} sw={K.sw} sh={K.sh} rot={rot} level={lvlOk} lat={site ? site.lat : 15} lon={site ? site.lon : -91} jd={jd}
        bortle={site && site.bortle} showLines={lines} showPhotos={photosOn && ph.status === "ready"} photos={ph.list} size={size}
        bodyCentered={cat.body || null} allowSun={cls === "sun"} neighbours={neighbours} compass={FRAME_COMPASS[lang]} bodyNames={BODY_NAMES[lang]}
        font={canvasFont(theme)} fontBig={canvasFont(theme, true)}
        northLabel="N" aria={`${tr(t, "name", lang)} — ${lens.name}`}
        onDrawn={(r) => { const s = r.drawn.join(","); if (s !== drawnIds.join(",")) setDrawnIds(r.drawn); if (r.moonIn !== moonIn) setMoonIn(r.moonIn); }} />
      <div className="fx-toggles">
        <button className={`fx-tog ${photosOn ? "on" : ""}`} onClick={() => setPhotosOn(!photosOn)} aria-pressed={photosOn}>{X.photos}</button>
        <button className={`fx-tog ${lines ? "on" : ""}`} onClick={() => setLines(!lines)} aria-pressed={lines}>{X.lines}</button>
        <button className={`fx-tog ${level ? "on" : ""}`} onClick={() => setLevel(!level)} aria-pressed={level}>{level ? X.level : X.eq}</button>
        <button className="fx-tog" onClick={() => setCam(0)}>{X.reset}</button>
        <button className="fx-tog" onClick={() => setCam(90)}>{X.portrait}</button>
        {size && size[0] / Math.max(1, size[1]) > 1.25 && <button className="fx-tog" onClick={align}>{X.align}</button>}
      </div>
      <label className="fx-ctl fx-rot"><span className="control-label">{X.rotate} {cam}°</span>
        <input type="range" min={-90} max={90} step={5} value={cam} onChange={(e) => setCam(Number(e.target.value))} /></label>
      {photosOn && ph.status === "loading" && <p className="dim small">{X.loadingPhotos}</p>}
      {photosOn && (ph.status === "error" || ph.status === "unavailable") && <p className="dim small">{X.photosOff}</p>}
      <div className="fx-fill">
        <span>{X.frame(fmtDeg(fw), fmtDeg(fh))}</span>
        {size ? <span> · {X.object(fmtSize(size))} · <b className={`fill-${fill.k}`}>{fill.txt || `${X.fill[fill.k]} (${fill.pct}%)`}</b></span> : <span> · {X.field}</span>}
        {moonIn && <span className="fx-moon"> · ☾ {lang === "es" ? "la Luna está en el cuadro" : "the Moon is in the frame"}</span>}
      </div>
      {credits.length > 0 && <div className="fx-credit">{X.credit}: {credits.join(" · ")}</div>}
      {plan.nbAllowed && plan.cls === "nebula" ? (
        <label className="check fx-nb"><input type="checkbox" checked={nb} onChange={(e) => setNb(e.target.checked)} /> {X.nbToggle}</label>
      ) : (lens.noFilter && ["nebula", "galaxy"].includes(plan.cls) ? <p className="dim small">{X.nbNo}</p> : null)}
      <div className="hour-table-wrap">
        <table className="fx-table">
          <thead><tr><th>{X.table.mount}</th><th>{X.table.sub}</th><th>ISO</th><th>{X.table.why}</th></tr></thead>
          <tbody>{plan.rows.map((r) => (
            <tr key={r.mount} className={`${r.role ? "fx-role" : ""} ${r.poor ? "fx-poor" : ""}`}>
              <td>{mountName(r.mount)}{r.role && <span className="fx-star" title={X.role}> ★</span>}</td>
              <td><b>{fmtRange(r.min, r.max)}</b>{r.stretch ? <div className="fx-sub">{X.stretch(fmtSec(r.stretch))}</div> : null}</td>
              <td>{r.iso}</td>
              <td className="fx-why">{X.limit[r.limit]}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="dim small">★ {X.role} · f/{N} · {gearName(K.body.name, lang)} ({K.pitch} µm) · Bortle {site && site.bortle != null ? site.bortle : "?"}{plan.nb ? (PLATFORM === "web" ? (lang === "es" ? " · filtro de banda dual" : " · dual-band filter") : " · STC Duo") : ""}</p>
      {plan.notes.length > 0 && <ul className="fx-notes">{plan.notes.map((n, i) => <li key={i}>{noteText(n)}</li>)}</ul>}
    </div>
  );
}
