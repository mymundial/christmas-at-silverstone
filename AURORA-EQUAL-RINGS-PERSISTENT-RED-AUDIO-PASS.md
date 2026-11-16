# Aurora Apex — equal rings, persistent locked red and quieter wrong cue

- All three rings now render using one common CSS border-width property, independent of diameter, with inactive purple, active royal blue, and persistently locked race red.
- The final inner ring becomes red as soon as locked, including during final completion.
- Original ring image elements remain in the DOM for game structure and animations, but are visually hidden in the Silverstone game treatment; no original mechanics, speeds or tolerance windows changed.
- Rotating ring lock-notch markers remain connected to their rings; fixed white lock pointer remains at the active ring top.
- `aurora-wrong.mp3` further attenuated by approximately 12 dB at file level, and its playback volume decreased from 0.5 to 0.25 (another ~6 dB). Audio setting respected.
- App built; JavaScript syntax and ZIP integrity checked. Interactive browser gameplay tests not performed.
