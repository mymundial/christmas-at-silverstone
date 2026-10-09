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
  function getElfAudio(){
    if(!ELF_STREAM_URL) return null;
    if(!elfAudioEl){
      elfAudioEl=new Audio(ELF_STREAM_URL);
      elfAudioEl.preload='none';
      elfAudioEl.addEventListener('ended',()=>{state.elfAudioOn=false;save();updateElfRadioUI();});
      elfAudioEl.addEventListener('error',()=>{state.elfAudioOn=false;save();updateElfRadioUI();toast('ELF FM stream unavailable.');});
    }
    return elfAudioEl;
  }
  function updateElfRadioUI(){
    const btn=document.getElementById('elfAudioToggle'); if(!btn) return;
    btn.classList.toggle('on',state.elfAudioOn);btn.classList.toggle('off',!state.elfAudioOn);
    btn.setAttribute('aria-pressed',state.elfAudioOn?'true':'false');
    btn.setAttribute('aria-label',`Radio ${state.elfAudioOn?'on':'off'}`);
  }
  async function toggleElfAudio(){
    if(!state.elfUnlocked) return;
    if(!ELF_STREAM_URL){toast('ELF FM live stream is not connected yet.');return;}
    const audio=getElfAudio();if(!audio)return;
    audio.volume=1;
    if(state.elfAudioOn){audio.pause();try{audio.load();}catch{}state.elfAudioOn=false;save();updateElfRadioUI();return;}
    try{await audio.play();state.elfAudioOn=true;save();updateElfRadioUI();}
    catch{state.elfAudioOn=false;save();updateElfRadioUI();toast('Tap again to enable ELF FM audio.');}
  }
  async function startElfTunerPreview(){
    const audio=getElfAudio(); if(!audio) return false;
    try{
      audio.volume=.02;
      if(audio.paused) await audio.play();
      elfTunerPreviewActive=true;
      return true;
    }catch{
      elfTunerPreviewActive=false;
      return false;
    }
  }
  function setElfTunerPreview(delta){
    if(!elfTunerPreviewActive||!elfAudioEl) return;
    const clarity=Math.max(0,Math.min(1,1-(delta/1.1)));
    elfAudioEl.volume=Math.min(.9,.02+Math.pow(clarity,1.7)*.86);
  }
  function stopElfTunerPreview(){
    if(!elfTunerPreviewActive) return;
    try{elfAudioEl?.pause();if(elfAudioEl){elfAudioEl.volume=1;elfAudioEl.load();}}catch{}
    elfTunerPreviewActive=false;
  }
  function getSantaCommsAudio(){
    if(!santaCommsEl){
      santaCommsEl=new Audio('./assets/santa-comms-radio.mp3');
      santaCommsEl.preload='auto';
    }
    return santaCommsEl;
  }
  function rampElementVolume(el,to,duration=350){
    if(!el) return ()=>{};
    const from=Number.isFinite(el.volume)?el.volume:1;
    const start=performance.now();let raf=0;
    const step=now=>{const p=Math.min(1,(now-start)/duration);el.volume=from+(to-from)*p;if(p<1)raf=requestAnimationFrame(step);};
    raf=requestAnimationFrame(step);
    return ()=>cancelAnimationFrame(raf);
  }
  let missionAudioRadioOwner=null;
  let missionAudioRadioWasPlaying=false;
  let missionAudioRadioRestoreVolume=1;
  let missionAudioRadioFadeCancel=()=>{};
  function ensureElfRadioPlayback(targetVolume=1,duration=520){
    if(!elfAudioEl||!state.elfAudioOn) return false;
    const audio=elfAudioEl;
    const target=Math.max(.01,Math.min(1,Number.isFinite(targetVolume)?targetVolume:1));
    const restore=()=>{
      missionAudioRadioFadeCancel();
      missionAudioRadioFadeCancel=()=>{};
      // Always restart the fade from silence. This makes recovery deterministic
      // if a mobile browser suspended the stream while it was at zero volume.
      audio.volume=0;
      missionAudioRadioFadeCancel=rampElementVolume(audio,target,duration);
    };
    if(audio.paused){
      try{
        const play=audio.play();
        if(play&&typeof play.then==='function'){play.then(restore).catch(()=>{});}
        else restore();
      }catch{}
    } else restore();
    return true;
  }
  function beginMissionAudioRadioOverride(owner){
    if(!owner||!state.audio) return false;
    const audio=elfAudioEl;
    if(missionAudioRadioOwner===owner) return missionAudioRadioWasPlaying;
    missionAudioRadioFadeCancel();
    missionAudioRadioFadeCancel=()=>{};
    missionAudioRadioOwner=owner;
    missionAudioRadioWasPlaying=Boolean(audio&&state.elfAudioOn&&!audio.paused);
    missionAudioRadioRestoreVolume=missionAudioRadioWasPlaying?Math.max(.01,audio.volume||1):1;
    if(missionAudioRadioWasPlaying){
      // Mission bedding always has priority over ELF FM. Keep the stream alive
      // at silence so it can fade back in seamlessly when mission audio ends.
      missionAudioRadioFadeCancel=rampElementVolume(audio,0,220);
    }
    return missionAudioRadioWasPlaying;
  }
  function endMissionAudioRadioOverride(owner){
    if(!owner||missionAudioRadioOwner!==owner) return;
    const shouldRestore=missionAudioRadioWasPlaying;
    const restoreVolume=missionAudioRadioRestoreVolume;
    missionAudioRadioFadeCancel();
    missionAudioRadioFadeCancel=()=>{};
    missionAudioRadioOwner=null;
    missionAudioRadioWasPlaying=false;
    missionAudioRadioRestoreVolume=1;
    if(!shouldRestore||!elfAudioEl||!state.elfAudioOn) return;
    ensureElfRadioPlayback(restoreVolume,520);
  }
  function stopSantaTransmission(restoreRadio=true){
    try{santaTransmissionCleanup?.();}catch{}
    santaTransmissionCleanup=null;
    if(santaCommsEl){try{santaCommsEl.pause();santaCommsEl.currentTime=0;}catch{}}
    stopStatic();
    if(restoreRadio&&elfAudioEl&&state.elfAudioOn){rampElementVolume(elfAudioEl,1,320);}
  }
  function loadOverrides(){
    try { return JSON.parse(localStorage.getItem(OVERRIDE_STORAGE)||'{}') || {}; }
    catch { return {}; }
  }
  function saveOverrides(){ localStorage.setItem(OVERRIDE_STORAGE, JSON.stringify(overrides)); }
  function loadLocalTestMode(){
    try { return localStorage.getItem(LOCAL_TEST_MODE_STORAGE)==='1'; }
    catch { return false; }
  }
  function saveLocalTestMode(){
    try { localStorage.setItem(LOCAL_TEST_MODE_STORAGE,localTestEnabled?'1':'0'); }catch{}
  }
  function set(patch, rerender=true){ state={...state,...patch}; save(); if(rerender) render(); }
  function recovery(){
    const restorationMissions=['entry','velocity','luffield','power','spirit','escapade','comet','jingle','lando','aurora'];
    const restored=restorationMissions.reduce((total,id)=>total+(state.completed.includes(id)?1:0),0);
    return Math.min(100,restored*10);
  }
  function sleighStage(){
    for(let i=SLEIGH_STAGES.length-1;i>=1;i--){
      const trigger=SLEIGH_STAGES[i].trigger;
      if(trigger&&state.completed.includes(trigger)) return SLEIGH_STAGES[i];
    }
    return SLEIGH_STAGES[0];
  }
  function current(){
    const i=normaliseProgressRouteIndex(state.routeIndex,state.completed);
    if(i!==state.routeIndex){state.routeIndex=i;save();}
    return CHECKPOINTS[i] || null;
  }
  function activeConfig(cp){
    if(!cp) return null;
    const localPoint=localTestEnabled&&(IS_ADMIN||state.mode==='live')?LOCAL_TEST_PRESET.points?.[cp.id]:null;
    if(localPoint){
      return {
        ...cp,
        lat:Number(localPoint.lat),
        lng:Number(localPoint.lng),
        detectionRadius:Number(localPoint.detectionRadius)||LOCAL_TEST_PRESET.detectionRadius,
        activationRadius:Number(localPoint.activationRadius)||LOCAL_TEST_PRESET.activationRadius,
        localLabel:localPoint.label||cp.location,
        source:'CULCHETH LOCAL TEST'
      };
    }
    return {...cp,source:'MASTER'};
  }
  function checkpointIndex(id){ return CHECKPOINTS.findIndex(c=>c.id===id); }
  function toast(msg){ if(!toastEl) return; toastEl.textContent=msg; toastEl.classList.add('show'); setTimeout(()=>toastEl.classList.remove('show'),1800); }
  function haptic(pattern=30){ try{navigator.vibrate?.(pattern)}catch{} }
  function ensureAudio(){
    if(!state.audio) return null;
    if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
    return audioCtx;
  }
  function ping(freq=660,dur=.08,vol=.035){
    const ctx=ensureAudio(); if(!ctx) return;
    const o=ctx.createOscillator(), g=ctx.createGain();
    o.type='sine';o.frequency.value=freq;g.gain.value=vol;o.connect(g).connect(ctx.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+dur);o.stop(ctx.currentTime+dur);
  }
  function startStatic(level=.08){
    stopStatic(); const ctx=ensureAudio(); if(!ctx) return;
    const buffer=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate); const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
    noiseNode=ctx.createBufferSource(); noiseGain=ctx.createGain(); noiseGain.gain.value=level;
    const filter=ctx.createBiquadFilter(); filter.type='bandpass';filter.frequency.value=1900;filter.Q.value=.65;
    noiseNode.buffer=buffer;noiseNode.loop=true;noiseNode.connect(filter).connect(noiseGain).connect(ctx.destination);noiseNode.start();
  }
  function setStatic(level){ if(noiseGain && audioCtx) noiseGain.gain.setTargetAtTime(level,audioCtx.currentTime,.05); }
  function stopStatic(){ try{noiseNode?.stop()}catch{} noiseNode=null;noiseGain=null; }

  function toRad(v){return v*Math.PI/180}
  function toDeg(v){return v*180/Math.PI}
  function distanceMetres(lat1,lng1,lat2,lng2){
    const R=6371000, dLat=toRad(lat2-lat1), dLng=toRad(lng2-lng1);
    const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  }
  function bearingDegrees(lat1,lng1,lat2,lng2){
    const p1=toRad(lat1), p2=toRad(lat2), dl=toRad(lng2-lng1);
    const y=Math.sin(dl)*Math.cos(p2), x=Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl);
    return (toDeg(Math.atan2(y,x))+360)%360;
  }
  function gpsCondition(accuracy){
    if(!Number.isFinite(accuracy)) return 'WAITING';
    if(accuracy<=20) return 'GOOD';
    if(accuracy<=40) return 'FAIR';
    return 'POOR';
  }
  function distanceToActivation(cp,distance){
    const cfg=activeConfig(cp); if(!cfg || !Number.isFinite(distance)) return null;
    return Math.max(0,distance-(cfg.activationRadius||0));
  }

  /*
   * Silverstone GP circuit georeferencing.
   *
   * The visual circuit asset is an affine representation of the real GP circuit.
   * This calibration maps latitude/longitude into the 210 x 126 viewBox used by
   * assets/f1-circuit.svg. Checkpoint coordinates remain the single source of
   * truth: changing a checkpoint lat/lng automatically changes its circuit-SVG
   * position everywhere that geoToCircuitPoint() is used.
   *
   * Calibration source: OpenStreetMap Silverstone Circuit relation 51162,
   * matched against the centreline extracted from f1-circuit.svg.
   */
  const CIRCUIT_GEOREFERENCE = Object.freeze({
    originLat:52.0723241768421,
    originLng:-1.015653955789474,
    earthRadius:6371000,
    cosOriginLat:0.6146662830500618,
    viewBoxWidth:210,
    viewBoxHeight:126,
    // [east metres, north metres, 1] × matrix => [svgX, svgY]
    affine:Object.freeze([
      Object.freeze([0.00725814726,-0.0912500082]),
      Object.freeze([-0.0885797520,-0.00718978806]),
      Object.freeze([95.2143520,57.0416177])
    ])
  });

  // Simplified centreline of the current Silverstone GP circuit in lap order.
  // Points are [lat, lng]. The first point is repeated at the end to close the lap.
  // The simplification retains extra vertices through corners while straights use
  // fewer points. It is used for route progress and Demo Mode movement; the visual
  // SVG placement itself uses the affine calibration above.
  const SILVERSTONE_GP_ROUTE = Object.freeze([
    [52.0713853,-1.0095038],[52.0710283,-1.0092896],[52.0706261,-1.0094674],[52.0703708,-1.0099406],
    [52.0701312,-1.0105863],[52.0696242,-1.0113830],[52.0684607,-1.0124189],[52.0674961,-1.0132389],
    [52.0661730,-1.0143761],[52.0649526,-1.0154831],[52.0639144,-1.0166265],[52.0636366,-1.0170729],
    [52.0635173,-1.0178241],[52.0636829,-1.0185520],[52.0641325,-1.0190474],[52.0646522,-1.0194926],
    [52.0654181,-1.0204477],[52.0659547,-1.0212495],[52.0664893,-1.0219824],[52.0665210,-1.0223762],
    [52.0662795,-1.0227850],[52.0662756,-1.0232990],[52.0667237,-1.0239336],[52.0671113,-1.0242179],
    [52.0674523,-1.0243291],[52.0676956,-1.0241939],[52.0678435,-1.0240046],[52.0682609,-1.0234867],
    [52.0693366,-1.0221521],[52.0705464,-1.0206510],[52.0709772,-1.0201111],[52.0712576,-1.0196489],
    [52.0713301,-1.0189555],[52.0712662,-1.0180557],[52.0711802,-1.0170492],[52.0712436,-1.0163800],
    [52.0714672,-1.0157059],[52.0724757,-1.0136593],[52.0724857,-1.0131601],[52.0722297,-1.0129562],
    [52.0715511,-1.0126176],[52.0713919,-1.0123275],[52.0714576,-1.0120478],[52.0716431,-1.0118685],
    [52.0720530,-1.0116256],[52.0724390,-1.0114836],[52.0727853,-1.0114372],[52.0730095,-1.0114735],
    [52.0731445,-1.0116012],[52.0732314,-1.0117476],[52.0737199,-1.0126005],[52.0750079,-1.0148965],
    [52.0759323,-1.0165518],[52.0769957,-1.0184893],[52.0771544,-1.0191290],[52.0770866,-1.0197104],
    [52.0767966,-1.0200546],[52.0762189,-1.0201437],[52.0758331,-1.0205840],[52.0758167,-1.0211887],
    [52.0759651,-1.0215190],[52.0762608,-1.0217051],[52.0765120,-1.0216047],[52.0768042,-1.0213630],
    [52.0771545,-1.0210848],[52.0776564,-1.0206664],[52.0780531,-1.0201193],[52.0783590,-1.0194970],
    [52.0785660,-1.0187273],[52.0786532,-1.0178209],[52.0786915,-1.0171968],[52.0788052,-1.0152527],
    [52.0789308,-1.0127209],[52.0789384,-1.0122953],[52.0788330,-1.0117639],[52.0786714,-1.0114256],
    [52.0784522,-1.0111833],[52.0780046,-1.0109273],[52.0775156,-1.0107016],[52.0768832,-1.0104812],
    [52.0760817,-1.0103385],[52.0747434,-1.0102347],[52.0743517,-1.0101794],[52.0739838,-1.0099654],
    [52.0738005,-1.0097931],[52.0735288,-1.0095574],[52.0733936,-1.0095288],[52.0731811,-1.0095852],
    [52.0729402,-1.0097305],[52.0726765,-1.0098867],[52.0723941,-1.0100402],[52.0721130,-1.0100972],
    [52.0719580,-1.0100732],[52.0716805,-1.0098832],[52.0713853,-1.0095038]
  ]);

  function geoToCircuitMeters(lat,lng){
    const g=CIRCUIT_GEOREFERENCE;
    return {
      x:toRad(lng-g.originLng)*g.earthRadius*g.cosOriginLat,
      y:toRad(lat-g.originLat)*g.earthRadius
    };
  }

  function geoToCircuitPoint(lat,lng){
    if(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng))) return null;
    const metres=geoToCircuitMeters(Number(lat),Number(lng));
    const m=CIRCUIT_GEOREFERENCE.affine;
    return {
      x:metres.x*m[0][0]+metres.y*m[1][0]+m[2][0],
      y:metres.x*m[0][1]+metres.y*m[1][1]+m[2][1]
    };
  }


  // Radar uses the original filled circuit SVG as the visible road shape while
  // GPS/Demo movement still follows SILVERSTONE_GP_ROUTE. The visible SVG is
  // pulled back further so the fixed centre marker is clearly wider than the
  // circuit ribbon while still retaining useful local track context.
  const CIRCUIT_RADAR_ZOOM=1.3;

  function forwardRouteDistance(fromDistance,toDistance){
    return normaliseRouteDistance(Number(toDistance)-Number(fromDistance));
  }

  const SILVERSTONE_ROUTE_METRES = SILVERSTONE_GP_ROUTE.map(([lat,lng])=>{
    const p=geoToCircuitMeters(lat,lng);return {lat,lng,x:p.x,y:p.y};
  });
  const SILVERSTONE_ROUTE_SEGMENTS=[];
  let SILVERSTONE_ROUTE_LENGTH=0;
  for(let i=0;i<SILVERSTONE_ROUTE_METRES.length-1;i++){
    const a=SILVERSTONE_ROUTE_METRES[i],b=SILVERSTONE_ROUTE_METRES[i+1];
    const length=Math.hypot(b.x-a.x,b.y-a.y);
    SILVERSTONE_ROUTE_SEGMENTS.push({i,a,b,start:SILVERSTONE_ROUTE_LENGTH,length});
    SILVERSTONE_ROUTE_LENGTH+=length;
  }

  function normaliseRouteDistance(distance){
    const length=SILVERSTONE_ROUTE_LENGTH;
    if(!length) return 0;
    return ((Number(distance)||0)%length+length)%length;
  }

  function routePointAtDistance(distance){
    const d=normaliseRouteDistance(distance);
    let seg=SILVERSTONE_ROUTE_SEGMENTS[SILVERSTONE_ROUTE_SEGMENTS.length-1];
    for(const candidate of SILVERSTONE_ROUTE_SEGMENTS){
      if(d<=candidate.start+candidate.length){seg=candidate;break;}
    }
    const t=seg.length?Math.max(0,Math.min(1,(d-seg.start)/seg.length)):0;
    return {
      lat:seg.a.lat+(seg.b.lat-seg.a.lat)*t,
      lng:seg.a.lng+(seg.b.lng-seg.a.lng)*t,
      distance:d,
      progress:SILVERSTONE_ROUTE_LENGTH?d/SILVERSTONE_ROUTE_LENGTH:0,
      segmentIndex:seg.i
    };
  }

  function projectGeoToRoute(lat,lng){
    if(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng))) return null;
    const q=geoToCircuitMeters(Number(lat),Number(lng));
    let best=null;
    for(const seg of SILVERSTONE_ROUTE_SEGMENTS){
      const vx=seg.b.x-seg.a.x,vy=seg.b.y-seg.a.y;
      const len2=vx*vx+vy*vy;
      const raw=len2?((q.x-seg.a.x)*vx+(q.y-seg.a.y)*vy)/len2:0;
      const t=Math.max(0,Math.min(1,raw));
      const x=seg.a.x+vx*t,y=seg.a.y+vy*t;
      const off=Math.hypot(q.x-x,q.y-y);
      if(!best||off<best.offTrackDistance){
        const distance=seg.start+seg.length*t;
        best={
          lat:seg.a.lat+(seg.b.lat-seg.a.lat)*t,
          lng:seg.a.lng+(seg.b.lng-seg.a.lng)*t,
          distance,
          progress:SILVERSTONE_ROUTE_LENGTH?distance/SILVERSTONE_ROUTE_LENGTH:0,
          offTrackDistance:off,
          segmentIndex:seg.i
        };
      }
    }
    return best;
  }

  function routePointBeforeGeo(lat,lng,metresBefore=180){
    const projected=projectGeoToRoute(lat,lng);
    if(!projected) return null;
    return routePointAtDistance(projected.distance-Math.max(0,Number(metresBefore)||0));
  }

  function localTestRouteStatus(){
    const ids=LOCAL_TEST_PRESET.checkpointIds;
    const configuredIds=ids.filter(id=>{
      const point=LOCAL_TEST_PRESET.points?.[id];
      return Number.isFinite(Number(point?.lat))&&Number.isFinite(Number(point?.lng));
    });
    return {
      id:LOCAL_TEST_PRESET.id,
      name:LOCAL_TEST_PRESET.name,
      total:ids.length,
      captured:configuredIds.length,
      configured:configuredIds.length,
      capturedIds:configuredIds,
      missingIds:ids.filter(id=>!configuredIds.includes(id)),
      ready:configuredIds.length===ids.length,
      fixed:true
    };
  }

  function localTestCheckpointSequence(){
    return LOCAL_TEST_PRESET.checkpointIds
      .map(id=>{
        const cp=CHECKPOINTS.find(item=>item.id===id);
        const point=LOCAL_TEST_PRESET.points?.[id];
        return cp&&point?{cp,point}:null;
      })
      .filter(Boolean);
  }

  function localTestVirtualProjection(lat,lng){
    if(!localTestEnabled||!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng))) return null;
    const status=localTestRouteStatus();
    if(!status.ready) return null;
    const checkpoints=localTestCheckpointSequence();
    if(checkpoints.length<2) return null;

    const originPoint=checkpoints[0].point;
    const originLat=Number(originPoint.lat),originLng=Number(originPoint.lng);
    const earthRadius=CIRCUIT_GEOREFERENCE.earthRadius;
    const cosOrigin=Math.cos(toRad(originLat));
    const toLocalMetres=(pointLat,pointLng)=>({
      x:toRad(Number(pointLng)-originLng)*earthRadius*cosOrigin,
      y:toRad(Number(pointLat)-originLat)*earthRadius
    });

    const points=checkpoints.map(({cp,point})=>{
      const p=toLocalMetres(point.lat,point.lng);
      return {cp,point,lat:Number(point.lat),lng:Number(point.lng),x:p.x,y:p.y};
    });
    const q=toLocalMetres(lat,lng);
    let best=null;

    // Culcheth is a linear rehearsal route from MC01 to MC12. Do not create a
    // synthetic MC12→MC01 closing segment: that could make the start/end of the
    // village walk map onto the wrong side of Silverstone.
    for(let i=0;i<points.length-1;i++){
      const a=points[i],b=points[i+1];
      const vx=b.x-a.x,vy=b.y-a.y;
      const len2=vx*vx+vy*vy;
      const raw=len2?((q.x-a.x)*vx+(q.y-a.y)*vy)/len2:0;
      const t=Math.max(0,Math.min(1,raw));
      const x=a.x+vx*t,y=a.y+vy*t;
      const off=Math.hypot(q.x-x,q.y-y);
      if(!best||off<best.localOffRouteDistance) best={segmentIndex:i,t,localOffRouteDistance:off,a,b};
    }
    if(!best) return null;

    const masterA=projectGeoToRoute(best.a.cp.lat,best.a.cp.lng);
    const masterB=projectGeoToRoute(best.b.cp.lat,best.b.cp.lng);
    if(!masterA||!masterB) return null;
    const masterSpan=forwardRouteDistance(masterA.distance,masterB.distance);
    const mapped=routePointAtDistance(masterA.distance+masterSpan*best.t);
    return {
      ...mapped,
      virtual:true,
      presetId:LOCAL_TEST_PRESET.id,
      presetName:LOCAL_TEST_PRESET.name,
      localSegmentIndex:best.segmentIndex,
      localSegmentT:best.t,
      localOffRouteDistance:best.localOffRouteDistance,
      fromId:best.a.cp.id,
      toId:best.b.cp.id
    };
  }

  const SYSTEM_STATUS_META = {
    circuitry:{label:'Circuitry',icon:'./assets/system-circuitry.svg'},
    diagnostic:{label:'Diagnostic',icon:'./assets/system-diagnostic.svg'},
    comms:{label:'Comms',icon:'./assets/system-comms.svg'},
    power:{label:'Power',icon:'./assets/system-power.svg'},
    core:{label:'Core',icon:'./assets/system-core.svg'},
    propulsion:{label:'Propulsion',icon:'./assets/system-propulsion.svg'},
    guidance:{label:'Guidance',icon:'./assets/system-guidance.svg'},
    control:{label:'Control',icon:'./assets/system-control.svg'},
    response:{label:'Response',icon:'./assets/system-response.svg'},
    navigation:{label:'Navigation',icon:'./assets/system-navigation.svg'}
  };
  function systemStatusEntry(key,status='Standby',state='standby'){
    const meta=SYSTEM_STATUS_META[key]||{label:key,icon:key};
    return {key,label:meta.label,icon:meta.icon,status,state};
  }
  function shell(content, nav=true){ return `<main class="phone ${nav?'':'no-nav'}"><div class="screen">${content}</div>${nav?navBar():''}</main>`; }
  function navPageContent(){
    if(state.nav==='missions') return renderMissions();
    if(state.nav==='sleigh') return renderSleigh();
    if(state.nav==='comms') return renderComms();
    return renderRadar();
  }
  function navShell(){
    return `<main class="phone"><div class="screen">${topBar()}<div class="nav-view" data-view="${state.nav}">${navPageContent()}</div></div>${navBar()}</main>`;
  }
  function syncNavChrome(){
    document.querySelectorAll('[data-nav]').forEach(btn=>btn.classList.toggle('active',btn.dataset.nav===state.nav));
    updateCommsBadge();
  }
  function renderNavShell(){
    const view=document.querySelector('.phone:not(.no-nav) .nav-view');
    const masthead=document.querySelector('.phone:not(.no-nav) .screen>.topbar');
    if(view&&masthead){
      view.dataset.view=state.nav;
      view.innerHTML=navPageContent();
      syncNavChrome();
      return;
    }
    app.innerHTML=navShell();
  }
  function brand(){return `<div class="brand"><img src="./assets/silverstone-logo-landscape-cropped.webp" alt="Silverstone"></div>`}
  function settingAudioIcon(){
    return `<svg class="mission-setting-svg audio-setting-svg" viewBox="0 0 32 32" aria-hidden="true"><path d="M14 9 10.2 12.2H7.5v7.6h2.7L14 23z"/><path d="M18 12.1a5.1 5.1 0 0 1 0 7.8"/><path d="M20.9 9.4a8.75 8.75 0 0 1 0 13.2"/></svg>`;
  }
  function navSleighIcon(){
    return `<span class="nav-sleigh-icon-wrap" aria-hidden="true"><img class="nav-sleigh-icon nav-sleigh-off" src="./assets/nav-sleigh-unselected.webp?v=7.39.3" alt=""><img class="nav-sleigh-icon nav-sleigh-on" src="./assets/nav-sleigh-selected.webp?v=7.39.3" alt=""></span>`;
  }
  function navIcon(id){
    const icons={
      radar:`<svg viewBox="0 0 210 126" aria-hidden="true"><path fill="currentColor" d="M105 60.5c-11.8 0-23.1 4.9-31.2 13.6l4.4 4.1c13.7-14.8 36.8-15.7 51.6-1.9.6.6 1.2 1.2 1.8 1.8l4.4-4.1C128 65.3 116.7 60.5 105 60.5Zm0 30c-7 0-12.7 5.6-12.7 12.6S98 115.8 105 115.8s12.7-5.6 12.7-12.6c0-3.3-1.2-6.4-3.5-8.8-2.4-2.5-5.8-3.9-9.2-3.9Zm0 19.3c-3.7 0-6.6-3-6.6-6.6s3-6.6 6.6-6.6c3.6 0 6.6 3 6.6 6.6s-2.9 6.5-6.6 6.6ZM105 9.2C79 9.2 54.1 20 36.4 39l4.4 4.1c33.1-35.4 88.6-37.4 124.1-4.3 1.4 1.3 2.8 2.7 4.1 4.1l4.4-4.1C155.7 19.9 130.9 9.2 105 9.2Zm0 25.6c-18.9 0-37 7.8-49.9 21.7l4.4 4.1c23.4-25.1 62.7-26.5 87.9-3.1 1 .9 2 1.9 3 2.9l4.4-4.1c-13.1-13.7-31-21.5-49.8-21.5Z"/></svg>`,
      missions:`<svg viewBox="0 0 210 126" aria-hidden="true"><path fill="currentColor" d="M142 62.7H86.9v6H142v-6Zm0 15.4H86.9v6H142v-6Zm0-30.9H86.9v6H142v-6Zm-61.1-15.4H68.1v6h12.8v-6Zm61.1 0H86.9v6H142v-6Zm2.2-26.5H65.8l-12.3 6v102l12.3 6h78.5l12.3-6v-102l-12.4-6Zm6.3 108H59.5v-102h91.1v102ZM80.9 78.1H68.1v6h12.8v-6Zm0-30.9H68.1v6h12.8v-6Zm0 15.5H68.1v6h12.8v-6Z"/></svg>`,
      comms:`<svg viewBox="0 0 210 126" aria-hidden="true"><path fill="currentColor" d="M105 8.62a46.17 46.17 0 0 1 46.12 46.12h6a52.14 52.14 0 0 0-104.27 0h6A46.17 46.17 0 0 1 105 8.62Zm41.18 50.67c-7.73 0-13.12 5.49-13.12 13.36V86c0 7.89 4.87 13.18 12.11 13.18a12.52 12.52 0 0 0 4.41-.77c-2.54 7.83-8.27 11.22-18.1 11.22H119a9 9 0 0 0-8.45-6H99.32a8.95 8.95 0 1 0 0 17.89h11.25a9 9 0 0 0 8.39-5.86h12.51c17.54 0 25.7-9.42 25.7-29.64V59.29Zm-35.6 56.2H99.32a2.93 2.93 0 0 1 0-5.86h11.25a2.93 2.93 0 1 1 0 5.86ZM151.16 86c0 4.49-2.24 7.17-6 7.17s-6.1-2.61-6.1-7.17V72.65c0-3.55 1.87-7.34 7.11-7.34h5Zm-14-44.19A3 3 0 0 0 140 43.69a3.17 3.17 0 0 0 1.12-.21 3 3 0 0 0 1.67-3.92 40.73 40.73 0 0 0-75.58 0 3 3 0 1 0 5.58 2.25 34.71 34.71 0 0 1 64.42 0ZM63.85 59.29h-11V86c0 7.89 4.82 13.18 12 13.18S77 93.89 77 86V72.65C77 64.78 71.58 59.29 63.85 59.29ZM71 86c0 4.56-2.23 7.17-6.11 7.17s-6-2.68-6-7.17V65.31h5c5.24 0 7.11 3.79 7.11 7.34Z"/></svg>`,
      sleigh:navSleighIcon()
    };
    return icons[id]||'';
  }
  function navBar(){ return `<nav class="nav" aria-label="Mission Control">${navButton('radar','Radar')}${navButton('missions','Missions')}${navButton('sleigh','Sleigh')}${navButton('comms','Comms')}</nav>`; }
  function navButton(id,label){
    const unread=id==='comms'?unreadCount():0;
    return `<button data-nav="${id}" class="${state.nav===id?'active':''}"><span class="ico">${navIcon(id)}${unread?`<span class="nav-badge">${unread>9?'9+':unread}</span>`:''}</span><span>${label}</span></button>`;
  }
  function topBar(){ return `<header class="topbar">${brand()}<img class="mission-control-logo" src="./assets/mission-control-logo.webp" alt="Mission Control"></header>`; }
  function statusStrip(){
    const cp=current();
    const activationDistance=distanceToActivation(cp,state.distance);
    const distanceValue=!cp?'GARAGES':state.targetVisible&&Number.isFinite(activationDistance)?`${Math.round(activationDistance)} M`:'SEARCHING';
    const condition=state.mode==='demo'?'DEMO':state.gpsEnabled===false?'OFF':state.gpsCondition;
    return `<section class="telemetry-block"><div class="telemetry-heading">MISSION TELEMETRY</div><div class="status-strip panel">
      <div class="status-cell"><div class="status-label">GPS Accuracy</div><div class="status-value gps-${condition.toLowerCase()}">${condition}</div></div>
      <div class="status-cell"><div class="status-label">Sleigh Rebuild</div><div class="status-value ${recovery()>=100?'is-complete':''}">${recovery()}%</div></div>
      <div class="status-cell"><div class="status-label">Next Checkpoint</div><div class="status-value">${distanceValue}</div></div>
    </div></section>`;
  }

  function radarMessage(cp){
    if(cp&&state.targetInRange&&cp.playable){
      return `<div class="mission-card message-card panel target-message compact-target" id="radarMessage"><div><div class="kicker">${cp.location}</div><h3>${cp.name}</h3></div><button class="btn small primary" data-start-mission="${cp.id}">${cp.type==='activation'?'Start Activation':cp.type==='radio'?'Tune Signal':cp.type==='diagnostics'?'Start Diagnostics':'Start Mission'}</button></div>`;
    }
    if(!cp){
      const demoRestart=state.mode==='demo'?`<button class="btn small primary" type="button" data-demo-restart>Restart</button>`:'';
      return `<div class="mission-card message-card panel complete-message compact-message final-radar-message" id="radarMessage"><div><div class="kicker">Mission Complete</div><h3>MEET SANTA AT HIS GROTTO</h3></div>${demoRestart}</div>`;
    }
    const activationGap=distanceToActivation(cp,state.distance);
    const acquired=state.targetVisible&&Number.isFinite(activationGap)&&activationGap<=60;
    if(cp.type==='activation'){
      if(acquired) return `<div class="mission-card message-card panel compact-message target-acquired-message" id="radarMessage"><div><div class="kicker">Target Approach</div><h3>Target Acquired</h3></div></div>`;
      if(state.targetVisible) return `<div class="mission-card message-card panel compact-message" id="radarMessage"><div><div class="kicker">Target Approach</div><h3>Checkpoint Ahead</h3></div></div>`;
      return `<div class="mission-card message-card panel compact-message" id="radarMessage"><div><div class="kicker">Target Search</div><h3>Locating Checkpoint</h3></div></div>`;
    }
    if(acquired){
      return `<div class="mission-card message-card panel compact-message target-acquired-message" id="radarMessage"><div><div class="kicker">Target Approach</div><h3>Target Acquired</h3></div></div>`;
    }
    if(state.targetVisible){
      return `<div class="mission-card message-card panel compact-message" id="radarMessage"><div><div class="kicker">Target Approach</div><h3>Checkpoint Ahead</h3></div></div>`;
    }
    return `<div class="mission-card message-card panel compact-message" id="radarMessage"><div><div class="kicker">Target Search</div><h3>Radar Searching</h3></div></div>`;
  }


  function render(){
    if(IS_ADMIN){ renderAdmin(); return; }
    if(cleanupMission){ cleanupMission(); cleanupMission=null; }
    stopStatic();
    stopMc00Scan();
    if(!state.onboarded){
      app.innerHTML=shell(renderLaunch(),false);
      bindGlobal();
      bindMc00Scan(state.bootDone);
      return;
    }
    if(state.missionOpen){ app.innerHTML=shell(renderMission(state.missionOpen),false); bindGlobal(); bindMission(state.missionOpen); return; }
    if(state.nav==='radar'&&!state.elfPromptSeen&&!state.elfUnlocked){ app.innerHTML=shell(renderElfOnboarding(),false); bindGlobal(); return; }
    if(state.nav==='comms') markAllMessagesRead();
    renderNavShell();
    bindGlobal();
    if(state.nav==='radar'){
      updateRadarLive();
      // Demo progression is re-armed whenever Radar is rendered. This makes
      // returning from Comms / Missions / Sleigh resilient if a pending demo
      // timer was interrupted while another panel was open.
      if(state.mode==='demo'&&!state.missionOpen){
        maybeStartDemoTarget(400);
        rearmDemoRoute(900);
      }
    }
  }
  function renderLaunch(){
    if(state.bootDone===false) return `<section class="hero"><div class="hero-content"><img class="hero-logo hero-logo-stacked" src="./assets/silverstone-logo-landing.webp" alt="Silverstone"><img class="hero-mission-logo" src="./assets/mission-control-logo.webp" alt="Mission Control"><div class="hero-actions"><button class="btn primary" data-onboard="mc00-live">Start Mission</button></div></div></section>`;
    return renderOnboardStep(state.bootDone);
  }
  function renderOnboardStep(step){
    const setupHeader=topBar();
    if(step==='mc00-live'){
      const systems=[
        systemStatusEntry('circuitry'),
        systemStatusEntry('propulsion'),
        systemStatusEntry('diagnostic'),
        systemStatusEntry('guidance'),
        systemStatusEntry('comms'),
        systemStatusEntry('control'),
        systemStatusEntry('power'),
        systemStatusEntry('response'),
        systemStatusEntry('core'),
        systemStatusEntry('navigation')
      ];
      return `<section class="onboard with-masthead setup-page mc00-page">${setupHeader}<div class="onboard-card panel mc00-card" data-mc00-mode="${step}"><div class="mc00-copy"><h1>System Diagnostics</h1><p class="support-copy">Santa-1 Sleigh Recovery</p></div><div class="mc00-visual-wrap"><div class="mc00-sleigh-frame"><div class="sleigh-visual sleigh-stage-1 mc00-sleigh-visual" role="img" aria-label="Santa-1 sleigh system diagnostics visual"><div class="sleigh-glow" aria-hidden="true"></div><img class="sleigh-art" src="./assets/sleigh-stage-1.webp" alt="" aria-hidden="true" fetchpriority="high"><div class="mc00-scan-beam" aria-hidden="true"></div></div></div></div>${systemStatusBank(systems,'mc00-system-bank','mc00')}<div class="mc00-progress-row"><div class="mc00-progress" role="progressbar" aria-label="System diagnostics progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="mc00ProgressFill"></span></div><strong id="mc00ProgressValue">0%</strong></div><div class="mc00-complete-popup panel" id="mc00CompleteBlock" hidden><div class="mc00-complete-icon" aria-hidden="true"><span class="checkmark-icon checkmark-icon--large"></span></div><h2>Scan Complete</h2><button class="btn primary wide" id="mc00Continue" data-mc00-continue="${step}">Continue</button></div></div></section>`;
    }
    if(step==='brief') return `<section class="onboard with-masthead setup-page briefing-page">${setupHeader}<div class="onboard-card panel setup-card"><div class="onboard-icon setup-icon"><span class="setup-icon-glyph"><img src="./assets/mission-briefing-icon.svg" alt=""></span></div><h1>Mission Briefing</h1><div class="support-copy briefing-copy"><p><strong>Santa needs your help.</strong></p><p>Santa-1 has made an unscheduled pit stop at Silverstone and the recovery is underway.</p><p>Follow the signals around the circuit and help bring each system back online to get the sleigh race-ready again.</p></div><div class="setup-actions"><button class="btn primary wide" data-onboard="location">Continue</button></div></div></section>`;
    return `<section class="onboard with-masthead setup-page radar-setup-page">${setupHeader}<div class="onboard-card panel setup-card"><div class="onboard-icon setup-icon"><span class="setup-icon-glyph"><img src="./assets/radar-setup-icon.svg" alt=""></span></div><h1>Mission Radar</h1><p class="support-copy">Mission Control uses your location to detect each installation as you move around the circuit.</p><div class="setup-actions stack"><button class="btn primary wide" data-location="request">Enable GPS Location</button><button class="btn secondary wide" data-location="demo">Demo Mode</button></div></div></section>`;
  }
  function renderElfOnboarding(){
    return `<section class="onboard with-masthead setup-page elf-setup-page">${topBar()}<div class="onboard-card panel setup-card"><div class="onboard-icon setup-icon"><span class="setup-icon-glyph"><img src="./assets/radio-setting-icon.svg" alt=""></span></div><h1>ELF FM</h1><p class="support-copy">Connect to ELF FM through Mission Control?</p><div class="setup-actions stack"><button class="btn primary wide" data-elf-onboard="tune">Tune In</button><button class="btn secondary wide" data-elf-onboard="continue">Continue Mission</button></div></div></section>`;
  }

  function renderRadar(){
    const cp=current();
    const modeClass=state.mode==='demo'?' demo-radar-page':'';
    const finalCircuitOverview=state.completed.includes('northern');
    const localVirtualCircuitMode=state.mode==='live'&&localTestEnabled&&localTestRouteStatus().ready;
    const circuitMode=state.completed.includes('entry')||finalCircuitOverview||localVirtualCircuitMode;
    const circuitLayer=finalCircuitOverview
      ? `<div class="track-radar-map final-overview" id="trackRadarMap" aria-hidden="true"><div class="track-radar-art" id="trackRadarArt"></div></div>`
      : circuitMode
        ? `<div class="track-radar-map waiting" id="trackRadarMap" aria-hidden="true" style="--circuit-radar-zoom:${CIRCUIT_RADAR_ZOOM}"><div class="track-radar-art" id="trackRadarArt"></div><span class="track-radar-target hidden" id="trackRadarTarget"></span></div>`
        : '';
    const userMarker=finalCircuitOverview?'':'<div class="user-dot"></div>';
    const targetMarker=!finalCircuitOverview&&cp?'<div class="target-dot hidden"></div>':'';
    return `<section class="radar-page${modeClass}">${statusStrip()}<section class="radar-zone" aria-label="Live checkpoint radar"><section class="radar-wrap"><div class="radar${circuitMode?' circuit-radar':''}${finalCircuitOverview?' circuit-overview-radar':''}">${circuitLayer}<div class="sweep"></div>${userMarker}${targetMarker}</div></section></section>${radarMessage(cp)}</section>`;
  }
  function missionStatus(cp){
    const idx=checkpointIndex(cp.id);
    if(state.completed.includes(cp.id)) return 'COMPLETE';
    if(state.available.includes(cp.id)) return 'AVAILABLE';
    if(idx===state.routeIndex) return state.targetInRange?'IN RANGE':'NEXT';
    if(idx<state.routeIndex) return 'AVAILABLE';
    return 'LOCKED';
  }
  function renderMissions(){
    const rows=CHECKPOINTS.filter(c=>c.playable&&isRouteCheckpoint(c)).map(cp=>{
      const status=missionStatus(cp);
      const playable=status==='AVAILABLE'||status==='IN RANGE';
      const interaction=playable?` data-open-mission="${cp.id}" role="button" tabindex="0" aria-label="Open ${cp.name}"`:'';
      return `<div class="mission-row panel ${status==='COMPLETE'?'done':''} ${status==='AVAILABLE'?'available':''} ${playable?'interactive':''}"${interaction}><div class="mission-index">${cp.mc.replace('MC-','')}</div><div class="mission-row-copy"><div class="kicker">${cp.location}</div><h3>${cp.name}</h3></div><div class="row-action"><div class="row-status">${status}</div></div></div>`;
    }).join('');
    return `<section class="missions-log"><div class="missions-feed-viewport"><div class="missions-feed-scroll"><div class="list missions-list">${rows}</div></div></div></section>`;
  }
  function renderSleigh(){
    const r=recovery();
    const info=sleighStage();
    const stage=info.stage;
    const postStatus=state.completed.includes('northern')
      ? {name:'Airborne',copy:'Northern Flight is underway. Santa-1 has launched successfully and the rebuilt sleigh is operating as intended.'}
      : state.completed.includes('lapland')
        ? {name:'Flight Ready',copy:'Lapland Launch has completed the final systems verification. Every rebuilt system is stable and Santa-1 is fully cleared for launch.'}
        : {name:info.name,copy:info.copy};
    // DOM is row-paired so this interleave renders mission order 1–5 down column 1,
    // then 6–10 down column 2.
    const systems=[
      systemStatusEntry('circuitry',state.completed.includes('entry')?'Online':'Offline',state.completed.includes('entry')?'online':'offline'),
      systemStatusEntry('propulsion',state.completed.includes('escapade')?'Online':'Offline',state.completed.includes('escapade')?'online':'offline'),
      systemStatusEntry('diagnostic',state.completed.includes('velocity')?'Online':'Offline',state.completed.includes('velocity')?'online':'offline'),
      systemStatusEntry('guidance',state.completed.includes('jingle')?'Online':'Offline',state.completed.includes('jingle')?'online':'offline'),
      systemStatusEntry('comms',state.completed.includes('luffield')?'Online':'Offline',state.completed.includes('luffield')?'online':'offline'),
      systemStatusEntry('control',state.completed.includes('comet')?'Online':'Offline',state.completed.includes('comet')?'online':'offline'),
      systemStatusEntry('power',state.completed.includes('power')?'Online':'Offline',state.completed.includes('power')?'online':'offline'),
      systemStatusEntry('response',state.completed.includes('lando')?'Online':'Offline',state.completed.includes('lando')?'online':'offline'),
      systemStatusEntry('core',state.completed.includes('spirit')?'Online':'Offline',state.completed.includes('spirit')?'online':'offline'),
      systemStatusEntry('navigation',state.completed.includes('aurora')?'Online':'Offline',state.completed.includes('aurora')?'online':'offline')
    ];
    return `<div class="sleigh-card panel"><div class="sleigh-title-row"><div><div class="kicker sleigh-pretitle">Sleigh Rebuild</div><h1>Santa-1</h1></div><strong class="sleigh-percent ${r>=100?'is-complete':''}">${r}%</strong></div><div class="sleigh-development-bar ${r>=100?'is-complete':''}" style="--sleigh-progress:${r}%" role="progressbar" aria-label="Santa-1 rebuild progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${r}"><div class="sleigh-development-spectrum" aria-hidden="true"></div><div class="sleigh-development-mask" style="left:${r}%" aria-hidden="true"></div><i class="sleigh-development-marker" aria-hidden="true"></i></div><div class="sleigh-visual sleigh-stage-${stage}"><div class="sleigh-glow" aria-hidden="true"></div><img class="sleigh-art" src="${info.asset}" alt="Santa-1 ${postStatus.name} rebuild stage"></div><div class="sleigh-systems panel soft"><div class="kicker sleigh-systems-title">System Status</div>${systemStatusBank(systems,'sleigh-system-bank')}</div></div>`;
  }

  function systemStatusBank(systems,extraClass='',dataPrefix=''){
    return `<div class="system-status-bank ${extraClass}">${systems.map((system,i)=>{
      const stateClass=system.state?` is-${system.state}`:'';
      const dataAttr=dataPrefix?` data-${dataPrefix}-system="${system.key}"`:'';
      const iconSrc=system.icon||SYSTEM_STATUS_META[system.key]?.icon||'';
      return `<div class="system-status-item${stateClass}"${dataAttr}><div class="system-status-name"><span class="system-node" aria-hidden="true"></span><img class="system-glyph" src="${iconSrc}" alt="" aria-hidden="true"><span>${system.label}</span></div><div class="system-status-value"${dataPrefix?` data-${dataPrefix}-status="${system.key}"`:''}>${system.status}</div></div>`;
    }).join('')}</div>`;
  }
  function messageActivationLabel(message){
    if(message.key==='opening') return 'MISSION CONTROL';
    if(message.checkpointId){
      const cp=CHECKPOINTS.find(c=>c.id===message.checkpointId||c.mc===message.checkpointId);
      if(cp){
        return cp.name||cp.location||'MISSION CONTROL';
      }
    }
    return message.sender||'MISSION CONTROL';
  }
  function renderComms(){
    const feed=[...state.messages].sort((a,b)=>b.timestamp-a.timestamp).map(m=>`<article class="comms-message panel ${m.read?'':'unread'}"><div class="comms-message-head"><div class="kicker">${messageActivationLabel(m)}</div><time datetime="${new Date(m.timestamp).toISOString()}">${formatMessageTime(m.timestamp)}</time></div><h3>${m.title}</h3><p>${m.body}</p></article>`).join('');
    const gpsOn=state.mode==='live'&&state.gpsEnabled!==false;
    const streamReady=Boolean(ELF_STREAM_URL);
    const radioButton=state.elfUnlocked
      ? `<button class="mission-setting-toggle radio-setting ${state.elfAudioOn?'on':'off'}" id="elfAudioToggle" data-elf-audio aria-pressed="${state.elfAudioOn?'true':'false'}" aria-label="ELF FM ${state.elfAudioOn?'on':'off'}" ${streamReady?'':'aria-disabled="true"'}><span class="mission-setting-icon"><img src="./assets/radio-setting-icon.svg" alt=""></span><span class="mission-setting-copy"><span>ELF FM</span></span></button>`
      : `<button class="mission-setting-toggle radio-setting off" data-tune-elf aria-pressed="false" aria-label="Tune ELF FM"><span class="mission-setting-icon"><img src="./assets/radio-setting-icon.svg" alt=""></span><span class="mission-setting-copy"><span>ELF FM</span></span></button>`;
    const gpsClass=state.mode==='demo'?'demo':gpsOn?'on':'off';
    const gpsStateLabel=state.mode==='demo'?'':`<strong>${gpsOn?'ACTIVE':state.gpsCondition}</strong>`;
    const settings=`<section class="mission-settings panel"><div class="mission-settings-head"><div class="kicker">Mission Settings</div></div><div class="mission-settings-grid"><div class="mission-setting-toggle mission-setting-status ${gpsClass}" aria-label="GPS Location ${state.mode==='demo'?'demo mode':gpsOn?'active':state.gpsCondition.toLowerCase()}"><span class="mission-setting-icon"><img src="./assets/radar-setup-icon.svg" alt=""></span><span class="mission-setting-copy"><span>GPS Location</span>${gpsStateLabel}</span></div><button class="mission-setting-toggle ${state.audio?'on':'off'}" data-mission-audio-setting aria-pressed="${state.audio?'true':'false'}" aria-label="Mission Audio ${state.audio?'on':'off'}"><span class="mission-setting-icon">${settingAudioIcon()}</span><span class="mission-setting-copy"><span>Mission Audio</span></span></button>${radioButton}</div></section>`;
    const feedBody=feed||'<div class="comms-empty panel">No transmissions received.</div>';
    return `${settings}<section class="comms-feed"><div class="comms-section-title"><span>Message Feed</span></div><div class="comms-feed-viewport"><div class="comms-feed-scroll">${feedBody}</div></div></section>`;
  }


  function missionHeader(cp){
    const label=`${cp.mc} / ${cp.location}`;
    if(cp.type==='diagnostics'){
      return `<div class="mission-head diagnostics-head"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><div class="diagnostics-brand"><img src="./assets/audi-rings-2026.webp" alt="Audi"></div><h1>${cp.name}</h1><p class="support-copy">${missionInstruction(cp.type)}</p></div>`;
    }
    if(cp.type==='activation'){
      return `<div class="mission-head mc01-head"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><h1>${cp.name}</h1><p class="support-copy">${missionInstruction(cp.type)}</p></div>`;
    }
    if(cp.type==='artifacts'){
      return `<div class="mission-head artifact-head"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><div class="artifact-sponsor"><img src="./assets/care-bears-logo.png?v=7.38.44" alt="Care Bears"></div><h1>${cp.name}</h1><p class="support-copy">${missionInstruction(cp.type)}</p></div>`;
    }
    if(cp.type==='spirit'){
      return `<div class="mission-head spirit-head"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><div class="spirit-sponsor"><img src="./assets/care-bears-logo.png?v=7.38.44" alt="Care Bears"></div><h1>${cp.name}</h1><p class="support-copy">${missionInstruction(cp.type)}</p></div>`;
    }
    if(cp.type==='power'&&cp.id==='escapade'){
      return `<div class="mission-head raceway-head"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><div class="raceway-sponsor"><img src="./assets/escapade-logo.png?v=1" alt="Escapade" width="1350" height="386" fetchpriority="high"></div><h1>${cp.name}</h1><p class="support-copy">${missionInstruction(cp.type)}</p></div>`;
    }
    if(cp.type==='lapland'){
      return `<div class="mission-head lapland-head"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><div class="lapland-sponsor"><img src="./assets/las-vegas-logo-white.svg" alt="Las Vegas"></div><h1>${cp.name}</h1><p class="support-copy">${missionInstruction(cp.type)}</p></div>`;
    }
    return `<div class="mission-head"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><h1>${cp.name}</h1><p class="support-copy">${missionInstruction(cp.type)}</p></div>`;
  }
  function missionInstruction(type){
    return ({
      activation:'You have now entered the live circuit zone.',
      diagnostics:'Capture the racing data needed to rebuild Santa-1.',
      radio:'Tune the receiver to 87.7 Elf FM.',
      commsrelay:'Establish communications with Santa-1.',
      power:'Test Santa-1’s propulsion system.',
      spirit:'Store the positive energy.',
      placeholder:'This checkpoint is reserved while the final installation game is developed.',
      artifacts:'Collect the energy signatures.',
      comet:'Calibrate Santa-1’s flight controls.',
      jingle:'Restore Santa-1’s guidance system.',
      lando:'Calibrate Santa-1’s flight response.',
      aurora:'Lock onto the North Pole navigation signal.',
      lapland:'Bring Santa-1’s launch systems online.',
      northern:'Authorise Santa-1 for departure.'
    })[type]||'';
  }
  function renderMission(id){
    const cp=id==='elf-radio'?ELF_RADIO_MISSION:CHECKPOINTS.find(c=>c.id===id); if(!cp) return '';
    return `<div class="mission-shell mission-${cp.type}">${topBar()}${missionHeader(cp)}<div class="mission-content" id="missionContent">${missionBody(cp)}</div></div>`;
  }
  function missionBody(cp){
    switch(cp.type){
      case 'activation': return circuitEntryBody();
      case 'diagnostics': return diagnosticsBody();
      case 'radio': return radioBody();
      case 'commsrelay': return commsRelayBody();
      case 'power': return powerBody();
      case 'spirit': return spiritBody();
      case 'placeholder': return placeholderBody(cp);
      case 'artifacts': return artifactBody();
      case 'comet': return cometBody();
      case 'jingle': return jingleBody();
      case 'lando': return landoBody();
      case 'aurora': return auroraBody();
      case 'lapland': return laplandBody();
      case 'northern': return northernBody();
      default:return '';
    }
  }
  function circuitEntryBody(){
    const cp=CHECKPOINTS.find(c=>c.id==='entry');
    const node=geoToCircuitPoint(cp?.lat,cp?.lng)||{x:88.88,y:31.11};
    const nodeX=node.x.toFixed(2),nodeY=node.y.toFixed(2);
    return `<div class="mission-instrument panel mc01-panel" id="mc01Activation" data-stage="detected">
      <div class="mc01-readout mc01-readout-top">
        <span class="mc01-bolt" aria-hidden="true"><img src="./assets/system-power.svg" alt=""></span>
        <div class="mc01-readout-copy"><span id="mc01StateLabel">Circuit Link</span><strong id="mc01State">Signal Detected</strong></div>
        <div class="mc01-signal-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      </div>
      <div class="mc01-track-stage" aria-hidden="true">
        <div class="mc01-track-shadow"></div>
        <div class="mc01-track-outline"></div>
        <div class="mc01-track-energy"></div>
        <svg class="mc01-node-map" viewBox="0 0 210 126" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <circle class="mc01-energy-ripple ripple-a" cx="${nodeX}" cy="${nodeY}" r="3.5"></circle>
          <circle class="mc01-energy-ripple ripple-b" cx="${nodeX}" cy="${nodeY}" r="3.5"></circle>
          <circle class="mc01-energy-node" cx="${nodeX}" cy="${nodeY}" r="3.5"></circle>
        </svg>
      </div>
      <div class="mc01-transfer mc01-transfer-bottom" aria-label="Circuit Link energy transfer progress">
        <div class="mc01-transfer-meta"><span>Energy Transfer</span><strong id="mc01TransferValue">0%</strong></div>
        <div class="mc01-transfer-track"><i id="mc01TransferFill"></i></div>
      </div>
    </div>`;
  }

  function diagnosticsBody(){
    const sensors=[
      {name:'Aero',key:'aero',viz:`<div class="mc02-icon mc02-icon-aero"><svg class="mc02-svg mc02-aero-svg" viewBox="0 0 210 126" aria-hidden="true"><path class="mc02-aero-frame-path" d="M27.16,11.07V120.66h6V17.08h6V120.64h6V17.08H164.74V120.64h6V17.08h6V120.66h6V11.07ZM49.7,34H160.2V28H49.7Z"/><path class="mc02-aero-ring-path" d="M105,41.51a39.27,39.27,0,1,0,39.27,39.26A39.3,39.3,0,0,0,105,41.51Zm0,72.88a33.62,33.62,0,1,1,33.62-33.62A33.66,33.66,0,0,1,105,114.39Z"/><g class="mc02-aero-fan-group"><path class="mc02-aero-blades-path" d="M105,114.39m14.35-27.73c-1.41.32-4.52.71-6.84-1.35a8.56,8.56,0,0,0,1-2.37c4.32-1.43,10.41-4.22,11.17-12,.86-8.82-8-15.09-14.52-16.73-3.49-.87-6.91.35-8.5,3.05-1.5,2.55-1,5.67,1.27,8.12,1,1.06,2.87,3.56,2.26,6.6H105a8.88,8.88,0,0,0-2.38.33c-3.4-3-8.85-6.9-16-3.68-8.07,3.67-9.09,14.46-7.23,21,1,3.45,3.76,5.8,6.89,5.83h.06c2.94,0,5.36-2,6.34-5.16.42-1.38,1.64-4.26,4.58-5.25a9.18,9.18,0,0,0,1.56,2c-.92,4.45-1.55,11.12,4.79,15.65A12.39,12.39,0,0,0,111,105c5.55,0,11.2-3.17,14.41-6.5,2.5-2.58,3.15-6.15,1.61-8.88S122.62,85.9,119.35,86.66Zm-23-7.24c-4.87,1.25-7.82,5.32-9,9.19-.08.27-.4,1.16-.94,1.16h0c-.41,0-1.15-.47-1.51-1.74-1.1-3.81-1-11.91,4.13-14.25,3.39-1.54,6.13-.29,8.85,1.91A8.6,8.6,0,0,0,96.33,79.42Zm10.19-19.27c.2-.35,1-.76,2.26-.44,3.85,1,10.82,5.09,10.27,10.7-.36,3.71-2.81,5.45-6.07,6.71a8.86,8.86,0,0,0-2.47-3.18c1.35-4.85-.7-9.43-3.46-12.39C106.85,61.34,106.24,60.62,106.52,60.15Zm-5.37,20.62A3.85,3.85,0,1,1,105,84.62,3.85,3.85,0,0,1,101.15,80.77Zm20.2,13.81c-2.76,2.85-9.82,6.82-14.41,3.54-3-2.16-3.31-5.16-2.77-8.6.27,0,.55,0,.83,0a8.71,8.71,0,0,0,3.16-.6c3.52,3.6,8.52,4.1,12.46,3.2.28-.07,1.21-.24,1.48.24S122.27,93.63,121.35,94.58Z"/></g></svg></div>`},
      {name:'Stability',key:'stability',viz:`<div class="mc02-icon mc02-icon-stability"><span class="mc02-layer mc02-stability-car"></span><span class="mc02-layer mc02-stability-headlights"></span></div>`},
      {name:'Power',key:'power',viz:`<div class="mc02-icon mc02-icon-power"><svg class="mc02-svg mc02-power-svg" viewBox="0 0 210 126" aria-hidden="true"><path class="mc02-power-gauge-path" d="M105,15.05A72.14,72.14,0,0,0,32.93,87.11a73,73,0,0,0,.77,10.57l.44,3,21.67-3.09-.84-6L39.28,93.82c-.22-2.22-.34-4.47-.34-6.71a65.69,65.69,0,0,1,13.47-39.9L64.67,57.39l3.85-4.63L56.26,42.58a65.89,65.89,0,0,1,45.86-21.44v16h6v-16a65.93,65.93,0,0,1,45.6,21.43L139.11,54.7,141.05,57a47.1,47.1,0,0,1,10.41,36.91l-.64,3.16,25,3.59.44-3a73.21,73.21,0,0,0,.77-10.58A72.15,72.15,0,0,0,105,15.05Z"/><g class="mc02-power-needle-group"><path class="mc02-power-needle-path" d="M171.32,117.08l-64-35.21.06,0-.12,0A5.77,5.77,0,0,0,99.39,89a5.89,5.89,0,0,0,3.16,3.34L170.41,119a1.08,1.08,0,0,0,.91-2Z"/></g></svg></div>`},
      {name:'Control',key:'control',viz:`<div class="mc02-icon mc02-icon-control"><span class="mc02-layer mc02-control-wheel"></span><span class="mc02-layer mc02-control-ring"></span></div>`},
      {name:'Traction',key:'traction',viz:`<div class="mc02-icon mc02-icon-traction"><span class="mc02-layer mc02-traction-car"></span><span class="mc02-layer mc02-traction-skids"></span><span class="mc02-layer mc02-traction-shine"></span></div>`},
      {name:'Response',key:'response',viz:`<div class="mc02-icon mc02-icon-response"><span class="mc02-layer mc02-response-cones"></span><span class="mc02-layer mc02-response-arrow"></span><span class="mc02-layer mc02-response-shine"></span></div>`}
    ];
    return `<div class="mission-instrument panel diagnostics-panel"><div class="sensor-grid diagnostics-grid">${sensors.map((x,i)=>`<button class="sensor sensor-${x.key}" data-sensor="${i}" data-diagnostic="${x.key}"><div class="sensor-head"><span class="num">0${i+1}</span><span class="name">${x.name}</span></div><div class="sensor-viz viz-${x.key}" aria-hidden="true">${x.viz}</div><div class="state">Tap to scan</div></button>`).join('')}</div></div><button class="btn primary wide" id="diagComplete" disabled>Complete Scan</button>`;
  }

  function radioBody(){return `<div class="mission-instrument panel"><div class="wave" id="radioWave">${'<i></i>'.repeat(28)}</div><div class="frequency"><span id="freqVal">86.4</span> <small>FM</small></div><div class="range-wrap"><input id="freqRange" class="range" type="range" min="86" max="89" value="86.4" step="0.1"><div class="freq-marks"><span>86.0</span><span>87.0</span><span>88.0</span><span>89.0</span></div></div><div class="signal-state" id="signalState">Searching for signal</div><button class="btn primary wide" id="lockSignal" disabled>Lock Signal</button></div>`}
  function commsRelayBody(){
    return `<div class="mission-instrument panel comms-relay-panel">
      <div class="relay-progress-head"><span>RELAYS LOCKED</span><strong id="relayLockedCount">0 / 4</strong></div>
      <div class="relay-progress-track" aria-label="Relay lock progress">${Array.from({length:4},(_,i)=>`<i data-relay-progress="${i}"></i>`).join('')}</div>
      <div class="relay-network" id="relayNetwork" aria-label="Signal relay network">
        <svg class="relay-route" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true">
          <line class="relay-hop-line" data-hop="0" x1="25" y1="25" x2="75" y2="25"></line>
          <line class="relay-hop-line" data-hop="1" x1="75" y1="25" x2="25" y2="75"></line>
          <line class="relay-hop-line" data-hop="2" x1="25" y1="75" x2="75" y2="75"></line>
          <line class="relay-hop-line" data-hop="3" x1="75" y1="75" x2="25" y2="125"></line>
          <line class="relay-hop-line" data-hop="4" x1="25" y1="125" x2="75" y2="125"></line>
        </svg>
        ${Array.from({length:5},(_,i)=>`<span class="relay-carrier-packet" data-carrier="${i}" aria-hidden="true"></span>`).join('')}
        <div class="relay-cell relay-endpoint relay-origin"><span class="relay-radio-icon"><img src="./assets/relay-transmitter-icon.svg" alt="" aria-hidden="true"></span><small>TRANSMITTER</small></div>
        ${[0,1,2,3].map(i=>`<div class="relay-cell relay-capture"><button class="relay-node ${i===0?'active':''}" data-relay="${i}" aria-label="Relay ${i+1}"><span class="relay-target"></span><span class="relay-pulse"></span><span class="relay-core">0${i+1}</span></button><small>RELAY 0${i+1}</small></div>`).join('')}
        <div class="relay-cell relay-endpoint relay-destination"><span class="relay-receiver-icon"><img src="./assets/relay-receiver-hi-spec.svg" alt="" aria-hidden="true"></span><small>RECEIVER</small></div>
      </div>
      <div class="visually-hidden" id="relayState" aria-live="polite">Relay 01 armed</div>
    </div>`;
  }
  function powerBody(){
    const revSegments=Array.from({length:12},()=>'<i></i>').join('');
    return `<div class="mission-instrument panel power-run-panel">
      <div class="power-arcade" id="powerArcade">
        <div class="power-scanlines" aria-hidden="true"></div>
        <div class="power-hud">
          <div class="power-time-hud"><span>Time</span><strong id="powerRunState">00:00</strong></div>
          <div class="power-speed-hud"><span>Speed</span><strong><b id="powerSpeed">0</b><small>MPH</small></strong></div>
          <div class="power-propulsion-hud"><span>Propulsion</span><strong id="powerOutput">0%</strong></div>
        </div>
        <div class="power-rev-wrap"><div class="power-rev" id="powerRev">${revSegments}</div></div>
        <div class="power-road-scene" id="powerRoad">
          <div class="power-sky-sprite" aria-hidden="true"></div>
          <div class="power-ground" aria-hidden="true">
            <div class="power-grass-plane"></div>
            <div class="power-road-plane"></div>
          </div>
          <div class="power-horizon-seam" aria-hidden="true"></div>
          <div class="power-speed-lines" aria-hidden="true">${Array.from({length:12},()=>'<i></i>').join('')}</div>
          <div class="power-car" id="powerCar">
            <img class="power-car-sprite" src="./assets/power-car.webp" alt="Blue retro pixel racing car seen from behind">
            <span class="power-exhaust power-exhaust-left"></span><span class="power-exhaust power-exhaust-right"></span>
          </div>
          <div class="power-burst" id="powerBurst" aria-hidden="true"><i></i><i></i><i></i></div>
        </div>
        <div class="power-max-hold"><span>SPEED LOCK</span><div><i id="powerMaxFill"></i></div><strong id="powerMaxState">STANDBY</strong></div>
      </div>
      <div class="visually-hidden" id="powerState" aria-live="polite">Ready</div>
      <button class="btn primary wide power-accelerator" id="powerAccelerator">ACCELERATE</button>
    </div>`;
  }
  function spiritBody(){
    const tankDefs=[
      {side:'left',index:0,key:'purple',rgb:'198,92,255',color:'#c65cff',name:'Purple energy'},
      {side:'left',index:1,key:'green',rgb:'92,245,96',color:'#5cf560',name:'Green energy'},
      {side:'left',index:2,key:'red',rgb:'255,92,116',color:'#ff5c74',name:'Red energy'},
      {side:'left',index:3,key:'blue',rgb:'76,219,255',color:'#4cdbff',name:'Light blue energy'},
      {side:'right',index:0,key:'yellow',rgb:'255,224,84',color:'#ffe054',name:'Yellow energy'},
      {side:'right',index:1,key:'pink',rgb:'255,110,186',color:'#ff6eba',name:'Pink energy'},
      {side:'right',index:2,key:'white',rgb:'247,250,255',color:'#f7faff',name:'White energy'},
      {side:'right',index:3,key:'orange',rgb:'255,122,28',color:'#ff7a1c',name:'Orange energy'}
    ];
    const bhpIcon=`<svg class="spirit-bhp-icon" viewBox="66 0 66 126" focusable="false" aria-hidden="true"><path d="M83.34,125.93,98.42,75.57h-32L127.44,0,112.37,50.35h32ZM79,69.55H106.5L97.88,98.34l33.88-42H104.29l8.62-28.78Z"></path></svg>`;
    const tankCells=side=>tankDefs.filter(tank=>tank.side===side).map(tank=>`<div class="spirit-tank-cell spirit-tank-${tank.key}" data-spirit-tank="${tank.side}-${tank.index}" data-spirit-color="${tank.key}" data-spirit-rgb="${tank.rgb}" data-spirit-hex="${tank.color}" style="--tank-rgb:${tank.rgb};--tank-color:${tank.color};" aria-label="${tank.name} storage tank">
      <span class="spirit-tank-energy"></span>
      <span class="spirit-tank-shimmer"></span>
      <span class="spirit-tank-grid" aria-hidden="true"></span>
      <span class="spirit-tank-plate" aria-hidden="true"><span class="spirit-tank-plate-face">${bhpIcon}</span></span>
      <span class="spirit-tank-vent" aria-hidden="true"><i></i><i></i><i></i></span>
      <button type="button" class="spirit-tank-power" data-spirit-charge="${tank.side}-${tank.index}" aria-label="Charge ${tank.name} tank"><span class="spirit-power-bolt" aria-hidden="true"><svg viewBox="66 0 78 126" focusable="false"><path d="M83.34,125.93,98.42,75.57h-32L127.44,0,112.37,50.35h32ZM79,69.55H106.5L97.88,98.34l33.88-42H104.29l8.62-28.78Z"></path></svg></span></button>
    </div>`).join('');
    const stageDots=Array.from({length:8},(_,i)=>`<i data-spirit-stage-dot="${i}"></i>`).join('');
    return `<div class="mission-instrument panel spirit-panel" id="spiritRig" data-stage="0">
      <div class="spirit-score"><span>CORE CHARGE</span><strong><b id="spiritStageNumber">0</b> / 8</strong></div>
      <div class="spirit-stage-progress" id="spiritStageProgress" aria-hidden="true">${stageDots}</div>
      <div class="spirit-apparatus" aria-label="Spirit energy storage tanks">
        <div class="spirit-meter spirit-meter-left" aria-hidden="true"><span class="spirit-meter-fill"></span><b class="spirit-meter-marker"></b></div>
        <div class="spirit-bank spirit-bank-left"><div class="spirit-tank-stack">${tankCells('left')}</div></div>
        <div class="spirit-bank spirit-bank-right"><div class="spirit-tank-stack">${tankCells('right')}</div></div>
        <div class="spirit-meter spirit-meter-right" aria-hidden="true"><span class="spirit-meter-fill"></span><b class="spirit-meter-marker"></b></div>
      </div>
    </div>`;
  }
  function placeholderBody(cp){const location=cp?.location||'Checkpoint';return `<div class="mission-instrument panel" style="text-align:center;padding:30px 18px"><div class="onboard-icon">?</div><div class="kicker">${location} / Creative Hold</div><h2 style="font-family:var(--display);text-transform:uppercase;font-size:28px;margin:8px 0">Mission TBC</h2><p class="sub">This checkpoint is reserved while the final installation game is developed. GPS activation, route progression and completion behaviour remain active for testing.</p><button class="btn primary wide" style="margin-top:16px" id="completePlaceholder">Complete Demo Step</button></div>`}
  function artifactBody(){
    return `<div class="mission-instrument panel artifact-panel">
      <div class="artifact-score"><span>SIGNATURE CAPTURE</span><strong id="artifactProgress">0 / 10</strong></div>
      <div class="artifact-progress-track" aria-hidden="true">${Array.from({length:10},(_,i)=>`<i data-artifact-step="${i}"></i>`).join('')}</div>
      <div class="artifact-instruction" aria-hidden="true">Collect the energy signatures.</div>
      <div class="artifact-field" id="artifactField" data-intensity="1" aria-label="Power Pulse positive energy field">
        <canvas class="starstream-canvas" id="starstreamCanvas" aria-hidden="true"></canvas>
        <div class="starstream-nebula" aria-hidden="true"></div>
        <div class="starstream-vignette" aria-hidden="true"></div>
        <div class="starstream-beam" id="starstreamBeam" aria-hidden="true"><i></i><i></i><i></i></div>
        <div class="artifact-layer" id="artifactLayer"></div>
        <div class="artifact-burst-layer" id="artifactBurstLayer" aria-hidden="true"></div>
      </div>
      <div class="signal-state artifact-state" id="artifactState" aria-hidden="true">Energy signatures detected</div>
    </div>`;
  }
  function cometBody(){
    const lanes=[['L','left'],['D','down'],['U','up'],['R','right']];
    const btnLabel={L:'Left',D:'Down',U:'Up',R:'Right'};
    const arrow=(dir,extra='')=>`<span class="comet-arrow-icon comet-arrow-${dir} ${extra}" aria-hidden="true"><i></i><i></i></span>`;
    return `<div class="mission-instrument panel comet-panel">
      <div class="comet-score"><span>CONTROL CALIBRATION</span><strong id="cometProgress">0 / 10</strong></div>
      <div class="comet-progress-track" aria-hidden="true">${Array.from({length:10},(_,i)=>`<i data-comet-step="${i}"></i>`).join('')}</div>
      <div class="comet-game" id="cometGame" aria-label="Directional flight control calibration game">
        <div class="comet-lanes">${lanes.map(([key])=>`<div class="comet-lane" data-comet-lane="${key}"></div>`).join('')}</div>
        <div class="comet-capture-line" aria-hidden="true"></div>
        <div class="comet-notes" id="cometNotes" aria-hidden="true"></div>
        <div class="comet-hit-flash" id="cometHitFlash"></div>
        <div class="comet-judgement" id="cometJudgement" aria-live="polite"></div>
        <div class="comet-combo" id="cometCombo" aria-live="polite"></div>
      </div>
      <div class="comet-controls">${lanes.map(([key,dir])=>`<button class="comet-btn comet-btn-${dir}" data-arrow="${key}" aria-label="${btnLabel[key]}">${arrow(dir)}</button>`).join('')}</div>
      <div class="visually-hidden" id="cometState" aria-live="polite">Flight controls armed</div>
    </div>`;
  }
  function jingleBody(){
    return `<div class="mission-instrument panel jingle-panel" id="jinglePanel">
      <div class="jingle-progress-head"><span>GUIDANCE LOCK</span><strong id="jingleLockCount">0 / 3</strong></div>
      <div class="jingle-lock-track" aria-label="Guidance lock progress">${[1,2,3].map(i=>`<i class="${i===1?'is-next':''}" data-jingle-beam="${i}"></i>`).join('')}</div>
      <div class="jingle-arena is-awaiting-start" id="jingleArena" tabindex="0" role="application" aria-label="Jingle Beams guidance game. Start the puck, then tap or slide horizontally to steer the paddle and direct the charge into each receiver.">
        <div class="jingle-grid" aria-hidden="true"><img class="jingle-centre-mark" src="./assets/silverstone-s-mark.webp" alt=""></div>
        <div class="jingle-energy-rail rail-left" aria-hidden="true"><i></i></div>
        <div class="jingle-energy-rail rail-right" aria-hidden="true"><i></i></div>
        <div class="jingle-receiver" id="jingleReceiver" aria-hidden="true"><span></span><i></i></div>
        <div class="jingle-goal-flare" id="jingleGoalFlare" aria-hidden="true"></div>
        <div class="jingle-puck-trail" id="jinglePuckTrail" aria-hidden="true"></div>
        <button type="button" class="jingle-puck is-ready" id="jinglePuck" aria-label="Start Jingle Beams"><i></i><img class="jingle-play-icon" src="./assets/video-play.svg" alt="" aria-hidden="true"><strong class="jingle-puck-countdown" id="jingleCountdown"></strong></button>
        <div class="jingle-paddle" id="jinglePaddle" aria-hidden="true"><i></i></div>
        <div class="jingle-drag-prompt" id="jinglePrompt"><strong>TAP TO STEER</strong></div>
      </div>
      <div class="jingle-state" id="jingleState" aria-live="polite">Beam 01 ready</div>
    </div>`;
  }
  function landoBody(){
    return `<div class="mission-instrument panel lando-panel">
      <div class="lando-round-head"><span>REACTION TEST</span><strong id="landoRound">1 / 4</strong></div>
      <div class="lando-results" aria-label="Reaction test results">
        ${[1,2,3,4].map(i=>`<div class="lando-result ${i===1?'active':''}" data-lando-result="${i}"><strong>${i}</strong></div>`).join('')}
      </div>
      <div class="lando-gantry-art" id="landoGantry" aria-label="Five column start light gantry with four stacked lamps">
        <img src="./assets/lando-gantry.webp" alt="" aria-hidden="true">
        <div class="lando-light-overlay" aria-hidden="true">
          ${[0,1,2,3,4].map(col=>[0,1,2,3].map(row=>`<span class="lando-lamp" data-col="${col}" data-row="${row}"></span>`).join('')).join('')}
        </div>
      </div>
      <button class="btn primary wide lando-react-btn" id="reactionBtn">Start Test</button>
    </div>`;
  }
  function auroraBody(){
    const rings=['outer','middle','inner'];
    return `<div class="mission-instrument panel aurora-panel">
      <div class="aurora-atmosphere" aria-hidden="true"></div>
      <div class="aurora-progress-head"><span>Navigation Lock</span><strong id="auroraLockCount">0 / 3</strong></div>
      <div class="aurora-lock-track" id="auroraLockTrack" aria-label="Navigation lock progress">${Array.from({length:3},()=>'<i></i>').join('')}</div>
      <div class="aurora-north" aria-hidden="true"><span class="aurora-north-star">✦</span><i></i></div>
      <div class="aurora-dial" id="auroraDial" role="group" aria-label="Aurora Apex navigation alignment instrument">
        <div class="aurora-field" aria-hidden="true"></div>
        <div class="aurora-target-line" aria-hidden="true"></div>
        <div class="aurora-capture-gate" aria-hidden="true"><i></i></div>
        ${rings.map(key=>`<button type="button" class="aurora-ring aurora-ring-${key}" data-aurora-ring="${key}" aria-label="Lock ${key} navigation ring"><img src="./assets/aurora-ring-${key}.webp" alt="" aria-hidden="true"><span class="aurora-lock-notch" aria-hidden="true"></span></button>`).join('')}
        <div class="aurora-charge-pulse" aria-hidden="true"></div>
        <div class="aurora-final-wave" aria-hidden="true"></div>
        <div class="aurora-compass" aria-hidden="true"><span><img class="aurora-compass-mark" src="./assets/silverstone-s-mark.webp" alt=""></span></div>
      </div>
      <div class="visually-hidden" id="auroraState" aria-live="polite">Align the active navigation ring with the North Pole axis.</div>
    </div>`;
  }
  function laplandBody(){
    // Ten mission-linked systems, arranged as two balanced five-row columns.
    // Existing system names remain unchanged; MC01/MC02 add CIRCUITRY + DIAGNOSTIC.
    // Row-paired markup is interleaved so the visible columns read in mission order:
    // column 1 = 1–5, column 2 = 6–10.
    const systems=[
      systemStatusEntry('circuitry'),
      systemStatusEntry('propulsion'),
      systemStatusEntry('diagnostic'),
      systemStatusEntry('guidance'),
      systemStatusEntry('comms'),
      systemStatusEntry('control'),
      systemStatusEntry('power'),
      systemStatusEntry('response'),
      systemStatusEntry('core'),
      systemStatusEntry('navigation')
    ];
    return `<div class="mission-instrument panel lapland-panel" id="laplandPanel" style="--lapland-charge:0">
      <section class="lapland-stage lapland-verification-stage" id="laplandVerificationStage">
        <div class="lapland-online-progress" id="laplandOnlineProgress">
          <div class="lapland-online-head"><span>SYSTEMS ONLINE</span><strong id="laplandOnlineCount">0 / 10</strong></div>
          <div class="lapland-online-track" aria-label="Launch system verification progress">${Array.from({length:10},(_,i)=>`<i data-lapland-progress="${i}"></i>`).join('')}</div>
        </div>
        ${systemStatusBank(systems,'lapland-system-bank','verify')}
        <div class="lapland-launch-slot">
          <button class="btn primary wide lapland-test-btn" id="initiateTest">Initialise Launch</button>
        </div>
      </section>
      <section class="lapland-stage lapland-transmission-stage" id="laplandTransmissionStage" hidden>
        <div class="incoming-transmission lapland-incoming">
          <div class="transmission-wave">${'<b></b>'.repeat(24)}</div>
          <div class="kicker">Incoming Transmission</div>
          <h2>ELF ENGINEERING</h2>
          <div class="signal-state lock">Signal locked</div>
        </div>
      </section>
      <section class="lapland-stage lapland-party-stage" id="laplandPartyStage" hidden aria-label="Las Vegas launch celebration">
        <div class="lapland-party-lightshow" aria-hidden="true">
          <i class="lapland-party-wash"></i>
          <i class="lapland-party-beam party-beam-a"></i><i class="lapland-party-beam party-beam-b"></i><i class="lapland-party-beam party-beam-c"></i><i class="lapland-party-reflections"></i>
        </div>
        <div class="lapland-disco-rig" aria-hidden="true"><canvas class="lapland-disco-video" id="laplandDiscoVisual" width="180" height="180"></canvas></div>
        <div class="lapland-party-message">
          <span>SANTA-1</span>
          <i class="lapland-clearance-divider" aria-hidden="true"></i>
          <strong>CLEARED FOR LAUNCH</strong>
        </div>
      </section>
    </div>`;
  }
  function northernBody(){return `<div class="mission-instrument panel northern-panel northern-hud-panel" id="northernPanel">
      <div class="northern-santa-label" aria-hidden="true"><i></i><span>SANTA-1</span><i></i></div>
      <div class="northern-hud-window" aria-hidden="true">
        <svg class="northern-hud-svg" viewBox="0 0 1000 650" preserveAspectRatio="xMidYMid meet" role="presentation">
          <defs>
            <radialGradient id="nfHudBg" cx="50%" cy="48%" r="66%">
              <stop offset="0" stop-color="#0a3146" stop-opacity=".48"/>
              <stop offset=".52" stop-color="#061f31" stop-opacity=".18"/>
              <stop offset="1" stop-color="#020d17" stop-opacity="0"/>
            </radialGradient>
            <filter id="nfSoftGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="6" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="nfCoreGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="10" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          <rect width="1000" height="650" fill="url(#nfHudBg)"/>

          <g class="nf-stars" fill="#b8f4ff">
            <circle cx="74" cy="88" r="2.2" opacity=".72"/><circle cx="122" cy="170" r="1.4" opacity=".45"/><circle cx="180" cy="108" r="1.8" opacity=".62"/>
            <circle cx="238" cy="202" r="1.6" opacity=".5"/><circle cx="294" cy="76" r="1.2" opacity=".55"/><circle cx="350" cy="144" r="2" opacity=".72"/>
            <circle cx="420" cy="94" r="1.3" opacity=".45"/><circle cx="470" cy="188" r="1.5" opacity=".58"/><circle cx="560" cy="112" r="1.5" opacity=".5"/>
            <circle cx="642" cy="76" r="1.8" opacity=".68"/><circle cx="704" cy="170" r="1.2" opacity=".48"/><circle cx="770" cy="108" r="2" opacity=".66"/>
            <circle cx="834" cy="196" r="1.5" opacity=".5"/><circle cx="906" cy="92" r="1.8" opacity=".68"/><circle cx="942" cy="228" r="1.3" opacity=".46"/>
            <circle cx="96" cy="334" r="1.5" opacity=".5"/><circle cx="154" cy="444" r="2" opacity=".68"/><circle cx="220" cy="352" r="1.3" opacity=".48"/>
            <circle cx="284" cy="528" r="1.8" opacity=".58"/><circle cx="344" cy="418" r="1.4" opacity=".48"/><circle cx="400" cy="566" r="2" opacity=".7"/>
            <circle cx="606" cy="548" r="1.5" opacity=".52"/><circle cx="668" cy="438" r="1.4" opacity=".46"/><circle cx="724" cy="568" r="2" opacity=".68"/>
            <circle cx="790" cy="420" r="1.3" opacity=".52"/><circle cx="848" cy="522" r="1.8" opacity=".62"/><circle cx="912" cy="390" r="1.5" opacity=".5"/>
            <circle cx="952" cy="548" r="2.1" opacity=".7"/>
          </g>

          <g class="nf-hud-static" fill="none" stroke="#58ddfb" stroke-linecap="round" stroke-linejoin="round">
            <circle class="nf-faint-ring nf-ring-drift-a" cx="500" cy="325" r="246" opacity=".14" stroke-width="1.4"/>
            <circle class="nf-faint-ring nf-ring-drift-b" cx="500" cy="325" r="184" opacity=".12" stroke-width="1.3" stroke-dasharray="3 12"/>
            <circle class="nf-dotted-ring nf-ring-drift-a" cx="500" cy="325" r="138" opacity=".78" stroke-width="2" stroke-dasharray="2 11"/>

            <path class="nf-outer-arc" d="M178 112 A350 350 0 0 0 178 538" stroke-width="5" opacity=".92"/>
            <path class="nf-outer-arc" d="M822 112 A350 350 0 0 1 822 538" stroke-width="5" opacity=".92"/>
            <path d="M250 166 A270 270 0 0 0 250 484" stroke-width="3" opacity=".68"/>
            <path d="M750 166 A270 270 0 0 1 750 484" stroke-width="3" opacity=".68"/>

            <path class="nf-mid-arc" d="M320 188 A205 205 0 0 0 320 462" stroke-width="10" opacity=".95" filter="url(#nfSoftGlow)"/>
            <path class="nf-mid-arc" d="M680 188 A205 205 0 0 1 680 462" stroke-width="10" opacity=".95" filter="url(#nfSoftGlow)"/>
            <path d="M395 248 A114 114 0 0 0 395 402" stroke-width="5" opacity=".9"/>
            <path d="M605 248 A114 114 0 0 1 605 402" stroke-width="5" opacity=".9"/>

            <path d="M402 92 L430 120 H570 L598 92" stroke-width="3" opacity=".82"/>
            <path d="M402 558 L430 530 H570 L598 558" stroke-width="3" opacity=".82"/>
            <path d="M443 111 H557" stroke-width="6" stroke-dasharray="7 9" opacity=".76"/>
            <path d="M443 539 H557" stroke-width="6" stroke-dasharray="7 9" opacity=".76"/>

            <path d="M56 325 H258" stroke-width="2" opacity=".56"/><path d="M742 325 H944" stroke-width="2" opacity=".56"/>
            <path d="M500 66 V150" stroke-width="2" opacity=".58"/><path d="M500 500 V584" stroke-width="2" opacity=".58"/>
            <path d="M348 325 l-20 -14 v28 z" stroke-width="3" opacity=".9"/>
            <path d="M652 325 l20 -14 v28 z" stroke-width="3" opacity=".9"/>

            <g class="nf-side-ticks" opacity=".72" stroke-width="3">
              <path d="M214 218 h18"/><path d="M202 240 h15"/><path d="M194 264 h13"/><path d="M188 290 h12"/>
              <path d="M188 360 h12"/><path d="M194 386 h13"/><path d="M202 410 h15"/><path d="M214 432 h18"/>
              <path d="M786 218 h-18"/><path d="M798 240 h-15"/><path d="M806 264 h-13"/><path d="M812 290 h-12"/>
              <path d="M812 360 h-12"/><path d="M806 386 h-13"/><path d="M798 410 h-15"/><path d="M786 432 h-18"/>
            </g>
          </g>

          <g class="nf-reticle" fill="none" stroke="#9becff" stroke-linecap="round">
            <path d="M430 325 H570" stroke-width="2.5" opacity=".9"/>
            <path d="M500 255 V395" stroke-width="2.5" opacity=".9"/>
            <circle cx="500" cy="325" r="31" stroke="#5eddf9" stroke-width="4" opacity=".78" filter="url(#nfSoftGlow)"/>
            <circle cx="500" cy="325" r="17" stroke="#9becff" stroke-width="3" opacity=".88"/>
          </g>

          <g class="nf-flight-progress">
            <line class="nf-progress-line-svg" x1="500" y1="445" x2="500" y2="205" stroke="#70e6ff" stroke-width="3" opacity=".62"/>
            <circle class="nf-progress-node-svg nf-node-ready" cx="500" cy="445" r="11"/>
            <circle class="nf-progress-node-svg nf-node-authorising" cx="500" cy="325" r="11"/>
            <circle class="nf-progress-node-svg nf-node-airborne" cx="500" cy="205" r="11"/>
            <g class="nf-progress-marker-anchor" transform="translate(500 445)">
              <g class="nf-progress-marker-svg">
                <circle class="nf-marker-halo" r="31" fill="#57dffb" opacity=".10"/>
                <circle class="nf-marker-ring" r="22" fill="#071b2b" stroke="#77e9ff" stroke-width="4" filter="url(#nfCoreGlow)"/>
                <circle class="nf-marker-core" r="10" fill="#e9fbff"/>
              </g>
            </g>
          </g>
        </svg>
      </div>
      <div class="northern-conditions" aria-label="Final flight conditions">
        <div class="northern-condition" data-flight-check="0"><span>Flight Path</span><strong>Checking</strong></div>
        <div class="northern-condition" data-flight-check="1"><span>Airspace</span><strong>Checking</strong></div>
        <div class="northern-condition" data-flight-check="2"><span>Launch Window</span><strong>Checking</strong></div>
      </div>
      <button class="btn primary wide northern-authorise-btn" id="authoriseFlight" disabled>
        <span class="northern-authorise-label">Authorise Flight</span>
      </button>
      <div class="visually-hidden" id="northernHint" aria-live="polite">Final flight checks in progress.</div>
    </div>`}


  function bindGlobal(){
    document.querySelectorAll('[data-nav]').forEach(b=>{
      if(b.dataset.navBound==='1') return;
      b.dataset.navBound='1';
      b.addEventListener('click',()=>{
        if(b.dataset.nav==='comms') markAllMessagesRead();
        set({nav:b.dataset.nav});
      });
    });
    document.querySelectorAll('[data-read-messages]').forEach(b=>b.addEventListener('click',()=>{markAllMessagesRead();set({nav:'comms'});}));
    document.querySelectorAll('[data-dismiss-messages]').forEach(b=>b.addEventListener('click',dismissMessageAlert));
    document.querySelectorAll('[data-tune-elf]').forEach(b=>b.addEventListener('click',()=>openElfTuner()));
    document.querySelectorAll('[data-elf-onboard]').forEach(b=>b.addEventListener('click',()=>{
      state.elfPromptSeen=true;save();
      if(b.dataset.elfOnboard==='tune'){
        ping(780,.06,.04);haptic(25);
        set({missionOpen:'elf-radio',missionReturnNav:'radar'});
      }else render();
    }));
    document.querySelectorAll('[data-elf-audio]').forEach(b=>b.addEventListener('click',toggleElfAudio));
    document.querySelectorAll('[data-mission-audio-setting]').forEach(b=>b.addEventListener('click',toggleMissionAudioSetting));
    document.querySelectorAll('[data-gps-setting]').forEach(b=>b.addEventListener('click',toggleGpsSetting));
    document.querySelectorAll('[data-demo-restart]').forEach(b=>b.addEventListener('click',()=>{
      if(state.mode!=='demo') return;
      clearDemo();
      stopGpsWatch();
      resetGeofenceRuntime();
      if(cleanupMission){ try{cleanupMission();}catch{} cleanupMission=null; }
      state={...defaults};
      save();
      render();
    }));
    document.querySelectorAll('[data-onboard]').forEach(b=>b.addEventListener('click',()=>{
      if(state.audio) ensureAudio();
      set({bootDone:b.dataset.onboard});
    }));
    document.querySelectorAll('[data-mc00-continue]').forEach(b=>b.addEventListener('click',()=>continueMc00Sequence(b.dataset.mc00Continue)));
    document.querySelectorAll('[data-audio]').forEach(b=>b.addEventListener('click',()=>{const on=b.dataset.audio==='on';set({audio:on,bootDone:'location'});if(on){ensureAudio();ping(660,.1,.03);}}));
    document.querySelectorAll('[data-location]').forEach(b=>b.addEventListener('click',()=>{
      if(b.dataset.location==='demo'){startDemoExperience();return;}
      startLiveExperience();
    }));
    document.querySelectorAll('[data-start-mission]').forEach(b=>b.addEventListener('click',()=>openMission(b.dataset.startMission)));
    document.querySelectorAll('[data-open-mission]').forEach(row=>{
      const open=()=>openMission(row.dataset.openMission);
      row.addEventListener('click',open);
      row.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}});
    });
    document.querySelectorAll('[data-exit-mission]').forEach(b=>b.addEventListener('click',()=>{if(state.missionOpen==='entry') stopMc01Activation();if(state.missionOpen==='lapland') stopLaplandAudio();const nav=state.missionReturnNav||'radar';set({missionOpen:null,nav});if(nav==='radar'&&lastGps)processGps(lastGps,true);}));
  }

  function toggleMissionAudioSetting(){
    const on=!state.audio;
    state.audio=on;save();render();
    if(on){ensureAudio();ping(660,.08,.025);toast('Mission Audio on.');}
    else{stopStatic();toast('Mission Audio off.');}
  }

  function openElfTuner(){
    ping(780,.06,.04);haptic(25);
    set({missionOpen:'elf-radio',missionReturnNav:'comms'});
  }
  function openMission(id){
    const cp=CHECKPOINTS.find(c=>c.id===id); if(!cp||!cp.playable) return;
    const idx=checkpointIndex(id);
    const allowed=state.completed.includes(id)||state.available.includes(id)||idx<state.routeIndex||(idx===state.routeIndex&&state.targetInRange);
    if(!allowed){toast('Mission is not available yet.');return;}
    // MC-01 is a cinematic activation. The Circuit Entry screen begins
    // immediately when opened; there is no second Start Activation control.
    if(id==='entry'&&!state.completed.includes('entry')){
      ping(780,.06,.04);haptic(25);
      triggerCircuitEntry();
      return;
    }
    if(state.audio&&(id==='comet'||id==='lapland')) beginMissionAudioRadioOverride(id);
    ping(780,.06,.04);haptic(25);
    set({missionOpen:id,missionReturnNav:state.nav});
  }
  function showNorthernLaunchSurge(){
    const el=document.createElement('div');el.className='surge';el.innerHTML=`<div class="surge-copy"><div class="kicker">Northern Flight</div><h1>Launch Authorised</h1><p>Santa-1 is cleared for departure.</p></div>`;document.body.appendChild(el);ping(180,.25,.08);setTimeout(()=>{ping(520,.18,.05);haptic([50,40,90]);},600);setTimeout(()=>el.remove(),2200);
  }
  function showCompletion(title,copy){
    const mc=document.getElementById('missionContent'); if(!mc) return;
    const outcome=copy||title||'';
    mc.innerHTML=`<div class="completion panel"><div class="check" aria-hidden="true"><span class="checkmark-icon checkmark-icon--large"></span></div><h2>Mission Complete</h2>${outcome?`<p>${outcome}</p>`:''}<button class="btn primary wide" id="returnRadar">Continue</button></div>`;
    const continueBtn=document.getElementById('returnRadar');
    let continueCommitted=false;
    const commitContinue=event=>{
      if(continueCommitted)return;
      // Touch/pen commits on pointer-up so iOS cannot swallow the first tap,
      // without re-rendering the page while the finger is still held down.
      // Mouse + keyboard continue to use the normal click path.
      if(event?.type==='pointerup'&&event.pointerType==='mouse')return;
      event?.preventDefault?.();
      event?.stopPropagation?.();
      continueCommitted=true;
      if(continueBtn)continueBtn.disabled=true;
      completeCurrent();
    };
    continueBtn?.addEventListener('pointerup',commitContinue,{passive:false});
    continueBtn?.addEventListener('click',commitContinue);
    ping(880,.14,.05);haptic([30,35,70]);
  }
  function showRadioCompletion(){
    const mc=document.getElementById('missionContent'); if(!mc) return;
    const returnNav=state.missionReturnNav==='comms'?'comms':'radar';
    mc.innerHTML=`<div class="completion panel"><div class="check" aria-hidden="true"><span class="checkmark-icon checkmark-icon--large"></span></div><div class="kicker">Signal Locked</div><h2>ELF FM Locked</h2><p>Signal acquired at 87.7. ELF FM is now available from Communications.</p><button class="btn primary wide" id="returnElf">Continue</button></div>`;
    document.getElementById('returnElf').onclick=()=>{
      state={...state,elfUnlocked:true,elfPromptSeen:true,missionOpen:null,missionReturnNav:returnNav,nav:returnNav};
      save();render();
    };
    ping(880,.14,.05);haptic([30,35,70]);
  }
  function completeCurrent(){
    const id=state.missionOpen; const idx=checkpointIndex(id); if(idx<0) return;
    if(id==='lapland'){
      // Keep ELF FM suppressed through the exit sting, then restore it with a
      // fade only after all Lapland mission audio has finished.
      stopLaplandAudio(true,false);
      playLaplandExitCelebration(()=>endMissionAudioRadioOverride('lapland'));
    }
    const done=state.completed.includes(id)?state.completed:[...state.completed,id];
    const available=state.available.filter(x=>x!==id);
    let routeIndex=normaliseRouteIndex(state.routeIndex);
    if(idx===routeIndex) routeIndex=nextRouteIndex(routeIndex);
    const returnNav=state.missionReturnNav||'radar';
    resetGeofenceRuntime();
    state={...state,completed:done,available,missionOpen:null,routeIndex,targetVisible:false,targetInRange:false,distance:null,lastMessage:'SEARCHING FOR NEXT RECOVERY SIGNAL',nav:returnNav};
    if(state.mode==='demo'){
      clearDemo();
      demoHoldUntil=0;
    }
    // As soon as a mission is completed, expose the next checkpoint from the
    // guest's current circuit position. Demo Mode also gets its route distance
    // immediately so the status strip begins counting down without a SEARCHING gap.
    primeCurrentCircuitTarget();
    save();checkpointCompletionMessage(id);render();
    if(state.mode==='demo'&&returnNav==='radar') rearmDemoRoute(0);
    if(state.mode==='live'&&lastGps) setTimeout(()=>processGps(lastGps,true),50);
  }
  function unlockMission(id){
    if(!id||state.completed.includes(id)||state.available.includes(id)) return;
    state.available=[...state.available,id];save();
  }
  function resetGeofenceRuntime(){activationHits=0;activationSince=null;outsideSince=null;nextPassSince=null;inRangeLatched=false;}
  function passCurrentCheckpoint(reason='passed'){
    const cp=current(); if(!cp) return;
    if(cp.playable&&!state.completed.includes(cp.id)) unlockMission(cp.id);
    state.routeIndex=nextRouteIndex(state.routeIndex);
    state.targetVisible=false;state.targetInRange=false;state.distance=null;state.lastMessage='SEARCHING FOR NEXT RECOVERY SIGNAL';
    resetGeofenceRuntime();
    // If the guest leaves an activation without completing it, immediately
    // move navigation on to the next checkpoint while keeping the skipped
    // mission stored in Missions for later.
    primeCurrentCircuitTarget();
    save();
    if(cp.playable&&!state.completed.includes(cp.id)){
      addMessage(`missed:${cp.id}`,'MISSION CONTROL','CHECKPOINT STORED',`${cp.name} has been stored for later. Continue your route or complete the mission at any time from Missions.`,cp.id);
    } else updateRadarLive();
  }
  function triggerCircuitEntry(){
    const cp=CHECKPOINTS.find(checkpoint=>checkpoint.id==='entry');
    if(!cp||state.completed.includes('entry')) return;
    const entryIndex=checkpointIndex('entry');
    const retrospectivelyAvailable=state.available.includes('entry')||entryIndex<state.routeIndex;
    const isCurrentTarget=current()?.id==='entry';
    if(!isCurrentTarget&&!retrospectivelyAvailable) return;
    if(state.mode==='demo') clearDemo();
    if(state.missionOpen==='entry') return;
    resetGeofenceRuntime();
    state={...state,missionOpen:'entry',missionReturnNav:state.nav||'radar',targetVisible:true,targetInRange:true,lastMessage:'CIRCUIT LINK SIGNAL DETECTED'};
    save();render();
  }

  function startLiveExperience(){
    if(!navigator.geolocation){toast('Location services are unavailable on this device.');return;}
    navigator.geolocation.getCurrentPosition(pos=>{
      state={...state,onboarded:true,mode:'live',gpsEnabled:true,nav:'radar',routeIndex:normaliseRouteIndex(state.routeIndex||ROUTE_START_INDEX),gpsAccuracy:pos.coords.accuracy,gpsCondition:gpsCondition(pos.coords.accuracy)};save();ensureOpeningMessage();render();startGpsWatch();processGps(normalisePosition(pos),true);
    },()=>toast('Location permission is required for Live Radar.'),{enableHighAccuracy:true,timeout:10000,maximumAge:0});
  }
  let mc00ScanTimer = null;
  let mc00ScanStartTimer = null;
  let mc00ScanRaf = null;

  function stopMc00Scan(){
    if(mc00ScanTimer){ clearInterval(mc00ScanTimer); mc00ScanTimer = null; }
    if(mc00ScanStartTimer){ clearTimeout(mc00ScanStartTimer); mc00ScanStartTimer = null; }
    if(mc00ScanRaf){ cancelAnimationFrame(mc00ScanRaf); mc00ScanRaf = null; }
  }

  function continueMc00Sequence(mode){
    stopMc00Scan();
    set({ bootDone: 'brief' });
  }

  function bindMc00Scan(step){
    if(step!=='mc00-live') return;
    const card = document.querySelector('.mc00-card');
    const bar = document.getElementById('mc00ProgressFill');
    const value = document.getElementById('mc00ProgressValue');
    const progress = document.querySelector('.mc00-progress');
    const complete = document.getElementById('mc00CompleteBlock');
    const button = document.getElementById('mc00Continue');
    if(!card || !bar || !value || !progress || !complete || !button) return;

    stopMc00Scan();

    const scanSystems = [
      'circuitry','diagnostic','comms','power','core',
      'propulsion','guidance','control','response','navigation'
    ].map((key,index)=>({ key, start:index*9, end:(index+1)*9 }));

    let progressValue = 0;
    const lastStates = new Map();

    const setSystemState = (key,nextState)=>{
      const previous=lastStates.get(key);
      if(previous===nextState) return;
      lastStates.set(key,nextState);
      const item=document.querySelector(`[data-mc00-system="${key}"]`);
      const status=document.querySelector(`[data-mc00-status="${key}"]`);
      if(!item||!status) return;
      item.classList.remove('is-standby','is-checking','is-offline','is-online');
      item.classList.add(`is-${nextState}`);
      status.textContent=nextState==='checking'?'Checking':nextState==='offline'?'Offline':nextState==='online'?'Online':'Standby';
      // System-state changes are visual only; the scan pings are driven by the
      // fixed cadence below so the first sound cannot be lost during AudioContext resume.
    };

    const paint = ()=>{
      bar.style.transform = `scaleX(${progressValue/100})`;
      value.textContent = `${progressValue}%`;
      progress.setAttribute('aria-valuenow', String(progressValue));

      scanSystems.forEach(system=>{
        const nextState = progressValue < system.start
          ? 'standby'
          : progressValue < system.end
            ? 'checking'
            : 'offline';
        setSystemState(system.key,nextState);
      });

      if(progressValue >= 100){
        stopMc00Scan();
        card.classList.add('is-complete');
        complete.hidden = false;
      }
    };

    scanSystems.forEach(system=>setSystemState(system.key,'standby'));
    paint();
    card.classList.remove('is-complete');
    complete.hidden = true;

    // Ten diagnostic pops are locked to the ten system-complete transitions.
    // Each completed system advances the bar by 9%, taking the scan to 90%.
    // Nothing sounds at 0%: the first pop lands exactly as the first system
    // changes to Offline. The distinct completion ping lands at 100%.
    mc00ScanStartTimer = setTimeout(()=>{
      mc00ScanStartTimer = null;
      mc00ScanTimer = setInterval(()=>{
        progressValue = Math.min(100, progressValue + 1);
        paint();
        if(progressValue <= 90 && progressValue % 9 === 0){
          ping(620,.05,.018);
        }
        if(progressValue === 100){
          ping(860,.12,.05);
          haptic([20,35,65]);
        }
      }, 45);
    }, 180);
  }
  let mc01Timers=[];
  let mc01BloomEl=null;
  let mc01BloomAudio=null;

  function getMc01BloomAudio(){
    if(!mc01BloomAudio){
      mc01BloomAudio=new Audio('./assets/christmas-magic-01.mp3');
      mc01BloomAudio.preload='auto';
      mc01BloomAudio.volume=.92;
    }
    return mc01BloomAudio;
  }

  function stopMc01Bloom(stopAudio=true){
    if(mc01BloomEl){mc01BloomEl.remove();mc01BloomEl=null;}
    if(stopAudio&&mc01BloomAudio){
      try{mc01BloomAudio.pause();mc01BloomAudio.currentTime=0;}catch{}
    }
  }

  function stopMc01Activation(){
    mc01Timers.forEach(clearTimeout);
    mc01Timers=[];
    stopMc01Bloom(true);
  }

  function mc01Later(fn,delay){
    const timer=setTimeout(()=>{
      mc01Timers=mc01Timers.filter(id=>id!==timer);
      fn();
    },delay);
    mc01Timers.push(timer);
  }

  function showMc01EnergyBloom(){
    if(state.missionOpen!=='entry'||mc01BloomEl) return;
    const el=document.createElement('div');
    el.className='mc01-energy-bloom';
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
    el.innerHTML=`<div class="mc01-bloom-field" aria-hidden="true"><i></i><i></i><i></i></div><div class="mc01-bloom-copy"><img class="mc01-bloom-mark" src="./assets/silverstone-s-mark.webp" alt=""><div class="kicker">Circuit Link</div><h1>Energy Transfer Complete</h1></div>`;
    document.body.appendChild(el);
    mc01BloomEl=el;
    if(state.audio){
      const audio=getMc01BloomAudio();
      try{audio.currentTime=0;audio.play().catch(()=>{});}catch{}
    }
    haptic([45,35,90]);
  }

  function finishMc01EnergyBloom(){
    if(state.missionOpen!=='entry') return;
    // Build the stable completion state while the full-screen bloom still covers
    // the mission, so there is never a frame where the completed scan reappears.
    showCompletion('Circuit Link Complete','Kinetic energy generated on track has created enough power to initiate Santa-1’s recovery.');
    const bloom=mc01BloomEl;
    if(!bloom) return;
    bloom.classList.add('is-exiting');
    mc01Later(()=>{
      if(bloom.isConnected) bloom.remove();
      if(mc01BloomEl===bloom) mc01BloomEl=null;
    },260);
  }

  function bindCircuitEntryActivation(){
    const panel=document.getElementById('mc01Activation');
    const stateLabel=document.getElementById('mc01StateLabel');
    const stateValue=document.getElementById('mc01State');
    const transferValue=document.getElementById('mc01TransferValue');
    const transferFill=document.getElementById('mc01TransferFill');
    if(!panel||!stateLabel||!stateValue||!transferValue||!transferFill) return;

    stopMc01Activation();
    if(state.audio) getMc01BloomAudio();

    const setProgress=value=>{
      const progress=Math.max(0,Math.min(100,Number(value)||0));
      transferValue.textContent=`${progress}%`;
      transferFill.style.transform=`scaleX(${progress/100})`;
    };
    const setStage=(stage,label,value,progress)=>{
      if(!document.getElementById('mc01Activation')) return;
      panel.dataset.stage=stage;
      stateLabel.textContent=label;
      stateValue.textContent=value;
      setProgress(progress);
    };

    setStage('detected','Circuit Link','Signal Detected',0);
    ping(560,.08,.025);

    mc01Later(()=>{
      setStage('routing','Circuit Link','Connection Establishing',25);
      ping(640,.06,.025);
      haptic(18);
    },800);

    // Extra visible scan beat: advance the Circuit Link state so the 50%
    // marker communicates a distinct routing step before power transfer.
    mc01Later(()=>{
      setStage('routing','Circuit Link','Energy Routing',50);
      ping(680,.055,.022);
      haptic(14);
    },1850);

    mc01Later(()=>{
      setStage('transfer','Power Transfer','Routing to Santa-1',75);
      ping(720,.08,.03);
      haptic([18,28,24]);
    },3000);

    mc01Later(()=>{
      setStage('recovery','Recovery Sequence','Initiated',100);
      ping(880,.14,.05);
      haptic([30,35,70]);
    },4200);

    // The scan now spends more of its runtime progressing through 25/50/75/100,
    // then holds 100% only briefly before the energy-transfer payoff begins.
    mc01Later(()=>{
      showMc01EnergyBloom();
    },4950);

    // Hold ENERGY TRANSFER COMPLETE for three seconds. The completion card is
    // rendered underneath the overlay first, then the overlay fades away so the
    // scan can never flash back on screen between the two states.
    mc01Later(()=>{
      finishMc01EnergyBloom();
    },7950);
  }
  function startGpsWatch(){
    if(state.gpsEnabled===false||gpsWatchId!==null||!navigator.geolocation) return;
    gpsWatchId=navigator.geolocation.watchPosition(pos=>processGps(normalisePosition(pos)),err=>{
      if(err.code===1){stopGpsWatch();state.gpsEnabled=false;}
      state.gpsCondition=err.code===1?'DENIED':'WAITING';save();updateRadarLive();
    },{enableHighAccuracy:true,maximumAge:1000,timeout:15000});
  }
  function normalisePosition(pos){return {lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy,timestamp:pos.timestamp||Date.now()};}
  function stopGpsWatch(){
    if(gpsWatchId!==null&&navigator.geolocation){try{navigator.geolocation.clearWatch(gpsWatchId);}catch{}}
    gpsWatchId=null;
  }
  function disableGpsSetting(){
    stopGpsWatch();
    lastGps=null;
    resetGeofenceRuntime();
    state={...state,gpsEnabled:false,gpsCondition:'OFF',gpsAccuracy:null,targetVisible:false,targetInRange:false,distance:null};
    save();render();toast('GPS location off.');
  }
  function enableGpsSetting(){
    if(!navigator.geolocation){toast('Location services are unavailable on this device.');return;}
    state.gpsEnabled=true;state.gpsCondition='WAITING';save();render();
    navigator.geolocation.getCurrentPosition(pos=>{
      clearDemo();
      state={...state,mode:'live',gpsEnabled:true,gpsAccuracy:pos.coords.accuracy,gpsCondition:gpsCondition(pos.coords.accuracy),targetVisible:false,targetInRange:false,distance:null};
      save();render();startGpsWatch();processGps(normalisePosition(pos),true);toast('GPS location on.');
    },err=>{
      state.gpsEnabled=false;state.gpsCondition=err.code===1?'DENIED':'OFF';save();render();toast(err.code===1?'Location permission was denied.':'Unable to enable GPS location.');
    },{enableHighAccuracy:true,timeout:10000,maximumAge:0});
  }
  function toggleGpsSetting(){
    const gpsOn=state.mode==='live'&&state.gpsEnabled!==false;
    if(gpsOn) disableGpsSetting(); else enableGpsSetting();
  }
  function processGps(fix,force=false){
    if(!fix||!Number.isFinite(fix.lat)||!Number.isFinite(fix.lng)) return;
    lastGps=fix;
    state.gpsAccuracy=fix.accuracy;state.gpsCondition=gpsCondition(fix.accuracy);
    if(IS_ADMIN){updateAdminGps();return;}
    if(!state.onboarded||state.mode!=='live'){save();return;}
    if(state.missionOpen){save();return;}
    const cp=current();
    if(!cp){state.targetVisible=false;state.targetInRange=false;state.distance=null;save();updateRadarLive();return;}
    const cfg=activeConfig(cp);
    const d=distanceMetres(fix.lat,fix.lng,cfg.lat,cfg.lng);
    const bearing=bearingDegrees(fix.lat,fix.lng,cfg.lat,cfg.lng);
    state.distance=d;state.bearing=bearing;
    const now=Date.now();
    const accuracy=Number(fix.accuracy);
    const reliable=Number.isFinite(accuracy)&&accuracy<=ACTIVATION_ACCURACY_MAX;
    const passReliable=Number.isFinite(accuracy)&&accuracy<=PASS_ACCURACY_MAX;
    const detectable=Number.isFinite(accuracy)&&accuracy<=DETECTION_ACCURACY_MAX&&d<=cfg.detectionRadius;
    const exitRadius=(cfg.activationRadius||30);
    const nextCp=nextRouteCheckpoint(state.routeIndex);
    const nextCfg=activeConfig(nextCp);
    const nextDistance=nextCfg&&nextCfg.geofence!==false?distanceMetres(fix.lat,fix.lng,nextCfg.lat,nextCfg.lng):Infinity;

    // Passing because the following checkpoint is nearby is intentionally much
    // stricter than ordinary detection. This avoids overlapping detection zones
    // skipping a mission: the next checkpoint must be close to its activation
    // zone, the current checkpoint must clearly be behind us, and the evidence
    // must persist across multiple good fixes.
    const nextPassRadius=nextCfg?(nextCfg.activationRadius||30)+20:0;
    const strongNextEvidence=Boolean(
      nextCfg&&
      Number.isFinite(accuracy)&&accuracy<=NEXT_PASS_ACCURACY_MAX&&
      nextDistance<=nextPassRadius&&
      d>exitRadius+15
    );
    if(strongNextEvidence){
      if(!nextPassSince) nextPassSince=now;
    } else nextPassSince=null;
    const nextPassConfirmed=Boolean(nextPassSince&&now-nextPassSince>=NEXT_PASS_DWELL_MS);

    const registerActivationFix=()=>{
      if(reliable&&d<=cfg.activationRadius){
        if(!activationSince) activationSince=now;
        activationHits++;
        return activationHits>=ACTIVATION_HITS_REQUIRED&&now-activationSince>=ACTIVATION_DWELL_MS;
      }
      activationHits=0;activationSince=null;
      return false;
    };

    if(cp.type==='activation'){
      state.targetVisible=detectable;state.targetInRange=false;
      const activationConfirmed=registerActivationFix();
      save();updateRadarLive();
      if(activationConfirmed||nextPassConfirmed) triggerCircuitEntry();
      return;
    }

    if(!inRangeLatched){
      // Once Circuit Link has been completed the circuit itself becomes the
      // navigation environment, so the current/next checkpoint remains visible
      // even when it is outside the old proximity-only detection radius.
      state.targetVisible=state.completed.includes('entry')?true:detectable;

      // `available` is persisted when a checkpoint has already been entered.
      // This lets a refresh recover the same leave-without-completing behaviour:
      // once a reliable fix confirms the guest is outside that activation radius,
      // navigation can hand off to the next checkpoint without forcing re-entry.
      if(state.available.includes(cp.id)&&passReliable&&d>exitRadius){
        state.targetInRange=false;
        if(!outsideSince) outsideSince=now;
        if(now-outsideSince>=PASS_DWELL_MS){passCurrentCheckpoint('left unlocked activation');if(lastGps)setTimeout(()=>processGps(lastGps,true),25);return;}
      } else {
        outsideSince=null;
        if(registerActivationFix()){
          inRangeLatched=true;state.targetVisible=true;state.targetInRange=true;unlockMission(cp.id);ping(700,.08,.04);haptic(30);
        }
      }
    } else {
      state.targetVisible=true;state.targetInRange=true;
      // Do not advance a checkpoint on a weak GPS fix. The guest must remain
      // outside the exit radius with a reasonably accurate fix for the full
      // dwell period before the route moves on.
      if(passReliable&&d>exitRadius){
        if(!outsideSince) outsideSince=now;
        if(now-outsideSince>=PASS_DWELL_MS){passCurrentCheckpoint('exit radius');if(lastGps)setTimeout(()=>processGps(lastGps,true),25);return;}
      } else outsideSince=null;
    }

    if(nextPassConfirmed&&!state.targetInRange){
      passCurrentCheckpoint('next checkpoint confirmed');
      if(lastGps)setTimeout(()=>processGps(lastGps,true),25);
      return;
    }
    save();updateRadarLive();
  }

  function activeRadarGeoPosition(){
    if(state.mode==='demo'){
      if(demoTrackPosition&&Number.isFinite(demoTrackPosition.lat)&&Number.isFinite(demoTrackPosition.lng)) return demoTrackPosition;
      const restored=restoreDemoCircuitPosition();
      if(restored) return restored;
      return null;
    }
    if(lastGps&&Number.isFinite(lastGps.lat)&&Number.isFinite(lastGps.lng)) return lastGps;
    return null;
  }
  function activeRadarCircuitGeoPosition(){
    const fix=activeRadarGeoPosition();
    if(!fix) return null;
    if(state.mode==='live'&&localTestEnabled){
      const virtual=localTestVirtualProjection(fix.lat,fix.lng);
      if(virtual) return virtual;
    }
    return fix;
  }
  function circuitRadarTargetPoint(cp,cfg){
    if(!cp||!cfg) return null;
    if(state.mode==='live'&&localTestEnabled&&localTestRouteStatus().ready){
      // Local coordinates drive geofences, but the visible target remains at the
      // equivalent Silverstone checkpoint so the village walk rehearses the
      // actual circuit journey without feeding local lat/lng into the affine map.
      return geoToCircuitPoint(cp.lat,cp.lng);
    }
    return geoToCircuitPoint(cfg.lat,cfg.lng);
  }

  function primeCurrentCircuitTarget(){
    if(!state.completed.includes('entry')) return false;
    const cp=current();
    const cfg=activeConfig(cp);
    if(!cp||!cfg) return false;
    const fix=activeRadarGeoPosition();
    if(!fix) return false;

    let distance=distanceMetres(fix.lat,fix.lng,cfg.lat,cfg.lng);
    if(state.mode==='demo'){
      const fromDistance=Number.isFinite(demoTrackDistance)
        ? normaliseRouteDistance(demoTrackDistance)
        : projectGeoToRoute(fix.lat,fix.lng)?.distance;
      const targetProjection=projectGeoToRoute(cfg.lat,cfg.lng);
      if(Number.isFinite(fromDistance)&&targetProjection) distance=forwardRouteDistance(fromDistance,targetProjection.distance);
    }

    state.targetVisible=true;
    state.targetInRange=false;
    state.distance=distance;
    state.bearing=bearingDegrees(fix.lat,fix.lng,cfg.lat,cfg.lng);
    return true;
  }
  function updateCircuitRadar(cp,cfg){
    const map=document.getElementById('trackRadarMap');
    const art=document.getElementById('trackRadarArt');
    const target=document.getElementById('trackRadarTarget');
    if(!map||!art) return;
    const fix=activeRadarCircuitGeoPosition();
    if(!fix){map.classList.add('waiting');if(target)target.classList.add('hidden');return;}
    const userPoint=geoToCircuitPoint(fix.lat,fix.lng);
    if(!userPoint){map.classList.add('waiting');if(target)target.classList.add('hidden');return;}
    // Keep the user fixed at 50/50 while the original circuit SVG moves below
    // them. Position the artwork completely before revealing the layer so a
    // refresh can never paint the SVG at its uninitialised 0/0 browser default.
    const zoom=CIRCUIT_RADAR_ZOOM;
    const unitPct=zoom*100/CIRCUIT_GEOREFERENCE.viewBoxWidth;
    art.style.left=`calc(50% - ${userPoint.x*unitPct}%)`;
    art.style.top=`calc(50% - ${userPoint.y*unitPct}%)`;
    if(target&&cp&&cfg){
      const targetPoint=circuitRadarTargetPoint(cp,cfg);
      if(targetPoint){
        target.style.left=`calc(50% + ${(targetPoint.x-userPoint.x)*unitPct}%)`;
        target.style.top=`calc(50% + ${(targetPoint.y-userPoint.y)*unitPct}%)`;
        target.classList.toggle('hidden',!state.targetVisible);
      }else target.classList.add('hidden');
    }
    map.classList.remove('waiting');
  }

  function updateRadarLive(){
    if(IS_ADMIN||state.nav!=='radar'||state.missionOpen) return;
    updateCommsBadge();
    const cp=current(); const cfg=activeConfig(cp);
    const gpsValue=document.querySelector('.status-cell:first-child .status-value');
    if(gpsValue){const condition=state.mode==='demo'?'DEMO':state.gpsCondition;gpsValue.textContent=condition;gpsValue.className=`status-value gps-${condition.toLowerCase()}`;}
    const sleighValue=document.querySelector('.status-cell:nth-child(2) .status-value'); if(sleighValue)sleighValue.textContent=`${recovery()}%`;
    const checkpointValue=document.querySelector('.status-cell:last-child .status-value');
    if(checkpointValue){const d=distanceToActivation(cp,state.distance);checkpointValue.textContent=!cp?'GARAGES':state.targetVisible&&Number.isFinite(d)?`${Math.round(d)} M`:'SEARCHING';}
    const target=document.querySelector('.target-dot');
    const finalCircuitOverview=state.completed.includes('northern');
    const localVirtualCircuitMode=state.mode==='live'&&localTestEnabled&&localTestRouteStatus().ready;
    const circuitMode=state.completed.includes('entry')||finalCircuitOverview||localVirtualCircuitMode;
    if(finalCircuitOverview){
      if(target) target.classList.add('hidden');
      // Final mission state is a static full-circuit overview. GPS/Demo movement
      // no longer translates the artwork, but the radar sweep remains active.
    }else if(circuitMode){
      if(target) target.classList.add('hidden');
      updateCircuitRadar(cp,cfg);
    }else if(target&&cp&&cfg){
      const radial=state.targetInRange?5:Math.max(8,Math.min(39,(Number.isFinite(state.distance)?state.distance/cfg.detectionRadius:1)*39));
      const ang=(Number.isFinite(state.bearing)?state.bearing:0)-90;
      const x=50+Math.cos(toRad(ang))*radial, y=50+Math.sin(toRad(ang))*radial;
      target.style.left=`${x}%`;target.style.top=`${y}%`;target.classList.toggle('hidden',!state.targetVisible);
    }
    const msg=document.getElementById('radarMessage'); if(!msg)return;
    const holder=document.createElement('div');holder.innerHTML=radarMessage(cp).trim();const fresh=holder.firstElementChild;
    if(!fresh)return;
    if(msg.innerHTML!==fresh.innerHTML||msg.className!==fresh.className){
      msg.className=fresh.className;msg.innerHTML=fresh.innerHTML;
      const b=msg.querySelector('[data-start-mission]');if(b)b.addEventListener('click',()=>openMission(b.dataset.startMission));
      const read=msg.querySelector('[data-read-messages]');if(read)read.addEventListener('click',()=>{markAllMessagesRead();set({nav:'comms'});});
      const dismiss=msg.querySelector('[data-dismiss-messages]');if(dismiss)dismiss.addEventListener('click',dismissMessageAlert);
    }
  }

  function startDemoExperience(){
    clearDemo();
    stopGpsWatch();
    lastGps=null;
    demoHoldUntil=Date.now()+900;
    demoTrackPosition=null;
    demoTrackDistance=null;
    state={...state,onboarded:true,bootDone:true,mode:'demo',gpsEnabled:false,nav:'radar',completed:[],available:[],routeIndex:1,targetVisible:false,targetInRange:false,distance:null,gpsCondition:'DEMO',demoRouteDistance:null};
    save();
    ensureOpeningMessage();
    render();
    ping(480,.07,.025);
    maybeStartDemoTarget(650);
  }
  function clearDemo(){clearTimeout(demoTimer);clearInterval(demoInterval);demoTimer=null;demoInterval=null;}
  function rearmDemoRoute(delay=350){
    if(state.mode!=='demo') return;
    const expectedIndex=normaliseProgressRouteIndex(state.routeIndex,state.completed);
    if(expectedIndex!==state.routeIndex){state.routeIndex=expectedIndex;save();}
    const arm=()=>{
      if(state.mode!=='demo'||state.nav!=='radar'||state.missionOpen||state.routeIndex!==expectedIndex||state.targetInRange) return;
      if(demoTimer===null&&demoInterval===null) forceDemoTarget(0);
    };
    setTimeout(arm,Math.max(0,Number(delay)||0));
    // Fallback in case a navigation/render transition interrupted the first timer.
    setTimeout(arm,2600);
  }

  function setDemoCircuitPosition(routeDistance){
    if(routeDistance===null||routeDistance===undefined||!Number.isFinite(Number(routeDistance))) return null;
    const routePoint=routePointAtDistance(Number(routeDistance));
    demoTrackDistance=routePoint.distance;
    demoTrackPosition={lat:routePoint.lat,lng:routePoint.lng,accuracy:5,timestamp:Date.now()};
    state.demoRouteDistance=routePoint.distance;
    return routePoint;
  }

  function restoreDemoCircuitPosition(){
    if(state.mode!=='demo'||!state.completed.includes('entry')) return null;
    if(demoTrackPosition&&Number.isFinite(demoTrackPosition.lat)&&Number.isFinite(demoTrackPosition.lng)) return demoTrackPosition;

    const persisted=state.demoRouteDistance;
    if(persisted!==null&&persisted!==undefined&&Number.isFinite(Number(persisted))){
      const routePoint=setDemoCircuitPosition(Number(persisted));
      return routePoint?demoTrackPosition:null;
    }

    // Older/demo sessions can reach the post-MC01 radar without a persisted
    // route distance. Seed from the checkpoint the guest is actually at, or
    // otherwise from the most recently completed route checkpoint.
    let seedCp=null;
    const activeCp=current();
    if(state.targetInRange&&activeCp) seedCp=activeCp;
    if(!seedCp){
      for(let i=Math.min(CHECKPOINTS.length-1,Math.max(ROUTE_START_INDEX,state.routeIndex-1));i>=ROUTE_START_INDEX;i--){
        const candidate=CHECKPOINTS[i];
        if(candidate&&state.completed.includes(candidate.id)){seedCp=candidate;break;}
      }
    }
    const seedCfg=activeConfig(seedCp);
    const projected=seedCfg?projectGeoToRoute(seedCfg.lat,seedCfg.lng):null;
    if(!projected) return null;
    const routePoint=setDemoCircuitPosition(projected.distance);
    save();
    return routePoint?demoTrackPosition:null;
  }
  function demoRouteSeedDistance(cp){
    if(Number.isFinite(demoTrackDistance)) return normaliseRouteDistance(demoTrackDistance);
    const restored=restoreDemoCircuitPosition();
    if(restored&&Number.isFinite(demoTrackDistance)) return normaliseRouteDistance(demoTrackDistance);
    const targetIndex=checkpointIndex(cp?.id);
    for(let i=targetIndex-1;i>=ROUTE_START_INDEX;i--){
      const previous=CHECKPOINTS[i];
      if(!previous||!state.completed.includes(previous.id)) continue;
      const previousCfg=activeConfig(previous);
      if(!previousCfg) continue;
      const projected=projectGeoToRoute(previousCfg.lat,previousCfg.lng);
      if(projected) return projected.distance;
    }
    return null;
  }

  function beginDemoCircuitApproach(cp,cfg){
    const targetProjection=projectGeoToRoute(cfg.lat,cfg.lng);
    if(!targetProjection) return false;
    const activationRadius=Number(cfg.activationRadius)||30;
    const startDistance=demoRouteSeedDistance(cp);
    if(!Number.isFinite(startDistance)) return false;

    // Travel continuously forward around the calibrated lap. Demo compresses time
    // but never teleports, reverses, or cuts across the circuit between missions.
    const routeTravel=forwardRouteDistance(startDistance,targetProjection.distance);
    const tickMs=100;
    const speedMetresPerSecond=180;
    let travelled=0;

    const updatePosition=(routeDistance,remainingRouteDistance)=>{
      const routePoint=setDemoCircuitPosition(routeDistance);
      const d=distanceMetres(routePoint.lat,routePoint.lng,cfg.lat,cfg.lng);
      state.distance=Math.max(0,Number.isFinite(remainingRouteDistance)?remainingRouteDistance:d);
      state.bearing=bearingDegrees(routePoint.lat,routePoint.lng,cfg.lat,cfg.lng);
      // Post-MC01 Demo navigation always exposes the next checkpoint from the
      // moment the previous mission is cleared, rather than waiting to enter
      // the normal live detection radius.
      state.targetVisible=true;
      state.targetInRange=false;
      save();updateRadarLive();
      return d;
    };

    const finishAtTarget=()=>{
      const routePoint=setDemoCircuitPosition(targetProjection.distance);
      const d=distanceMetres(routePoint.lat,routePoint.lng,cfg.lat,cfg.lng);
      state.targetVisible=true;state.targetInRange=true;state.distance=d;
      state.bearing=bearingDegrees(routePoint.lat,routePoint.lng,cfg.lat,cfg.lng);
      unlockMission(cp.id);save();updateRadarLive();ping(700,.08,.04);haptic(30);
    };

    let d=updatePosition(startDistance,routeTravel);
    if(routeTravel<1){finishAtTarget();return true;}

    demoInterval=setInterval(()=>{
      if(!canRunDemoTarget()){clearInterval(demoInterval);demoInterval=null;return;}
      const activeCp=current();const activeCfg=activeConfig(activeCp);
      if(!activeCp||!activeCfg||activeCp.id!==cp.id){clearInterval(demoInterval);demoInterval=null;return;}
      travelled=Math.min(routeTravel,travelled+speedMetresPerSecond*(tickMs/1000));
      d=updatePosition(startDistance+travelled,routeTravel-travelled);
      if(travelled>=routeTravel){
        clearInterval(demoInterval);demoInterval=null;finishAtTarget();
      }
    },tickMs);
    return true;
  }

  function beginDemoApproach(){
    if(!canRunDemoTarget()) return;
    const cp=current();
    const cfg=activeConfig(cp);
    if(!cp||!cfg) return;
    const activationRadius=Number(cfg.activationRadius)||30;
    if(state.completed.includes('entry')&&cp.id!=='entry'&&beginDemoCircuitApproach(cp,cfg)) return;
    let d=state.targetVisible&&Number.isFinite(state.distance)
      ? Math.max(activationRadius,state.distance)
      : 180;
    state.targetVisible=true;
    state.targetInRange=false;
    state.distance=d;
    state.bearing=Number.isFinite(state.bearing)?state.bearing:35;
    save();updateRadarLive();
    if(d<=activationRadius){
      state.targetInRange=true;state.distance=activationRadius;unlockMission(cp.id);save();updateRadarLive();ping(700,.08,.04);haptic(30);return;
    }
    demoInterval=setInterval(()=>{
      if(!canRunDemoTarget()){clearInterval(demoInterval);demoInterval=null;return;}
      const activeCp=current();
      const activeCfg=activeConfig(activeCp);
      if(!activeCp||!activeCfg){clearInterval(demoInterval);demoInterval=null;return;}
      const activeRadius=Number(activeCfg.activationRadius)||30;
      d-=16;
      state.distance=Math.max(activeRadius,d);
      state.bearing=(state.bearing+2)%360;
      if(d<=activeRadius){
        clearInterval(demoInterval);demoInterval=null;
        state.targetInRange=true;state.distance=activeRadius;unlockMission(activeCp.id);save();updateRadarLive();ping(700,.08,.04);haptic(30);
      }else{save();updateRadarLive();}
    },650);
  }
  function forceDemoTarget(delay=250){
    if(state.mode!=='demo'||state.nav!=='radar'||state.missionOpen||!current()) return;
    clearDemo();
    demoTimer=setTimeout(()=>{demoTimer=null;beginDemoApproach();},Math.max(0,Number(delay)||0));
  }
  function canRunDemoTarget(){
    return state.mode==='demo'&&state.nav==='radar'&&(state.elfPromptSeen||state.elfUnlocked)&&!state.missionOpen&&!!current()&&!state.targetInRange;
  }
  function maybeStartDemoTarget(delay=500){
    if(!canRunDemoTarget()||demoTimer!==null||demoInterval!==null) return;
    const wait=Math.max(0,Number(delay)||0,demoHoldUntil-Date.now());
    demoTimer=setTimeout(()=>{
      demoTimer=null;
      // If the guest opened another panel during the wait, stop here. The
      // next Radar render will call maybeStartDemoTarget() again.
      if(!canRunDemoTarget()) return;
      beginDemoApproach();
    },wait);
  }

  const ADMIN_FIELD_STORAGE='silverstone-mc-field-test-v2';
  let adminGpsHistory=[];
  let adminRefreshTimer=null;

  function loadAdminFieldState(){
    const fallback={testTargetId:null,fieldLog:[],guestSnapshot:null,guestRouteTestActive:false,lastCapture:{}};
    try{
      const parsed=JSON.parse(localStorage.getItem(ADMIN_FIELD_STORAGE)||'{}');
      return {
        ...fallback,
        ...parsed,
        fieldLog:Array.isArray(parsed.fieldLog)?parsed.fieldLog.slice(-100):[],
        lastCapture:parsed.lastCapture&&typeof parsed.lastCapture==='object'?parsed.lastCapture:{}
      };
    }catch{return fallback;}
  }
  let adminFieldState=loadAdminFieldState();
  function saveAdminFieldState(){
    try{localStorage.setItem(ADMIN_FIELD_STORAGE,JSON.stringify({...adminFieldState,fieldLog:(adminFieldState.fieldLog||[]).slice(-100)}));}catch{}
  }
  function adminRouteCheckpoints(){return CHECKPOINTS.filter(cp=>cp.geofence!==false&&isRouteCheckpoint(cp));}
  function adminTestTarget(){
    const wanted=CHECKPOINTS.find(cp=>cp.id===adminFieldState.testTargetId&&cp.geofence!==false);
    return wanted||current()||adminRouteCheckpoints()[0]||null;
  }
  function adminSavedConfig(cp){
    // Diagnostics always follow the currently selected coordinate profile.
    // Survey candidates are stored separately and can never drive guest GPS.
    return activeConfig(cp);
  }
  function adminDistance(cp,fix=lastGps){
    if(!cp||!fix)return null;
    const cfg=activeConfig(cp);
    return cfg?distanceMetres(fix.lat,fix.lng,cfg.lat,cfg.lng):null;
  }
  function adminFormatDistance(value){
    if(!Number.isFinite(value))return '—';
    if(value>=10000)return `${(value/1000).toFixed(1)} km`;
    if(value>=1000)return `${(value/1000).toFixed(2)} km`;
    return `${Math.round(value)} m`;
  }
  function adminNearest(fix=lastGps){
    if(!fix)return null;
    let best=null;
    adminRouteCheckpoints().forEach(cp=>{
      const distance=adminDistance(cp,fix);
      if(Number.isFinite(distance)&&(!best||distance<best.distance))best={cp,distance,cfg:adminSavedConfig(cp)};
    });
    return best;
  }
  function adminGuestStatus(cp){
    if(!cp)return '—';
    const idx=checkpointIndex(cp.id);
    if(state.completed.includes(cp.id))return 'COMPLETED';
    if(state.available.includes(cp.id))return 'AVAILABLE';
    if(idx===normaliseProgressRouteIndex(state.routeIndex,state.completed))return state.targetInRange?'IN RANGE':'ROUTE TARGET';
    if(idx<state.routeIndex)return 'PASSED / PLAYABLE';
    return 'LOCKED';
  }
  function adminDiagnostic(cp,fix=lastGps){
    if(!cp)return null;
    const cfg=activeConfig(cp),distance=fix?distanceMetres(fix.lat,fix.lng,cfg.lat,cfg.lng):null;
    const accuracy=Number(fix?.accuracy);
    const detectionAccuracy=Number.isFinite(accuracy)&&accuracy<=DETECTION_ACCURACY_MAX;
    const activationAccuracy=Number.isFinite(accuracy)&&accuracy<=ACTIVATION_ACCURACY_MAX;
    const passAccuracy=Number.isFinite(accuracy)&&accuracy<=PASS_ACCURACY_MAX;
    const nextPassAccuracy=Number.isFinite(accuracy)&&accuracy<=NEXT_PASS_ACCURACY_MAX;
    const insideDetection=Number.isFinite(distance)&&distance<=cfg.detectionRadius;
    const insideActivation=Number.isFinite(distance)&&distance<=cfg.activationRadius;
    let expected='WAITING FOR GPS';
    if(fix){
      if(!detectionAccuracy)expected='POOR GPS — NO DETECTION';
      else if(!insideDetection)expected='APPROACH';
      else if(!insideActivation)expected='DETECTED';
      else if(!activationAccuracy)expected='DETECTED — WAITING FOR ACCURACY';
      else expected='ACTIVATION CONDITIONS MET';
    }
    return {cp,cfg,distance,accuracy,detectionAccuracy,activationAccuracy,passAccuracy,nextPassAccuracy,insideDetection,insideActivation,expected};
  }
  function adminCurrentFixAge(){return lastGps?Math.max(0,Date.now()-(Number(lastGps.timestamp)||Date.now())):null;}
  function adminCircuitPosition(fix=lastGps){
    if(!fix)return {point:null,projection:null,virtual:null};
    const virtual=localTestEnabled?localTestVirtualProjection(fix.lat,fix.lng):null;
    if(virtual){
      return {point:geoToCircuitPoint(virtual.lat,virtual.lng),projection:virtual,virtual};
    }
    return {point:geoToCircuitPoint(fix.lat,fix.lng),projection:projectGeoToRoute(fix.lat,fix.lng),virtual:null};
  }
  function adminRulePill(label,ok,waiting=false){return `<span class="admin-rule ${waiting?'waiting':ok?'ok':'no'}">${label}: ${waiting?'—':ok?'YES':'NO'}</span>`;}

  function renderAdmin(){
    if(adminRefreshTimer){clearInterval(adminRefreshTimer);adminRefreshTimer=null;}
    const target=adminTestTarget();
    if(target&&adminFieldState.testTargetId!==target.id){adminFieldState.testTargetId=target.id;saveAdminFieldState();}
    const routeStatus=localTestRouteStatus();
    const virtualActive=localTestEnabled&&routeStatus.ready;
    const guestTarget=current();
    app.innerHTML=`<main class="admin-shell admin-shell-simple">
      <header class="admin-head admin-head-simple"><div><div class="kicker">Silverstone Mission Control · Working V2</div><h1>Field Test</h1><p>GPS, installation positions and route testing.</p></div><div class="admin-head-actions"><a class="btn secondary" href="/">Open Mission Control</a><button class="btn danger" id="adminResetProgress">Reset Mission Progress</button></div></header>

      <section class="admin-simple-section admin-gps-simple panel">
        <div class="admin-live-head"><div><div class="kicker">1 · GPS Status</div><h2 id="adminGpsStatus">${lastGps?gpsCondition(lastGps.accuracy):'Not Started'}</h2></div><button class="btn primary" id="adminStartGps">${lastGps?'Restart GPS':'Start Live GPS'}</button></div>
        <div class="admin-gps-primary">
          <div><span>Accuracy</span><strong id="adminAccuracy">—</strong></div>
          <div class="admin-gps-coords"><span>My Position</span><strong><span id="adminLat">—</span><br><span id="adminLng">—</span></strong></div>
          <div><span>Nearest Installation</span><strong id="adminNearest">—</strong><small id="adminNearestDistance">—</small></div>
        </div>
      </section>

      <section class="admin-simple-section admin-installation-simple panel">
        <div class="admin-section-head admin-simple-head"><div><div class="kicker">2 · Test Installation</div><h2>Select & Inspect</h2></div><span class="admin-source">SAFE TEST TARGET</span></div>
        <label class="admin-main-select">Installation<select id="adminTargetSelect">${adminRouteCheckpoints().map(cp=>`<option value="${cp.id}" ${cp.id===target?.id?'selected':''}>${cp.mc} · ${cp.name} · ${cp.location}</option>`).join('')}</select></label>
        <div class="admin-local-route-progress is-ready"><span>Culcheth Local Test</span><strong>${routeStatus.total} FIXED TEST POSITIONS READY</strong><small>Preconfigured village route. No capture/setup walk required.</small></div>
        ${adminCheckpoint(target)}
        <div class="admin-coordinate-mode ${virtualActive?'local-active':'master-active'}">
          <div><span>Coordinate Mode</span><strong>${virtualActive?'CULCHETH LOCAL TEST':'SILVERSTONE MASTER'}</strong><small>${virtualActive?'Only the fixed Culcheth Live GPS profile is active. Guest Radar progress is virtually mapped onto Silverstone; master Silverstone coordinates remain untouched. Demo Mode remains separate.':'Canonical Silverstone coordinates and real circuit georeference are active. Culcheth coordinates are parked in their separate test profile.'}</small></div>
          <div class="admin-mode-actions"><button class="btn small ${virtualActive?'secondary':'success'}" id="adminUseMaster">Silverstone Master</button><button class="btn small ${virtualActive?'success':'secondary'}" id="adminUseLocal">Culcheth Local Test</button></div>
        </div>
      </section>

      <section class="admin-simple-section admin-route-simple panel ${adminFieldState.guestRouteTestActive?'test-active':''}">
        <div class="admin-section-head admin-simple-head"><div><div class="kicker">3 · Route Testing</div><h2>Guest Progress</h2></div>${adminFieldState.guestRouteTestActive?'<span class="admin-source local">TEST ROUTE ACTIVE</span>':'<span class="admin-source">PROTECTED</span>'}</div>
        <div class="admin-route-readout">
          <div><span>Guest Next Checkpoint</span><strong id="adminRouteTarget">${guestTarget?.mc||'Complete'}</strong></div>
          <div><span>Field Test Target</span><strong id="adminTestTargetMetric">${target?.mc||'—'}</strong></div>
          <div><span>Target Guest State</span><strong id="adminActualState">${adminGuestStatus(target)}</strong></div>
        </div>
        <p class="admin-hint">Choosing an installation above does not change guest progress. Use the route-test button only when you deliberately want to exercise the real guest progression engine; the current guest state is saved first.</p>
        <div class="admin-primary-actions"><button class="btn secondary" id="adminSetGuestRoute">Test This Installation In Guest Route</button><button class="btn secondary" id="adminRestoreGuest" ${adminFieldState.guestSnapshot?'':'disabled'}>Restore Guest Progress</button></div>
      </section>

      <details class="admin-advanced panel">
        <summary><span><span class="kicker">Only if needed</span><strong>Advanced Diagnostics</strong></span><span class="admin-advanced-arrow">⌄</span></summary>
        <div class="admin-advanced-body">
          <div class="admin-metrics admin-advanced-metrics">
            <div><span>Fix Age</span><strong id="adminFixAge">—</strong></div><div><span>Route Distance</span><strong id="adminRouteDistance">—</strong></div><div><span>Test Distance</span><strong id="adminTestDistance">—</strong></div><div><span>Virtual Circuit</span><strong id="adminVirtualCircuit">${virtualActive?'ACTIVE':'PARKED'}</strong></div><div><span>Circuit Progress</span><strong id="adminCircuitProgress">—</strong></div><div><span>Local Route Offset</span><strong id="adminOffTrack">—</strong></div><div><span>SVG Position</span><strong id="adminSvgPoint">—</strong></div><div><span>Route Index</span><strong>${state.routeIndex}</strong></div><div><span>Completed</span><strong>${state.completed.length}</strong></div><div><span>Available</span><strong>${state.available.length}</strong></div>
          </div>
          <div class="admin-test-state admin-advanced-state"><span>Expected GPS State</span><strong id="adminExpectedState">—</strong></div>
          <div class="admin-rules" id="adminRuleReadout"></div>
          <p class="admin-hint">Activation: ${ACTIVATION_HITS_REQUIRED} good fixes / ~${(ACTIVATION_DWELL_MS/1000).toFixed(1)} s. Pass evidence: ~${(PASS_DWELL_MS/1000).toFixed(1)} s. Next-checkpoint confirmation: ~${(NEXT_PASS_DWELL_MS/1000).toFixed(1)} s.</p>
          <div class="admin-tool-buttons"><button class="btn secondary" id="adminSnapshot">Save Diagnostic Snapshot</button><button class="btn secondary" id="adminCopySnapshot">Copy Live Diagnostics</button><button class="btn secondary" id="adminExportLog" ${adminFieldState.fieldLog?.length?'':'disabled'}>Copy Field Log (${adminFieldState.fieldLog?.length||0})</button><button class="btn secondary" id="adminClearLog" ${adminFieldState.fieldLog?.length?'':'disabled'}>Clear Field Log</button></div>
          <div class="admin-advanced-divider"></div>
          <div><div class="kicker">Data Tools</div><h3>Survey Candidates & Utilities</h3></div>
          <div class="admin-tool-buttons"><button class="btn secondary" id="adminExport">Copy Survey JSON</button><button class="btn secondary" id="adminTestMessage">Send Test Message</button><button class="btn secondary" id="adminClearMessages">Clear Comms Feed</button><button class="btn secondary" id="adminResetOverrides">Clear Survey Candidates</button></div>
          <textarea id="adminImportText" class="admin-json" placeholder='Paste survey candidate JSON here to import'></textarea><button class="btn secondary" id="adminImport">Import JSON</button>
        </div>
      </details>
    </main>`;
    bindAdmin();updateAdminGps();
    adminRefreshTimer=setInterval(updateAdminGps,1000);
  }

  function adminCheckpoint(cp){
    if(!cp)return '';
    const survey=overrides[cp.id];
    const localPoint=LOCAL_TEST_PRESET.points?.[cp.id];
    const active=activeConfig(cp);
    const editCfg=survey?{...cp,...survey}:{...cp};
    const diag=adminDiagnostic(cp);
    const capture=adminFieldState.lastCapture?.[cp.id];
    return `<div class="admin-selected-installation ${survey?'has-override':''}">
      <div class="admin-selected-head"><div><div class="kicker">${cp.mc} · ${cp.location}</div><h3>${cp.name}</h3></div><span class="admin-source ${localTestEnabled?'local':''}">${localTestEnabled?'CULCHETH LOCAL':'SILVERSTONE MASTER'}</span></div>
      <div class="admin-installation-readout">
        <div><span>Silverstone Master</span><strong>${cp.lat.toFixed(7)}<br>${cp.lng.toFixed(7)}</strong></div>
        <div><span>Culcheth Test</span><strong>${localPoint?`${Number(localPoint.lat).toFixed(7)}<br>${Number(localPoint.lng).toFixed(7)}`:'—'}</strong><small>${localPoint?.label||''}</small></div>
        <div><span>Distance From Me</span><strong data-admin-distance="${cp.id}">${adminFormatDistance(diag?.distance)}</strong></div>
        <div><span>Active Trigger</span><strong>${active.activationRadius} m</strong></div>
      </div>
      <details class="admin-installation-advanced"><summary>Survey / coordinate capture</summary><div class="admin-installation-advanced-body">
        <p class="admin-hint">For on-site surveying only. Captured/saved values below are candidates and never alter either Silverstone Master or the fixed Culcheth Local Test profile.</p>
        <div class="admin-coordinate-editor">
          <label>Candidate latitude<input data-field="lat" data-id="${cp.id}" type="number" step="0.0000001" value="${survey?.lat??cp.lat}"></label>
          <label>Candidate longitude<input data-field="lng" data-id="${cp.id}" type="number" step="0.0000001" value="${survey?.lng??cp.lng}"></label>
        </div>
        ${capture?`<div class="admin-capture-note">Last capture: ${Number(capture.lat).toFixed(7)}, ${Number(capture.lng).toFixed(7)} · accuracy ±${Math.round(capture.accuracy)} m · ${capture.samples} sample${capture.samples===1?'':'s'}</div>`:''}
        <div class="admin-primary-actions"><button class="btn primary" data-admin-current="${cp.id}">Capture My Position</button><button class="btn secondary" data-admin-save="${cp.id}">Save Survey Candidate</button><button class="btn secondary" data-admin-reset="${cp.id}" ${survey?'':'disabled'}>Clear Candidate</button></div>
        <div class="admin-fields"><label>Candidate detection radius (m)<input data-field="detectionRadius" data-id="${cp.id}" type="number" min="10" max="500" step="1" value="${survey?.detectionRadius??cp.detectionRadius}"></label><label>Candidate activation radius (m)<input data-field="activationRadius" data-id="${cp.id}" type="number" min="5" max="200" step="1" value="${survey?.activationRadius??cp.activationRadius}"></label></div>
        <button class="btn small secondary" data-admin-copycoords="${cp.id}">Copy Candidate Coordinates</button>
      </div></details>
    </div>`;
  }

  function bindAdmin(){
    document.getElementById('adminStartGps')?.addEventListener('click',startAdminGps);
    document.getElementById('adminUseMaster')?.addEventListener('click',()=>{
      localTestEnabled=false;
      saveLocalTestMode();
      resetGeofenceRuntime();
      renderAdmin();
      toast('Silverstone Master active. Culcheth test coordinates are parked.');
    });
    document.getElementById('adminUseLocal')?.addEventListener('click',()=>{
      localTestEnabled=true;
      saveLocalTestMode();
      resetGeofenceRuntime();
      renderAdmin();
      toast('Culcheth Local Test active. Silverstone master coordinates are untouched.');
    });
    document.getElementById('adminTargetSelect')?.addEventListener('change',e=>setAdminTestTarget(e.target.value));
    document.querySelectorAll('[data-admin-current]').forEach(b=>b.addEventListener('click',()=>captureAdminPosition(b.dataset.adminCurrent)));
    document.querySelectorAll('[data-admin-copycoords]').forEach(b=>b.addEventListener('click',()=>copyAdminCoords(b.dataset.adminCopycoords)));
    document.querySelectorAll('[data-admin-save]').forEach(b=>b.addEventListener('click',()=>saveAdminCheckpoint(b.dataset.adminSave)));
    document.querySelectorAll('[data-admin-reset]').forEach(b=>b.addEventListener('click',()=>{
      delete overrides[b.dataset.adminReset];
      saveOverrides();
      renderAdmin();
      toast('Survey candidate cleared. Active coordinate profiles are unchanged.');
    }));
    document.getElementById('adminSnapshot')?.addEventListener('click',captureAdminSnapshot);
    document.getElementById('adminCopySnapshot')?.addEventListener('click',copyAdminDiagnostics);
    document.getElementById('adminExportLog')?.addEventListener('click',copyAdminLog);
    document.getElementById('adminClearLog')?.addEventListener('click',()=>{adminFieldState.fieldLog=[];saveAdminFieldState();renderAdmin();toast('Field log cleared.');});
    document.getElementById('adminSetGuestRoute')?.addEventListener('click',setGuestRouteToTestTarget);
    document.getElementById('adminRestoreGuest')?.addEventListener('click',restoreGuestProgressSnapshot);
    document.getElementById('adminExport')?.addEventListener('click',async()=>{const json=JSON.stringify(overrides,null,2);await adminCopyText(json,'Survey candidate JSON copied.','JSON placed in the text box.');});
    document.getElementById('adminTestMessage')?.addEventListener('click',()=>{addMessage(`admin-test:${Date.now()}`,'MISSION CONTROL','TEST TRANSMISSION','This is a local Comms test message generated from the admin page.');toast('Test message added.');});
    document.getElementById('adminClearMessages')?.addEventListener('click',()=>{state.messages=[];state.messageSeq=0;state.messageAlert=false;save();toast('Comms feed cleared.');});
    document.getElementById('adminImport')?.addEventListener('click',()=>{
      try{
        const parsed=JSON.parse(document.getElementById('adminImportText').value||'{}');
        overrides=parsed&&typeof parsed==='object'?parsed:{};
        saveOverrides();
        renderAdmin();
        toast('Survey candidates imported. Active coordinate mode was not changed.');
      }catch{toast('Invalid JSON.');}
    });
    document.getElementById('adminResetOverrides')?.addEventListener('click',()=>{
      if(confirm('Clear all saved survey candidates on this device? Silverstone Master and Culcheth Local Test coordinates are not affected.')){
        overrides={};
        saveOverrides();
        renderAdmin();
        toast('Survey candidates cleared.');
      }
    });
    document.getElementById('adminResetProgress')?.addEventListener('click',()=>{if(confirm('Reset all Mission Control guest progress on this device?')){state={...defaults};save();resetGeofenceRuntime();adminFieldState.guestSnapshot=null;adminFieldState.guestRouteTestActive=false;saveAdminFieldState();renderAdmin();toast('Guest progress reset.');}});
  }

  function setAdminTestTarget(id){
    const cp=CHECKPOINTS.find(c=>c.id===id&&c.geofence!==false);if(!cp)return;
    adminFieldState.testTargetId=id;saveAdminFieldState();renderAdmin();toast(`${cp.mc} selected for isolated diagnostics.`);
  }

  function recordAdminFix(fix){
    if(!fix)return;
    adminGpsHistory=[...adminGpsHistory,fix].filter(item=>Date.now()-(Number(item.timestamp)||0)<=20000).slice(-30);
  }
  function averagedAdminFix(){
    const now=Date.now();
    const recent=adminGpsHistory.filter(f=>now-(Number(f.timestamp)||0)<=12000&&Number.isFinite(f.lat)&&Number.isFinite(f.lng)&&Number.isFinite(Number(f.accuracy)));
    if(!recent.length)return lastGps?{...lastGps,samples:1}:null;
    const best=Math.min(...recent.map(f=>Number(f.accuracy)));
    const usable=recent.filter(f=>Number(f.accuracy)<=Math.max(15,best*1.8));
    let weightTotal=0,latTotal=0,lngTotal=0;
    usable.forEach(f=>{const a=Math.max(1,Number(f.accuracy));const w=1/(a*a);weightTotal+=w;latTotal+=f.lat*w;lngTotal+=f.lng*w;});
    return {lat:latTotal/weightTotal,lng:lngTotal/weightTotal,accuracy:best,timestamp:now,samples:usable.length};
  }
  function captureAdminPosition(id){
    if(!lastGps){toast('Start Live GPS first.');startAdminGps();return;}
    const fix=averagedAdminFix();if(!fix)return;
    const latField=document.querySelector(`[data-field="lat"][data-id="${id}"]`),lngField=document.querySelector(`[data-field="lng"][data-id="${id}"]`);
    if(!latField||!lngField)return;
    latField.value=Number(fix.lat).toFixed(8);lngField.value=Number(fix.lng).toFixed(8);
    adminFieldState.lastCapture[id]={lat:fix.lat,lng:fix.lng,accuracy:fix.accuracy,samples:fix.samples||1,timestamp:fix.timestamp};saveAdminFieldState();
    toast(`Position captured from ${fix.samples||1} recent GPS fix${(fix.samples||1)===1?'':'es'}. Save it as a survey candidate if required.`);
  }
  async function copyAdminCoords(id){
    const lat=Number(document.querySelector(`[data-field="lat"][data-id="${id}"]`)?.value),lng=Number(document.querySelector(`[data-field="lng"][data-id="${id}"]`)?.value);
    if(!Number.isFinite(lat)||!Number.isFinite(lng)){toast('Enter valid coordinates first.');return;}
    const cp=CHECKPOINTS.find(c=>c.id===id);
    await adminCopyText(`${lat.toFixed(8)}, ${lng.toFixed(8)}`,`${cp?.mc||id} candidate coordinates copied.`);
  }

  function saveAdminCheckpoint(id){
    const cp=CHECKPOINTS.find(c=>c.id===id); if(!cp)return;
    const lat=Number(document.querySelector(`[data-field="lat"][data-id="${id}"]`).value),lng=Number(document.querySelector(`[data-field="lng"][data-id="${id}"]`).value);
    if(!Number.isFinite(lat)||!Number.isFinite(lng)){toast('Enter valid coordinates.');return;}
    const next={lat,lng};
    if(cp.geofence!==false){
      const detectionRadius=Number(document.querySelector(`[data-field="detectionRadius"][data-id="${id}"]`).value),activationRadius=Number(document.querySelector(`[data-field="activationRadius"][data-id="${id}"]`).value);
      if(!Number.isFinite(detectionRadius)||!Number.isFinite(activationRadius)||activationRadius>=detectionRadius){toast('Detection radius must be larger than activation radius.');return;}
      next.detectionRadius=detectionRadius;next.activationRadius=activationRadius;
    }
    overrides[id]=next;
    saveOverrides();
    renderAdmin();
    toast(`${cp.mc} survey candidate saved. Active Silverstone/Culcheth coordinates were not changed.`);
  }

  function startAdminGps(){
    if(!navigator.geolocation){toast('Geolocation unavailable.');return;}
    if(adminWatchId!==null)navigator.geolocation.clearWatch(adminWatchId);
    adminGpsHistory=[];
    adminWatchId=navigator.geolocation.watchPosition(pos=>{lastGps=normalisePosition(pos);recordAdminFix(lastGps);updateAdminGps();},()=>toast('Unable to read GPS. Check browser permission.'),{enableHighAccuracy:true,maximumAge:250,timeout:15000});
  }

  function updateAdminGps(){
    if(!IS_ADMIN||!document.getElementById('adminLat'))return;
    const target=adminTestTarget(),diag=adminDiagnostic(target),nearest=adminNearest(),guestTarget=current(),guestDistance=adminDistance(guestTarget,lastGps),circuit=adminCircuitPosition();
    const setText=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
    setText('adminGpsStatus',lastGps?gpsCondition(lastGps.accuracy):'Not Started');
    setText('adminLat',lastGps?lastGps.lat.toFixed(7):'—');setText('adminLng',lastGps?lastGps.lng.toFixed(7):'—');
    setText('adminAccuracy',lastGps?`±${Math.round(lastGps.accuracy)} m`:'—');setText('adminFixAge',lastGps?`${(adminCurrentFixAge()/1000).toFixed(1)} s`:'—');
    setText('adminNearest',nearest?`${nearest.cp.mc} ${nearest.cp.name}`:'—');setText('adminNearestDistance',adminFormatDistance(nearest?.distance));
    setText('adminRouteTarget',guestTarget?.mc||'Complete');setText('adminRouteDistance',adminFormatDistance(guestDistance));
    setText('adminTestTargetMetric',target?.mc||'—');setText('adminTestDistance',adminFormatDistance(diag?.distance));
    setText('adminVirtualCircuit',circuit.virtual?'ACTIVE':localTestEnabled?'WAITING FOR GPS':'PARKED');
    setText('adminCircuitProgress',circuit.virtual?`${Math.round(circuit.virtual.progress*100)}%`:'—');
    setText('adminOffTrack',circuit.virtual?adminFormatDistance(circuit.virtual.localOffRouteDistance):'—');
    setText('adminSvgPoint',circuit.point?`${circuit.point.x.toFixed(1)}, ${circuit.point.y.toFixed(1)}`:'—');
    setText('adminExpectedState',diag?.expected||'—');setText('adminActualState',adminGuestStatus(target));
    const rules=document.getElementById('adminRuleReadout');if(rules&&diag)rules.innerHTML=adminRulePill(`GPS ≤${DETECTION_ACCURACY_MAX}m`,diag.detectionAccuracy,!lastGps)+adminRulePill(`Inside detection ${diag.cfg.detectionRadius}m`,diag.insideDetection,!lastGps)+adminRulePill(`GPS ≤${ACTIVATION_ACCURACY_MAX}m`,diag.activationAccuracy,!lastGps)+adminRulePill(`Inside activation ${diag.cfg.activationRadius}m`,diag.insideActivation,!lastGps)+adminRulePill(`Pass GPS ≤${PASS_ACCURACY_MAX}m`,diag.passAccuracy,!lastGps)+adminRulePill(`Next-pass GPS ≤${NEXT_PASS_ACCURACY_MAX}m`,diag.nextPassAccuracy,!lastGps);
    document.querySelectorAll('[data-admin-distance]').forEach(el=>{const cp=CHECKPOINTS.find(c=>c.id===el.dataset.adminDistance);el.textContent=adminFormatDistance(adminDistance(cp));});
  }

  function adminSnapshotPayload(){
    const target=adminTestTarget(),diag=adminDiagnostic(target),nearest=adminNearest(),circuit=adminCircuitPosition(),guestTarget=current();
    return {
      capturedAt:new Date().toISOString(),coordinateMode:localTestEnabled?'CULCHETH_LOCAL_TEST':'MASTER',localPreset:{id:LOCAL_TEST_PRESET.id,name:LOCAL_TEST_PRESET.name,...localTestRouteStatus()},
      gps:lastGps?{lat:lastGps.lat,lng:lastGps.lng,accuracy:lastGps.accuracy,fixAgeMs:adminCurrentFixAge(),condition:gpsCondition(lastGps.accuracy)}:null,
      nearest:nearest?{id:nearest.cp.id,mc:nearest.cp.mc,name:nearest.cp.name,distanceM:nearest.distance}:null,
      testTarget:target?{id:target.id,mc:target.mc,name:target.name,source:diag?.cfg.source,lat:diag?.cfg.lat,lng:diag?.cfg.lng,distanceM:diag?.distance,detectionRadiusM:diag?.cfg.detectionRadius,activationRadiusM:diag?.cfg.activationRadius,expectedState:diag?.expected,guestState:adminGuestStatus(target),insideDetection:diag?.insideDetection,insideActivation:diag?.insideActivation,detectionAccuracyOk:diag?.detectionAccuracy,activationAccuracyOk:diag?.activationAccuracy}:null,
      guestProgress:{mode:state.mode,routeIndex:state.routeIndex,routeTarget:guestTarget?.id||null,completed:[...state.completed],available:[...state.available]},
      circuit:circuit.point?{svgX:circuit.point.x,svgY:circuit.point.y,virtual:Boolean(circuit.virtual),localRouteOffsetM:circuit.virtual?.localOffRouteDistance??null,routeProgress:circuit.virtual?.progress??circuit.projection?.progress??null,fromId:circuit.virtual?.fromId??null,toId:circuit.virtual?.toId??null}:null
    };
  }
  function captureAdminSnapshot(){
    const payload=adminSnapshotPayload();adminFieldState.fieldLog=[...(adminFieldState.fieldLog||[]),payload].slice(-100);saveAdminFieldState();renderAdmin();toast(`Diagnostic snapshot ${adminFieldState.fieldLog.length} saved.`);
  }
  async function copyAdminDiagnostics(){await adminCopyText(JSON.stringify(adminSnapshotPayload(),null,2),'Live diagnostics copied.','Diagnostics placed in the text box.');}
  async function copyAdminLog(){
    const payload={exportedAt:new Date().toISOString(),version:'2.0.0',entries:adminFieldState.fieldLog||[]};
    await adminCopyText(JSON.stringify(payload,null,2),'Field log copied.','Field log placed in the text box.');
  }
  async function adminCopyText(text,success='Copied.',fallback='Text placed in the box.'){
    try{await navigator.clipboard.writeText(text);toast(success);}
    catch{const box=document.getElementById('adminImportText');if(box)box.value=text;toast(fallback);}
  }

  function setGuestRouteToTestTarget(){
    const cp=adminTestTarget(),idx=checkpointIndex(cp?.id);if(!cp||idx<ROUTE_START_INDEX)return;
    if(!adminFieldState.guestSnapshot)adminFieldState.guestSnapshot=JSON.parse(JSON.stringify(state));
    adminFieldState.guestRouteTestActive=true;saveAdminFieldState();
    state={...state,onboarded:true,mode:'live',routeIndex:normaliseRouteIndex(idx),targetVisible:false,targetInRange:false,distance:null,missionOpen:null,nav:'radar'};resetGeofenceRuntime();save();renderAdmin();toast(`${cp.mc} set as guest route target. Original guest progress is saved for restore.`);
  }
  function restoreGuestProgressSnapshot(){
    if(!adminFieldState.guestSnapshot){toast('No guest progress snapshot saved.');return;}
    state={...defaults,...adminFieldState.guestSnapshot};save();resetGeofenceRuntime();adminFieldState.guestSnapshot=null;adminFieldState.guestRouteTestActive=false;saveAdminFieldState();renderAdmin();toast('Saved guest progress restored.');
  }
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
  function bindDiagnostics(){
    const done=new Set();
    const durations=[1600,1900,1700,1200,1680,2050];
    const scanAudioPaths=[
      './assets/mc02-scan-aero.mp3',
      './assets/mc02-scan-stability.mp3',
      './assets/mc02-scan-power.mp3',
      './assets/mc02-scan-control.mp3',
      './assets/mc02-scan-traction.mp3',
      './assets/mc02-scan-response.mp3'
    ];
    const scanAudio=scanAudioPaths.map(src=>{
      const audio=new Audio(src);
      audio.preload='auto';
      audio.volume=.72;
      return audio;
    });
    const captureAudio=new Audio('./assets/mc02-scan-capture.mp3');
    captureAudio.preload='auto';
    captureAudio.volume=.82;
    const submitAudio=new Audio('./assets/mc02-mission-complete.mp3');
    submitAudio.preload='auto';
    submitAudio.volume=.82;
    let busy=false;
    let activeScanAudio=null;
    let fadeTimer=null;

    function playOneShot(audio){
      if(!state.audio||!audio)return;
      try{
        audio.pause();
        audio.currentTime=0;
        const play=audio.play();
        if(play&&typeof play.catch==='function')play.catch(()=>{});
      }catch{}
    }

    function stopDiagnosticScanFx(fade=true){
      if(fadeTimer){clearInterval(fadeTimer);fadeTimer=null;}
      const audio=activeScanAudio;
      if(!audio)return;
      const finish=()=>{
        try{audio.pause();audio.currentTime=0;audio.volume=.72;}catch{}
        if(activeScanAudio===audio)activeScanAudio=null;
      };
      if(!fade||audio.paused){finish();return;}
      const from=Math.max(.01,audio.volume);
      let step=0;
      fadeTimer=setInterval(()=>{
        step+=1;
        try{audio.volume=Math.max(0,from*(1-step/6));}catch{}
        if(step>=6){
          clearInterval(fadeTimer);fadeTimer=null;finish();
        }
      },24);
    }

    function playDiagnosticScanFx(index){
      if(!state.audio)return;
      stopDiagnosticScanFx(false);
      const audio=scanAudio[index];
      if(!audio)return;
      activeScanAudio=audio;
      try{
        audio.pause();
        audio.currentTime=0;
        audio.volume=.72;
        const play=audio.play();
        if(play&&typeof play.catch==='function')play.catch(()=>{if(activeScanAudio===audio)activeScanAudio=null;});
      }catch{if(activeScanAudio===audio)activeScanAudio=null;}
    }

    scanAudio.forEach(audio=>audio.addEventListener('ended',()=>{
      if(activeScanAudio===audio){audio.volume=.72;activeScanAudio=null;}
    }));

    document.querySelectorAll('[data-sensor]').forEach(btn=>btn.onclick=()=>{
      const i=Number(btn.dataset.sensor);
      if(done.has(i)||busy)return;
      busy=true;
      document.querySelectorAll('[data-sensor]').forEach(other=>{ if(other!==btn&&!other.classList.contains('done')) other.classList.add('scan-locked'); });
      btn.classList.add('active');
      btn.querySelector('.state').textContent='Scanning…';
      playDiagnosticScanFx(i);
      haptic(12);
      setTimeout(()=>{
        stopDiagnosticScanFx(true);
        done.add(i);
        btn.classList.remove('active');
        btn.classList.add('done');
        btn.querySelector('.state').innerHTML='Captured <span class="checkmark-icon checkmark-icon--inline" aria-hidden="true"></span>';
        document.querySelectorAll('[data-sensor]').forEach(other=>other.classList.remove('scan-locked'));
        playOneShot(captureAudio);
        haptic(24);
        busy=false;
        if(done.size===6)document.getElementById('diagComplete').disabled=false;
      },durations[i]||1800);
    });
    document.getElementById('diagComplete').onclick=()=>{
      stopDiagnosticScanFx(false);
      playOneShot(submitAudio);
      showCompletion('Performance Scan Complete','The racing performance data has been captured and is ready to support Santa-1’s recovery systems.');
    };
  }
  async function completeElfTuning(){
    stopStatic();
    state.elfUnlocked=true;
    const audio=getElfAudio();
    let playing=false;
    if(audio){
      try{
        audio.volume=1;
        await audio.play();
        playing=true;
      }catch{
        playing=false;
      }
    }
    elfTunerPreviewActive=false;
    state.elfAudioOn=playing;
    save();
    showRadioCompletion();
    if(!playing) toast('Signal tuned. Use ELF FM in Comms to start the stream.');
  }
  function bindRadio(){
    const range=document.getElementById('freqRange'), val=document.getElementById('freqVal'), st=document.getElementById('signalState'), btn=document.getElementById('lockSignal'), wave=document.getElementById('radioWave');
    startStatic(.095);
    startElfTunerPreview().then(started=>{if(!started) st.textContent='Move the tuner to locate the signal';});
    let wasLocked=false;
    const update=()=>{
      const f=Number(range.value);
      val.textContent=f.toFixed(1);
      const delta=Math.abs(f-87.7);
      const distanceMix=Math.max(0,Math.min(1,delta/1.1));
      setStatic(.006+distanceMix*.089);
      setElfTunerPreview(delta);
      if(delta<.051){
        st.textContent='Signal acquired';st.classList.add('lock');btn.disabled=false;wave.classList.add('locked');
        if(!wasLocked){ping(920,.06,.02);haptic(20);wasLocked=true;}
      } else {
        wasLocked=false;
        st.textContent=delta<.15?'Signal almost clear…':delta<.4?'Signal resolving…':delta<.8?'Weak signal…':'Searching for signal';
        st.classList.remove('lock');btn.disabled=true;wave.classList.remove('locked');
      }
    };
    range.oninput=update;update();
    btn.onclick=()=>{completeElfTuning();};
    cleanupMission=()=>{stopStatic();stopElfTunerPreview();};
  }
  function bindCommsRelay(){
    const nodes=[...document.querySelectorAll('[data-relay]')];
    const hops=[...document.querySelectorAll('[data-hop]')];
    const stateEl=document.getElementById('relayState');
    const progressCount=document.getElementById('relayLockedCount');
    const progressHead=document.querySelector('.relay-progress-head');
    const progressBars=[...document.querySelectorAll('[data-relay-progress]')];
        const cycles=[1900,1650,1450,1300];
    const relayFxShort=new Audio('./assets/mc03-relay-success-short.mp3');
    const relayFxFull=new Audio('./assets/mc03-relay-success-full.mp3');
    const relayFxMiss=new Audio('./assets/mc03-relay-miss.mp3');
    [relayFxShort,relayFxFull,relayFxMiss].forEach(a=>{a.preload='auto';try{a.load();}catch{}});
    function playRelayFx(a,volume=.9){
      if(!state.audio||!a)return;
      try{a.pause();a.currentTime=0;a.volume=volume;const p=a.play();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch{}
    }
    function stopRelayFx(){[relayFxShort,relayFxFull,relayFxMiss].forEach(a=>{try{a.pause();a.currentTime=0;}catch{}});}
    let stage=0,phase=0,start=performance.now(),raf=0,locked=false,finishing=false;
    const santa=getSantaCommsAudio();
    try{santa.load();}catch{}
    const routeSvg=document.querySelector('.relay-route');
    const relayNetwork=document.getElementById('relayNetwork');
    const carrierPackets=[...document.querySelectorAll('[data-carrier]')];
    let carrierSegments=[];
    let capturePhase=.66;
    const routePoints=[document.querySelector('.relay-origin .relay-radio-icon'),...nodes,document.querySelector('.relay-destination .relay-receiver-icon')];
    function alignRelayRoute(){
      if(!routeSvg||!relayNetwork)return;
      const sr=routeSvg.getBoundingClientRect();
      const nr=relayNetwork.getBoundingClientRect();
      if(!sr.width||!sr.height||!nr.width||!nr.height)return;
      const toSvgPoint=(el)=>{const r=el?.getBoundingClientRect();return r?{x:((r.left+r.width/2-sr.left)/sr.width)*100,y:((r.top+r.height/2-sr.top)/sr.height)*150}:null;};
      const toPixelPoint=(el)=>{const r=el?.getBoundingClientRect();return r?{x:r.left+r.width/2-nr.left,y:r.top+r.height/2-nr.top}:null;};
      const svgPts=routePoints.map(toSvgPoint);
      const pixelPts=routePoints.map(toPixelPoint);
      hops.forEach((line,i)=>{const a=svgPts[i],b=svgPts[i+1];if(!a||!b)return;line.setAttribute('x1',a.x.toFixed(3));line.setAttribute('y1',a.y.toFixed(3));line.setAttribute('x2',b.x.toFixed(3));line.setAttribute('y2',b.y.toFixed(3));});
      carrierSegments=Array.from({length:Math.max(0,pixelPts.length-1)},(_,i)=>({a:pixelPts[i],b:pixelPts[i+1]}));
      const activePulse=nodes[stage]?.querySelector('.relay-pulse');
      const activeTarget=nodes[stage]?.querySelector('.relay-target');
      if(activePulse&&activeTarget){
        const pulseDiameter=activePulse.offsetWidth;
        const targetDiameter=activeTarget.offsetWidth;
        if(pulseDiameter&&targetDiameter){
          capturePhase=Math.max(.1,Math.min(.95,((targetDiameter/pulseDiameter)-.42)/1.28));
        }
      }
    }
    const onRelayResize=()=>alignRelayRoute();
    window.addEventListener('resize',onRelayResize);
    requestAnimationFrame(alignRelayRoute);
    function draw(now){
      if(finishing)return;
      const cycle=cycles[stage]||1300;
      phase=((now-start)%cycle)/cycle;
      const pulse=nodes[stage]?.querySelector('.relay-pulse');
      if(pulse){
        const scale=.42+phase*1.28;
        pulse.style.transform=`translate(-50%,-50%) scale(${scale})`;
        pulse.style.opacity=String(Math.max(.08,1-phase*.72));
      }
      if(carrierPackets.length){
        carrierPackets.forEach((packet,i)=>{
          const isLive=i===stage||hops[i]?.classList.contains('locked');
          const segment=carrierSegments[i];
          if(!isLive||!segment?.a||!segment?.b||phase>capturePhase){packet.style.opacity='0';return;}
          const raw=Math.max(0,Math.min(1,phase/capturePhase));
          const eased=raw*raw*(3-2*raw);
          const x=segment.a.x+(segment.b.x-segment.a.x)*eased;
          const y=segment.a.y+(segment.b.y-segment.a.y)*eased;
          const angle=Math.atan2(segment.b.y-segment.a.y,segment.b.x-segment.a.x)*180/Math.PI;
          const edgeFade=Math.min(1,raw/.07,(1-raw)/.045);
          packet.style.left=`${x}px`;
          packet.style.top=`${y}px`;
          packet.style.opacity=String(Math.max(0,edgeFade));
          packet.style.transform=`translate(-100%,-50%) rotate(${angle}deg)`;
        });
      }
      raf=requestAnimationFrame(draw);
    }
    function arm(nextStage){
      stage=nextStage;phase=0;start=performance.now();locked=false;
      nodes.forEach((n,i)=>n.classList.toggle('active',i===stage));
      hops.forEach((h,i)=>h.classList.toggle('active',i===stage&&!h.classList.contains('locked')));
      carrierPackets.forEach(packet=>packet.style.opacity='0');
      requestAnimationFrame(alignRelayRoute);
      stateEl.textContent=`Relay 0${stage+1} armed`;
      if(progressCount)progressCount.textContent=`${stage} / 4`;
      progressHead?.classList.remove('is-complete');
      progressBars.forEach((bar,i)=>{
        bar.classList.toggle('on',i<stage);
        bar.classList.remove('complete');
      });
    }
    function showIncomingTransmission(){
      finishing=true;cancelAnimationFrame(raf);
      const mc=document.getElementById('missionContent');if(!mc)return;
      mc.innerHTML=`<div class="mission-instrument panel incoming-transmission"><div class="transmission-wave">${'<b></b>'.repeat(24)}</div><div class="kicker">Incoming Transmission</div><h2>SANTA-1</h2><div class="signal-state lock" id="incomingState">Signal locked</div></div>`;
      const radioWasOn=Boolean(state.elfAudioOn&&elfAudioEl&&!elfAudioEl.paused);
      const previousRadioVolume=radioWasOn?elfAudioEl.volume:1;
      let stopDuck=()=>{};
      // Narrative transmissions take priority over ELF FM. Keep a trace of the
      // station underneath rather than stopping/restarting the live stream.
      if(radioWasOn) stopDuck=rampElementVolume(elfAudioEl,0,420);
      if(state.audio) startStatic(.05);
      let introStatic=null,santaDelay=null,fallback=null,tailTimer=null,finished=false;
      const finish=()=>{
        if(finished)return;finished=true;
        clearTimeout(introStatic);clearTimeout(santaDelay);clearTimeout(fallback);clearTimeout(tailTimer);stopStatic();
        if(radioWasOn&&elfAudioEl){elfAudioEl.volume=0;rampElementVolume(elfAudioEl,previousRadioVolume,520);}
        setTimeout(()=>showCompletion('Comms Link Restored','Communications have been established and Mission Control is now connected to Santa-1.'),260);
      };
      const playSanta=()=>{
        stopStatic();
        if(!state.audio){setTimeout(finish,1050);return;}
        try{
          santa.currentTime=0;santa.volume=1;
          const play=santa.play();
          if(play&&typeof play.catch==='function') play.catch(()=>finish());
          santa.onended=()=>{
            startStatic(.028);
            tailTimer=setTimeout(()=>{stopStatic();finish();},220);
          };
          santa.onerror=()=>finish();
          fallback=setTimeout(finish,14000);
        }catch{finish();}
      };
      // Give the carrier/static its own beat, then leave a clean gap before
      // Santa begins so the opening Ho Ho Ho is never masked by the noise.
      introStatic=setTimeout(()=>{stopStatic();},430);
      santaDelay=setTimeout(playSanta,900);
      santaTransmissionCleanup=()=>{
        clearTimeout(introStatic);clearTimeout(santaDelay);clearTimeout(fallback);clearTimeout(tailTimer);stopDuck();
        if(santaCommsEl){santaCommsEl.onended=null;santaCommsEl.onerror=null;try{santaCommsEl.pause();santaCommsEl.currentTime=0;}catch{}}
        if(radioWasOn&&elfAudioEl)elfAudioEl.volume=previousRadioVolume;
        stopStatic();
      };
      cleanupMission=()=>stopSantaTransmission(true);
    }
    nodes.forEach((node,i)=>node.onclick=()=>{
      if(i!==stage||locked||finishing)return;
      // The moving pulse intersects the fixed capture ring around 67% of the cycle.
      const hit=phase>=.53&&phase<=.80;
      if(!hit){
        node.classList.add('miss');stateEl.textContent='Signal missed · retry current relay.';haptic([16,28,16]);playRelayFx(relayFxMiss,.82);
        setTimeout(()=>node.classList.remove('miss'),280);start=performance.now();return;
      }
      locked=true;node.classList.remove('active');node.classList.add('locked');
      hops[stage]?.classList.remove('active');
      hops[stage]?.classList.add('locked');
      carrierPackets.forEach(packet=>packet.style.opacity='0');
      if(progressCount)progressCount.textContent=`${stage+1} / 4`;
      progressBars.forEach((bar,i)=>bar.classList.toggle('on',i<=stage));
      if(stage===3){
        progressHead?.classList.add('is-complete');
        progressBars.forEach(bar=>bar.classList.add('complete'));
      }
      stateEl.textContent=stage===3?'Transmission path locked.':'Relay locked · signal strengthened.';
      playRelayFx(stage===3?relayFxFull:relayFxShort,stage===3?.95:.9);haptic([20,25,38]);
      if(stage===3){
        hops.forEach(h=>h.classList.add('locked'));
        const dest=document.querySelector('.relay-destination');dest?.classList.add('locked');
        const receiverIcon=dest?.querySelector('.relay-receiver-icon img');
        if(receiverIcon) receiverIcon.src='./assets/relay-receiver-hi-spec-green.svg';
        // Prime the Santa media element inside the final user gesture, but at
        // zero volume. This preserves reliable mobile playback while the
        // visible carrier/static intro and clean pause happen afterwards.
        if(state.audio){
          try{
            santa.currentTime=0;santa.volume=0;
            const prime=santa.play();
            if(prime&&typeof prime.then==='function') prime.then(()=>{try{santa.pause();santa.currentTime=0;santa.volume=1;}catch{}}).catch(()=>{});
          }catch{}
        }
        setTimeout(()=>showIncomingTransmission(),2350);
      }else setTimeout(()=>arm(stage+1),460);
    });
    cleanupMission=()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',onRelayResize);stopRelayFx();stopSantaTransmission(true);};
    hops[0]?.classList.add('active');
    requestAnimationFrame(alignRelayRoute);
    raf=requestAnimationFrame(draw);
  }

  function bindPower(){
    const arcade=document.getElementById('powerArcade');
    const road=document.getElementById('powerRoad');
    const car=document.getElementById('powerCar');
    const button=document.getElementById('powerAccelerator');
    const speedEl=document.getElementById('powerSpeed');
    const outputEl=document.getElementById('powerOutput');
    const runState=document.getElementById('powerRunState');
    const speedValue= speedEl?.closest('strong') || speedEl;
    const stateEl=document.getElementById('powerState');
    const maxFill=document.getElementById('powerMaxFill');
    const maxState=document.getElementById('powerMaxState');
    const burst=document.getElementById('powerBurst');
    const rev=[...document.querySelectorAll('#powerRev i')];
    const speedLines=[...document.querySelectorAll('.power-speed-lines i')];
    const topSpeed=214;
    const sustainRequired=1150;
    const idleAudio=new Audio('./assets/car-engine-loop.wav');
    idleAudio.preload='auto';
    idleAudio.loop=true;
    idleAudio.volume=0;
    const powerAudio=new Audio('./assets/power-acceleration.mp3');
    powerAudio.preload='auto';
    powerAudio.volume=0;
    const powerWinAudio=new Audio('./assets/power-win.mp3');
    powerWinAudio.preload='auto';
    powerWinAudio.volume=.92;
    const audioFadeMap=new WeakMap();
    let speed=0,holding=false,sustain=0,last=performance.now(),roadPhase=0,grassPhase=0,raf=0,finished=false;
    let thresholdStep=0;
    let runStarted=false, elapsed=0;

    function cancelAudioFade(media){
      const rafId=audioFadeMap.get(media);
      if(rafId) cancelAnimationFrame(rafId);
      audioFadeMap.delete(media);
    }
    function fadeAudio(media,target,duration=220,onDone){
      cancelAudioFade(media);
      const from=Number.isFinite(media.volume)?media.volume:0;
      const start=performance.now();
      const step=now=>{
        const p=Math.min(1,(now-start)/duration);
        media.volume=Math.max(0,Math.min(1,from+(target-from)*p));
        if(p<1) audioFadeMap.set(media,requestAnimationFrame(step));
        else{ audioFadeMap.delete(media); onDone?.(); }
      };
      audioFadeMap.set(media,requestAnimationFrame(step));
    }
    function fadePowerAudio(target,duration=220,onDone){
      fadeAudio(powerAudio,target,duration,onDone);
    }
    function startIdleAudio(level=.24){
      if(!state.audio)return;
      cancelAudioFade(idleAudio);
      if(idleAudio.paused){
        idleAudio.volume=0;
        try{
          const play=idleAudio.play();
          if(play&&typeof play.then==='function') play.then(()=>fadeAudio(idleAudio,level,220)).catch(()=>{});
          else fadeAudio(idleAudio,level,220);
        }catch{}
      }else fadeAudio(idleAudio,level,220);
    }
    function pauseIdleAudio(){
      if(!state.audio||idleAudio.paused)return;
      cancelAudioFade(idleAudio);
      fadeAudio(idleAudio,0,200,()=>{try{idleAudio.pause();}catch{}});
    }
    function stopIdleAudio(reset=false){
      cancelAudioFade(idleAudio);
      try{idleAudio.pause();idleAudio.volume=0;if(reset)idleAudio.currentTime=0;}catch{}
    }
    function startPowerAudio(){
      if(!state.audio)return;
      cancelAudioFade(powerAudio);
      // Resume from the exact point reached on the previous acceleration hold.
      // Do not rewind when the player lifts and presses again.
      if(powerAudio.paused){
        powerAudio.volume=0;
        try{
          const play=powerAudio.play();
          if(play&&typeof play.then==='function') play.then(()=>fadePowerAudio(.82,180)).catch(()=>{});
          else fadePowerAudio(.82,180);
        }catch{}
      }else fadePowerAudio(.82,180);
    }
    function pausePowerAudio(){
      if(!state.audio||powerAudio.paused)return;
      // Fade the engine away, then pause without changing currentTime so the
      // next acceleration continues naturally from where the sound left off.
      fadePowerAudio(0,240,()=>{try{powerAudio.pause();}catch{}});
    }
    function stopPowerAudio(reset=false){
      cancelAudioFade(powerAudio);
      try{powerAudio.pause();powerAudio.volume=0;if(reset)powerAudio.currentTime=0;}catch{}
    }

    function setHolding(next){
      if(finished)return;
      holding=next;
      if(next) runStarted = true;
      button.classList.toggle('pressed',holding);
      if(holding){
        pauseIdleAudio();
        startPowerAudio();
        stateEl.textContent=speed>190?'Maintain maximum velocity':'Building raceway speed…';
      }else{
        pausePowerAudio();
        startIdleAudio(speed>1?.24:.2);
        stateEl.textContent=speed>1?'Press again to build speed':'Accelerate';
      }
    }

    function accelerationRate(v){
      if(v<72)return 62;
      if(v<155)return 47;
      return 32;
    }

    function formatRunTime(ms){
      const elapsedMs=Math.max(0,ms);
      if(elapsedMs>=60000)return '--:--';
      const seconds=Math.floor(elapsedMs/1000);
      const centiseconds=Math.floor(elapsedMs/10)%100;
      return String(seconds).padStart(2,'0')+':'+String(centiseconds).padStart(2,'0');
    }

    function updateRoad(dt,norm,now){
      // Scroll the road and grass textures together so they share one ground plane
      // and meet the sky on exactly the same horizon line.
      const travel=(dt*.00205)*speed;
      // Keep the perspective planes geometrically fixed. Speed is communicated by
      // texture travel, speed lines and car motion instead of scaling the 3D planes,
      // which prevents iOS Safari from clipping/flickering them at high velocity.
      roadPhase=(roadPhase+travel)%470;
      grassPhase=(grassPhase+travel*.72)%270;
      road.style.setProperty('--road-scroll',`${roadPhase.toFixed(2)}px`);
      road.style.setProperty('--grass-scroll',`${grassPhase.toFixed(2)}px`);
      const jitter=Math.sin(now*.026)*(norm*1.35)+Math.sin(now*.051)*(norm*.45);
      car.style.transform=`translateX(-50%) translateX(${jitter.toFixed(2)}px) translateY(${(norm*-1.8).toFixed(2)}px) scale(${(1+norm*.025).toFixed(3)})`;
      speedLines.forEach((line,i)=>{
        const alpha=Math.max(0,(norm-.55)*1.8)*(.25+((i%4)/5));
        line.style.opacity=String(Math.min(.72,alpha));
        line.style.transform=`translateY(${(((now*.085*Math.max(.2,norm))+i*19)%150).toFixed(1)}px) scaleY(${(1+norm*.9).toFixed(2)})`;
      });
    }

    function renderPower(norm){
      speedEl.textContent=String(Math.round(speed));
      const output=Math.min(100,Math.round(Math.pow(norm,.82)*100));
      outputEl.textContent=output+'%';
      arcade.style.setProperty('--power-level',norm.toFixed(3));
      road.style.setProperty('--power-level',norm.toFixed(3));
      const active=Math.round(norm*rev.length);
      rev.forEach((seg,i)=>{
        seg.classList.toggle('active',i<active);
        seg.classList.toggle('hot',i<active&&i>=8);
      });
      const nextThreshold=Math.min(4,Math.floor(norm*4));
      if(nextThreshold>thresholdStep){
        thresholdStep=nextThreshold;
        haptic(thresholdStep===4?[22,18,35]:14);
        ping(280+thresholdStep*105,.045,.018);
      }else if(nextThreshold<thresholdStep){thresholdStep=nextThreshold;}
    }

    function finishRun(){
      if(finished)return;
      finished=true;holding=false;speed=topSpeed;sustain=sustainRequired;
      renderPower(1);
      runState.textContent=formatRunTime(elapsed);
      outputEl.textContent='100%';
      maxFill.style.width='100%';
      maxState.textContent='LOCKED';
      maxState.classList.remove('is-capturing');
      maxState.classList.add('is-locked');
      stateEl.textContent='Maximum raceway speed confirmed';
      button.textContent='LOCKED';
      button.classList.add('is-locked');
      button.disabled=true;
      arcade.classList.add('captured');
      outputEl.classList.add('is-complete');
      car.classList.add('captured');
      burst.classList.add('active');
      ping(980,.16,.055);haptic([34,24,65]);
      if(state.audio){
        pauseIdleAudio();
        // Start the 8-bit win sting on the same frame the engine begins fading,
        // giving the two sounds a short intentional overlap at max power.
        try{
          powerWinAudio.currentTime=0;
          const win=powerWinAudio.play();
          if(win&&typeof win.catch==='function')win.catch(()=>{});
        }catch{}
        if(!powerAudio.paused)fadePowerAudio(0,520,()=>{try{powerAudio.pause();}catch{}});
      }
      cancelAnimationFrame(raf);
      setTimeout(()=>showCompletion('Raceway Run Complete','Santa-1’s propulsion system has been tested and is ready for flight.'),1100);
    }

    function frame(now){
      const dt=Math.min(40,now-last);last=now;
      if(runStarted && !finished){
        elapsed += dt;
        runState.textContent = formatRunTime(elapsed);
      }
      if(holding){speed=Math.min(topSpeed,speed+accelerationRate(speed)*(dt/1000));}
      else{speed=Math.max(0,speed-38*(dt/1000));}
      const norm=Math.max(0,Math.min(1,speed/topSpeed));
      if(speed>=topSpeed-.75&&holding){
        sustain=Math.min(sustainRequired,sustain+dt);
        maxState.textContent='CAPTURING';
        maxState.classList.add('is-capturing');
        maxState.classList.remove('is-locked');
        stateEl.textContent='Maintain maximum velocity to confirm the run';
      }else{
        sustain=Math.max(0,sustain-dt*1.7);
        maxState.textContent='STANDBY';
        maxState.classList.remove('is-capturing','is-locked');
      }
      maxFill.style.width=(sustain/sustainRequired*100).toFixed(1)+'%';
      renderPower(norm);updateRoad(dt,norm,now);
      if(sustain>=sustainRequired){finishRun();return;}
      raf=requestAnimationFrame(frame);
    }

    const press=e=>{if(e){e.preventDefault();try{button.setPointerCapture?.(e.pointerId);}catch{}}setHolding(true);};
    const release=e=>{if(e)e.preventDefault();setHolding(false);};
    button.addEventListener('pointerdown',press);
    button.addEventListener('pointerup',release);
    button.addEventListener('pointercancel',release);
    // iOS Safari can treat a sustained press as text selection / callout even on
    // controls. Suppress those browser gestures without changing the game input.
    button.addEventListener('contextmenu',e=>e.preventDefault());
    button.addEventListener('selectstart',e=>e.preventDefault());
    button.addEventListener('dragstart',e=>e.preventDefault());
    button.addEventListener('lostpointercapture',()=>setHolding(false));
    button.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();setHolding(true);}});
    button.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();setHolding(false);}});
    cleanupMission=()=>{
      cancelAnimationFrame(raf);
      stopIdleAudio(false);
      stopPowerAudio(false);
      try{powerWinAudio.pause();powerWinAudio.currentTime=0;}catch{}
    };
    raf=requestAnimationFrame(frame);
  }
  function bindSpirit(){
    const rig=document.getElementById('spiritRig');
    const stageNumber=document.getElementById('spiritStageNumber');
    const stageDots=[...document.querySelectorAll('[data-spirit-stage-dot]')];
    const tanks=[...document.querySelectorAll('[data-spirit-tank]')];
    const buttons=[...document.querySelectorAll('[data-spirit-charge]')];
    const meterMap={
      left:document.querySelector('.spirit-meter-left'),
      right:document.querySelector('.spirit-meter-right')
    };
    if(!rig||!stageNumber||stageDots.length!==8||tanks.length!==8||buttons.length!==8) return;

    const tapsPerTank=4;
    const tankHits=new Map(tanks.map(tank=>[tank.dataset.spiritTank,0]));
    let completedTanks=0;
    let completed=false;
    let finishTimer=0;
    const reactionTimers=[];
    const payoffAudio=new Audio('./assets/spirit-tank-fully-charged.wav');
    payoffAudio.preload='auto';
    payoffAudio.volume=.72;
    const bubblesAudio=new Audio('./assets/spirit-depot-bubbles-loop.wav');
    bubblesAudio.preload='auto';
    bubblesAudio.loop=true;
    bubblesAudio.volume=.42;

    function playTankPayoff(){
      if(!state.audio)return;
      try{
        payoffAudio.currentTime=0;
        const play=payoffAudio.play();
        if(play&&typeof play.catch==='function')play.catch(()=>{});
      }catch{}
    }

    function startBubbles(){
      if(!state.audio||completed||!bubblesAudio.paused)return;
      try{
        const play=bubblesAudio.play();
        if(play&&typeof play.catch==='function')play.catch(()=>{});
      }catch{}
    }

    function stopBubbles(){
      try{bubblesAudio.pause();bubblesAudio.currentTime=0;}catch{}
    }

    function tankFor(id){return tanks.find(tank=>tank.dataset.spiritTank===id);}

    function updateMeters(){
      ['left','right'].forEach(side=>{
        const sideTanks=tanks.filter(tank=>tank.dataset.spiritTank.startsWith(`${side}-`));
        const total=sideTanks.reduce((sum,tank)=>sum+(tankHits.get(tank.dataset.spiritTank)||0),0);
        const level=Math.max(0,Math.min(1,total/(sideTanks.length*tapsPerTank)));
        meterMap[side]?.style.setProperty('--meter-level',String(level));
      });
    }

    function renderTank(tank){
      const id=tank.dataset.spiritTank;
      const hits=tankHits.get(id)||0;
      const fill=Math.max(0,Math.min(1,hits/tapsPerTank));
      tank.style.setProperty('--tank-fill',String(fill));
      tank.classList.toggle('is-active',hits>0&&hits<tapsPerTank);
      tank.classList.toggle('is-full',hits>=tapsPerTank);
      const button=tank.querySelector('[data-spirit-charge]');
      if(button){
        const isFull=hits>=tapsPerTank;
        button.disabled=false;
        button.setAttribute('aria-disabled',String(completed||isFull));
        button.classList.toggle('is-charging',!completed&&!isFull);
        button.classList.toggle('is-full',isFull);
      }
    }

    function updateStage(){
      rig.dataset.stage=String(completedTanks);
      stageNumber.textContent=String(completedTanks);
    }

    function registerTankComplete(tank){
      completedTanks++;
      const dot=stageDots[completedTanks-1];
      if(dot){
        const rgb=tank.dataset.spiritRgb||'76,219,255';
        const hex=tank.dataset.spiritHex||'#4cdbff';
        dot.style.setProperty('--tank-rgb',rgb);
        dot.style.setProperty('--tank-color',hex);
        dot.dataset.spiritProgressColor=tank.dataset.spiritColor||'';
        dot.classList.add('complete','on');
      }
      tank.classList.remove('is-locking');
      void tank.offsetWidth;
      tank.classList.add('is-locking');
      const timer=setTimeout(()=>tank.classList.remove('is-locking'),900);
      reactionTimers.push(timer);
      playTankPayoff();
      haptic([24,18,42]);
      updateStage();
    }

    function pulseTank(tank,button){
      [tank,button].forEach(el=>{
        if(!el)return;
        el.classList.remove('is-pumping');
        void el.offsetWidth;
        el.classList.add('is-pumping');
        const timer=setTimeout(()=>el.classList.remove('is-pumping'),220);
        reactionTimers.push(timer);
      });
    }

    function completeSpirit(){
      if(completed)return;
      completed=true;
      stopBubbles();
      rig.classList.add('is-complete');
      stageNumber.textContent='8';
      buttons.forEach(button=>{button.disabled=false;button.setAttribute('aria-disabled','true');button.classList.remove('is-charging');});
      haptic([30,28,64]);
      finishTimer=setTimeout(()=>{
        if(state.missionOpen==='spirit')showCompletion('Spirit Core Charged','The positive energy signatures have been safely stored and the Spirit Core is now fully charged.');
      },950);
    }

    function onCharge(event){
      event?.preventDefault?.();
      event?.stopPropagation?.();
      if(completed)return;
      const button=event.currentTarget;
      const id=button.dataset.spiritCharge;
      const tank=tankFor(id);
      if(!tank)return;
      const hits=tankHits.get(id)||0;
      if(hits>=tapsPerTank)return;

      startBubbles();
      const nextHits=hits+1;
      tankHits.set(id,nextHits);
      renderTank(tank);
      updateMeters();
      pulseTank(tank,button);
      haptic(10);

      if(nextHits===tapsPerTank){
        registerTankComplete(tank);
        if(completedTanks>=8)completeSpirit();
      }
    }

    function onChargeKey(event){
      if(event.key!=='Enter'&&event.key!==' ')return;
      event.preventDefault();
      onCharge(event);
    }
    const blockTankGesture=event=>{event.preventDefault();event.stopPropagation();};
    buttons.forEach(button=>{
      button.addEventListener('touchstart',blockTankGesture,{passive:false});
      button.addEventListener('pointerdown',blockTankGesture,{passive:false});
      button.addEventListener('pointerup',onCharge,{passive:false});
      button.addEventListener('touchend',blockTankGesture,{passive:false});
      button.addEventListener('dblclick',blockTankGesture,{passive:false});
      button.addEventListener('keydown',onChargeKey);
    });
    tanks.forEach(renderTank);
    updateMeters();
    updateStage();

    cleanupMission=()=>{
      clearTimeout(finishTimer);
      reactionTimers.forEach(clearTimeout);
      buttons.forEach(button=>{
        button.removeEventListener('touchstart',blockTankGesture);
        button.removeEventListener('pointerdown',blockTankGesture);
        button.removeEventListener('pointerup',onCharge);
        button.removeEventListener('touchend',blockTankGesture);
        button.removeEventListener('dblclick',blockTankGesture);
        button.removeEventListener('keydown',onChargeKey);
      });
      stopBubbles();
      try{payoffAudio.pause();payoffAudio.currentTime=0;}catch{}
    };
  }
  function bindArtifacts(){
    const field=document.getElementById('artifactField');
    const layer=document.getElementById('artifactLayer');
    const burstLayer=document.getElementById('artifactBurstLayer');
    const beam=document.getElementById('starstreamBeam');
    const progress=document.getElementById('artifactProgress');
    const stateEl=document.getElementById('artifactState');
    const canvas=document.getElementById('starstreamCanvas');
    const panel=field?.closest('.artifact-panel');
    const steps=[...document.querySelectorAll('[data-artifact-step]')];
    if(!field||!layer||!burstLayer||!beam||!progress||!stateEl||!canvas) return;

    const ENERGY_SIGNATURES=[
      {id:'green',name:'Green',rgb:'92,245,96'},
      {id:'pink',name:'Pink',rgb:'255,110,186'},
      {id:'purple',name:'Purple',rgb:'198,92,255'},
      {id:'yellow',name:'Yellow',rgb:'255,224,84'},
      {id:'blue',name:'Blue',rgb:'76,219,255'},
      {id:'red',name:'Red',rgb:'255,92,116'},
      {id:'orange',name:'Orange',rgb:'255,122,28'},
      {id:'white',name:'White',rgb:'247,250,255'}
    ];

    let cleared=0;
    let finished=false;
    let raf=0;
    let resizeObserver=null;
    let timers=[];
    let signatureBag=[];
    let liveItems=new Set();
    let capturedSignatures=[];
    const energyHitAudio=[
      './assets/power-pulse-energy-hit-1.mp3',
      './assets/power-pulse-energy-hit-2.mp3',
      './assets/power-pulse-energy-hit-3.mp3'
    ].map(src=>{
      const audio=new Audio(src);
      audio.preload='auto';
      audio.volume=.9;
      return audio;
    });
    const energyBoostAudio=new Audio('./assets/power-pulse-energy-boost.wav');
    energyBoostAudio.preload='auto';
    energyBoostAudio.volume=.92;
    let energyHitIndex=0;

    function playEnergyHit(){
      if(!state.audio)return;
      const audio=energyHitAudio[energyHitIndex++%energyHitAudio.length];
      try{
        audio.pause();
        audio.currentTime=0;
        audio.volume=.9;
        const play=audio.play();
        if(play&&typeof play.catch==='function')play.catch(()=>{});
      }catch{}
    }
    function playEnergyBoost(){
      if(!state.audio)return;
      try{
        energyBoostAudio.pause();
        energyBoostAudio.currentTime=0;
        energyBoostAudio.volume=.92;
        const play=energyBoostAudio.play();
        if(play&&typeof play.catch==='function')play.catch(()=>{});
      }catch{}
    }

    function clearTimers(){timers.forEach(clearTimeout);timers=[];}
    function later(fn,delay){const t=setTimeout(()=>{timers=timers.filter(id=>id!==t);fn();},delay);timers.push(t);return t;}
    function rand(min,max){return min+Math.random()*(max-min);}
    function intensity(){return cleared<3?1:cleared<7?2:3;}
    function stageConfig(){
      if(cleared<3) return {maxConcurrent:1,spawnMin:520,spawnMax:700,lifetimeMin:900,lifetimeMax:1100,armDelay:120};
      if(cleared<7) return {maxConcurrent:2,spawnMin:340,spawnMax:520,lifetimeMin:650,lifetimeMax:830,armDelay:105};
      return {maxConcurrent:3,spawnMin:230,spawnMax:380,lifetimeMin:460,lifetimeMax:620,armDelay:95};
    }
    function refillSignatureBag(){
      signatureBag=[...ENERGY_SIGNATURES];
      for(let i=signatureBag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[signatureBag[i],signatureBag[j]]=[signatureBag[j],signatureBag[i]];}
    }
    function nextSignature(){if(!signatureBag.length)refillSignatureBag();return signatureBag.pop();}
    function randomPos(){
      let best={x:18+Math.random()*64,y:18+Math.random()*62,score:-1};
      for(let attempt=0;attempt<18;attempt++){
        const candidate={x:18+Math.random()*64,y:18+Math.random()*62};
        let nearest=999;
        for(const item of liveItems){
          const dx=candidate.x-item.x;
          const dy=candidate.y-item.y;
          const d=Math.sqrt(dx*dx+dy*dy);
          nearest=Math.min(nearest,d);
        }
        if(!liveItems.size) return candidate;
        if(nearest>best.score) best={...candidate,score:nearest};
        if(nearest>=24) return candidate;
      }
      return {x:best.x,y:best.y};
    }

    function setIntensity(){
      const level=intensity();
      field.dataset.intensity=String(level);
      panel?.classList.toggle('is-live',cleared>0);
      panel?.classList.toggle('is-intense',cleared>=7);
    }

    function renderStability(){
      progress.textContent=`${cleared} / 10`;
      steps.forEach((step,i)=>{
        const isOn=i<cleared;
        const rgb=capturedSignatures[i]||'98,239,157';
        step.classList.toggle('on',isOn);
        step.style.setProperty('--artifact-rgb',rgb);
      });
      setIntensity();
    }

    function startStarstream(){
      const ctx=canvas.getContext('2d',{alpha:true});
      if(!ctx) return;
      const stars=[];
      const STAR_COUNT=150;
      let width=0,height=0,dpr=1,last=performance.now();

      function seed(star,far=false){
        let x=0,y=0;
        do{x=(Math.random()*2-1)*1.22;y=(Math.random()*2-1)*.92;}while(Math.abs(x)<.035&&Math.abs(y)<.035);
        star.x=x;
        star.y=y;
        star.z=far?.96+Math.random()*.24:.08+Math.random()*1.08;
        star.blue=Math.random();
        star.weight=.55+Math.random()*1.35;
      }
      for(let i=0;i<STAR_COUNT;i++){const star={};seed(star,false);stars.push(star);}

      function resize(){
        const rect=field.getBoundingClientRect();
        dpr=Math.min(2,window.devicePixelRatio||1);
        width=Math.max(1,Math.round(rect.width));
        height=Math.max(1,Math.round(rect.height));
        canvas.width=Math.round(width*dpr);
        canvas.height=Math.round(height*dpr);
        canvas.style.width=width+'px';
        canvas.style.height=height+'px';
        ctx.setTransform(dpr,0,0,dpr,0,0);
      }
      resize();
      if(window.ResizeObserver){resizeObserver=new ResizeObserver(resize);resizeObserver.observe(field);}else window.addEventListener('resize',resize);

      function frame(now){
        if(finished&&field.classList.contains('stabilised')===false) return;
        const dt=Math.min(.038,Math.max(.001,(now-last)/1000));
        last=now;
        ctx.clearRect(0,0,width,height);

        const level=Number(field.dataset.intensity)||1;
        const stable=field.classList.contains('stabilised');
        const speed=stable?.10:(level===1?.30:level===2?.43:.58);
        const focal=Math.min(width,height)*.58;
        const cx=width*.49,cy=height*.50;

        for(const star of stars){
          const previousZ=star.z;
          star.z-=speed*dt;
          if(star.z<.055){seed(star,true);continue;}

          const sx=cx+(star.x/star.z)*focal;
          const sy=cy+(star.y/star.z)*focal;
          const prevZ=previousZ+speed*dt*(level===3?3.1:2.45);
          const px=cx+(star.x/prevZ)*focal;
          const py=cy+(star.y/prevZ)*focal;
          if(sx<-80||sx>width+80||sy<-80||sy>height+80){seed(star,true);continue;}

          const proximity=Math.max(0,Math.min(1,1-star.z));
          const alpha=Math.min(.95,.16+proximity*.92);
          const blue=190+Math.round(star.blue*55);
          ctx.beginPath();
          ctx.moveTo(px,py);
          ctx.lineTo(sx,sy);
          ctx.lineWidth=Math.max(.55,star.weight*(.55+proximity*1.25));
          ctx.lineCap='round';
          ctx.strokeStyle=`rgba(${star.blue>.76?190:105},${blue},255,${alpha})`;
          ctx.stroke();

          if(proximity>.66){
            ctx.beginPath();
            ctx.arc(sx,sy,Math.max(.45,star.weight*.62),0,Math.PI*2);
            ctx.fillStyle=`rgba(224,249,255,${Math.min(.9,alpha)})`;
            ctx.fill();
          }
        }
        raf=requestAnimationFrame(frame);
      }
      raf=requestAnimationFrame(frame);
    }

    function removeSignature(item,className='popped',delay=220){
      if(!item||item.locked) return;
      item.locked=true;
      liveItems.delete(item);
      item.el.classList.add(className);
      later(()=>item.el.remove(),delay);
    }

    function signatureCentre(item){
      const fr=field.getBoundingClientRect(),r=item.el.getBoundingClientRect();
      return {x:r.left-fr.left+r.width/2,y:r.top-fr.top+r.height/2};
    }

    function spawnBurst(x,y,rgb){
      const flare=document.createElement('span');
      flare.className='artifact-flare is-emotion';
      flare.style.left=x+'px';flare.style.top=y+'px';
      flare.style.setProperty('--emotion-rgb',rgb);
      burstLayer.appendChild(flare);
      later(()=>flare.remove(),340);

      const streakCount=cleared>=7?12:9;
      for(let i=0;i<streakCount;i++){
        const streak=document.createElement('i');
        streak.className='artifact-streak is-emotion';
        const angle=(Math.PI*2/streakCount)*i+(Math.random()*.18-.09);
        const distance=(cleared>=7?86:68)+(Math.random()*16);
        streak.style.left=x+'px';streak.style.top=y+'px';
        streak.style.setProperty('--emotion-rgb',rgb);
        streak.style.setProperty('--dx',`${Math.cos(angle)*distance}px`);
        streak.style.setProperty('--dy',`${Math.sin(angle)*distance}px`);
        streak.style.setProperty('--rot',`${(angle*180/Math.PI).toFixed(1)}deg`);
        burstLayer.appendChild(streak);
        later(()=>streak.remove(),340);
      }

      const count=cleared>=7?14:10;
      for(let i=0;i<count;i++){
        const p=document.createElement('i');
        p.className='artifact-particle is-emotion';
        p.style.left=x+'px';p.style.top=y+'px';
        p.style.setProperty('--emotion-rgb',rgb);
        p.style.setProperty('--dx',`${(Math.random()-.5)*120}px`);
        p.style.setProperty('--dy',`${(Math.random()-.5)*120}px`);
        p.style.setProperty('--rot',`${Math.round((Math.random()-.5)*260)}deg`);
        burstLayer.appendChild(p);
        later(()=>p.remove(),420);
      }

      field.classList.remove('is-hit');
      void field.offsetWidth;
      field.classList.add('is-hit');
      later(()=>field.classList.remove('is-hit'),240);
    }

    function expireSignature(item){
      if(finished||!liveItems.has(item)||item.locked) return;
      removeSignature(item,'passed',180);
      if(stateEl) stateEl.textContent=cleared>=10?'Power stabilised':'';
    }

    function captureSignature(item){
      if(finished||!liveItems.has(item)||item.locked||!item.armed) return;
      const c=signatureCentre(item);
      spawnBurst(c.x,c.y,item.signature.rgb);
      removeSignature(item,'popped',210);
      cleared=Math.min(10,cleared+1);
      capturedSignatures[cleared-1]=item.signature.rgb;
      renderStability();
      playEnergyHit();
      haptic(18);
      if(stateEl) stateEl.textContent=cleared===10?'Power stabilised':'';
      if(cleared>=10){finish();return;}
      later(()=>{
        const cfg=stageConfig();
        if(!finished&&liveItems.size<cfg.maxConcurrent) createSignature();
      },60);
    }

    function createSignature(){
      if(finished) return;
      const cfg=stageConfig();
      if(liveItems.size>=cfg.maxConcurrent) return;
      const signature=nextSignature();
      const pos=randomPos();
      const el=document.createElement('button');
      el.type='button';
      el.className=`starstream-signature emotion-signature energy-${signature.id} is-entering`;
      el.style.left=pos.x+'%';
      el.style.top=pos.y+'%';
      el.style.setProperty('--emotion-rgb',signature.rgb);
      el.setAttribute('aria-label',`Capture ${signature.name.toLowerCase()} energy signature`);
      el.innerHTML=`
        <span class="signature-core power-pulse-energy-core" aria-hidden="true">
          <svg class="power-pulse-energy-icon" viewBox="66 0 66 126" focusable="false" aria-hidden="true">
            <path d="M83.34,125.93,98.42,75.57h-32L127.44,0,112.37,50.35h32ZM79,69.55H106.5L97.88,98.34l33.88-42H104.29l8.62-28.78Z"></path>
          </svg>
        </span>
        <span class="signature-scan" aria-hidden="true"></span>`;
      layer.appendChild(el);

      const item={el,signature,x:pos.x,y:pos.y,locked:false,armed:false};
      liveItems.add(item);

      later(()=>{
        if(finished||item.locked||!liveItems.has(item)) return;
        item.armed=true;
        el.classList.remove('is-entering');
      },cfg.armDelay);

      later(()=>expireSignature(item), rand(cfg.lifetimeMin,cfg.lifetimeMax));

      const tap=ev=>{
        ev.preventDefault();
        ev.stopPropagation();
        captureSignature(item);
      };
      if(window.PointerEvent) el.addEventListener('pointerdown',tap,{passive:false});
      el.addEventListener('click',tap,{passive:false});
    }

    function scheduleSpawn(){
      if(finished) return;
      const cfg=stageConfig();
      later(()=>{
        if(finished) return;
        if(liveItems.size<cfg.maxConcurrent) createSignature();
        scheduleSpawn();
      }, rand(cfg.spawnMin,cfg.spawnMax));
    }

    function finish(){
      finished=true;
      clearTimers();
      for(const item of liveItems){
        item.locked=true;
        item.el.classList.add('absorbed');
        setTimeout(()=>item.el.remove(),180);
      }
      liveItems.clear();
      panel?.classList.add('is-complete');
      field.classList.remove('is-hit');
      field.classList.add('stabilised');
      beam.classList.add('active');
      progress.textContent='10 / 10';
      haptic([28,24,58]);
      // Let the final capture hit land, then resolve into the dedicated Power Pulse boost.
      later(playEnergyBoost,140);
      setTimeout(()=>showCompletion('Power Stabilised','The positive energy signatures have been captured and stabilised, ready to be stored in the Spirit Core.'),900);
    }

    const blockFieldGesture=event=>{
      if(event.cancelable) event.preventDefault();
    };
    field.addEventListener('touchmove',blockFieldGesture,{passive:false});
    field.addEventListener('gesturestart',blockFieldGesture,{passive:false});

    renderStability();
    startStarstream();
    if(stateEl) stateEl.textContent='';
    createSignature();
    scheduleSpawn();

    cleanupMission=()=>{
      finished=true;
      clearTimers();
      if(raf)cancelAnimationFrame(raf);
      resizeObserver?.disconnect?.();
      for(const item of liveItems){item.el.remove();}
      liveItems.clear();
      [...energyHitAudio,energyBoostAudio].forEach(audio=>{try{audio.pause();audio.currentTime=0;}catch{}});
      field.removeEventListener('touchmove',blockFieldGesture);
      field.removeEventListener('gesturestart',blockFieldGesture);
    };
  }
  function bindComet(){
    const dirClass={L:'left',D:'down',U:'up',R:'right'};
    const keys=['L','D','U','R'];
    const game=document.getElementById('cometGame');
    const panel=game?.closest('.comet-panel');
    const notesLayer=document.getElementById('cometNotes');
    const progress=document.getElementById('cometProgress');
    const stateEl=document.getElementById('cometState');
    const flash=document.getElementById('cometHitFlash');
    const judgement=document.getElementById('cometJudgement');
    const comboEl=document.getElementById('cometCombo');
    const instruction=document.getElementById('cometInstruction');
    const steps=[...document.querySelectorAll('[data-comet-step]')];
    if(!game||!notesLayer||!progress||!stateEl||!flash||!judgement||!comboEl) return;

    // Structural lane ownership: every direction gets its own fixed 25% lane
    // container. Notes are created inside their designated lane, so a LEFT
    // signal cannot ever render in DOWN/UP/RIGHT (and vice versa).
    notesLayer.innerHTML='';
    const laneHosts={};
    keys.forEach((key,index)=>{
      const host=document.createElement('div');
      host.className=`comet-note-lane comet-note-lane-${dirClass[key]}`;
      host.dataset.cometNoteLane=key;
      Object.assign(host.style,{
        position:'absolute',
        top:'0',
        bottom:'0',
        left:`${index*25}%`,
        width:'25%',
        pointerEvents:'none',
        overflow:'visible'
      });
      notesLayer.appendChild(host);
      laneHosts[key]=host;
    });

    const BPM=129.2;
    const BEAT=60/BPM;
    const BEAT_OFFSET=.62;
    const TRAVEL_BEATS=3.35;
    const TARGET_Y=.80;
    const PERFECT_WINDOW=.085;
    const GOOD_WINDOW=.21;
    const MISS_WINDOW=.31;

    let correct=0;
    let combo=0;
    let finished=false;
    let raf=0;
    let spawnTimer=0;
    let judgementTimer=0;
    let beatPulseTimer=0;
    let clockStart=performance.now();
    let lastBeat=-1;
    let lastLane='';
    let notes=[];
    let music=null;
    let completionSfx=null;
    // Capture whether ELF FM was genuinely playing before Comet Curve took
    // audio priority. Used as a second restore path after mission teardown.
    const cometRadioWasPlaying=beginMissionAudioRadioOverride('comet');
    let signalCount=0;
    let nextSpawnAt=BEAT_OFFSET;

    function clock(){ return Math.max(0,(performance.now()-clockStart)/1000); }
    function spawnGapBeats(){ return correct<3?1.5:correct<7?1.25:1; }
    function arrowMarkup(key){
      return `<span class="comet-arrow-icon comet-arrow-${dirClass[key]}" aria-hidden="true"><i></i><i></i></span><span class="comet-tail"></span>`;
    }
    function chooseLane(){
      const pool=keys.filter(k=>k!==lastLane);
      const lane=pool[Math.floor(Math.random()*pool.length)]||keys[Math.floor(Math.random()*keys.length)];
      lastLane=lane;
      return lane;
    }
    function startMusic(){
      if(!state.audio) return;
      beginMissionAudioRadioOverride('comet');
      try{
        music=new Audio('./assets/comet-curve-rhythm.mp3');
        music.preload='auto';
        music.volume=.66;
        music.loop=true;
        music.currentTime=0;
        const play=music.play();
        if(play&&typeof play.catch==='function') play.catch(()=>endMissionAudioRadioOverride('comet'));
      }catch{music=null;endMissionAudioRadioOverride('comet');}
    }
    function ensureMusic(){
      if(!state.audio||!music||!music.paused) return;
      music.play().catch(()=>{});
    }
    function stopMusic(){
      if(!music) return;
      try{
        music.loop=false;
        music.volume=0;
        music.pause();
        music.currentTime=0;
        music.removeAttribute('src');
        music.load();
      }catch{}
      music=null;
    }
    function playCompletionSound(){
      if(!state.audio){endMissionAudioRadioOverride('comet');return;}
      try{
        completionSfx=new Audio('./assets/comet-curve-complete.mp3');
        completionSfx.preload='auto';
        completionSfx.volume=.86;
        completionSfx.currentTime=0;
        let released=false;
        const releaseRadio=()=>{
          if(released)return;
          released=true;
          endMissionAudioRadioOverride('comet');
          // Some mobile browsers can leave a zero-volume stream suspended even
          // after the first restore request. Reassert the user's enabled radio
          // state after the completion sting without requiring a toggle cycle.
          if(cometRadioWasPlaying) setTimeout(()=>ensureElfRadioPlayback(1,520),180);
        };
        completionSfx.onended=releaseRadio;
        completionSfx.onerror=releaseRadio;
        const play=completionSfx.play();
        if(play&&typeof play.catch==='function') play.catch(releaseRadio);
      }catch{completionSfx=null;endMissionAudioRadioOverride('comet');}
    }
    function stopCompletionSound(){
      if(!completionSfx) return;
      try{completionSfx.pause();completionSfx.currentTime=0;}catch{}
      completionSfx=null;
    }
    function pulseBeat(){
      game.classList.remove('beat-pulse');
      void game.offsetWidth;
      game.classList.add('beat-pulse');
      clearTimeout(beatPulseTimer);
      beatPulseTimer=setTimeout(()=>game.classList.remove('beat-pulse'),105);
    }
    function showJudgement(text,type){
      clearTimeout(judgementTimer);
      judgement.textContent=text;
      judgement.className=`comet-judgement show ${type}`;
      judgementTimer=setTimeout(()=>{judgement.className='comet-judgement';},500);
    }
    function updateCombo(){
      comboEl.textContent=combo>=2?`COMBO ${String(combo).padStart(2,'0')}`:'';
      comboEl.classList.toggle('show',combo>=2);
    }
    function pulseLane(key,type){
      const lane=document.querySelector(`[data-comet-lane="${key}"]`);
      if(!lane) return;
      lane.classList.remove('hit','miss');
      void lane.offsetWidth;
      lane.classList.add(type);
      setTimeout(()=>lane.classList.remove(type),220);
    }
    function scheduleNextSpawn(){
      clearTimeout(spawnTimer);
      if(finished) return;
      const t=clock();
      if(nextSpawnAt<=t+.04) nextSpawnAt=t+.08;
      spawnTimer=setTimeout(()=>{
        if(finished) return;
        spawn(nextSpawnAt);
        nextSpawnAt+=spawnGapBeats()*BEAT;
        scheduleNextSpawn();
      },Math.max(0,(nextSpawnAt-t)*1000));
    }
    function spawn(spawnAt=clock()){
      if(finished) return;
      const laneKey=chooseLane();
      const targetTime=spawnAt+(TRAVEL_BEATS*BEAT);
      const el=document.createElement('div');
      el.className=`comet-note active ${dirClass[laneKey]}`;
      el.dataset.lane=laneKey;
      el.dataset.direction=laneKey;
      // Position only within the note's own lane container. The lane itself
      // owns the horizontal placement; the note is always centred at 50%.
      el.style.left='50%';
      el.style.top='5%';
      el.innerHTML=arrowMarkup(laneKey);
      laneHosts[laneKey].appendChild(el);
      notes.push({laneKey,dirKey:laneKey,el,spawnTime:spawnAt,targetTime,hit:false});
      signalCount++;
      if(signalCount===2&&instruction) instruction.classList.add('recede');
      if(!raf) raf=requestAnimationFrame(frame);
    }
    function removeNote(note,status='miss'){
      if(!note||!notes.includes(note)) return;
      note.hit=status==='hit';
      note.el.classList.remove('active');
      note.el.classList.add(status);
      setTimeout(()=>note.el.remove(),190);
      notes=notes.filter(n=>n!==note);
    }
    function triggerMissVisual(key){
      pulseLane(key,'miss');
      game.classList.remove('miss-shock');
      void game.offsetWidth;
      game.classList.add('miss-shock');
      setTimeout(()=>game.classList.remove('miss-shock'),260);
    }
    function registerMiss(key,message='SIGNAL MISSED',note=null){
      if(finished) return;
      triggerMissVisual(key);
      if(note) removeNote(note,'miss');
      combo=0;
      updateCombo();
      showJudgement('MISS','miss');
      stateEl.textContent=message;
      ping(180,.09,.025);
      haptic([18,20,28]);
    }
    function hitNote(note,error){
      if(finished||!note) return;
      const perfect=error<=PERFECT_WINDOW;
      pulseLane(note.laneKey,'hit');
      removeNote(note,'hit');
      flash.classList.remove('active');
      void flash.offsetWidth;
      flash.classList.add('active');
      setTimeout(()=>flash.classList.remove('active'),280);

      correct++;
      combo++;
      updateCombo();
      progress.textContent=`${correct} / 10`;
      steps[correct-1]?.classList.add('on');
      showJudgement(perfect?'PERFECT':'GOOD',perfect?'perfect':'good');
      ping(perfect?880:720,.055,perfect?.022:.016);
      haptic(perfect?[24,18,28]:20);
      stateEl.textContent=combo>=3?`SYNCED · COMBO ${combo}`:'SIGNAL LOCK';

      if(correct>=10){
        finished=true;
        cancelAnimationFrame(raf);raf=0;
        clearTimeout(spawnTimer);
        notes.forEach(n=>n.el.remove());notes=[];
        game.classList.add('complete');
        panel?.classList.add('is-complete');
        document.querySelectorAll('.comet-btn').forEach(b=>b.disabled=true);
        comboEl.classList.remove('show');
        judgement.textContent='LOCKED';
        judgement.className='comet-judgement show complete';
        stateEl.textContent='LOCKED';
        // Hard-stop the rhythm loop before starting the dedicated
        // completion payoff: the two audio sources must never overlap.
        stopMusic();
        playCompletionSound();
        haptic([30,22,60]);
        setTimeout(()=>showCompletion('Flight Controls Calibrated','Santa-1’s flight controls have been calibrated and are responding correctly.'),900);
      }
    }
    function frame(){
      if(finished){raf=0;return;}
      const t=clock();
      const beatIndex=Math.floor((t-BEAT_OFFSET)/BEAT);
      if(beatIndex>=0&&beatIndex!==lastBeat){lastBeat=beatIndex;pulseBeat();}

      notes.slice().forEach(note=>{
        let y=.05;
        if(t<=note.targetTime){
          const p=Math.max(0,Math.min(1,(t-note.spawnTime)/(note.targetTime-note.spawnTime)));
          y=.05+((TARGET_Y-.05)*p);
        }else{
          const p=Math.max(0,Math.min(1,(t-note.targetTime)/MISS_WINDOW));
          y=TARGET_Y+((.97-TARGET_Y)*p);
        }
        note.el.style.top=(y*100)+'%';
        if(t-note.targetTime>MISS_WINDOW){
          registerMiss(note.laneKey,'SIGNAL MISSED',note);
        }
      });
      raf=requestAnimationFrame(frame);
    }

    document.querySelectorAll('.comet-btn[data-arrow]').forEach(btn=>btn.onclick=()=>{
      if(finished) return;
      ensureMusic();
      const key=btn.dataset.arrow;
      const t=clock();
      const laneNotes=notes
        .filter(n=>n.laneKey===key)
        .map(n=>({note:n,error:Math.abs(t-n.targetTime),delta:t-n.targetTime}))
        .sort((a,b)=>a.error-b.error);
      const candidate=laneNotes[0];

      if(!candidate||candidate.error>MISS_WINDOW){
        const activeNear=notes.some(n=>Math.abs(t-n.targetTime)<=MISS_WINDOW);
        if(activeNear) registerMiss(key,'INPUT ERROR');
        else { stateEl.textContent='WAIT FOR THE LINE'; haptic(7); }
        return;
      }

      if(candidate.error>GOOD_WINDOW){
        registerMiss(key,'TIMING LOST',candidate.note);
        return;
      }
      hitNote(candidate.note,candidate.error);
    });

    cleanupMission=()=>{
      cancelAnimationFrame(raf);
      clearTimeout(spawnTimer);
      clearTimeout(judgementTimer);
      clearTimeout(beatPulseTimer);
      notes.forEach(n=>n.el.remove());
      notes=[];
      stopMusic();
      stopCompletionSound();
      endMissionAudioRadioOverride('comet');
      if(cometRadioWasPlaying) ensureElfRadioPlayback(1,520);
    };

    clockStart=performance.now();
    startMusic();
    nextSpawnAt=BEAT_OFFSET;
    scheduleNextSpawn();
    raf=requestAnimationFrame(frame);
  }
  function bindJingle(){
    const panel=document.getElementById('jinglePanel');
    const arena=document.getElementById('jingleArena');
    const puck=document.getElementById('jinglePuck');
    const trail=document.getElementById('jinglePuckTrail');
    const paddle=document.getElementById('jinglePaddle');
    const receiver=document.getElementById('jingleReceiver');
    const goalFlare=document.getElementById('jingleGoalFlare');
    const prompt=document.getElementById('jinglePrompt');
    const stateEl=document.getElementById('jingleState');
    const lockCount=document.getElementById('jingleLockCount');
    const countdownEl=document.getElementById('jingleCountdown');
    if(!panel||!arena||!puck||!trail||!paddle||!receiver||!stateEl) return;

    let beam=1;
    let running=false;
    let started=false;
    let dragging=false;
    let raf=0;
    let launchTimer=0;
    let finishTimer=0;
    let buzzerTimer=0;
    let countdownTimers=[];
    let last=performance.now();
    let lastStrikeAt=0;
    let lastPostAt=0;
    let bounds={w:0,h:0,paddleW:0,paddleH:0,paddleY:0,puckR:9,goalW:0,goalLeft:0,goalRight:0,apertureLeft:0,apertureRight:0,goalBottom:0};
    let paddleX=0;
    let puckX=0;
    let puckY=0;
    let vx=0;
    let vy=0;
    let previousPuck={x:0,y:0};
    const speeds=[0,0.245,0.285,0.325];
    const goalWidths=[null,'clamp(240px,78%,300px)','clamp(210px,68%,260px)','clamp(180px,58%,220px)'];

    const strikePool=Array.from({length:3},()=>{
      const a=new Audio('./assets/jingle-puck-strike.mp3');
      a.preload='auto';
      return a;
    });
    const postPool=Array.from({length:2},()=>{
      const a=new Audio('./assets/jingle-post-hit.mp3');
      a.preload='auto';
      return a;
    });
    const goalAudio=new Audio('./assets/jingle-goal.mp3');
    goalAudio.preload='auto';
    const buzzerAudio=new Audio('./assets/jingle-buzzer.mp3');
    buzzerAudio.preload='auto';
    const countdownAudio=new Audio('./assets/arena-game-countdown.mp3');
    countdownAudio.preload='auto';
    countdownAudio.volume=.86;
    let strikeIndex=0;
    let postIndex=0;

    function beamEl(n){return document.querySelector(`[data-jingle-beam="${n}"]`);}
    function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
    function playAudio(el,volume=1,rate=1){
      if(!state.audio||!el) return;
      try{
        el.pause();
        el.currentTime=0;
        el.volume=clamp(volume,0,1);
        el.playbackRate=rate;
        const play=el.play();
        if(play&&typeof play.catch==='function') play.catch(()=>{});
      }catch{}
    }
    function playStrike(volume=.62,rate=1){
      if(!state.audio) return;
      const now=performance.now();
      if(now-lastStrikeAt<70) return;
      lastStrikeAt=now;
      const el=strikePool[strikeIndex++%strikePool.length];
      playAudio(el,volume,rate);
    }
    function playPost(side){
      if(!state.audio) return;
      const now=performance.now();
      if(now-lastPostAt<90) return;
      lastPostAt=now;
      const el=postPool[postIndex++%postPool.length];
      playAudio(el,.64,side==='left'?.97:1.03);
    }
    function setPaddleX(x){
      const half=bounds.paddleW/2;
      paddleX=clamp(x,half+10,bounds.w-half-10);
      paddle.style.transform=`translate3d(${paddleX-half}px,0,0)`;
    }
    function setPuckPosition(){
      const r=bounds.puckR;
      puck.style.transform=`translate3d(${puckX-r}px,${puckY-r}px,0)`;
      const dx=puckX-previousPuck.x;
      const dy=puckY-previousPuck.y;
      const length=clamp(Math.hypot(dx,dy)*10,16,58);
      const angle=Math.atan2(dy,dx)*180/Math.PI;
      trail.style.width=`${length}px`;
      trail.style.transform=`translate3d(${puckX}px,${puckY}px,0) rotate(${angle+180}deg)`;
    }
    function updateBounds(preservePaddle=true){
      const rect=arena.getBoundingClientRect();
      bounds.w=rect.width;
      bounds.h=rect.height;
      bounds.paddleW=paddle.offsetWidth;
      bounds.paddleH=paddle.offsetHeight;
      bounds.paddleY=paddle.offsetTop;
      bounds.puckR=puck.offsetWidth/2;
      bounds.goalW=receiver.offsetWidth;
      bounds.goalLeft=parseFloat(receiver.style.left||'50')/100*bounds.w-bounds.goalW/2;
      bounds.goalRight=bounds.goalLeft+bounds.goalW;
      const apertureW=bounds.goalW*.5;
      const goalCenter=bounds.goalLeft+bounds.goalW/2;
      bounds.apertureLeft=goalCenter-apertureW/2;
      bounds.apertureRight=goalCenter+apertureW/2;
      bounds.goalBottom=receiver.offsetTop+receiver.offsetHeight;
      if(!preservePaddle||!paddleX) setPaddleX(bounds.w/2);
      else setPaddleX(paddleX);
    }
    function setReceiverForBeam(n){
      receiver.style.left='50%';
      receiver.style.width=goalWidths[n]||'';
      receiver.dataset.beam=String(n);
      requestAnimationFrame(()=>requestAnimationFrame(()=>updateBounds()));
    }
    function pulseRail(side){
      const rail=arena.querySelector(`.rail-${side}`);
      if(!rail) return;
      rail.classList.remove('is-hit');
      void rail.offsetWidth;
      rail.classList.add('is-hit');
      setTimeout(()=>rail.classList.remove('is-hit'),180);
    }
    function pulsePost(){
      receiver.classList.remove('is-post-hit');
      void receiver.offsetWidth;
      receiver.classList.add('is-post-hit');
      setTimeout(()=>receiver.classList.remove('is-post-hit'),170);
    }
    function resetPuckAtReceiver(){
      updateBounds();
      const rect=receiver.getBoundingClientRect();
      const arenaRect=arena.getBoundingClientRect();
      puckX=rect.left-arenaRect.left+rect.width/2;
      puckY=Math.max(bounds.goalBottom+28,62);
      previousPuck={x:puckX,y:puckY};
      setPuckPosition();
    }
    function launchPuck(fromReceiver=false,keepPosition=false){
      clearTimeout(launchTimer);
      updateBounds();
      if(fromReceiver) resetPuckAtReceiver();
      else if(!keepPosition){
        puckX=bounds.w/2;
        puckY=Math.min(bounds.h*.35,bounds.paddleY-90);
        previousPuck={x:puckX,y:puckY};
        setPuckPosition();
      }
      const speed=speeds[beam];
      const lateral=(beam===1?.28:(beam===2?.36:.43))*(Math.random()<.5?-1:1);
      vx=speed*lateral;
      vy=Math.sqrt(Math.max(.001,speed*speed-vx*vx));
      running=true;
      last=performance.now();
      stateEl.textContent=`Beam 0${beam} live`;
    }
    function scheduleLaunch(fromReceiver=false,delay=420){
      running=false;
      clearTimeout(launchTimer);
      launchTimer=setTimeout(()=>launchPuck(fromReceiver),delay);
    }
    function normaliseVelocity(speed){
      const mag=Math.hypot(vx,vy)||1;
      vx=vx/mag*speed;
      vy=vy/mag*speed;
    }
    function paddleHit(){
      const half=bounds.paddleW/2;
      const offset=clamp((puckX-paddleX)/half,-1,1);
      const speed=speeds[beam];
      vx=vx*.28+offset*speed*.84;
      vy=-Math.abs(vy||speed);
      normaliseVelocity(speed);
      puckY=bounds.paddleY-bounds.puckR-1;
      paddle.classList.remove('is-hit');
      void paddle.offsetWidth;
      paddle.classList.add('is-hit');
      setTimeout(()=>paddle.classList.remove('is-hit'),170);
      playStrike(.68,1+(Math.random()-.5)*.07);
      haptic(14);
    }
    function postHit(side){
      const speed=speeds[beam];
      puckY=bounds.goalBottom+bounds.puckR+1;
      vy=Math.abs(vy||speed);
      const lateral=Math.max(Math.abs(vx),speed*.22);
      vx=side==='left'?Math.abs(lateral):-Math.abs(lateral);
      normaliseVelocity(speed);
      pulsePost();
      playPost(side);
      haptic(10);
    }
    function missedPaddle(){
      running=false;
      stateEl.textContent=`Beam 0${beam} relaunching`;
      arena.classList.add('is-missed');
      haptic([14,24,14]);
      setTimeout(()=>arena.classList.remove('is-missed'),260);
      scheduleLaunch(true,520);
    }
    function markBeamCharged(n){
      const current=beamEl(n);
      current?.classList.remove('is-next');
      current?.classList.add('is-charged');
      current?.setAttribute('aria-label',`Guidance lock ${n} complete`);
      const next=beamEl(n+1);
      next?.classList.add('is-next');
      if(lockCount)lockCount.textContent=`${n} / 3`;
    }
    function finishGame(){
      running=false;
      panel.classList.add('is-complete');
      arena.classList.add('is-complete');
      stateEl.textContent='GUIDANCE LOCKED';
      clearTimeout(buzzerTimer);
      countdownTimers.forEach(clearTimeout);countdownTimers=[];
      buzzerTimer=setTimeout(()=>{
        playAudio(buzzerAudio,.78,1);
        haptic([30,28,70]);
      },780);
      finishTimer=setTimeout(()=>showCompletion('Guidance Locked','Santa-1’s guidance system is locked and ready for flight.'),2450);
    }
    function scoreGoal(){
      if(!running) return;
      running=false;
      const scoredBeam=beam;
      markBeamCharged(scoredBeam);
      stateEl.textContent=`BEAM 0${scoredBeam} CHARGED`;
      goalFlare.classList.remove('is-active');
      void goalFlare.offsetWidth;
      goalFlare.classList.add('is-active');
      receiver.classList.add('is-charged');
      puck.classList.add('is-absorbed');
      playAudio(goalAudio,.86,1);
      haptic([22,18,42]);
      setTimeout(()=>{
        goalFlare.classList.remove('is-active');
        if(scoredBeam<3){
          puck.classList.remove('is-absorbed');
          receiver.classList.remove('is-charged');
        }
      },520);
      if(scoredBeam===3){
        finishGame();
        return;
      }
      beam++;
      setTimeout(()=>{
        setReceiverForBeam(beam);
        stateEl.textContent=`Beam 0${beam} ready`;
        scheduleLaunch(true,380);
      },620);
    }
    function tick(now){
      const dt=Math.min(26,now-last);
      last=now;
      if(running){
        previousPuck={x:puckX,y:puckY};
        puckX+=vx*dt;
        puckY+=vy*dt;
        const r=bounds.puckR;
        const minX=r+4;
        const maxX=bounds.w-r-4;
        if(puckX<minX&&vx<0){
          const overrun=minX-puckX;
          puckX=minX+overrun;
          vx=Math.abs(vx);
          pulseRail('left');playStrike(.2,.93);
        }
        if(puckX>maxX&&vx>0){
          const overrun=puckX-maxX;
          puckX=maxX-overrun;
          vx=-Math.abs(vx);
          pulseRail('right');playStrike(.2,1.05);
        }

        if(vy<0&&puckY-r<=bounds.goalBottom){
          if(puckX>=bounds.apertureLeft&&puckX<=bounds.apertureRight){
            scoreGoal();
          }else if(puckX>=bounds.goalLeft&&puckX<=bounds.goalRight){
            postHit(puckX<((bounds.goalLeft+bounds.goalRight)/2)?'left':'right');
          }else if(puckY-r<=6){
            const minY=r+6;
            const overrun=minY-puckY;
            puckY=minY+Math.max(0,overrun);
            vy=Math.abs(vy);
            playStrike(.18,.97);
          }
        }

        if(running&&vy>0&&puckY+r>=bounds.paddleY&&previousPuck.y+r<bounds.paddleY+bounds.paddleH){
          const half=bounds.paddleW/2;
          if(puckX>=paddleX-half-r*.35&&puckX<=paddleX+half+r*.35) paddleHit();
        }
        if(running&&puckY-r>bounds.h) missedPaddle();
        setPuckPosition();
      }
      raf=requestAnimationFrame(tick);
    }
    function pointerToPaddle(e){
      const rect=arena.getBoundingClientRect();
      setPaddleX(e.clientX-rect.left);
    }
    function startCountdown(){
      if(started)return;
      started=true;
      running=false;
      prompt?.classList.add('is-hidden');
      arena.classList.remove('is-awaiting-start');
      arena.classList.add('is-counting');
      puck.classList.remove('is-ready');
      puck.classList.add('is-countdown');
      puck.setAttribute('aria-label','Jingle Beams countdown');
      trail.style.opacity='0';
      updateBounds(false);
      puckX=bounds.w/2;
      puckY=bounds.h/2;
      previousPuck={x:puckX,y:puckY};
      setPuckPosition();
      if(countdownEl)countdownEl.textContent='3';
      stateEl.textContent='Guidance start sequence';
      if(state.audio){
        try{
          countdownAudio.currentTime=0;
          const play=countdownAudio.play();
          if(play&&typeof play.catch==='function')play.catch(()=>{});
        }catch{}
      }
      countdownTimers.push(setTimeout(()=>{if(countdownEl)countdownEl.textContent='2';},1000));
      countdownTimers.push(setTimeout(()=>{if(countdownEl)countdownEl.textContent='1';},2000));
      countdownTimers.push(setTimeout(()=>{
        if(countdownEl)countdownEl.textContent='';
        puck.classList.remove('is-countdown');
        puck.setAttribute('aria-label','Jingle Beams puck');
        arena.classList.remove('is-counting');
        arena.classList.add('is-live');
        updateBounds(false);
        puckX=bounds.w/2;
        puckY=bounds.h/2;
        previousPuck={x:puckX,y:puckY};
        setPuckPosition();
        trail.style.opacity='';
        launchPuck(false,true);
      },3000));
    }
    function onPointerDown(e){
      dragging=true;
      try{arena.setPointerCapture?.(e.pointerId);}catch{}
      e.preventDefault();
      try{arena.focus({preventScroll:true});}catch{arena.focus();}
      pointerToPaddle(e);
    }
    function onPointerMove(e){
      if(!dragging) return;
      e.preventDefault();
      pointerToPaddle(e);
    }
    function onPointerUp(e){
      dragging=false;
      try{arena.releasePointerCapture?.(e.pointerId);}catch{}
    }
    function onKeyDown(e){
      if(!['ArrowLeft','ArrowRight','a','A','d','D'].includes(e.key)) return;
      e.preventDefault();
      updateBounds();
      setPaddleX(paddleX+(['ArrowLeft','a','A'].includes(e.key)?-28:28));
    }
    function onResize(){
      updateBounds();
      if(!running&&!panel.classList.contains('is-complete')&&!arena.classList.contains('is-counting')) resetPuckAtReceiver();
    }

    // Hold on a visible play control. The user's tap starts the 3-2-1 sequence
    // synchronously, keeping the attached countdown audio reliable on iOS.
    setReceiverForBeam(1);
    updateBounds(false);
    puckX=bounds.w/2;
    puckY=bounds.h/2;
    previousPuck={x:puckX,y:puckY};
    setPuckPosition();
    trail.style.opacity='0';
    const stopStartBubble=event=>event.stopPropagation();
    const startFromPuck=event=>{event.preventDefault();event.stopPropagation();startCountdown();};
    puck.addEventListener('pointerdown',stopStartBubble);
    puck.addEventListener('click',startFromPuck);
    arena.addEventListener('pointerdown',onPointerDown,{passive:false});
    arena.addEventListener('pointermove',onPointerMove,{passive:false});
    arena.addEventListener('pointerup',onPointerUp);
    arena.addEventListener('pointercancel',onPointerUp);
    arena.addEventListener('keydown',onKeyDown);
    window.addEventListener('resize',onResize);
    raf=requestAnimationFrame(tick);

    cleanupMission=()=>{
      cancelAnimationFrame(raf);
      clearTimeout(launchTimer);
      clearTimeout(finishTimer);
      clearTimeout(buzzerTimer);
      countdownTimers.forEach(clearTimeout);countdownTimers=[];
      arena.removeEventListener('pointerdown',onPointerDown);
      arena.removeEventListener('pointermove',onPointerMove);
      arena.removeEventListener('pointerup',onPointerUp);
      arena.removeEventListener('pointercancel',onPointerUp);
      arena.removeEventListener('keydown',onKeyDown);
      puck.removeEventListener('pointerdown',stopStartBubble);
      puck.removeEventListener('click',startFromPuck);
      window.removeEventListener('resize',onResize);
      [...strikePool,...postPool,goalAudio,buzzerAudio,countdownAudio].forEach(a=>{try{a.pause();a.currentTime=0;}catch{}});
    };
  }
  function bindLando(){
    let round=1,armed=false,goTime=0,timers=[],running=false;
    const btn=document.getElementById('reactionBtn');
    const roundEl=document.getElementById('landoRound');
    const lamps=[...document.querySelectorAll('.lando-lamp')];
    const results=[...document.querySelectorAll('[data-lando-result]')];
    const redLightAudio=Array.from({length:5},()=>new Audio('./assets/lando-red-light-beep.wav'));
    const goAudio=new Audio('./assets/lando-go-beep.wav');
    redLightAudio.forEach(audio=>{audio.preload='auto';audio.volume=.72;});
    goAudio.preload='auto';goAudio.volume=.82;
    let countdownAudioPrimed=false;
    const clear=()=>{timers.forEach(clearTimeout);timers=[]};
    function stopCountdownAudio(reset=true){
      [...redLightAudio,goAudio].forEach(audio=>{try{audio.pause();if(reset)audio.currentTime=0;}catch{}});
    }
    function cleanupLando(){clear();stopCountdownAudio(true);}
    cleanupMission=cleanupLando;

    function primeCountdownAudio(){
      if(countdownAudioPrimed||!state.audio)return;
      countdownAudioPrimed=true;
      // Do not call play() here. iOS can leak an audible frame even at volume 0,
      // which created a stray beep on the first START TEST press. Loading is
      // sufficient; the first intended red-light cue is the first playback.
      [...redLightAudio,goAudio].forEach(audio=>{try{audio.load();}catch{}});
    }
    function playCountdownFx(audio,volume){
      if(!state.audio)return;
      try{
        audio.pause();audio.currentTime=0;audio.volume=volume;
        const play=audio.play();
        if(play&&typeof play.catch==='function')play.catch(()=>{});
      }catch{}
    }

    function activeRows(){return Math.min(round,4);}
    function setResultState(n,status,value=null){
      const el=results[n-1]; if(!el)return;
      el.className=`lando-result ${status}`;
      if(value!==null){
        const ms=Math.max(0,Math.round(Number(value)||0));
        el.innerHTML=`<span class="lando-result-value"><b>${ms}</b><small>ms</small></span>`;
      }
    }
    function resetLights(){lamps.forEach(l=>l.className='lando-lamp');}
    function lampsForColumn(col){
      const rows=activeRows();
      return lamps.filter(l=>Number(l.dataset.col)===col && Number(l.dataset.row)>=4-rows);
    }
    function start(){
      clear(); resetLights(); armed=false; running=true; goTime=0;
      primeCountdownAudio();
      roundEl.textContent=`${round} / 4`;
      roundEl.classList.remove('is-complete');
      btn.textContent='STANDBY'; btn.disabled=false; btn.classList.remove('success','is-measured'); btn.classList.add('is-standby');
      setResultState(round,'active');
      for(let col=0;col<5;col++){
        timers.push(setTimeout(()=>{
          lampsForColumn(col).forEach(l=>l.classList.add('red'));
          playCountdownFx(redLightAudio[col],.72); haptic(8);
        },380+col*250));
      }
      const builtAt=380+4*250;
      const wait=builtAt+650+Math.random()*1050;
      timers.push(setTimeout(()=>{
        lamps.forEach(l=>l.classList.remove('red'));
        armed=true; running=true; goTime=performance.now();
        btn.classList.remove('is-standby');
        btn.textContent='REACT';
        playCountdownFx(goAudio,.82); haptic(18);
      },wait));
    }
    function capture(){
      const ms=Math.round(performance.now()-goTime);
      armed=false; running=false;
      for(let col=0;col<5;col++) lampsForColumn(col).forEach(l=>l.classList.add('green'));
      setResultState(round,'complete',ms);
      const currentResult=results[round-1]; if(currentResult) currentResult.dataset.ms=String(ms);
      btn.classList.remove('is-standby');btn.classList.add('success','is-measured');
      btn.textContent='REACTION MEASURED';btn.disabled=true;
      haptic([20,20,45]); ping(760,.075,.03);
      if(round===4){
        roundEl.classList.add('is-complete');
        const scored=results.map(el=>({el,ms:Number(el.dataset.ms)})).filter(x=>Number.isFinite(x.ms));
        const best=scored.sort((a,b)=>a.ms-b.ms)[0];
        timers.push(setTimeout(()=>{best?.el.classList.add('best');haptic([18,20,52]);},520));
        timers.push(setTimeout(()=>showCompletion('Response Calibrated','Santa-1’s flight response has been calibrated for high-speed operation.'),1750));
      }else{
        timers.push(setTimeout(()=>{
          round++;
          roundEl.textContent=`${round} / 4`;
          setResultState(round,'active');
          resetLights();
          btn.classList.remove('success','is-measured');
          btn.textContent='START TEST';btn.disabled=false;
        },1250));
      }
    }

    function onFastReactionPress(e){
      if(!armed||e.pointerType==='mouse') return;
      e.preventDefault();
      capture();
    }
    btn.addEventListener('pointerdown',onFastReactionPress,{passive:false});
    btn.onclick=()=>{
      if(btn.textContent==='Start Test'||btn.textContent==='START TEST'){start();return;}
      if(armed){capture();return;}
      if(running){
        clear(); running=false; armed=false; resetLights();
        btn.classList.remove('is-standby');
        btn.textContent='FALSE START';
        setResultState(round,'active');
        haptic([20,30,20]);
        timers.push(setTimeout(()=>{btn.textContent='START TEST';},700));
      }
    };
    const previousCleanup=cleanupMission;
    cleanupMission=()=>{btn.removeEventListener('pointerdown',onFastReactionPress);previousCleanup?.();};
  }
  function bindAurora(){
    const panel=document.querySelector('.aurora-panel');
    const dial=document.getElementById('auroraDial');
    const lockCount=document.getElementById('auroraLockCount');
    const lockTrack=[...document.querySelectorAll('#auroraLockTrack i')];
    const stateEl=document.getElementById('auroraState');
    const north=document.querySelector('.aurora-north');
    const pulseEl=document.querySelector('.aurora-charge-pulse');
    const finalWave=document.querySelector('.aurora-final-wave');
    if(!dial||!lockCount||lockTrack.length!==3||!stateEl)return;

    const ringEls={
      outer:document.querySelector('[data-aurora-ring="outer"]'),
      middle:document.querySelector('[data-aurora-ring="middle"]'),
      inner:document.querySelector('[data-aurora-ring="inner"]')
    };
    const order=['outer','middle','inner'];
    const labels={outer:'Outer',middle:'Middle',inner:'Inner'};
    const angles={outer:132,middle:-84,inner:164};
    const baseSpeeds={outer:62,middle:-84,inner:126};
    const captureWindows={outer:38,middle:30,inner:24};
    const pulseSizes={outer:'91%',middle:'60%',inner:'34%'};
    const locked={outer:false,middle:false,inner:false};
    const desyncVelocity={outer:0,middle:0,inner:0};
    const reduced=!!(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const speedScale=reduced ? .72 : 1;

    const lockAudio=new Audio('./assets/aurora-ring-lock.wav');
    lockAudio.preload='auto';
    lockAudio.volume=.78;
    const ambientAudio=new Audio('./assets/aurora-ambient-loop.wav');
    ambientAudio.preload='auto';
    ambientAudio.loop=true;
    ambientAudio.volume=.17;

    let activeIndex=0;
    let finished=false;
    let raf=0;
    let lastTs=0;
    let completionTimer=0;
    let ambientFadeRaf=0;
    const feedbackTimers=[];

    const normalise=a=>((a%360)+360)%360;
    const signed=a=>{const n=normalise(a);return n>180?n-360:n;};
    const activeKey=()=>order[activeIndex]||null;
    const lockedCount=()=>order.filter(key=>locked[key]).length;

    function renderRing(key){
      ringEls[key].style.setProperty('--aurora-rotation',`${angles[key]}deg`);
    }

    function startAmbient(){
      if(!state.audio||finished||!ambientAudio.paused)return;
      beginMissionAudioRadioOverride('aurora');
      ambientAudio.volume=.17;
      try{
        const play=ambientAudio.play();
        if(play&&typeof play.catch==='function')play.catch(()=>{});
      }catch{}
    }

    function fadeAmbientOut(duration=520){
      cancelAnimationFrame(ambientFadeRaf);
      if(ambientAudio.paused)return;
      const from=ambientAudio.volume;
      const started=performance.now();
      const step=now=>{
        const p=Math.min(1,(now-started)/duration);
        ambientAudio.volume=Math.max(0,from*(1-p));
        if(p<1)ambientFadeRaf=requestAnimationFrame(step);
        else{
          ambientFadeRaf=0;
          try{ambientAudio.pause();ambientAudio.currentTime=0;ambientAudio.volume=.17;}catch{}
          endMissionAudioRadioOverride('aurora');
        }
      };
      ambientFadeRaf=requestAnimationFrame(step);
    }

    function playLockAudio(){
      if(!state.audio)return;
      try{
        lockAudio.currentTime=0;
        const play=lockAudio.play();
        if(play&&typeof play.catch==='function')play.catch(()=>{});
      }catch{}
    }

    function updateProgress(){
      const count=lockedCount();
      lockCount.textContent=`${count} / 3`;
      lockTrack.forEach((segment,i)=>segment.classList.toggle('locked',i<count));
    }

    function updateStage(){
      order.forEach((key,i)=>{
        const isLocked=locked[key];
        const isActive=!isLocked&&i===activeIndex;
        ringEls[key].classList.toggle('active',isActive);
        ringEls[key].classList.toggle('tracking',!isLocked&&!isActive);
      });
      const active=activeKey();
      if(active) stateEl.textContent=`Align the ${labels[active].toLowerCase()} navigation ring with the North Pole axis.`;
      updateProgress();
    }

    function fireInwardPulse(key){
      if(!pulseEl)return;
      pulseEl.style.setProperty('--pulse-size',pulseSizes[key]);
      pulseEl.classList.remove('fire');
      void pulseEl.offsetWidth;
      pulseEl.classList.add('fire');
    }

    function clearMomentClass(el,className,delay){
      if(!el)return;
      el.classList.remove(className);
      void el.offsetWidth;
      el.classList.add(className);
      feedbackTimers.push(setTimeout(()=>el.classList.remove(className),delay));
    }

    function finishSequence(){
      finished=true;
      dial.classList.remove('capture-ready','miss','desync');
      dial.classList.add('complete');
      panel?.classList.add('is-complete');
      if(north) north.classList.add('complete');
      order.forEach(key=>ringEls[key].classList.add('final-surge'));
      if(finalWave){
        finalWave.classList.remove('fire');
        void finalWave.offsetWidth;
        finalWave.classList.add('fire');
      }
      updateProgress();
      stateEl.textContent='Navigation route locked to the North Pole.';
      fadeAmbientOut();
      ping(1090,.13,.04);
      feedbackTimers.push(setTimeout(()=>ping(1370,.18,.05),260));
      haptic([32,20,68]);
      completionTimer=setTimeout(()=>showCompletion('North Pole Signal Locked','The North Pole navigation signal has been locked and Santa-1 has a route home.'),2800);
    }

    function lockRing(key){
      if(finished||locked[key]||key!==activeKey())return;
      angles[key]=0;
      renderRing(key);
      locked[key]=true;
      ringEls[key].classList.remove('near-lock','active','miss','desync');
      ringEls[key].classList.add('locked');
      clearMomentClass(ringEls[key],'lock-burst',620);
      dial.classList.remove('capture-ready','miss','desync');
      fireInwardPulse(key);
      playLockAudio();

      const charge=lockedCount();
      dial.dataset.charge=String(charge);
      updateProgress();
      haptic(charge===3?[24,18,50]:[18,15,34]);

      activeIndex++;
      if(activeIndex>=order.length){
        feedbackTimers.push(setTimeout(finishSequence,360));
      }else{
        updateStage();
        const next=activeKey();
        clearMomentClass(ringEls[next],'wake',520);
        updateReadiness();
      }
    }

    function missCapture(key){
      if(!key||finished)return;
      const direction=Math.sign(baseSpeeds[key])||1;
      desyncVelocity[key]+=direction*118;
      clearMomentClass(ringEls[key],'desync',260);
      clearMomentClass(dial,'desync',230);
      clearMomentClass(ringEls[key],'miss',250);
      stateEl.textContent='Navigation alignment missed.';
      haptic([12,22,12]);
      feedbackTimers.push(setTimeout(()=>{
        if(!finished&&key===activeKey())stateEl.textContent=`Align the ${labels[key].toLowerCase()} navigation ring with the North Pole axis.`;
      },520));
    }

    function updateReadiness(){
      const key=activeKey();
      let ready=false;
      order.forEach(k=>ringEls[k].classList.remove('near-lock'));
      if(key&&!finished){
        const offset=Math.abs(signed(angles[key]));
        ready=offset<=captureWindows[key];
        ringEls[key].classList.toggle('near-lock',ready);
      }
      dial.classList.toggle('capture-ready',ready);
      if(north) north.classList.toggle('capture-ready',ready);
    }

    function frame(ts){
      if(!lastTs)lastTs=ts;
      const dt=Math.min(.05,(ts-lastTs)/1000||0);
      lastTs=ts;

      if(!finished){
        order.forEach(key=>{
          if(locked[key])return;
          let speed=baseSpeeds[key]*speedScale;
          if(key==='inner') speed*=1+.12*Math.sin(ts/620);
          speed+=desyncVelocity[key];
          angles[key]+=speed*dt;
          desyncVelocity[key]*=Math.exp(-dt*11.5);
          if(Math.abs(desyncVelocity[key])<.5)desyncVelocity[key]=0;
          renderRing(key);
        });
        updateReadiness();
      }
      if(!finished)raf=requestAnimationFrame(frame);
    }

    function captureRing(event){
      event?.preventDefault?.();
      const requested=event?.currentTarget?.dataset?.auroraRing;
      const key=activeKey();
      if(!key||finished||requested!==key)return;
      startAmbient();
      const offset=Math.abs(signed(angles[key]));
      if(offset<=captureWindows[key]) lockRing(key);
      else missCapture(key);
    }
    order.forEach(key=>ringEls[key]?.addEventListener('click',captureRing));

    order.forEach(renderRing);
    updateStage();
    updateReadiness();
    startAmbient();
    raf=requestAnimationFrame(frame);

    cleanupMission=()=>{
      cancelAnimationFrame(raf);
      cancelAnimationFrame(ambientFadeRaf);
      clearTimeout(completionTimer);
      feedbackTimers.forEach(clearTimeout);
      order.forEach(key=>ringEls[key]?.removeEventListener('click',captureRing));
      try{lockAudio.pause();lockAudio.currentTime=0;}catch{}
      try{ambientAudio.pause();ambientAudio.currentTime=0;ambientAudio.volume=.17;}catch{}
      endMissionAudioRadioOverride('aurora');
    };
  }
  let laplandMusic=null;
  let laplandVoice=null;
  let laplandExitSfx=null;
  let laplandVolumeRaf=0;
  let laplandMusicSource=null;
  let laplandMusicGain=null;
  let laplandTimers=[];

  function clearLaplandTimers(){
    laplandTimers.forEach(id=>clearTimeout(id));
    laplandTimers=[];
  }
  function laplandLater(fn,delay){
    const id=setTimeout(()=>{laplandTimers=laplandTimers.filter(x=>x!==id);fn();},delay);
    laplandTimers.push(id);
    return id;
  }
  function getLaplandMusic(){
    if(!laplandMusic){
      laplandMusic=new Audio('./assets/lapland-vegas.mp3');
      laplandMusic.preload='auto';
      laplandMusic.loop=true;
      laplandMusic.volume=.34;
    }
    return laplandMusic;
  }
  function getLaplandVoice(){
    if(!laplandVoice){
      laplandVoice=new Audio('./assets/lapland-chief-engineer.mp3');
      laplandVoice.preload='auto';
      laplandVoice.volume=1;
      try{laplandVoice.load();}catch{}
    }
    return laplandVoice;
  }
  function primeLaplandVoiceSilently(){
    if(!state.audio)return;
    const voice=getLaplandVoice();
    // Loading is enough. Do not call play() to prime this clip: on iOS a muted
    // media-element prime can leak/restart and sounds like the transmission has
    // already begun before the real playback starts.
    try{
      voice.pause();
      voice.currentTime=0;
      voice.volume=1;
      voice.muted=false;
      voice.load();
    }catch{}
  }
  function getLaplandExitSfx(){
    if(!laplandExitSfx){
      laplandExitSfx=new Audio('./assets/quest-complete.mp3');
      laplandExitSfx.preload='auto';
      laplandExitSfx.volume=.9;
    }
    return laplandExitSfx;
  }
  function playLaplandExitCelebration(onComplete){
    if(!state.audio){onComplete?.();return;}
    const sfx=getLaplandExitSfx();
    let finished=false;
    const finish=()=>{if(finished)return;finished=true;sfx.onended=null;sfx.onerror=null;onComplete?.();};
    try{sfx.currentTime=0;}catch{}
    sfx.onended=finish;
    sfx.onerror=finish;
    try{
      const p=sfx.play();
      if(p&&typeof p.catch==='function') p.catch(finish);
    }catch{finish();}
  }
  function ensureLaplandMusicGraph(){
    if(laplandMusicGain) return laplandMusicGain;
    const music=getLaplandMusic();
    const ctx=ensureAudio();
    if(!ctx) return null;
    try{
      laplandMusicSource=ctx.createMediaElementSource(music);
      laplandMusicGain=ctx.createGain();
      laplandMusicGain.gain.value=.34;
      laplandMusicSource.connect(laplandMusicGain).connect(ctx.destination);
      music.volume=1;
      return laplandMusicGain;
    }catch{return null;}
  }
  function fadeLaplandMusic(target,duration=350,onDone){
    if(!laplandMusic){onDone?.();return;}
    const level=Math.max(0,Math.min(1,target));
    const gain=ensureLaplandMusicGraph();
    if(gain&&audioCtx){
      const now=audioCtx.currentTime;
      try{
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value,now);
        gain.gain.linearRampToValueAtTime(level,now+Math.max(.01,duration/1000));
      }catch{gain.gain.value=level;}
      if(onDone) laplandLater(onDone,duration);
      return;
    }
    cancelAnimationFrame(laplandVolumeRaf);
    const from=laplandMusic.volume;
    const started=performance.now();
    const step=now=>{
      const p=Math.min(1,(now-started)/duration);
      laplandMusic.volume=from+(level-from)*p;
      if(p<1) laplandVolumeRaf=requestAnimationFrame(step);
      else {laplandVolumeRaf=0;onDone?.();}
    };
    laplandVolumeRaf=requestAnimationFrame(step);
  }
  function startLaplandMusic(){
    if(!state.audio) return;
    beginMissionAudioRadioOverride('lapland');
    const music=getLaplandMusic();
    music.loop=true;
    if(music.ended) music.currentTime=0;
    const gain=ensureLaplandMusicGraph();
    if(gain&&audioCtx){
      music.volume=1;
      const now=audioCtx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.min(gain.gain.value||.34,.34),now);
    }else music.volume=Math.min(music.volume||.34,.34);
    try{
      const p=music.play();
      if(p&&typeof p.catch==='function') p.catch(()=>endMissionAudioRadioOverride('lapland'));
    }catch{endMissionAudioRadioOverride('lapland');}
  }
  function stopLaplandAudio(reset=true,restoreRadio=true){
    clearLaplandTimers();
    cancelAnimationFrame(laplandVolumeRaf);laplandVolumeRaf=0;
    stopStatic();
    if(laplandVoice){
      laplandVoice.onended=null;laplandVoice.onerror=null;
      try{laplandVoice.pause();if(reset)laplandVoice.currentTime=0;laplandVoice.volume=1;laplandVoice.muted=false;}catch{}
    }
    if(laplandMusic){
      try{laplandMusic.pause();if(reset)laplandMusic.currentTime=0;laplandMusic.volume=laplandMusicGain?1:.34;}catch{}
      if(laplandMusicGain&&audioCtx){try{laplandMusicGain.gain.cancelScheduledValues(audioCtx.currentTime);laplandMusicGain.gain.setValueAtTime(.34,audioCtx.currentTime);}catch{}}
    }
    if(restoreRadio) endMissionAudioRadioOverride('lapland');
  }

  // Mirror the reliable Luffield transmission pattern: static intro, clean gap,
  // primed narrative audio, audio-end/fallback completion, and a guaranteed
  // on-screen dwell so mobile playback failure can never skip the card.
  function playLaplandClearance(onComplete){
    const shownAt=performance.now();
    const minDwell=6500;
    let introStatic=null,voiceDelay=null,fallback=null,tailTimer=null,finishTimer=null,finished=false;
    const voice=getLaplandVoice();
    const finish=()=>{
      if(finished)return;
      const remaining=Math.max(0,minDwell-(performance.now()-shownAt));
      finished=true;
      finishTimer=laplandLater(()=>{
        clearTimeout(introStatic);clearTimeout(voiceDelay);clearTimeout(fallback);clearTimeout(tailTimer);
        stopStatic();
        voice.onended=null;voice.onerror=null;
        onComplete?.();
      },remaining);
    };
    if(state.audio) startStatic(.05);
    introStatic=laplandLater(()=>stopStatic(),430);
    voiceDelay=laplandLater(()=>{
      stopStatic();
      if(!state.audio){finish();return;}
      try{
        voice.currentTime=0;voice.volume=1;voice.muted=false;
        const play=voice.play();
        if(play&&typeof play.catch==='function') play.catch(finish);
        voice.onended=()=>{
          startStatic(.028);
          tailTimer=laplandLater(()=>{stopStatic();finish();},220);
        };
        voice.onerror=finish;
        fallback=laplandLater(finish,14000);
      }catch{finish();}
    },900);
    return ()=>{
      clearTimeout(introStatic);clearTimeout(voiceDelay);clearTimeout(fallback);clearTimeout(tailTimer);clearTimeout(finishTimer);
      voice.onended=null;voice.onerror=null;
      try{voice.pause();voice.currentTime=0;voice.volume=1;voice.muted=false;}catch{}
      stopStatic();
    };
  }

  function bindLapland(){
    const btn=document.getElementById('initiateTest');
    const panel=document.getElementById('laplandPanel');
    const verificationStage=document.getElementById('laplandVerificationStage');
    const transmissionStage=document.getElementById('laplandTransmissionStage');
    const partyStage=document.getElementById('laplandPartyStage');
    const discoVisual=document.getElementById('laplandDiscoVisual');
    const onlineCount=document.getElementById('laplandOnlineCount');
    const onlineSegments=[...document.querySelectorAll('[data-lapland-progress]')];
    const head=document.querySelector('.lapland-head');
    if(!btn||!panel||!verificationStage||!transmissionStage||!partyStage) return;

    // Render the disco ball from the existing 8x5 sprite sheet onto a canvas.
    // Canvas cropping is much more reliable on mobile Safari than animating a
    // very large transparent WebP as a CSS background.
    let discoRaf=0;
    let discoStartedAt=0;
    let discoLastFrame=-1;
    const discoSprite=new Image();
    discoSprite.decoding='async';
    discoSprite.src='./assets/disco-ball-sprite.webp';
    const drawDiscoFrame=frame=>{
      if(!(discoVisual instanceof HTMLCanvasElement)||!discoSprite.complete||!discoSprite.naturalWidth)return;
      const ctx=discoVisual.getContext('2d');
      if(!ctx)return;
      const cols=8,rows=5,total=40;
      const index=((frame%total)+total)%total;
      const sw=discoSprite.naturalWidth/cols;
      const sh=discoSprite.naturalHeight/rows;
      const sx=(index%cols)*sw;
      const sy=Math.floor(index/cols)*sh;
      ctx.clearRect(0,0,discoVisual.width,discoVisual.height);
      ctx.drawImage(discoSprite,sx,sy,sw,sh,0,0,discoVisual.width,discoVisual.height);
    };
    const stopDisco=()=>{
      cancelAnimationFrame(discoRaf);
      discoRaf=0;
      discoLastFrame=-1;
    };
    const startDisco=()=>{
      if(!(discoVisual instanceof HTMLCanvasElement))return;
      stopDisco();
      discoStartedAt=performance.now();
      const render=now=>{
        if(state.missionOpen!=='lapland'||partyStage.hidden){stopDisco();return;}
        const frame=Math.floor((now-discoStartedAt)/100)%40;
        if(frame!==discoLastFrame){discoLastFrame=frame;drawDiscoFrame(frame);}
        discoRaf=requestAnimationFrame(render);
      };
      drawDiscoFrame(0);
      discoRaf=requestAnimationFrame(render);
    };
    discoSprite.addEventListener('load',()=>drawDiscoFrame(0),{once:true});

    startLaplandMusic();

    // MC01–MC10 each restore one named system. Checks run down column 1 first,
    // then column 2, matching the visible mission-order layout.
    const checks=['entry','velocity','luffield','power','spirit','escapade','comet','jingle','lando','aurora'];
    const systemKeys=['circuitry','diagnostic','comms','power','core','propulsion','guidance','control','response','navigation'];
    const setCharge=value=>panel.style.setProperty('--lapland-charge',String(Math.max(0,Math.min(1,value))));
    const setOnlineProgress=(onlineSystems,complete=false)=>{
      const ticks=Math.max(0,Math.min(10,onlineSystems));
      if(onlineCount){
        onlineCount.textContent=`${ticks} / 10`;
        onlineCount.classList.toggle('complete',complete&&ticks===10);
      }
      onlineSegments.forEach((segment,i)=>{
        segment.classList.toggle('on',i<ticks);
        segment.classList.toggle('complete',complete&&ticks===10);
      });
    };
    const setRowState=(key,nextState,label)=>{
      const row=document.querySelector(`[data-verify-system="${key}"]`);
      const status=document.querySelector(`[data-verify-status="${key}"]`);
      if(!row||!status) return;
      row.classList.remove('is-standby','is-online','is-offline','is-checking');
      row.classList.add(`is-${nextState}`);
      status.textContent=label;
    };
    const setButtonState=mode=>{
      btn.classList.remove('is-initialising','is-complete');
      delete btn.dataset.review;
      if(mode==='initialising'){
        btn.disabled=true;
        btn.textContent='SYSTEM VERIFICATION';
        btn.classList.add('is-initialising');
      }else if(mode==='complete'){
        btn.disabled=true;
        btn.textContent='COMPLETE';
        btn.classList.add('is-complete');
      }else{
        btn.disabled=false;
        btn.textContent='INITIALISE LAUNCH';
      }
    };
    const setLaunchComplete=()=>{
      setButtonState('complete');
      panel.classList.add('is-complete');
      head?.classList.add('is-launch-clear');
      ping(820,.08,.026);
      laplandLater(()=>ping(1080,.12,.038),150);
      haptic([20,24,62]);
    };
    let stopTransmission=()=>{};

    const showTransmission=()=>{
      if(state.missionOpen!=='lapland') return;
      verificationStage.hidden=true;
      partyStage.hidden=true;
      transmissionStage.hidden=false;
      panel.classList.remove('is-verifying','is-celebrating','is-party');
      panel.classList.add('is-transmission');
      head?.classList.remove('is-celebrating');
      if(laplandMusic&&!laplandMusic.paused) fadeLaplandMusic(.018,360);
      stopTransmission=playLaplandClearance(showParty);
    };
    const revealParty=()=>{
      if(state.missionOpen!=='lapland') return;
      stopTransmission();stopTransmission=()=>{};
      transmissionStage.hidden=true;
      verificationStage.hidden=true;
      partyStage.hidden=false;
      panel.classList.remove('is-transmission');
      panel.classList.add('is-party','is-celebrating');
      head?.classList.add('is-celebrating');
      startDisco();
      fadeLaplandMusic(.9,780);
      ping(1040,.14,.045);
      laplandLater(()=>ping(1320,.18,.045),210);
      haptic([25,28,75]);
      laplandLater(()=>{
        if(state.missionOpen==='lapland'){
          showCompletion('Launch Systems Online','Santa-1 is fully online and ready for the final flight sequence.');
        }
      },10000);
    };
    const showParty=()=>{
      if(state.missionOpen!=='lapland')return;
      revealParty();
    };

    setButtonState('idle');
    setOnlineProgress(0,false);

    btn.onclick=()=>{
      if(btn.dataset.review==='true'){stopLaplandAudio();set({missionOpen:null,nav:'missions'});return;}

      primeLaplandVoiceSilently();

      setButtonState('initialising');
      clearLaplandTimers();
      panel.querySelector('.final-check-note')?.remove();
      panel.classList.remove('is-complete','is-celebrating','is-party','is-transmission','has-attention');
      head?.classList.remove('is-launch-clear','is-celebrating');
      panel.classList.add('is-verifying');
      transmissionStage.hidden=true;
      partyStage.hidden=true;
      verificationStage.hidden=false;
      setCharge(0);
      setOnlineProgress(0,false);
      let onlineSystems=0;
      const missing=[];

      startLaplandMusic();
      if(laplandMusic&&!laplandMusic.paused) fadeLaplandMusic(.34,220);
      systemKeys.forEach(key=>setRowState(key,'standby','Standby'));

      checks.forEach((checkpointId,i)=>laplandLater(()=>{
        const key=systemKeys[i];
        setRowState(key,'checking','Checking');
        ping(430+i*34,.04,.012);

        laplandLater(()=>{
          const ready=state.completed.includes(checkpointId);
          setRowState(key,ready?'online':'offline',ready?'Online':'Offline');
          if(!ready) missing.push(checkpointId);
          if(ready) onlineSystems++;
          setCharge((i+1)/checks.length);
          setOnlineProgress(onlineSystems,false);
          ping(ready?540+i*38:220,.05,.016);

          if(i===checks.length-1){
            laplandLater(()=>{
              const clear=!missing.length;
              setCharge(1);
              panel.classList.remove('is-verifying');

              if(clear){
                setOnlineProgress(10,true);
                setLaunchComplete();
                // Let COMPLETE register before the narrative hand-off.
                laplandLater(showTransmission,1550);
              }else{
                if(laplandMusic&&!laplandMusic.paused) fadeLaplandMusic(.34,350);
                panel.classList.add('has-attention');
                btn.disabled=false;btn.dataset.review='true';btn.textContent='View Missions';btn.classList.remove('is-initialising','is-complete');
                const note=document.createElement('div'); note.className='final-check-note';
                note.innerHTML=`<div class="kicker">Systems Require Attention</div><p>${missing.length} ${missing.length===1?'system':'systems'} must be restored before launch systems can come online.</p>`;
                verificationStage.appendChild(note);haptic([20,35,20]);
              }
            },620);
          }
        },220);
      },220+i*360));
    };

    cleanupMission=()=>{
      stopTransmission();
      stopDisco();
      stopLaplandAudio();
    };
  }
  let northernTimers=[];
  let northernFlybyAudio=null;
  let northernSantaAudio=null;
  let northernMagicAudio=null;
  let northernTakeoverEl=null;

  function northernLater(fn,delay){
    const timer=setTimeout(()=>{
      northernTimers=northernTimers.filter(id=>id!==timer);
      fn();
    },delay);
    northernTimers.push(timer);
    return timer;
  }

  function getNorthernFlybyAudio(){
    if(!northernFlybyAudio){
      northernFlybyAudio=new Audio('./assets/santa-sleigh-flyby.mp3');
      northernFlybyAudio.preload='auto';
      northernFlybyAudio.volume=.95;
    }
    return northernFlybyAudio;
  }

  function getNorthernSantaAudio(){
    if(!northernSantaAudio){
      northernSantaAudio=new Audio('./assets/northern-santa-final.mp3');
      northernSantaAudio.preload='auto';
      northernSantaAudio.volume=.92;
    }
    return northernSantaAudio;
  }

  function getNorthernMagicAudio(){
    if(!northernMagicAudio){
      northernMagicAudio=new Audio('./assets/christmas-magic-02.mp3');
      northernMagicAudio.preload='auto';
      northernMagicAudio.volume=.88;
    }
    return northernMagicAudio;
  }

  function stopNorthernSequence(){
    northernTimers.forEach(clearTimeout); northernTimers=[];
    if(northernTakeoverEl){northernTakeoverEl.remove();northernTakeoverEl=null;}
    [northernSantaAudio,northernMagicAudio].forEach(audio=>{
      if(!audio)return;
      try{audio.pause();audio.currentTime=0;audio.onended=null;audio.onerror=null;audio.muted=false;}catch{}
    });
    stopStatic();
    endMissionAudioRadioOverride('northern-transmission');
  }

  function primeNorthernFinalAudio(){
    if(!state.audio)return;
    [getNorthernMagicAudio(),getNorthernSantaAudio()].forEach(audio=>{
      try{
        audio.load();audio.pause();audio.currentTime=0;audio.muted=true;
        const play=audio.play();
        if(play&&typeof play.then==='function'){
          play.then(()=>{try{audio.pause();audio.currentTime=0;}catch{}}).catch(()=>{});
        }else{audio.pause();audio.currentTime=0;}
      }catch{}
    });
  }

  function showNorthernTransmission(){
    const mc=document.getElementById('missionContent'); if(!mc)return;
    if(state.audio) beginMissionAudioRadioOverride('northern-transmission');
    mc.innerHTML=`<div class="mission-instrument panel incoming-transmission">
      <div class="transmission-wave">${'<b></b>'.repeat(24)}</div>
      <div class="kicker">Incoming Transmission</div>
      <h2>SANTA-1</h2>
      <div class="signal-state lock">Signal locked</div>
    </div>`;

    let finished=false;
    let fallbackTimer=null;
    const opened=performance.now();
    const santa=getNorthernSantaAudio();
    if(state.audio)startStatic(.04);
    northernLater(()=>stopStatic(),420);

    const finish=()=>{
      if(finished)return;finished=true;
      clearTimeout(fallbackTimer);stopStatic();
      endMissionAudioRadioOverride('northern-transmission');
      try{santa.onended=null;santa.onerror=null;}catch{}
      const elapsed=performance.now()-opened;
      const wait=Math.max(0,900-elapsed);
      northernLater(showNorthernMissionComplete,wait+220);
    };

    if(state.audio){
      try{
        santa.currentTime=0;santa.volume=.92;santa.muted=false;
        santa.onended=finish;
        santa.onerror=()=>{fallbackTimer=setTimeout(finish,6200);northernTimers.push(fallbackTimer);};
        northernLater(()=>{
          try{
            const play=santa.play();
            if(play&&typeof play.catch==='function')play.catch(()=>{fallbackTimer=setTimeout(finish,6200);northernTimers.push(fallbackTimer);});
          }catch{fallbackTimer=setTimeout(finish,6200);northernTimers.push(fallbackTimer);}
        },260);
        fallbackTimer=setTimeout(finish,17000);northernTimers.push(fallbackTimer);
      }catch{fallbackTimer=setTimeout(finish,6200);northernTimers.push(fallbackTimer);}
    }else{
      fallbackTimer=setTimeout(finish,6200);northernTimers.push(fallbackTimer);
    }
  }

  function showNorthernMissionComplete(){
    const flyby=getNorthernFlybyAudio();
    if(state.audio){
      try{
        flyby.onended=null;flyby.onerror=null;flyby.currentTime=0;flyby.volume=.95;
        const play=flyby.play();
        if(play&&typeof play.catch==='function')play.catch(()=>{});
      }catch{}
    }
    showCompletion('Santa-1 Airborne','Santa-1 is airborne. Recovery complete. The Northern Flight is underway.');
  }

  function playNorthernAirborneMagic(){
    if(!state.audio)return;
    const magic=getNorthernMagicAudio();
    try{
      magic.onended=null;magic.onerror=null;magic.currentTime=0;magic.volume=.88;magic.muted=false;
      const play=magic.play();
      if(play&&typeof play.catch==='function')play.catch(()=>{});
    }catch{}
  }

  function showNorthernAirborneTakeover(){
    if(northernTakeoverEl)return;
    playNorthernAirborneMagic();
    ping(980,.18,.05);haptic([35,30,85,35,110]);
    const el=document.createElement('div');
    el.className='mc01-energy-bloom';
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
    el.innerHTML=`<div class="mc01-bloom-field" aria-hidden="true"><i></i><i></i><i></i></div><div class="mc01-bloom-copy"><img class="mc01-bloom-mark" src="./assets/silverstone-s-mark.webp" alt=""><div class="kicker">SANTA-1</div><h1>AIRBORNE</h1></div>`;
    document.body.appendChild(el);northernTakeoverEl=el;
    // Put the transmission behind the takeover before its fade begins so
    // the authorisation screen never flashes back between states.
    northernLater(()=>showNorthernTransmission(),3500);
    northernLater(()=>el.classList.add('is-exiting'),3820);
    northernLater(()=>{
      if(el.isConnected)el.remove();
      if(northernTakeoverEl===el)northernTakeoverEl=null;
    },4260);
  }

  function bindNorthern(){
    const panel=document.getElementById('northernPanel');
    const button=document.getElementById('authoriseFlight');
    const label=button?.querySelector('.northern-authorise-label');
    const hint=document.getElementById('northernHint');
    const checks=[...document.querySelectorAll('[data-flight-check]')];
    if(!panel||!button||!label||!hint||checks.length!==3)return;

    stopNorthernSequence();
    cleanupMission=stopNorthernSequence;
    [getNorthernFlybyAudio(),getNorthernSantaAudio(),getNorthernMagicAudio()].forEach(audio=>{try{audio.load();}catch{}});

    label.textContent='Authorise Flight';
    button.disabled=true;
    button.classList.remove('success','is-authorising','is-authorised');
    panel.classList.remove('is-ready','is-authorising','is-authorised','is-airborne');

    const checkValues=['Locked','Clear','Open'];
    checks.forEach((check,i)=>{
      check.classList.remove('ready');
      const value=check.querySelector('strong'); if(value)value.textContent='Checking';
      northernLater(()=>{
        check.classList.add('ready');
        if(value)value.textContent=checkValues[i];
        ping(560+(i*70),.045,.018);haptic(12);
      },420+(i*580));
    });
    northernLater(()=>{
      button.disabled=false;
      panel.classList.add('is-ready');
      hint.textContent='Santa-1 ready for final authorisation.';
      haptic(18);
    },1850);

    let authorised=false;
    button.addEventListener('click',()=>{
      if(button.disabled||authorised)return;
      authorised=true;
      primeNorthernFinalAudio();
      button.disabled=true;
      button.classList.add('is-authorising');
      panel.classList.remove('is-ready');
      panel.classList.add('is-authorising');
      label.textContent='Authorising';
      hint.textContent='Final flight authorisation in progress.';
      ping(690,.08,.025);haptic(22);

      northernLater(()=>{
        button.classList.remove('is-authorising');
        panel.classList.remove('is-authorising');
        button.classList.add('success','is-authorised');
        panel.classList.add('is-authorised');
        label.textContent='Authorised';
        hint.textContent='Santa-1 cleared for departure.';
        ping(920,.16,.05);haptic([30,30,85]);
        northernLater(()=>panel.classList.add('is-airborne'),220);
        northernLater(showNorthernAirborneTakeover,620);
      },720);
    });
  }


  // Warm mission artwork after the first render so later pages do not flash
  // unloaded icons/backgrounds on mobile Safari. Critical first-screen assets
  // remain declared as <link rel="preload"> in index.html.
  const missionImagePreloads = [
    './assets/radar-bezel.webp',
    './assets/mc02-control-mid-ring.svg','./assets/mc02-response-arrow.svg','./assets/mc02-response-cones.svg',
    './assets/mc02-stability-front-car.svg','./assets/mc02-stability-headlights.svg','./assets/mc02-traction-car.svg','./assets/mc02-traction-skids.svg',
    './assets/care-bears-logo.png','./assets/lando-gantry.webp',
    './assets/aurora-sky.webp','./assets/aurora-ring-outer.webp','./assets/aurora-ring-middle.webp','./assets/aurora-ring-inner.webp',
    './assets/las-vegas-logo-white.svg',
    './assets/sleigh-stage-2.webp','./assets/sleigh-stage-3.webp','./assets/sleigh-stage-4.webp','./assets/sleigh-stage-5.webp'
  ];
  const warmMissionImages=()=>missionImagePreloads.forEach(src=>{const img=new Image();img.decoding='async';img.src=src;});
  if('requestIdleCallback' in window) requestIdleCallback(warmMissionImages,{timeout:1400});
  else setTimeout(warmMissionImages,350);

  if(IS_ADMIN){renderAdmin();}
  else {
    if(state.onboarded) ensureOpeningMessage();
    render();
    if(state.onboarded&&state.mode==='live'&&state.gpsEnabled!==false) startGpsWatch();
    if(state.onboarded&&state.mode==='demo'&&state.nav==='radar'&&!state.missionOpen){setTimeout(maybeStartDemoTarget,350);rearmDemoRoute(850);}
  }
})();
