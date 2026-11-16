# Santa’s Parc Fermé — official icon and colour correction pass

## Source
Silverstone — Festival of Lights — Guidelines, supplied PDF.
- AERO: F1 overhead illustration, page 35.
- STABILITY: F1 side-view illustration, page 35.
- POWER: engine illustration, page 29.
- CONTROL: gloves illustration, page 32.
- TRACTION: tyre illustration, page 30.
- RESPONSE: chevrons illustration, page 30.

The six illustrations were extracted from the guideline's original vector pages, saved as WebP images with alpha transparency, and placed inside existing white circular holders.

## Why the purple changed
The preceding pass introduced a noticeably brighter purple gradient, from `rgba(79,41,138,.96)` to `rgba(57,25,114,.98)`. This had not been requested. The correction restores a single muted-purple container colour `#1B0E45`, sampled from the provided Santa's Parc Fermé mockup; each individual card stays Midnight `#120531`.

## Implemented
- New Silverstone source illustrations in all six scan cards.
- Old technical diagnostics remain in the DOM and are visible only during each active scan, preserving the existing animation sequence and audio.
- No changes to scan timings, progress counter mechanics, audio or mission completion logic.
- Fixed old fixed-height mission content constraint; one scrollable content column allows all six cards and the disabled/enabled completion CTA to appear in natural document order.
- Retains a single muted-purple container around the six-step progress meter and cards.
- Preserves same type size for PARTS CHECKED and 0/6.

## Validation
- `npm run build`: PASS.
- `npm run audit`: 30 pass / 3 warnings / same five pre-existing failures; zero new failures.
- Isolated Chromium layout render at 360, 390, and 480 px: no card overlap or title/icon collisions; CTA follows cards in the scrollable game area.
- Isolated actual `bindDiagnostics()` interaction test: 6 scans in nonsequential order: [RESPONSE, AERO, CONTROL, POWER, TRACTION, STABILITY]. Each completed scan filled exactly the next unlit segment, with counter advancing 1/6 through 6/6. `CHECKING....` and `CHECKED!` confirmed; final CTA enabled at 6/6.
- GPS, geofences, checkpoint progression, sound and other modules unchanged.

## Installation
This is a changed-files-only overlay. Extract it over the existing `christmas-at-silverstone-main` project from the immediately previous Santa's Parc Fermé correction build, preserving the existing fonts and other unchanged project files. Run `npm run build` from the project root after applying.
