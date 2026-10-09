(() => {
  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  const STORAGE = 'silverstone-mc-pass2-v1';
  // Test stream for ELF FM. Replace with the production HTTPS stream when available.
  const ELF_STREAM_URL = 'https://streams.radiomast.io/ref-128k-mp3-stereo';
  const OVERRIDE_STORAGE = 'silverstone-mc-gps-overrides-v1';
  const OVERRIDE_MODE_STORAGE = 'silverstone-mc-gps-overrides-enabled-v1'; // legacy; no longer controls guest coordinates
  const LOCAL_TEST_MODE_STORAGE = 'silverstone-mc-local-test-mode-v1';
  const IS_ADMIN = window.location.pathname.replace(/\/+$/, '') === '/admin';
  if(IS_ADMIN){
    document.documentElement.classList.add('admin-mode');
    document.body.classList.add('admin-mode');
  }

  const CHECKPOINTS = [
    {id:'gantry', mc:'MC-00', location:'Entrance Gantry', name:'Scan QR', type:'qr', playable:false, core:false, geofence:false, routeEnabled:false, lat:52.0735668895174, lng:-1.0234212294205571},
    {id:'entry', mc:'MC-01', location:'National Link Road', name:'Circuit Link', type:'activation', playable:true, core:false, mission:'Circuit Link', geofence:true, lat:52.07317077672548, lng:-1.0116046670979981, detectionRadius:80, activationRadius:30},
    {id:'velocity', mc:'MC-02', location:'Wellington Straight', name:'Velocity Vault', type:'diagnostics', playable:true, core:true, mission:'Velocity Vault', lat:52.07672858114103, lng:-1.0179463765923242, detectionRadius:150, activationRadius:35},
    {id:'luffield', mc:'MC-03', location:'Luffield', name:'Comms Relay', type:'commsrelay', playable:true, core:false, mission:'Comms Relay', routeEnabled:true, geofence:true, lat:52.07588935484336, lng:-1.0202073683140254, detectionRadius:120, activationRadius:30},
    {id:'power', mc:'MC-04', location:'National Pit Straight', name:'Power Pulse', type:'artifacts', playable:true, core:true, mission:'Power Pulse', lat:52.07867166248026, lng:-1.0177768332976036, detectionRadius:150, activationRadius:35},
    {id:'spirit', mc:'MC-05', location:'Copse', name:'Spirit Depot', type:'spirit', playable:true, core:true, mission:'Spirit Depot', lat:52.07895798720806, lng:-1.0124059222979016, detectionRadius:120, activationRadius:30},
    {id:'escapade', mc:'MC-06', location:'Escapade', name:'Reindeer Raceway', type:'power', playable:true, core:true, mission:'Reindeer Raceway', lat:52.07480005189975, lng:-1.0102119794664433, detectionRadius:120, activationRadius:30},
    {id:'comet', mc:'MC-07', location:'Becketts', name:'Comet Curve', type:'comet', playable:true, core:true, mission:'Comet Curve', lat:52.07247136741095, lng:-1.0099658493552224, detectionRadius:140, activationRadius:30},
    {id:'jingle', mc:'MC-08', location:'Hangar Straight', name:'Jingle Beams', type:'jingle', playable:true, core:true, mission:'Jingle Beams', lat:52.067475902465475, lng:-1.0132842109045421, detectionRadius:150, activationRadius:35},
    {id:'lando', mc:'MC-09', location:'Stowe', name:'Lightspeed Lando', type:'lando', playable:true, core:true, mission:'Lightspeed Lando', lat:52.06363909240851, lng:-1.017077251994755, detectionRadius:120, activationRadius:30},
    {id:'aurora', mc:'MC-10', location:'Vale', name:'Aurora Apex', type:'aurora', playable:true, core:true, mission:'Aurora Apex', lat:52.065488708771205, lng:-1.0204674536551839, detectionRadius:120, activationRadius:30},
    {id:'lapland', mc:'MC-11', location:'Hamilton Straight', name:'Lapland Launch', type:'lapland', playable:true, core:true, mission:'Lapland Launch', lat:52.06828247188286, lng:-1.0234649670014986, detectionRadius:150, activationRadius:35},
    {id:'northern', mc:'MC-12', location:'Farm Curve', name:'Northern Flight', type:'northern', playable:true, core:true, mission:'Northern Flight', lat:52.07236283289121, lng:-1.0138972673152702, detectionRadius:120, activationRadius:30}
  ];

  const ELF_RADIO_MISSION = {id:'elf-radio', mc:'COMMS', location:'RADIO', name:'ELF FM', type:'radio', playable:true, core:false, mission:'Tune In'};

  const ROUTE_START_INDEX = 1;
  // GPS reliability thresholds. Activation is deliberately stricter than
  // detection so a weak fix can reveal a checkpoint without unlocking it.
  const ACTIVATION_ACCURACY_MAX = 25;
  const DETECTION_ACCURACY_MAX = 100;
  const PASS_ACCURACY_MAX = 40;
  const NEXT_PASS_ACCURACY_MAX = 35;
  const PASS_DWELL_MS = 1200;
  const ACTIVATION_HITS_REQUIRED = 2;
  const ACTIVATION_DWELL_MS = 1200;
  const NEXT_PASS_DWELL_MS = 1800;

  // Completely separate local test profile. These coordinates are used only when
  // Culcheth Local Test is explicitly enabled in /admin. The canonical Silverstone
  // CHECKPOINTS above remain the sole master/on-circuit coordinate source.
  //
  // The local route follows the agreed walk from 428 Warrington Road, around the
  // Village Green via Lodge Drive and back down Common Lane. It is intentionally
  // a linear rehearsal route rather than a replacement georeference.
  const LOCAL_TEST_PRESET = Object.freeze({
    id:'culcheth-loop',
    name:'Culcheth Local Test',
    detectionRadius:45,
    activationRadius:20,
    checkpointIds:Object.freeze(['entry','velocity','luffield','power','spirit','escapade','comet','jingle','lando','aurora','lapland','northern']),
    points:Object.freeze({
      entry:Object.freeze({lat:53.45296100,lng:-2.51642300,label:'428 Warrington Road'}),
      velocity:Object.freeze({lat:53.45293000,lng:-2.51830000,label:'Lower east side · Village Green'}),
      luffield:Object.freeze({lat:53.45332000,lng:-2.51800000,label:'East side · Village Green'}),
      power:Object.freeze({lat:53.45373700,lng:-2.51793800,label:'26 Lodge Drive / east end'}),
      spirit:Object.freeze({lat:53.45376100,lng:-2.51867700,label:'Mid Lodge Drive'}),
      escapade:Object.freeze({lat:53.45376700,lng:-2.51941500,label:'1 Kirkby Road / Lodge Drive'}),
      comet:Object.freeze({lat:53.45379000,lng:-2.52096000,label:'West Lodge Drive / bakery side'}),
      jingle:Object.freeze({lat:53.45345000,lng:-2.52145000,label:'Upper Jackson Avenue'}),
      lando:Object.freeze({lat:53.45303600,lng:-2.52158900,label:'31 Common Lane / Jackson Avenue'}),
      aurora:Object.freeze({lat:53.45266492,lng:-2.52089185,label:'CPS Centre'}),
      lapland:Object.freeze({lat:53.45212000,lng:-2.51977000,label:'Common Lane bend / red-pin area'}),
      northern:Object.freeze({lat:53.45253000,lng:-2.51842100,label:'Culcheth Library / cycle shop area'})
    })
  });

  function isRouteCheckpoint(cp){ return !!cp && cp.routeEnabled!==false; }
  function normaliseRouteIndex(index){
    let i=Math.max(ROUTE_START_INDEX,Number.isFinite(Number(index))?Number(index):ROUTE_START_INDEX);
    while(i<CHECKPOINTS.length&&!isRouteCheckpoint(CHECKPOINTS[i])) i++;
    return i;
  }
  function nextRouteIndex(index){ return normaliseRouteIndex(Number(index)+1); }
  function nextRouteCheckpoint(index){ const i=nextRouteIndex(index); return CHECKPOINTS[i]||null; }
  function normaliseProgressRouteIndex(index,completed=[]){
    let i=normaliseRouteIndex(index);
    const done=new Set(Array.isArray(completed)?completed:[]);
    while(i<CHECKPOINTS.length&&done.has(CHECKPOINTS[i]?.id)) i=nextRouteIndex(i);
    return i;
  }

  const OPENING_MESSAGE = {
    sender:'MISSION CONTROL',
    title:'RECOVERY MISSION ACTIVE',
    body:'Santa-1 has lost power and is grounded at Silverstone. We’ll use the circuit and its racing technology to bring the sleigh back online.'
  };

  const COMPLETION_MESSAGES = {
    entry:{sender:'MISSION CONTROL',title:'CIRCUIT POWER ROUTED',body:'We’re connected to the circuit. Energy is now reaching Santa-1 and the recovery can begin.'},
    velocity:{sender:'ENGINEERING',title:'RACING DATA CAPTURED',body:'We’ve got the data we need. Aero, stability, power, control, traction and response have all been captured for the rebuild.'},
    luffield:{sender:'COMMUNICATIONS',title:'COMMS ESTABLISHED',body:'We’ve got Santa back on comms. The link is clear and Mission Control can stay in contact from here.'},
    power:{sender:'ENGINEERING',title:'POWER STABILISED',body:'The racing energy is stable and the interference has been cleared. We can now send it on to be stored.'},
    spirit:{sender:'MISSION CONTROL',title:'SPIRIT CORE CHARGED',body:'The recovered energy is safely stored and both banks are holding steady. Santa-1 has a reliable power reserve again.'},
    escapade:{sender:'PROPULSION SYSTEM',title:'PROPULSION ONLINE',body:'Propulsion is holding up at speed. Santa-1 can handle the power needed for flight.'},
    comet:{sender:'CONTROL SYSTEM',title:'FLIGHT CONTROLS CALIBRATED',body:'Flight controls are calibrated and Santa-1 can now respond cleanly to rapid changes in direction.'},
    jingle:{sender:'GUIDANCE SYSTEM',title:'GUIDANCE LOCKED',body:'Guidance is locked. All three beams are working together and Santa-1 has a stable flight reference.'},
    lando:{sender:'RESPONSE SYSTEM',title:'RESPONSE CALIBRATED',body:'Response timing is where it needs to be. Santa-1 can now react quickly enough for high-speed flight.'},
    aurora:{sender:'NAVIGATION',title:'NORTH POLE SIGNAL LOCKED',body:'We’ve got a strong North Pole signal. Navigation has a clear reference and the route home is confirmed.'},
    lapland:{sender:'MISSION CONTROL',title:'LAUNCH SYSTEMS ONLINE',body:'Every restored system is responding correctly. Santa-1’s launch systems are online and ready for the final flight sequence.'},
    northern:{sender:'MISSION CONTROL',title:'RECOVERY MISSION COMPLETE',body:'Santa-1 is airborne. Recovery complete. The Northern Flight is underway.'}
  };

  const SLEIGH_STAGES = [
    {stage:1,trigger:null,name:'Grounded',asset:'./assets/sleigh-stage-1.webp',milestone:'Initial State',next:'Power Pulse',copy:'Santa-1 remains grounded while Mission Control restores the systems needed to begin the physical rebuild.'},
    {stage:2,trigger:'power',name:'Power Restored',asset:'./assets/sleigh-stage-2.webp',milestone:'Power Pulse',next:'Jingle Beams',copy:'Power Pulse has stabilised the recovered energy. Santa-1 is now visibly rebuilding as the remaining flight systems come back online.'},
    {stage:3,trigger:'jingle',name:'Guidance Restored',asset:'./assets/sleigh-stage-3.webp',milestone:'Jingle Beams',next:'Aurora Apex',copy:'Jingle Beams has restored guidance. The sleigh rebuild has advanced and Santa-1 is now waiting for a confirmed navigation route.'},
    {stage:4,trigger:'aurora',name:'Ready for Launch Clearance',asset:'./assets/sleigh-stage-4.webp',milestone:'Aurora Apex',next:'Lapland Launch',copy:'Aurora Apex has restored navigation and confirmed the route home. Santa-1 is rebuilt and ready for final launch clearance.'},
    {stage:5,trigger:'lapland',name:'Launch Cleared',asset:'./assets/sleigh-stage-5.webp',milestone:'Lapland Launch',next:'Northern Flight',copy:'Final launch verification is complete. Santa-1 is cleared for departure and awaiting the Northern Flight authorisation.'}
  ];

  const defaults = {
    onboarded:false,
    audio:true,
    mode:'live',
    nav:'radar',
    completed:[],
    available:[],
    routeIndex:ROUTE_START_INDEX,
    targetVisible:false,
    targetInRange:false,
    distance:null,
    bearing:0,
    gpsAccuracy:null,
    gpsCondition:'WAITING',
    gpsEnabled:true,
    missionOpen:null,
    missionReturnNav:'radar',
    elfUnlocked:false,
    elfAudioOn:false,
    elfPromptSeen:false,
    lastMessage:'SEARCHING FOR RECOVERY SIGNALS',
    bootDone:false,
    messages:[],
    messageSeq:0,
    messageAlert:false,
    demoRouteDistance:null,
    routeRevision:5
  };

  let state = load();
  let overrides = loadOverrides();
  let localTestEnabled = loadLocalTestMode();
  let cleanupMission = null;
  let audioCtx = null;
  let noiseNode = null;
  let noiseGain = null;
  let elfAudioEl = null;
  let elfTunerPreviewActive = false;
  let santaCommsEl = null;
  let santaTransmissionCleanup = null;
  let gpsWatchId = null;
  let adminWatchId = null;
  let lastGps = null;
  let activationHits = 0;
  let activationSince = null;
  let outsideSince = null;
  let nextPassSince = null;
  let inRangeLatched = false;
  let demoTimer = null;
  let demoInterval = null;
  let demoTrackPosition = null;
  let demoTrackDistance = null;
  let demoHoldUntil = 0;

  function load(){
    try {
      const parsed=JSON.parse(localStorage.getItem(STORAGE)||'{}');
      const oldCompleted=Array.isArray(parsed.completed)?parsed.completed:[];
      const oldAvailable=Array.isArray(parsed.available)?parsed.available:[];
      const completed=[...new Set(oldCompleted.map(id=>id==='elf'?'luffield':id))];
      const available=[...new Set(oldAvailable.map(id=>id==='elf'?'luffield':id))];
      // Strip legacy MC-03 messages from the old ELF FM checkpoint implementation,
      // then refresh persisted feed copy from the current canonical scripts.
      const messages=(Array.isArray(parsed.messages)?parsed.messages:[])
        .filter(m=>m?.checkpointId!=='elf'&&!String(m?.key||'').includes(':elf'))
        .map(m=>{
          if(m?.key==='opening') return {...m,...OPENING_MESSAGE};
          const key=String(m?.key||'');
          if(key.startsWith('complete:')){
            const script=COMPLETION_MESSAGES[key.slice('complete:'.length)];
            if(script) return {...m,...script};
          }
          return m;
        });
      let routeIndex=normaliseProgressRouteIndex(parsed.routeIndex??ROUTE_START_INDEX,completed);
      // Restore MC-03 for older sessions that skipped the temporarily removed route slot.
      if((Number(parsed.routeRevision)||1)<2 && routeIndex>3 && !completed.includes('luffield')) routeIndex=3;
      const liveMode=parsed.mode==='live';
      return {
        ...defaults,
        ...parsed,
        completed,
        available,
        messages,
        routeIndex,
        routeRevision:5,
        missionOpen:parsed.missionOpen==='entry'?null:(parsed.missionOpen||null),
        elfUnlocked:Boolean(parsed.elfUnlocked),
        elfAudioOn:false,
        elfPromptSeen:Boolean(parsed.elfPromptSeen),
        // Never trust a persisted in-range lock after a refresh. Live GPS must
        // revalidate the checkpoint before a mission can be opened again.
        targetInRange:liveMode?false:Boolean(parsed.targetInRange),
        targetVisible:liveMode?false:Boolean(parsed.targetVisible),
        distance:liveMode?null:(Number.isFinite(parsed.distance)?parsed.distance:null),
        gpsAccuracy:liveMode?null:(Number.isFinite(parsed.gpsAccuracy)?parsed.gpsAccuracy:null),
        gpsCondition:liveMode?(parsed.gpsEnabled===false?'OFF':'WAITING'):(parsed.gpsCondition||defaults.gpsCondition),
        gpsEnabled:parsed.gpsEnabled!==undefined?Boolean(parsed.gpsEnabled):liveMode,
        demoRouteDistance:parsed.mode==='demo'&&parsed.demoRouteDistance!==null&&parsed.demoRouteDistance!==undefined&&Number.isFinite(Number(parsed.demoRouteDistance))?Number(parsed.demoRouteDistance):null
      };
    } catch { return {...defaults}; }
  }
  function save(){ localStorage.setItem(STORAGE, JSON.stringify(state)); }
  function unreadCount(){ return state.messages.filter(m=>!m.read).length; }
  function formatMessageTime(timestamp){
    try{return new Date(timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});}catch{return '';}
  }
  function addMessage(key,sender,title,body,checkpointId=null){
    if(!key||state.messages.some(m=>m.key===key)) return false;
    const seq=(Number(state.messageSeq)||0)+1;
    const message={id:`MSG-${String(seq).padStart(3,'0')}`,seq,key,sender,title,body,checkpointId,timestamp:Date.now(),read:false};
    state.messageSeq=seq;
    state.messages=[...state.messages,message];
    state.messageAlert=true;
    save();
    if(!IS_ADMIN&&state.nav==='radar'&&!state.missionOpen) updateRadarLive();
    return true;
  }
  function ensureOpeningMessage(){
    if(!state.onboarded) return;
    addMessage('opening',OPENING_MESSAGE.sender,OPENING_MESSAGE.title,OPENING_MESSAGE.body,'MC-00');
  }
  function markAllMessagesRead(){
    if(!state.messages.some(m=>!m.read)){state.messageAlert=false;save();return;}
    state.messages=state.messages.map(m=>({...m,read:true}));
    state.messageAlert=false;save();
  }
  function dismissMessageAlert(){ state.messageAlert=false;save();updateRadarLive(); }
  function updateCommsBadge(){
    const ico=document.querySelector('[data-nav="comms"] .ico'); if(!ico) return;
    ico.querySelector('.nav-badge')?.remove();
    const unread=unreadCount(); if(!unread) return;
    const badge=document.createElement('span');badge.className='nav-badge';badge.textContent=unread>9?'9+':String(unread);ico.appendChild(badge);
  }
  function checkpointCompletionMessage(id){
    const script=COMPLETION_MESSAGES[id]; if(!script) return;
    addMessage(`complete:${id}`,script.sender,script.title,script.body,id);
  }
