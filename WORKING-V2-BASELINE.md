# Silverstone Mission Control — Working V2 Baseline

Freeze date: **30 September 2026**

## Purpose

Working V2 is the hand-off baseline for the next development phase: **live GPS, geofence and on-track mission-progression validation at Silverstone**.

The UI/game experience represented by this package is treated as frozen while GPS work begins. GPS changes should be isolated from gameplay and presentation unless a field-test requirement makes a UI/debug addition necessary.

## Route order

| MC | Location | Activation | Detection | Activation radius |
| --- | --- | --- | ---: | ---: |
| MC-00 | Entrance Gantry | Scan QR | — | — |
| MC-01 | National Link Road | Circuit Link | 80 m | 30 m |
| MC-02 | Wellington Straight | Velocity Vault | 150 m | 35 m |
| MC-03 | Luffield | Comms Relay | 120 m | 30 m |
| MC-04 | National Pit Straight | Power Pulse | 150 m | 35 m |
| MC-05 | Copse | Spirit Depot | 120 m | 30 m |
| MC-06 | Escapade | Reindeer Raceway | 120 m | 30 m |
| MC-07 | Becketts | Comet Curve | 140 m | 30 m |
| MC-08 | Hangar Straight | Jingle Beams | 150 m | 35 m |
| MC-09 | Stowe | Lightspeed Lando | 120 m | 30 m |
| MC-10 | Vale | Aurora Apex | 120 m | 30 m |
| MC-11 | Hamilton Straight | Lapland Launch | 150 m | 35 m |
| MC-12 | Farm Curve | Northern Flight | 120 m | 30 m |

The exact latitude/longitude values remain in `src/modules/00-runtime-state.js` and are intentionally not duplicated here.

## GPS / circuit baseline to preserve

- Checkpoint `lat` / `lng` is the single installation-position source of truth.
- The same coordinates drive geofence distance, circuit-SVG position, radar checkpoint placement and Demo Mode route approach.
- Circuit mapping is handled by the affine calibration in `src/modules/03-circuit-georef.js`.
- The calibrated route is `SILVERSTONE_GP_ROUTE`.
- Post-MC01 Demo Mode progresses continuously forward along the calibrated route rather than reseeding near each checkpoint.
- Completing a mission hands radar navigation to the next route checkpoint immediately.
- A live unlocked-but-unfinished checkpoint remains available in Missions; route hand-off may occur after leaving the activation radius with reliable GPS.
- MC12 completion switches Radar to the fixed full-circuit overview and removes moving guest/checkpoint navigation markers.

See `CIRCUIT-GEOREFERENCE.md` for the current SVG calibration outputs and update rules.

## Field-test priorities for the GPS phase

1. Validate real device coordinates and GPS accuracy around the circuit.
2. Validate detection and activation radii at each installation position.
3. Confirm approach → detected → unlocked/available transitions do not flicker with normal GPS drift.
4. Confirm leaving and re-entering a radius does not corrupt mission state.
5. Confirm completed missions persist and route hand-off is correct.
6. Confirm out-of-order field testing can be performed without breaking the normal guest progression.
7. Validate circuit-radar registration while physically travelling around Silverstone.
8. Capture enough diagnostic information during the test to explain a bad trigger: current coordinates, reported GPS accuracy, nearest checkpoint, distance, trigger radius and expected route checkpoint.

## Experience status at freeze

Working V2 is considered complete enough to move into GPS development. Remaining design work is deliberately deferred rather than mixed into field-test changes.

**Higher-priority future design review**
- Aurora Apex needs a stronger game mechanic / redesign.
- Northern Flight still merits refinement after GPS validation.
- Comms Relay mechanic and instruction language should be revisited; tracing/drawing the relay path is an open alternative to timed tapping.

**Lower-priority future polish**
- Circuit Link
- Jingle Beams
- Comet Curve
- Lapland Launch

**Cross-experience review after GPS**
- Review every mission's narrative subtitle, gameplay instruction and dynamic feedback so the physical action is immediately understandable.
- Review Radar approach-box wording and whether new-message notifications belong there or should remain primarily in Comms.
- Normalise perceived audio levels across the experience.
- Define a tighter Mission Control sonic vocabulary, potentially including a consistent mission-complete signature while retaining activation-specific game sounds.

## Freeze rule

During GPS development, do not opportunistically redesign games, refactor the large stylesheet, convert audio formats, or restructure mission modules. Those changes can obscure GPS regressions and should be handled in later dedicated passes.

## Local field-test profile added after freeze

The GPS development layer now includes an opt-in **Culcheth Local Test** profile in `/admin`. It exists only to rehearse the live GPS experience away from Silverstone. Its coordinates and local trigger radii are separate from the frozen Silverstone master checkpoint data.

When Culcheth Local Test is active, the physical village route drives geofence behaviour while the Radar maps progress virtually onto the equivalent Silverstone MC01→MC12 circuit sections. Switching back to **Silverstone Master** immediately returns to the unchanged canonical Silverstone coordinates and affine georeference. Demo Mode remains independent of both Live GPS profiles.
