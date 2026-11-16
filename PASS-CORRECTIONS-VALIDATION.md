# Branding correction pass — validation

## Scope
This patch contains only the corrections requested after the restrained 5B+6 build:

1. Remove the thicker left-edge treatment from active/available shared cards; use a uniform 1px outline.
2. Remove the doubled Missions-page horizontal gutter so mission cards use the intended available width.
3. Centre COMPLETE / AVAILABLE / LOCKED and other shared status-pill labels consistently.
4. Centre shared page/mission titles and their supporting copy; navigation/list-row titles remain left-led.
5. Replace the persistent masthead compact logo with the same approved Christmas at Silverstone master lockup used on the splash page.
6. Increase and rebalance the Santa's Pit Crew / Sleigh progress block for clearer spacing and scale.

## Source changes
- `src/styles.css`: correction layer only.
- `src/modules/10-ui-rendering.js`: one visual change only — persistent masthead logo changed from compact asset/class to master asset/class.
- `src/main.js`: regenerated from modules by the normal build process.
- `index.html`: unchanged.
- Assets: unchanged.
- No mission, GPS, radar, audio or game logic modules changed.
- No copy strings were rewritten by this correction pass.

## Visual checks
- Mission cards: uniform border thickness on all four sides.
- Missions feed: one horizontal page gutter, no nested/pinched gutter.
- COMPLETE / AVAILABLE / LOCKED: centred within their pills.
- Mission title + support copy: centred.
- Setup/onboarding title + support copy: centred.
- Masthead: same master Christmas at Silverstone lockup as splash; Pit Crew status enlarged/re-spaced.

## Technical checks
- Production build: PASS.
- Generated source/dist payloads: PASS.
- Runtime references: PASS.
- Dead production assets: PASS.
- Mission route / checkpoint / radar / GPS audit checks: PASS.
- Audit total: 30 passes / 3 warnings / same 5 pre-existing failures.
- New audit failures introduced by this patch: 0.

The five audit failures are the same pre-existing items from the established baseline: legacy production formats/references, the existing completion-hierarchy audit, and the two existing MC03 polish audits.
