# Santa’s Parc Fermé — no-scroll and scan-state correction

Date: 2026-11-06
Base: `christmas-at-silverstone-parc-ferme-COMPLETE-RUNNABLE.zip`

## Changes
- Removed the legacy diagnostic icon markup from the six scan cards. Official Silverstone illustrations remain visible for idle, checking and checked states. The official illustration has a restrained pulse while checking.
- Fixed card outlines: subdued white on unchecked/checking, solid white once checked; no orange/yellow completion glow.
- Rebuilt the six-card area as a flexible 2×3 grid within the existing muted `#1B0E45` parent panel; cards retain Midnight `#120531`.
- Reduced circle, card, spacing and internal typography dimensions as a function of viewport height; all cards, six progress segments and the completion CTA are visible in the same screen without scrolling on the tested mobile viewports.
- Preserved six scan durations, audio handling, count order, state labels and button enable/complete mechanics.

## QA
- `npm run build`: PASS.
- `npm run dev`: served the app and official icon asset successfully (HTTP 200).
- Isolated Chromium layout checks at 320×568, 375×667, 360×740, 390×700, 390×844 and 480×930: all cards and CTA within the viewport; `.screen` and `.mission-content` scrollHeight equal clientHeight.
- Interaction test, nonsequential order RESPONSE, AERO, CONTROL, POWER, TRACTION, STABILITY: `CHECKING....` → `CHECKED!`; official artwork remains visible; no old icon markup appears; progress fills 1–6 in completion order; button enables at 6/6.
- Audit: 30 passes / 3 warnings / same 5 pre-existing failures. Not a clean audit; failures remain from earlier versions.
- Source modifications compared with complete runnable base: `src/styles.css` and `src/modules/10-ui-rendering.js`; generated `src/main.js` and `dist` counterparts updated during build.
- No browser-device hardware testing has been performed; reported viewport tests are isolated Chromium rendering and interaction tests.
