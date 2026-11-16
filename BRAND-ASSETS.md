# Christmas at Silverstone brand assets

## Logos

- `christmas-at-silverstone-master-light.svg` — preferred master lockup on Midnight/Royal Blue/dark surfaces.
- `christmas-at-silverstone-master-dark.svg` — master lockup on white/light surfaces.
- `christmas-at-silverstone-secondary-light.svg` / `...-dark.svg` — supplied secondary lockup for placements at **450 px or smaller**.
- `christmas-at-silverstone-compact-light.svg` / `...-dark.svg` — supplied compact lockup for placements at **250 px or smaller**. Guideline minimum: **125 px**. The compact version is also the supplied option for photography.

The SVG files are cropped exports of the supplied Illustrator artwork and retain the source vector paths. The master logo remains preferred wherever space permits. Do not stretch, redraw, recolour or alter proportions.

Official clear space is **X**, where X equals the rendered width and height of the North Star in the selected logo artwork. The CSS deliberately does not invent a fixed-pixel substitute: use `.brand-lockup-frame` and set `--brand-logo-x` from the actual rendered North Star measurement for that placement. Runtime placement is intentionally deferred to the shell pass.

Sizing utilities are `.brand-lockup--master`, `.brand-lockup--secondary` and `.brand-lockup--compact`; the secondary and compact maximum thresholds and 125 px minimum are encoded as CSS tokens from the supplied guideline.

## Patterns
