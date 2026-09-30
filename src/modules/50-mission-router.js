  function bindMission(id){
    const cp=id==='elf-radio'?ELF_RADIO_MISSION:CHECKPOINTS.find(c=>c.id===id); if(!cp) return;
    if(cp.type==='activation') bindCircuitEntryActivation();
    if(cp.type==='diagnostics') bindDiagnostics();
    if(cp.type==='radio') bindRadio();
    if(cp.type==='commsrelay') bindCommsRelay();
    if(cp.type==='power') bindPower();
    if(cp.type==='spirit') bindSpirit();
    if(cp.type==='placeholder') document.getElementById('completePlaceholder').onclick=()=>showCompletion('Checkpoint Reserved',`${cp.location} is reserved while the final activation game is developed.`);
    if(cp.type==='artifacts') bindArtifacts();
    if(cp.type==='comet') bindComet();
    if(cp.type==='jingle') bindJingle();
    if(cp.type==='lando') bindLando();
    if(cp.type==='aurora') bindAurora();
    if(cp.type==='lapland') bindLapland();
    if(cp.type==='northern') bindNorthern();
  }
