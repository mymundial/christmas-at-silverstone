# Pit Stop 11 — Lights Out & Sleigh Away: Silverstone branding pass 1

## Visual changes
- Replaced the Lapland Launch screen title with **LIGHTS OUT & SLEIGH AWAY** and the approved supporting copy.
- Removed the Las Vegas logo from the mission-screen header. The associated logo asset remains in the wider application because this pass does not alter other mission assets.
- Changed the navigation verification label to **PARTS AWAKE**; kept the existing 0/10 count and ten markers.
- Presented the original ten system statuses as a two-column purple/red card grid with compact Silverstone typography.
- Styled the existing **INITIALISE LAUNCH** button in the established red, white-bordered treatment.
- Refined the display strings for each system's verification status: SLEEPING…, WAKING…, AWAKE! where appropriate.

## Unchanged behaviour
- Checks still run automatically after pressing INITIALISE LAUNCH. Cards are informational, not tappable. This deliberately preserves the current game's mechanics instead of introducing the individually tappable behaviour depicted in the design reference.
- Ten checkpoint dependencies, completion requirements, timing, audio, transmission and party stages remain as implemented.
- Other game screens are unchanged.

## Validation
- `node build.js`: pass
- `node --check src/main.js`: pass
- `node --check src/modules/61-mc11-lapland-launch.js`: pass
- ZIP integrity check: pass
- Interactive browser/gameplay testing: not performed
