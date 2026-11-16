# Pit Stop 09 — Lando's Landing Lights / Second Pass

- Separated four visual progress segments above the gantry from four GO 1–4 reaction-time cards underneath.
- Preserved the original four reaction tests, countdown light choreography, false-start and scoring logic.
- Reaction values now render in their respective cards, in milliseconds; best result receives a border accent.
- Reworked the gantry backdrop asset from blue to purple, retaining the metal rig, light housings and overlay positions.
- Reduced CTA/state text sizes (Start Test, Standby, React, False Start, Reaction Measured).
- Kept the complete existing app, including the previous Sleigh Speed Straight update.

Validation: `npm run build`, `node --check src/main.js`, `node --check src/modules/59-mc09-lightspeed-lando.js` passed. Interactive browser/gameplay QA has not been performed.
