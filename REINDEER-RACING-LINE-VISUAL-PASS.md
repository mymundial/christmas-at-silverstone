# Pit Stop 06 — Reindeer Racing Line visual pass

- Game-only heading: REINDEER / RACING LINE, centred Silverstone Display with soft glow.
- Game-only subtitle: How fast can you go following the racing line?
- Replaced the game header Escapade image with the partnership text shown in the approved mockup.
- Flat dark-purple two-lane playfield with moving red/white kerbs and white dashed centre line.
- Official extracted top-down Silverstone F1 artwork, facing upward, on a white circular backing. Lossless WebP.
- Time, MPH, POWER shown as three consistent side-by-side telemetry boxes.
- Removed the question-mark/extra TAP instruction and restyled the main action button GO, GO GO! with a white outline.
- Existing speed-lock readout retained for the hold-to-accelerate completion mechanic.

# Scope held

- Shared checkpoint remains Reindeer Raceway.
- No changes to the acceleration/hold runtime source, power thresholds, speed calculation, audio, GPS, or unrelated games.
- Browser-layout checks via a static mission fixture with exact styles/fonts: 320x568, 360x740, 375x667, 390x844, 480x930 and 720x1200. No horizontal clipping, both telemetry and action visible.
- npm run build: PASS.
- npm run audit: 30 passes, 3 warnings and 5 baseline failure categories. No new failure categories.
- Live browser navigation in the testing container was blocked, so live tap/hold interaction has not been revalidated in this pass; game implementation source is byte-identical to prior full build.
