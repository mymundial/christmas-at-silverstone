Silverstone Mission Control — production audit
================================================
PASS  Production build — npm build equivalent completed successfully
PASS  Generated JavaScript syntax — src/main.js parses successfully in Node
PASS  Production source hygiene — No development modules are deployed
PASS  Generated payload: src/main.js — Source and dist are byte-identical
PASS  Generated payload: src/styles.css — Source and dist are byte-identical
PASS  Runtime references — All static runtime asset/font/script/style references resolve
PASS  Dead production assets — Every deployed asset and font is referenced
PASS  Asset file integrity — WebP, WOFF2 and MP3 signatures match their extensions
PASS  CSS brace balance — 4514 rule blocks balanced
PASS  Vercel configuration — Static build targets dist with npm run build
PASS  Admin asset base — /admin uses root-relative base for shared runtime assets
PASS  Service-worker retirement — Retirement shim only: no fetch interception; clears legacy caches and unregisters
PASS  Mission route — 13 checkpoints present in expected order
PASS  Mission handlers — Every route checkpoint type has an audited render/bind or automatic flow
PASS  Reindeer Raceway hold control — iOS selection/callout suppression and context-menu prevention are present
PASS  Reindeer Raceway high-speed geometry — Speed stretch remains fixed; JS does not scale scenery with velocity
PASS  Circuit georeference — Real-world coordinate calibration and GP route centreline are present
PASS  Coordinate single source — MC01, live radar and checkpoint markers derive SVG position from master lat/lng
PASS  Circuit demo route — Post-MC01 Demo Mode persists lap position and travels continuously forward along the calibrated route
PASS  Circuit radar artwork — Radar renders the original circuit SVG at the refined 1.3x scale
PASS  Circuit radar bootstrap — Unpositioned circuit art stays hidden; Demo lap distance is persisted and restored after refresh
PASS  Checkpoint handoff — Completed missions expose the next circuit checkpoint immediately; skipped unlocked activations advance after leaving their radius; Demo counts down route metres
PASS  Circuit radar hierarchy — Guest marker stays above the sweep; circuit remains full-opacity/unblurred; installation targets use the approved flashing beacon core/ring treatment beneath the sweep
PASS  Final circuit overview — Northern Flight completion shows the full centred circuit with no user/checkpoint navigation markers while the radar sweep remains active
PASS  MC01 energy bloom — Scan registers 25/50/75/100, holds 100% for 750 ms, shows ENERGY TRANSFER COMPLETE for 3.0 s, then reveals the completion card without returning to the scan
PASS  MC01 scan language — Circuit Link terminology stays consistent through detection, connection, routing, transfer and recovery
PASS  MC01 web assets — Bloom audio 53.9 KB; S mark 4.4 KB
PASS  MC03 synchronized timing cue — Travelling packets and the active node pulse share one measured cycle phase; packet arrival coincides with the dotted capture ring and the miss bump/red target feedback is restored.
PASS  MC02 component animation suite — Velocity Vault keeps the approved icon placement while animating only the intended source component; captured state remains selective green with the rest of each icon cyan.
WARN  Deployment footprint — 14.80 MB exceeds the 7 MB audit target
WARN  ELF FM stream — Current build still identifies the Radio Mast URL as a test stream; replace before final public launch if a production stream is supplied
WARN  Web app manifest — No install icon is defined. This does not affect normal browser use, only add-to-home-screen presentation.
FAIL  Production file types — assets/aurora-ambient-loop.wav, assets/aurora-ring-lock.wav, assets/car-engine-loop.wav, assets/care-bears-logo.png, assets/escapade-logo.png, assets/lando-go-beep.wav, assets/lando-red-light-beep.wav, assets/power-pulse-energy-boost.wav, assets/spirit-depot-bubbles-loop.wav, assets/spirit-tank-fully-charged.wav
FAIL  Legacy format references — index.html: .png | src/main.js: .png, .wav
FAIL  Lapland Launch dependency — Launch initialisation does not match the approved MC-01 to MC-10 system sequence
FAIL  Mission completion hierarchy — Completion-card hierarchy or MC01 completion copy does not match the approved system
FAIL  MC03 visual-only polish — Relay geometry/timing changed or the approved visual-only polish is incomplete
FAIL  MC03 restrained relay-success pass — MC03 capture geometry, success colour state, persistent packets, centred meter, audio, or frozen timing is incomplete
NOTE  External runtime URL(s): https://streams.radiomast.io/ref-128k-mp3-stereo
------------------------------------------------
29 passed, 3 warning(s), 6 failure(s).
