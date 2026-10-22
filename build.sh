#!/usr/bin/env bash
# Cielos de Guatemala — one source, two builds.
#
#   ./build.sh [TRIGGER_ID]
#
#   dist/claude/cielos_de_guatemala.html   the Claude artifact (everything inline, shared database)
#   dist/claude/app.js                     its bundle (uploaded as an asset so offline copies can embed it)
#   dist/web/ → docs/                      the public website (GitHub Pages serves docs/): index.html, app.js,
#                                          app.css, sw.js, manifest, icons, fonts, openly licensed photos
set -euo pipefail
cd "$(dirname "$0")"
TRIG="${1:-__TRIGGER_ID__}"
VER="v$(date -u +%Y%m%d%H%M%S)"
SITE_URL="${SITE_URL:-https://lum42.github.io/cielos-de-guatemala/}"
SRC=(prelude.js data_base.js data_extra.js catalog.js systems.js highlights.js lessons.js public.js exposure.js
     skydata.js astro.js frame.jsx theme.jsx calendar.jsx darksky.jsx mentor.jsx gear.jsx stargazer.jsx app.jsx)
CSS=(src/themes.css src/page.css src/new.css)

bundle() { # platform outdir trigger
  local platform="$1" out="$2" trig="$3"
  mkdir -p "$out"
  (cd src && cat "${SRC[@]}") \
    | sed -e "s/__TRIGGER_ID__/${trig}/" -e "s/__APP_VERSION__/${VER}/" -e "s/__PLATFORM__/${platform}/" > "$out/main.jsx"
  node_modules/.bin/esbuild "$out/main.jsx" --bundle --format=iife --jsx-factory=React.createElement --jsx-fragment=React.Fragment \
    --define:process.env.NODE_ENV='"production"' --minify --target=es2019 --legal-comments=none --log-level=warning --outfile="$out/app.js"
  if grep -q "</script" "$out/app.js"; then echo "ERROR: </script in $platform bundle" >&2; exit 1; fi
}

# ── Claude artifact ──
bundle claude dist/claude "$TRIG"
cat build/fonts.css "${CSS[@]}" > dist/claude/page.full.css
{
  echo '<title>Cielos de Guatemala</title>'
  echo '<meta name="claude:viewport-fit-sides" content="cover">'
  printf '<style id="cg-css">'; cat dist/claude/page.full.css; echo '</style>'
  echo '<div id="root"><div class="app"><header class="header"><div class="header-eyebrow">15°N · Guatemala</div><h1 class="header-title">Cielos de Guatemala</h1><div class="header-sub">Computing tonight'"'"'s sky…</div></header></div></div>'
  printf '<script>'; cat dist/claude/app.js; echo '</script>'
} > dist/claude/cielos_de_guatemala.html
echo "$VER" > dist/claude/VERSION

# ── public website ──
rm -rf dist/web && mkdir -p dist/web
bundle web dist/web.tmp none
mv dist/web.tmp/app.js dist/web/app.js && rm -rf dist/web.tmp
python3 tools/web_assets.py build dist/web dist/fonts.web.css
cat dist/fonts.web.css "${CSS[@]}" > dist/web/app.css
FONTS=$(cd dist/web && ls fonts/*.woff2 | sed 's/.*/"&"/' | paste -sd, -)
sed -e "s|__SITE_URL__|${SITE_URL}|g" web/index.html > dist/web/index.html
sed -e "s/__APP_VERSION__/${VER}/" -e "s|__FONT_LIST__|${FONTS}|" web/sw.js > dist/web/sw.js
cp web/manifest.webmanifest dist/web/
touch dist/web/.nojekyll
echo "$VER" > dist/web/VERSION

# GitHub Pages serves the website from docs/
rm -rf docs && cp -r dist/web docs

ls -la dist/claude/cielos_de_guatemala.html dist/claude/app.js dist/web
