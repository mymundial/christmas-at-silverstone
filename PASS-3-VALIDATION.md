# Pass 3 — Typography + Information Hierarchy Validation

Date: 2 November 2026  
Baseline: Pass 2B

## Scope contract

Pass 3 changes the shared typographic hierarchy only. It does not redesign the card system, navigation shell, radar artwork, mission/game internals, GPS, audio, checkpoint sequencing or game mechanics.

## Implemented

- Added a canonical Silverstone typography scale for:
  - display XL
  - display large / medium
  - headings
  - body / small body
  - micro labels
  - status numerics
  - display/body leading and label tracking
- Standardised small tracked uppercase labels across shared screens.
- Strengthened setup/onboarding titles while retaining their existing Pass 2 layout.
- Converted visible mission context from internal `MC-xx / location` language to `PIT STOP xx / location`.
- Reworked mission header hierarchy so challenge names are dominant, tight, uppercase Silverstone display headlines with left-aligned supporting copy.
- Strengthened Tracker telemetry numerics and standardised telemetry label hierarchy.
- Strengthened Pit Stops list hierarchy: quiet location context, dominant installation name, compact status.
- Standardised Sleigh title / percentage hierarchy and Team Radio message hierarchy.
- Strengthened completion-state headings.
- Standardised CTA typography only; control geometry and colour remain owned by the shared-component pass.
- Kept the compact Tracker message title at its existing safe 18 px size after visual validation showed that enlarging it would increase truncation within the current pre-redesign card geometry.

## Functional change surface

Compared with Pass 2B, only one source JS module changed:

- `src/modules/10-ui-rendering.js`

The renderer change is limited to the user-facing mission header label:

- before: `MC-04 / NATIONAL PIT STRAIGHT`
- after: `PIT STOP 04 / NATIONAL PIT STRAIGHT`

The other 24 JS modules remain byte-for-byte identical to Pass 2B.

## Static acceptance checks

- Production build: **PASS**
- CSS parser errors: **0**
- Every new Pass 3 type token has live usage outside its declaration: **PASS**
- Mission header exposes PIT STOP terminology: **PASS**
- Old internal MC label removed from missionHeader: **PASS**
- No GPS / geofence / route / mission-body / game module changed: **PASS**

## Production audit

Result remains at the established Working V2 / Pass 2B baseline:

- **30 passes**
- **3 warnings**
- **5 pre-existing failures**

No new production-audit failure was introduced by Pass 3.

## Visual validation

The full stylesheet was rendered at a representative 390 x 844 mobile viewport for:

- setup/onboarding
- Tracker telemetry + message card
- mission header
- Pit Stops list
- Sleigh
- Team Radio
- completion

The validation confirmed:

- display headlines remain inside their intended shared containers
- mission header context and headline hierarchy are clearly separated
- status numerics are materially stronger than labels
- Pit Stop rows retain readable long titles
- Sleigh title / percentage remain balanced
- completion hierarchy remains contained
- the compact Tracker card is not enlarged beyond its current safe geometry

A local Chromium attempt was made but the container Chromium process cannot complete because its DBus environment is unavailable. The full-stylesheet rendered component states are therefore the visual validation source for this pass.

## Intentionally unchanged after Pass 3

These are not Pass 3 failures:

- landing/boot screen composition
- Tracker screen information architecture and compact message-card geometry
- Pit Stops screen page-level title/count treatment
- Sleigh screen content composition
- Team Radio page-level composition
- card/button geometry and visual component redesign
- game-specific layouts and artwork
- radar bezel / cyan radar internals
