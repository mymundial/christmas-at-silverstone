# Pass 5B+6 Restraint Correction

## Scope
Remove all Silverstone pattern use and undo the decorative/overdesigned mission-wrapper treatment introduced in Pass 5B+6, while retaining the approved Midnight / White / Race Red brand system from Passes 1-5A.

## Changes
- Removed the entire Pass 5B+6 decorative mission-wrapper CSS layer.
- Restored mission headers, arrival cards and completion states to their Pass 5A geometry/component treatment.
- Removed all Silverstone pattern CSS variables and utility classes.
- Removed the landing-page pattern background introduced in Pass 5A.
- Removed all four deployed pattern image assets.
- Retained the approved Christmas at Silverstone logos, Midnight canvas, Race Red actions/active states, white typography and shared component system.

## Scope protection
- No JavaScript modules changed.
- `src/main.js` unchanged.
- `index.html` unchanged.
- No copy changes.
- No GPS, mission sequencing, audio, radar internals or game logic changes.
- No internal game redesign.

## Verification
- Runtime/project references to `brand-pattern` or `silverstone-pattern`: 0.
- Silverstone pattern asset files in project: 0.
- Corrected CSS differs from Pass 5A only by removal of pattern definitions/utilities and the landing pattern pseudo-element.
- Build succeeds.
- Production audit remains at the established baseline: 30 pass / 3 warnings / 5 pre-existing failures.
