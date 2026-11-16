# Pit Lane Power-Up visual pass

## Scope
Only checkpoint MC-04's game presentation was redesigned. The shared Power Pulse name was retained in checkpoint data.

- In-game title: PIT LANE / POWER-UP, centered with the established soft title glow.
- In-game subtitle: Sparkles of Christmas magic are zooming down the pit lane. Catch them to power up the sleigh!
- Removed the Care Bears logo from this game's header (not other missions).
- Lighter purple parent panel includes the ten-segment SPARKLES CAUGHT progress meter and dark-purple playfield.
- Removed the starscape visual/animation; retained signature spawn and capture mechanics.
- Replaced energy artwork with Race Red circles, white outlines and the official Silverstone snowflake asset rendered as a white lossless WebP.
- Capture target remains 10; audio, GPS, timing, checkpoint names and other missions remain unchanged.

## Verification
- `npm run build`: successful.
- Source review against prior full package confirms `00-runtime-state.js` unchanged.
- Interactive game-handler test: all 10 captures increment score and progress segments, then trigger completion.
- Static browser layout check (real stylesheet/fonts, mocked mission shell) at 320x568, 360x740, 375x667, 390x844, 480x930 and 720x1200: panel, game area and title rendered within the app shell. This is **not** a live-device runtime test.
- `npm run audit`: 30 passes, 3 warnings and 5 existing failure categories (unchanged).
