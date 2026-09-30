# Silverstone Mission Control — Working V2

**Status:** frozen functional baseline for live GPS / geofencing development.

Working V2 is the canonical source of truth at the point visual/gameplay development was paused for on-track GPS testing. Housekeeping in this freeze is deliberately non-behavioural: no mission logic, UI/gameplay behaviour, audio behaviour, route progression, GPS/geofence logic, checkpoint coordinates or circuit calibration have been changed.

## Start here

```bash
npm run build
npm run audit
npm run dev
```

Production output is generated in `dist/`. The source JavaScript remains split into ordered files under `src/modules/`; `bundle-js.cjs` generates the browser bundle at `src/main.js`.

## Canonical rules

- `src/modules/00-runtime-state.js` is the source of truth for checkpoint latitude/longitude and detection/activation radii.
- `src/modules/03-circuit-georef.js` owns the coordinate-to-SVG calibration and Silverstone GP route centreline.
- Do not add separate per-installation SVG coordinates. Radar and checkpoint placement must continue deriving from checkpoint lat/lng.
- Do not change mission/game/UI behaviour while developing GPS unless the change is explicitly required for field testing.
- Demo Mode and live GPS behaviour should remain separable so test progression cannot contaminate the guest route state.

See `WORKING-V2-BASELINE.md` for route order, GPS starting state, locked scope and known post-GPS design discussions.

## Working V2 housekeeping

The freeze removed only confirmed dead/retired material: old Power Pulse PNG artwork, obsolete MC02 and Lightspeed Lando audio duplicates, retired Vegas artwork, retired Spirit/Jingle audio, obsolete root preview images, and a duplicate root audio file. Runtime-used files were retained, including assets referenced dynamically such as the Aurora ring artwork.

`dist/` is intentionally included so this package remains immediately deployable, while a fresh build can always regenerate it.

## Field-test coordinate profiles

`/admin` provides two deliberately separate Live GPS profiles:

- **Silverstone Master** — uses the canonical checkpoint coordinates and the existing Silverstone affine circuit georeference.
- **Culcheth Local Test** — uses a fixed, preconfigured MC01–MC12 village route for local rehearsal. Local GPS/geofence progress is virtually projected onto the equivalent Silverstone circuit sections for Radar presentation.

The Culcheth profile does not overwrite `CHECKPOINTS[*].lat/lng`, does not modify the Silverstone affine calibration, and is not used by Demo Mode. Admin coordinate capture/save controls are survey-candidate tools only and never become active guest coordinates automatically.
