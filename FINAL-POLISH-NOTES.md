# Final Polish Notes — Pass 7.39.0

## Implemented

- Admin: moved **Reset Mission Progress** to the header beside **Open Mission Control**.
- MC-00 System Diagnostics: ten evenly spaced scan pings at 0–90%, then a distinct final 100% completion ping. Navigation now follows exactly the same cadence as the other system checks.
- Preloading/warming: MC-00 system icons, onboarding icons, radar bezel, Velocity Vault graphic layers, Care Bears branding used by Power Pulse/Spirit Depot, Lightspeed Lando gantry, Aurora Apex sky/rings, Las Vegas logo, and later Santa-1 sleigh stages.
- Onboarding mobile spacing: Mission Briefing and Mission Radar explicitly use the same card offset as the ELF FM prompt.
- Radar: removed New Message alert cards; Comms badge/feed still carries message notification state. Added defined Target Search / Target Approach / Target Acquired wording.
- Comms: Demo GPS is a non-interactive amber status tile with no duplicate DEMO text. Mission Audio selected icon uses the same cyan treatment as ELF FM.
- Santa-1 visual progression:
  - Stage 1 through MC-03 / before Power Pulse completion
  - Stage 2 after Power Pulse
  - Stage 3 after Jingle Beams
  - Stage 4 after Aurora Apex — Ready for Launch Clearance
  - Stage 5 after Lapland Launch — Launch Cleared
- Bottom navigation: Sleigh now uses the same current-colour icon system as Radar, Missions and Comms.
- Missions: softened top scroll shadow so the first mission outline remains clear.
- Circuit Link: can now be opened retrospectively from Missions after being passed/missed.
- Demo Mode: added **Restart Demo** control within Radar telemetry without reducing the radar's usable vertical area.
- Lapland launch system check list restored to canonical route order (Comet Curve before Jingle Beams).

## Parked / separate pass

- Santa-1 artwork upgrade / larger sleigh hero / possible additional instrument on Sleigh page.
- Aurora Apex gameplay/visual rethink. Current gameplay is intentionally preserved.
- Audio normalisation and final radio/music policy. Do this as a mix pass, not a blanket file-normalisation pass:
  - voice/transmissions need their own target,
  - music beds and ELF FM need ducking/headroom beneath voice,
  - looping ambience needs a lower sustained target than one-shot effects,
  - short UI/game effects should be peak/loudness matched as a group.
  External ELF FM should be treated as a separate bus with a limiter/ducking policy rather than attempting to alter the remote stream itself.
- Northern Flight: latest note was incomplete ("Northern flight needs some"), so no speculative redesign was made.

## Audit note

The included production audit still contains legacy-format rules that conflict with canonical assets already in this project (existing PNG/WAV files) and older strict visual assertions for MC-03/completion hierarchy. The pass itself builds successfully, generated source/dist payloads match, all runtime references resolve, route/GPS/georeference checks pass, and Lapland route-order assertion passes.
