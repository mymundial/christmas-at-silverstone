# Mission Control JavaScript source modules

These files are the canonical JavaScript source for Pass 6.83 onward.

They intentionally share one private runtime scope. `bundle-js.cjs` concatenates the numbered `.js` files in filename order into `src/main.js`; production therefore continues to make a single JavaScript request and the app's existing runtime contract is preserved.

Do not edit generated `src/main.js` directly. Edit the relevant module, then run `npm run build` (or `npm run dev`, which regenerates the bundle before starting the local server).

High-level layout:

- `00–02`: runtime state, audio/shared helpers, geometry
- `10`: UI rendering and mission markup
- `20`: navigation and mission-flow actions
- `30–31`: live GPS and demo progression
- `40`: admin tooling
- `50`: mission binding router
- `51–61`: mission-specific interaction handlers
- `99`: application bootstrap
