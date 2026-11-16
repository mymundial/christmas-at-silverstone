# Radar Correction Validation

Scope of this correction pass:
- Correct the outer ring so it matches the approved Option A direction.
- Remove the incorrect bright outer red halo.
- Keep the dark Midnight housing and integrated thin red pinstripe.
- Preserve the white inner keyline.
- Replace the thin laser-like sweep with a broader, softer translucent red sweep.
- Keep circuit, installation marker and user marker colours as previously approved.
- No geometry, GPS, checkpoint logic, copy or other screen changes.

Validation:
- `npm run build`: PASS
- `npm run audit`: 30 pass / 3 warnings / same 5 pre-existing failures
- `src/main.js`: unchanged
- `src/modules/*`: unchanged
- `index.html`: unchanged
- CSS-only pass
