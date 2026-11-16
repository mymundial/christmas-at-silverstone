# Pit Stop 05 — Christmas Spirit Charging Station (first design pass)

Baseline: christmas-at-silverstone-pit-lane-power-up-MARKER-ALIGNMENT-FULL-APP.zip.

Scoped changes:
- Game-only header: three centred headline lines CHRISTMAS / SPIRIT CHARGING / STATION, Santa's Parc Fermé-inspired white glow, supplied subtitle, Care Bears partnership in text rather than image.
- Single muted-purple (#1B0E45) parent panel and midnight-purple (#120531) two-by-four cell playfield.
- CHRISTMAS SPIRIT 0/8 progress meter with eight equal-width red/muted segments.
- Eight simplified dark-purple cells, each with white bolt and text. Red bottom-up fill uses the unchanged --tank-fill value from the original state machine. White border on a completed cell. The legacy side-meter presentation is hidden, but the existing meter state updates remain intact.
- Visual cell state text EMPTY / CHARGING / FULL uses the original per-cell tap count, without changing the taps.

Unchanged:
- Shared Spirit Depot name and shared checkpoint data; 8 cells; four successful taps per cell; any-order cell charging; click/pointer/keyboard events; audio and haptics; completion action; GPS; all other missions.

Validation:
- `npm run build` successful.
- Scripted Chromium render of actual bundled app JS + source CSS with a saved Spirit mission state at 320x568, 360x740, 375x667, 390x844, 480x930, 720x1200. No JS errors. Eight visible cells and progress segments.
- Scripted pointer-up interaction: four taps fill the first cell 0.25/0.50/0.75/1.00; all eight cells complete with 32 taps and the original mission-complete panel appears.
- The browser environment blocks network navigation; the render/interaction check ran with the real app JavaScript and CSS embedded into a blank Chromium page. This is not a live-device test.
- Existing production audit: 30 passes, 3 warnings, 5 pre-existing failure categories; no additional failures.
