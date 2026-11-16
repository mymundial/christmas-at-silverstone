# MC-03 Luffield — Box, Box, Ho, Ho, Ho! (visual update)

**Baseline:** christmas-at-silverstone-parc-ferme-visible-scan-pulse-FULL-APP.zip
**Date:** 6 November 2026

## Included
- Mission game heading: **BOX, BOX, / HO, HO, HO!**, with a restrained glow.
- Subtitle from the supplied mockup: "Santa can’t hear us over the engine noise! Connect the radio by tapping the links as the signal hits it, so we can call him into the pits."
- One muted purple (`#1B0E45`) mission game panel containing the RADIO LINKS 0/4 meter and full six-node network.
- Four segment progress meter: muted segments fill Race Red as links are successfully captured.
- Node labels: TX — NORTH POLE, 01–04 — LINK 01–04, RADIO — SANTA.
- Default node: Midnight fill / white outline. TX and completed link nodes: Race Red / white outline.
- Existing fixed capture ring and phase-driven expanding ring retained, restyled white/red.
- Existing physical connecting lines retained and recoloured subdued white; active route emphasised. Moving signal packet recoloured Race Red with white tip.
- No helper instruction, question icon, or player-turn UI introduced.

## Gameplay preservation
- `src/modules/53-mc03-luffield.js`: **only two counter presentation strings changed** (`0 / 4` -> `0/4`, and corresponding updated count). All other relay mechanics, packet positions, durations, capture windows, audio, and final transmission logic byte-identical.
- `index.html`: unchanged.
- The 23 other source JS modules (outside the Luffield renderer and binder): unchanged.
- Current app checkpoint name is unchanged outside the Luffield game heading, preserving mission routing and existing copy elsewhere.

## Checks
- `npm run build`: passed.
- `npm run dev`: local server started and printed `http://localhost:5173`.
- `node --check src/main.js`: passed.
- `npm run audit`: 30 passes / 3 warnings / same five pre-existing failures. No new failures.
- CSS and layout independently rendered in Chromium at 360x740, 375x667, 390x844, 480x930. At 375x667, the panel extends slightly beyond the fixed viewport; the Luffield content area scrolls so the bottom is reachable rather than clipped.
- Checked visual initial state and 1/4 completed state (Race Red segment and completed circle). These are isolated HTML/CSS previews; real-device interaction/audio should still be reviewed before final sign-off.

## Files modified
- `src/modules/10-ui-rendering.js` — header and game markup.
- `src/modules/53-mc03-luffield.js` — counter formatting only.
- `src/styles.css` — scoped Luffield presentation styles.
- `src/main.js` — regenerated bundle of the above modules.
