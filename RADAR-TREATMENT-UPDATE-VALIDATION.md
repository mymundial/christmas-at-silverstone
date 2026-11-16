# Radar Treatment Update Validation

Scope of this pass:
- Keep radar geometry and behaviour unchanged.
- Refine outer ring separation from the background.
- Reduce the depth of the inner shadow.
- Recolour the radar hierarchy to match the approved direction:
  - circuit: Race Red
  - installation target: Royal Blue
  - user marker: White
  - sweep: Race Red
- Keep `MISSION TELEMETRY` centered.

Implementation notes:
- CSS-only pass.
- No JavaScript changes.
- No GPS, checkpoint, routing or mission logic changes.
- No other screens changed.

Validation:
- `npm run build`: PASS
- `npm run audit`: 30 pass / 3 warnings / same 5 pre-existing failures
- `src/main.js`: unchanged
- `src/modules/*`: unchanged
- `index.html`: unchanged

Files changed:
- `src/styles.css`
