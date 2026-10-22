#!/usr/bin/env python3
"""Static assets for the public website build.

usage: python3 tools/web_assets.py <build dir> <out dir> <fonts css out>

  <out>/fonts/*.woff2          font files (the Claude build embeds them as base64 instead)
  <fonts css out>              @font-face rules pointing at fonts/*.woff2
  <out>/photos-public.json     reference photos limited to openly licensed (ESO / NOIRLab, CC BY 4.0) images
  <out>/icons/*.png            app icons (any + maskable), favicon, apple-touch-icon
  <out>/og.png                 1200x630 link-preview image
"""
import io, json, math, os, random, re, shutil, sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

build, out, fonts_css_out = sys.argv[1:4]
os.makedirs(os.path.join(out, "fonts"), exist_ok=True)
os.makedirs(os.path.join(out, "icons"), exist_ok=True)

# ── fonts: same @font-face rules as the embedded build, but as files ──
css = open(os.path.join(build, "fonts.css"), encoding="utf-8").read()
rules = []
for block in re.findall(r"@font-face\s*\{[^}]*\}", css):
    fam = re.search(r"font-family:\s*'([^']+)'", block).group(1)
    wt = re.search(r"font-weight:\s*(\d+)", block).group(1)
    fname = f"{fam.lower().replace(' ', '-')}-latin-{wt}-normal.woff2"
    src = os.path.join(build, "fonts", fname)
    if not os.path.exists(src):
        sys.exit(f"missing font file {src}")
    shutil.copy(src, os.path.join(out, "fonts", fname))
    rules.append(re.sub(r"src:\s*url\(data:[^)]*\)", f"src:url(fonts/{fname})", block))
open(fonts_css_out, "w", encoding="utf-8").write("\n".join(rules) + "\n")

# ── photos: only openly licensed images go on the public site ──
# build/photos.json is the full Stellarium pack (used by the Claude build, not committed); build/photos-public.json
# is the openly licensed subset that ships with the website and the public repository.
full = os.path.join(build, "photos.json")
pub_path = os.path.join(build, "photos-public.json")
if os.path.exists(full):
    ph = json.load(open(full, encoding="utf-8"))
    keep = [t for t in ph["tex"] if re.search(r"\bESO\b|NOIRLab", t.get("cr", ""))]
    pub = {"source": "Stellarium nebula textures; public site limited to ESO and NOIRLab images (CC BY 4.0), credited per image", "tex": keep}
    json.dump(pub, open(pub_path, "w", encoding="utf-8"), separators=(",", ":"))
    print(f"photos-public.json: {len(keep)} of {len(ph['tex'])} images")
shutil.copy(pub_path, os.path.join(out, "photos-public.json"))

# ── artwork ──
def font_from_woff2(name, size):
    from fontTools.ttLib import TTFont
    f = TTFont(os.path.join(build, "fonts", name))
    f.flavor = None
    buf = io.BytesIO(); f.save(buf); buf.seek(0)
    return ImageFont.truetype(buf, size)

def sky(w, h, seed=7, stars=1.0):
    """Deep-navy gradient, faint Milky Way band, scattered stars."""
    top, bot = (24, 32, 84), (6, 8, 22)
    grad = Image.new("RGB", (1, 256))
    for y in range(256):
        k = y / 255
        grad.putpixel((0, y), tuple(round(top[i] * (1 - k) + bot[i] * k) for i in range(3)))
    img = grad.resize((w, h), Image.BILINEAR)
    band = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(band)
    for i in range(18):
        cx = w * (0.15 + 0.7 * i / 17); cy = h * (0.78 - 0.55 * i / 17)
        r = min(w, h) * (0.10 + 0.05 * math.sin(i * 1.7))
        d.ellipse([cx - r * 1.6, cy - r, cx + r * 1.6, cy + r], fill=26)
    band = band.filter(ImageFilter.GaussianBlur(min(w, h) * 0.06))
    img = Image.composite(Image.new("RGB", (w, h), (150, 160, 215)), img, band)
    rnd = random.Random(seed)
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    unit = min(w, h) / 512
    for _ in range(int(w * h / (2600 * unit * unit) * stars)):
        x, y = rnd.random() * w, rnd.random() * h * 0.82
        m = rnd.random() ** 3
        r = (0.6 + 2.2 * m) * unit
        col = rnd.choice([(255, 255, 255), (220, 228, 255), (255, 240, 214)])
        d.ellipse([x - r, y - r, x + r, y + r], fill=col + (int(90 + 165 * m),))
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")

def volcanoes(img, base, scale):
    """Silhouette of three cones (Agua, Fuego, Acatenango seen from the valley)."""
    w, h = img.size
    sil = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(sil)
    def cone(cx, peak, half, flat):
        pts = [(cx - half * 2.2, h), (cx - half * 0.55, base - (base - peak) * 0.55), (cx - flat, peak), (cx + flat, peak), (cx + half * 0.55, base - (base - peak) * 0.55), (cx + half * 2.2, h)]
        d.polygon(pts, fill=255)
    cone(w * 0.30, base - h * 0.34 * scale, w * 0.17 * scale, w * 0.018 * scale)
    cone(w * 0.70, base - h * 0.27 * scale, w * 0.14 * scale, w * 0.012 * scale)
    cone(w * 0.84, base - h * 0.30 * scale, w * 0.11 * scale, w * 0.01 * scale)
    d.rectangle([0, base, w, h], fill=255)
    sil = sil.filter(ImageFilter.GaussianBlur(max(1, w / 900)))
    rim = sil.filter(ImageFilter.GaussianBlur(max(2, w / 260)))
    glow = Image.new("RGB", (w, h), (60, 72, 140))
    img = Image.composite(glow, img, rim.point(lambda v: int(v * 0.35)))
    return Image.composite(Image.new("RGB", (w, h), (5, 7, 16)), img, sil)

def sparkle(img, cx, cy, r, col=(242, 196, 109)):
    w, h = img.size
    halo = Image.new("L", (w, h), 0)
    ImageDraw.Draw(halo).ellipse([cx - r * 0.95, cy - r * 0.95, cx + r * 0.95, cy + r * 0.95], fill=80)
    halo = halo.filter(ImageFilter.GaussianBlur(r * 0.45))
    img = Image.composite(Image.new("RGB", (w, h), col), img, halo)
    shape = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(shape)
    k = 0.16
    pts = []
    for i in range(8):
        ang = -math.pi / 2 + i * math.pi / 4
        rr = r if i % 2 == 0 else r * k
        pts.append((cx + rr * math.cos(ang), cy + rr * math.sin(ang)))
    d.polygon(pts, fill=255)
    img = Image.composite(Image.new("RGB", (w, h), (255, 236, 190)), img, shape)
    core = Image.new("L", (w, h), 0)
    ImageDraw.Draw(core).ellipse([cx - r * 0.12, cy - r * 0.12, cx + r * 0.12, cy + r * 0.12], fill=255)
    return Image.composite(Image.new("RGB", (w, h), (255, 255, 250)), img, core.filter(ImageFilter.GaussianBlur(r * 0.04)))

def icon_art(size, safe):
    S = size * 4
    img = sky(S, S, seed=11, stars=0.55)
    pad = S * (1 - safe) / 2
    img = volcanoes(img, S - pad * 0.6 - S * 0.07, safe)
    img = sparkle(img, S * 0.5, pad + (S - 2 * pad) * 0.34, (S - 2 * pad) * 0.22)
    return img.resize((size, size), Image.LANCZOS)

def rounded(img, radius_frac=0.22):
    s = img.size[0]
    m = Image.new("L", (s * 4, s * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, s * 4 - 1, s * 4 - 1], radius=int(s * 4 * radius_frac), fill=255)
    out_img = img.convert("RGBA")
    out_img.putalpha(m.resize((s, s), Image.LANCZOS))
    return out_img

any512 = icon_art(512, 0.92)
rounded(any512).save(os.path.join(out, "icons", "icon-512.png"), optimize=True)
rounded(icon_art(192, 0.92)).save(os.path.join(out, "icons", "icon-192.png"), optimize=True)
icon_art(512, 0.74).save(os.path.join(out, "icons", "icon-maskable-512.png"), optimize=True)
icon_art(180, 0.86).save(os.path.join(out, "icons", "apple-touch-icon.png"), optimize=True)
rounded(icon_art(64, 0.96)).resize((32, 32), Image.LANCZOS).save(os.path.join(out, "icons", "favicon-32.png"), optimize=True)

# ── link-preview image ──
W, H = 1200, 630
og = sky(W * 2, H * 2, seed=3, stars=0.8)
og = volcanoes(og, H * 2 - 70, 0.62)
og = sparkle(og, W * 2 * 0.83, H * 2 * 0.22, 64)
og = og.resize((W, H), Image.LANCZOS)
d = ImageDraw.Draw(og)
title = font_from_woff2("cormorant-garamond-latin-600-normal.woff2", 96)
sub = font_from_woff2("inter-latin-400-normal.woff2", 30)
eyebrow = font_from_woff2("inter-latin-600-normal.woff2", 20)
d.text((80, 150), "15°N · GUATEMALA", font=eyebrow, fill=(184, 148, 90))
d.text((76, 186), "Cielos de Guatemala", font=title, fill=(246, 233, 201))
d.text((80, 318), "Qué ver esta noche · Astrofotografía · Cielos oscuros", font=sub, fill=(200, 206, 236))
d.text((80, 362), "What's up tonight · Astrophotography · Dark skies", font=sub, fill=(155, 163, 202))
og.save(os.path.join(out, "og.png"), optimize=True)
print("icons + og.png written")
