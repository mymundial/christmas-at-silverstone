# Santa's Parc Fermé — visible scanning light correction

## Scope
- Add a clearly visible white light pulse to the circular official illustration holder **only** while a part is in its `active`/`CHECKING....` state.
- Stop the pulse automatically when scanning completes; inactive and checked cards have no pulse.
- Keep illustrated icon static in every state and do not reintroduce legacy diagnostic artwork.
- Reserve bottom clearance for the entire COMPLETE SCAN button in the existing fixed no-scroll layout.

## Implementation
- CSS-only source change: `src/styles.css`.
- Animate the opacity and scale of a white halo overlay on the holder, rather than subtly scaling the artwork. This avoids the prior CSS important-box-shadow conflict.
- Retain muted unfinished card borders and white checked borders.
- No changes to JS, audio, scan durations, mission sequence, route, GPS, or other screens.

## Validation
- `npm run build`: passes.
- `npm run audit`: 30 pass, 3 warnings, same 5 pre-existing failures.
- Chromium visual checks: halo opacity rises from ~0.15 to ~0.99 during its animation, with a visible white glow.
- Browser viewport checks (synthetic app markup/CSS): 320x568, 375x667, 360x740, 390x844, 480x930, 720x1200, 720x1440.
- Zero internal content scrolling in these checks, full button visible; minimum measured viewport clearance ~14px.
- All JS files and HTML source unchanged versus prior full runnable ZIP.

Note: the visual checks used an isolated render of the game's layout and CSS; the final test in the actual app remains important.
