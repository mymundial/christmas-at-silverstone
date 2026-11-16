# Title and subtitle consistency pass

Baseline: CIRCUIT-LINK-MARKER-VISIBILITY-GLOW-REFINED-FULL-APP.zip.

## Audit

All 12 installation screens use the shared `.mission-head` title and `.support-copy` subtitle markup; some have additional mission-specific selectors overriding colours or shadows. Onboarding includes MC00 System Diagnostics, Mission Briefing, Mission Radar, ELF FM, and a demo scan page; these use `.onboard` card headings/copy, separate from the mission heading rules. The opening splash uses a logo asset rather than a text title and is not recoloured.

## Changes

Added a terminal CSS layer applying the existing Santa's Parc Fermé restrained white/pink-purple headline glow and muted lavender-grey support text to mission headings and onboarding heading/copy. Style rules target only these text elements. No content, font size, spacing, alignment, gameplay, animation, logic, or assets changed. In-panel labels, transmission headings, buttons, HUD elements, and global navigation text were intentionally excluded.

## Validation

Run `node build.js`, `node --check src/main.js`, and check that `dist/styles.css` contains the terminal rules. Full visual checks are separate from build verification.
