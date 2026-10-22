# Cielos de Guatemala

**Español** · [English](#english)

Una guía del cielo nocturno de Guatemala (15°N) para observar, fotografiar y cuidar nuestros cielos oscuros.

**Ábrela aquí:** https://lum42.github.io/cielos-de-guatemala/

- **Esta noche**: qué se ve a simple vista y con binoculares, a qué hora, hacia qué punto cardinal y a cuántos puños sobre el horizonte. Pronóstico de nubes por hora, la Luna y las lluvias de meteoros.
- **Cielo**: mapa del cielo para cualquier hora de la noche desde el sitio que elijas, con el recorrido de cada objeto.
- **Calendario**: fases de la Luna, lluvias de meteoros con aviso de luz lunar, planetas y la temporada del centro de la Vía Láctea.
- **Cielos oscuros**: simulador de contaminación lumínica en la escala de Bortle, por qué importa la noche oscura y qué puede hacer cualquiera.
- **Mentor**: 17 lecciones paso a paso, de mirar el cielo a procesar fotos, y misiones del mes.
- **Modo fotógrafo**: objetivos de temporada, encuadre real con tu cámara y lente (Canon, Nikon, Sony, Fujifilm, OM System / Olympus / Panasonic), rangos de exposición seguros en trípode o con rastreador.
- Tres temas: Noche, Rojo (para no perder la visión nocturna) y 8-bit. Español e inglés.
- Funciona sin señal: instálala desde el navegador y abre una vez con conexión para guardar el pronóstico.

**Privacidad**: sin cuentas, sin anuncios y sin rastreo. Tus ajustes se guardan solo en tu dispositivo; el pronóstico se pide directamente a Open-Meteo.

### ¿Por qué?

Guatemala todavía tiene cielos donde la Vía Láctea proyecta sombra. Desde los 15°N se ven estrellas que casi nadie ve desde Estados Unidos o Europa: la Cruz del Sur, Alfa Centauri, Omega Centauri, Canopus. Esta app quiere que más gente salga a mirar, y que quien mire quiera cuidar la noche.

---

## English

A night-sky guide for Guatemala (15°N): what to look at tonight, how to photograph it, and how to keep our skies dark.

**Open it:** https://lum42.github.io/cielos-de-guatemala/

- **Tonight**: what's visible by eye and with binoculars, when, which direction and how many fists above the horizon; hourly cloud forecast, the Moon and meteor showers.
- **Sky**: a sky chart for any time of the night from the chosen site, with each object's path.
- **Calendar**: Moon phases, meteor showers with a moonlight verdict, planet events and the Milky Way core season.
- **Dark Skies**: a light-pollution simulator on the Bortle scale, why darkness matters and what anyone can do.
- **Mentor**: 17 step-by-step lessons, from naked-eye basics to processing, plus monthly missions.
- **Photographer mode**: seasonal targets, true framing for your camera and lens (Canon, Nikon, Sony, Fujifilm, OM System / Olympus / Panasonic) and safe exposure ranges on a tripod or a tracker.
- Night, Red (night-vision) and 8-bit themes. Spanish and English.
- Works offline once installed from the browser; open it once with signal to store the forecast.

**Privacy**: no accounts, ads or tracking. Settings stay on your device; forecasts are requested straight from Open-Meteo.

## Build

Requirements: Node 18+, Python 3 with Pillow, fontTools and brotli.

```sh
npm install
npx playwright install chromium               # browser for the tests
python3 -m pip install pillow fonttools brotli
./build.sh                 # → docs/ (the website) and dist/claude/ (the Claude artifact build); on Windows run it from Git Bash
node test/smoke.js web     # every tab × mode × theme, desktop and phone
node test/flow.js          # switches, kit choice, mentor links, offline service worker
```

One source, two builds: `src/` is concatenated and bundled with esbuild; `PLATFORM` is `"web"` for the public site (data on the device, Open-Meteo forecasts, service worker) or `"claude"` for the Claude artifact (shared database, scheduled forecast refresh, ask-your-mentor).

| Path | What it holds |
| --- | --- |
| `src/astro.js` | Sun, Moon and planet positions, twilight, rise/set, moon phases, planet events |
| `src/skydata.js` | Packed star catalog (≤ mag 6), Milky Way brightness map, constellation lines |
| `src/catalog.js`, `src/highlights.js` | Photo targets and naked-eye highlights with how-to-find notes |
| `src/systems.js` | Camera bodies, lenses and trackers for the five systems |
| `src/exposure.js`, `src/frame.jsx` | NPF rule, tracked limits, sky-glow caps, the framing preview |
| `src/lessons.js`, `src/mentor.jsx` | Lessons, missions, dark-sky content |
| `web/` | Website shell: `index.html`, service worker, manifest |
| `docs/` | Built website served by GitHub Pages |

See [CREDITS.md](CREDITS.md) for data, image and font sources.

## License · Licencia

The code is released under the [MIT License](LICENSE). MIT covers the code only: data, photos and fonts keep their own licenses, listed in [CREDITS.md](CREDITS.md). The HYG-derived star data in `src/skydata.js` stays CC BY-SA, the reference photos are CC BY 4.0, and the fonts are under the SIL Open Font License.

El código se publica bajo la [licencia MIT](LICENSE). La MIT cubre solo el código: los datos, las fotos y las fuentes conservan sus propias licencias, detalladas en [CREDITS.md](CREDITS.md). Los datos estelares derivados de HYG en `src/skydata.js` siguen bajo CC BY-SA, las fotos de referencia son CC BY 4.0 y las fuentes usan la SIL Open Font License.
