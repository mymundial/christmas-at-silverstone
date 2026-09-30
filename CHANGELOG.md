# Working V2 — Canonical freeze / housekeeping

- Declared the cumulative current build as **Working V2**, the baseline for GPS/geofence development.
- Removed confirmed dead/retired assets and obsolete root preview/duplicate files only.
- Retained dynamically referenced runtime artwork and all currently used audio/media.
- Rebuilt `dist/` from the frozen source.
- Refreshed README, baseline hand-off notes, audit output and checksums.
- Changed package/cache identity to `2.0.0` for the freeze.
- **No gameplay, visual behaviour, audio behaviour, GPS/geofence logic, checkpoint coordinates, route progression or circuit calibration changed.**

# Pass 7.38.42 — Mission narrative copy alignment

- Updated MC00 Mission Briefing to the approved Silverstone-aligned guest call-to-action.
- Updated MC01–MC12 mission subtitles to the locked narrative wording.
- Updated Mission Complete outcome copy to the approved system-specific wording.
- Updated the full Comms feed title/message set from Mission Start through Northern Flight.
- Existing persisted completion messages now refresh from the current canonical Comms scripts on load, so the new copy appears without clearing local storage.
- No gameplay, geofence, route, radar, audio or layout behaviour changed.
- Cache version bumped to 7.38.42.

# Pass 7.38.41 — Checkpoint marker visual match

- Checkpoint marker core now matches the guest/user marker visual language.
- Standard radar checkpoint core uses the same 10px cyan-white centre and tight glow as the user marker.
- Circuit radar checkpoint core uses the same 12px white centre and glow as the circuit user marker.
- Existing checkpoint expanding beacon pulse is retained.
- Marker positioning, checkpoint geofences, radar route logic and z-order are unchanged; the guest marker remains above the checkpoint marker.
- Cache version bumped to 7.38.41.

# Pass 7.38.40 — Radar depth / checkpoint beacons

## Scope
- Radar presentation only.
- No checkpoint coordinates, geofence logic, route progression, or mission mechanics changed.

## Changes
- Reworked the inner radar rim into a substantially stronger dark inset falloff so the circuit visually disappears beneath the bezel instead of meeting a hard edge.
- Reworked both pre-circuit and circuit checkpoint targets into compact double-flash beacon markers using the existing target positions.
- Checkpoint beacons use a bright core and short expanding ring pulse; no marker geometry or GPS behaviour changed.
- Added reduced-motion static beacon treatment.
- Cache version bumped to 7.38.40.

# Pass 7.38.39 — Radar rim / telemetry / checkpoint language

## Scope
- Radar presentation and radar-page copy only.
- No geofence, route, mission, animation, or checkpoint mechanics changed.

## Changes
- Strengthened the existing inner radar-bezel shadow so the circuit edge blends beneath the rim rather than meeting it abruptly.
- Changed TELEMETRY to MISSION TELEMETRY.
- Standardised pre-arrival radar messaging to CHECKPOINT AHEAD for every checkpoint; MC01 search state now reads LOCATING CHECKPOINT.
- Cache version bumped to 7.38.39.

# Pass 7.38.38 — MC02 Aero / Power optical centring

## Scope
- MC02 only.
- Aero and Power icon horizontal alignment only.
- No animation, timing, copy, state, sizing, or other card changes.

## Changes
- Aero shifted 9px left so the visible garage/fan artwork aligns with the centred CAPTURED label.
- Power shifted 8px left so the complete speedometer/needle artwork aligns with the centred CAPTURED label.
- Cache version bumped to 7.38.38.

# GPS field-test pass — Culcheth Local Test profile

- Added a fixed **Culcheth Local Test** coordinate profile for MC01–MC12, beginning at 428 Warrington Road and following the agreed village route up the east side of the Village Green, across Lodge Drive, down Jackson Avenue/Common Lane, and finishing at the Culcheth Library/cycle-shop area.
- The Culcheth profile is completely separate from the canonical Silverstone checkpoint coordinates. Selecting it never writes to or replaces the Silverstone `CHECKPOINTS[*].lat/lng` values.
- Culcheth Local Test is opt-in from `/admin` and applies only to Live GPS. Demo Mode remains separate.
- Local geofences use dedicated local-test radii; Silverstone master detection/activation radii are unchanged.
- In Culcheth mode, live village GPS progress is projected onto the equivalent MC01→MC12 sections of the existing Silverstone circuit route for the main Radar. The canonical Silverstone affine georeference is not changed.
- Admin coordinate capture remains available only as a survey/candidate tool. Saved survey candidates cannot drive either the Silverstone Master or fixed Culcheth profile.
