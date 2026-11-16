# Santa's Parc Fermé correction pass validation

Date: 2026-11-06
Baseline: christmas-at-silverstone-santas-parc-ferme-pass.zip

## Corrected in this pass
- Rebuilt the MC-02 layout so the entire progress area and all six scan cards sit inside one lighter-purple container.
- Removed the separate progress-card appearance.
- Set `PARTS CHECKED` and `0/6` to the same size.
- Retained darker individual scan cards within the lighter parent container.
- Replaced fixed compact grid heights with auto-height card rows to stop overlapping.
- Corrected subtitle wrapping so the full sentence is visible.
- Reduced and re-centered white circular icon holders and the diagnostic icons inside them.
- Preserved the previously approved copy changes and sequential six-box progress logic.

## Validation
- `npm run build`: PASS
- No GPS, checkpoint, mission progression or audio logic changed in this correction pass.
