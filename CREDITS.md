# Credits · Créditos

## Data

- **Weather forecasts** — [Open-Meteo.com](https://open-meteo.com/), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Requested directly from the visitor's browser; attribution is shown in the app footer.
- **Stars, Milky Way and constellation lines** — derived from [d3-celestial](https://github.com/ofrohn/d3-celestial) by Olaf Frohn (BSD 3-Clause). Star data comes from the [HYG Database](https://github.com/astronexus/HYG-Database) by David Nash (CC BY-SA); the packed star list in `src/skydata.js` keeps those share-alike terms. Milky Way outlines by José R. Vieira, as distributed with d3-celestial.
- **Sun, Moon and planet positions** — computed in the app with low-precision formulas: JPL's approximate Keplerian elements for the planets (E. M. Standish) and standard series for the Sun and Moon. Good to a few arcminutes for the Sun and planets and about 0.3° for the Moon.
- **Bortle scale** — John E. Bortle, *Sky & Telescope*, February 2001.
- **Responsible lighting principles** — [DarkSky International](https://darksky.org/resources/guides-and-how-tos/lighting-principles/), Five Principles for Responsible Outdoor Lighting.
- **Citizen science** — [Globe at Night](https://globeatnight.org/), a NOIRLab program.

## Reference photos

The framing preview overlays real photos on the sky. They come from the [Stellarium](https://stellarium.org/) nebula texture set and are credited one by one in the app.

- **Public website** (`docs/photos-public.json`): only images credited to **ESO** or **NOIRLab/NSF/AURA**, released under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Several were post-processed for Stellarium by Sun Shuwei.
- The full Stellarium set is used only in the private Claude build and is not part of this repository.

## Fonts

All under the [SIL Open Font License 1.1](https://openfontlicense.org/), packaged by [Fontsource](https://fontsource.org/):

- **Inter** — Rasmus Andersson
- **Cormorant Garamond** — Christian Thalmann (Catharsis Fonts)
- **Press Start 2P** — CodeMan38
- **VT323** — Peter Hull

## Software

- [React](https://react.dev/) (MIT) and [esbuild](https://esbuild.github.io/) (MIT).
