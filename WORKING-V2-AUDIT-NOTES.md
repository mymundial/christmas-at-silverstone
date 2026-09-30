# Working V2 audit notes

The production audit is retained as a regression signal, but several assertions in `audit-production.cjs` pre-date approved Working V2 changes and therefore report failures that are **not new housekeeping regressions**.

Current known stale assertions:

- **Production file types / legacy format references** — Working V2 intentionally uses runtime WAV audio plus current PNG sponsor/logo assets. These are active referenced assets, not dead files.
- **Lapland Launch dependency** — the audit expects an older launch-system sequence; Working V2 contains the later approved mission/system behaviour.
- **Mission completion hierarchy** — the audit checks an older completion-card hierarchy; Working V2 uses the later approved completion treatment.
- **MC03 visual-only / restrained success assertions** — the audit checks older Comms Relay geometry/success-state requirements that were superseded by later approved passes.

The audit still passes the checks most relevant to the next GPS phase: production build, JavaScript syntax, runtime references, 13-checkpoint route, mission handlers, circuit georeference, coordinate single source, continuous Demo route, circuit radar registration/bootstrap, checkpoint hand-off and final circuit overview.

The audit script itself has not been rewritten during the Working V2 freeze. Updating it to describe the final approved UI/game states should be a separate maintenance task after GPS validation, so the freeze does not accidentally redefine runtime behaviour.
