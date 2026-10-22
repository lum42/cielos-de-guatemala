# Cielos de Guatemala — notes for Claude

Night-sky guide for Guatemala (15°N) built from one source into two apps:

- **Website** (`docs/`, GitHub Pages, https://lum42.github.io/cielos-de-guatemala/) for the general public: stargazing first, dark-sky awareness, Spanish by default.
- **Claude build** (`dist/claude/`), the owner's personal app, published as a claude.ai artifact: https://claude.ai/artifact/RPidS2kE3N487LJZREbXhW. Photographer mode by default, the owner's own gear (OM System MFT kit, Sky-Watcher GTi + Star Adventurer 2i), shared database, "Ask your mentor" (Claude), forecast refresh button.

The owner (Lumz) is learning astronomy and astrophotography from first principles; Claude acts as their astronomy mentor. Tone in the app: warm, precise, plain language, no hype.

## Build and test

```sh
npm install                          # esbuild 0.21.5, react 18.3.1
python3 -m pip install pillow fonttools brotli  # for tools/web_assets.py; on Windows `pip` can belong to another Python than `python3`
./build.sh [TRIGGER_ID]              # bash + python3; on Windows use Git Bash or WSL (build.sh calls `python3`)
node test/smoke.js web               # every tab × mode × theme × language, desktop + 390px phone
node test/flow.js                    # switches, kit choice, mentor links, offline service worker, Claude-build mock
```

Tests need Playwright (a dev dependency; once per machine: `npx playwright install chromium`). `.gitattributes` keeps LF line endings on Windows checkouts, which bash needs for `build.sh`. They fail on page errors, console errors and horizontal overflow; `--shots` saves screenshots to `test/shots/`. Run both before every push.

`./build.sh` writes:
- `dist/claude/cielos_de_guatemala.html` (everything inline) and `dist/claude/app.js`
- `dist/web/`, then copies it to `docs/`, which GitHub Pages serves. Commit `docs/` with the source change.

## How the code is put together

- **No modules.** `build.sh` concatenates `src/` files in a fixed order (see `SRC=` in build.sh) into one scope, then bundles with esbuild. Every top-level name is global to the app; check for name clashes when adding files, and add new files to `SRC=` in the right order.
- **Placeholders** replaced by sed at build time: `__PLATFORM__` (`"web"` | `"claude"`), `__APP_VERSION__`, `__TRIGGER_ID__` (Claude build only).
- `PLATFORM === "web"`: data on the device (localStorage keys all start `cg-`), forecasts from Open-Meteo in the browser (`fetchOpenMeteo`, 1 h cache), service worker in `web/sw.js`, install prompt.
- `PLATFORM === "claude"`: `window.claude.use("db" | "user" | "sample" | "mcp" | "downloads")`; collections `sites`, `forecasts`, `log`, `places`, `loadout/state`, `config/app` (asset ids for `photos.json` and `app.js`). Personal content (gear list, two-rig split, session planner, STC filter wording) only shows here.
- Lint for undefined names on the concatenated file (`dist/claude/main.jsx`) with ESLint `no-undef` + `react/jsx-no-undef`; esbuild does not catch them.

| File | Holds |
| --- | --- |
| `src/prelude.js` | React imports, `store`, tiny global stores (`useTheme`, `useMode`), `PLATFORM` |
| `src/data_base.js`, `src/data_extra.js` | Targets, owner's lenses, sites, loadout, workflow (personal data) |
| `src/catalog.js` | Object coordinates, sizes, facts, how-to-find hops; `SITE_COORDS` |
| `src/systems.js` | Canon / Nikon / Sony / Fujifilm / MFT bodies, lenses, trackers; `kitLensesFor` ranks kit lenses by FF-equivalent focal match |
| `src/highlights.js` | 24 naked-eye / binocular highlights, meteor showers |
| `src/lessons.js` | Mentor lessons (4 levels), Bortle table, dark-sky copy |
| `src/public.js` | Public variants of personal content; Spanish site names (`siteName`), fact and gear-name localizers |
| `src/exposure.js` | NPF rule, tracked limits scaled by pixel pitch, sky-glow cap, `exposurePlan` |
| `src/astro.js` | Sun/Moon/planets (low precision), twilight, rise/set, `nightInfo`, moon phases, planet events, core window |
| `src/skydata.js` | Packed star catalog ≤ mag 6, Milky Way map, constellation lines (generated; HYG data is CC BY-SA) |
| `src/frame.jsx` | Canvas sky/frame preview with photo overlays; `FrameExposure` |
| `src/theme.jsx` | Moving sky backdrop, top controls (mode / theme / language) |
| `src/calendar.jsx`, `src/darksky.jsx`, `src/mentor.jsx`, `src/gear.jsx`, `src/stargazer.jsx` | The newer tabs |
| `src/app.jsx` | App shell, Tonight / Sky / Targets / Sites / Field / Log tabs, offline copy (Claude build) |
| `src/themes.css`, `src/page.css`, `src/new.css` | Styles; `page.css` is the original 8-bit sheet made token-driven |

## Rules that keep it working

- **Every visible string in both languages.** Data objects carry `field` and `field_es`; read them with `tr(obj, "field", lang)`. UI strings live in per-module `{ en, es }` tables.
- **Themes** are `night`, `red`, `pixel`, set as `data-sky` on `<html>`. Never use `data-theme`: the claude.ai viewer sets that attribute itself. Colors come from CSS tokens; `--k` / `--kd` scale font sizes per theme. Red mode is a fixed multiply overlay.
- Respect `prefers-reduced-motion` (the sky backdrop stops; pixel stars stop twinkling).
- **Public photos:** only ESO and NOIRLab images (CC BY 4.0) go in `photos-public.json`. `build/photos.json` (the full Stellarium set) is gitignored and only used for the Claude build.
- The website makes no network requests except Open-Meteo (credited in the footer, CC BY 4.0). No trackers, no analytics.
- Keep phone layouts free of horizontal scroll; the smoke test checks it.
- Times are Guatemala local (UTC−6, no DST): use `hhmm`, `gt`, `todayGT`.

## Publishing the Claude build

Done from a Claude session that has the Artifact tool (the owner's "Astrophotography" project chat):
1. `./build.sh trig_01B37nEptpzVX2YNHeXUfBXK`
2. Republish `dist/claude/cielos_de_guatemala.html` to the artifact URL above (keep its capabilities).
3. Upload `dist/claude/app.js` as an asset and update `config/app.appJs` (offline copies embed it; it must match the published version).

A scheduled task (`trig_01B37nEptpzVX2YNHeXUfBXK`, 12:48 and 16:48 Guatemala) refreshes `forecasts` in this artifact and in the older "Guatemala Night Sky" artifact from Clear Outside.

## Open items

- No license chosen for the code yet (data and fonts keep theirs, see CREDITS.md). Ask the owner before adding one.
