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
    document.querySelectorAll('[data-pitcrew-players]').forEach(b=>b.addEventListener('click',()=>{
      const next=Math.max(1,Math.min(4,(Number(state.pitCrewPlayers)||1)+Number(b.dataset.pitcrewPlayers)));
      if(next!==state.pitCrewPlayers){state.pitCrewPlayers=next;save();render();}
    }));
    document.querySelectorAll('[data-pitcrew-confirm]').forEach(b=>b.addEventListener('click',()=>{
      state.pitCrewConfirmed=true;save();render();
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
    document.querySelectorAll('[data-gps-status]').forEach(b=>b.addEventListener('click',()=>{
      if(b.dataset.gpsStatus==='retry'){startLiveExperience();return;}
      if(b.dataset.gpsStatus==='demo'){locationOnboardingAttempt++;startDemoExperience();return;}
      if(b.dataset.gpsStatus==='continue'){completeConnectedLocationOnboarding();return;}
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
    const allowed=state.mode==='demo'?(idx===state.routeIndex&&!state.completed.includes(id)):(state.completed.includes(id)||state.available.includes(id)||idx<state.routeIndex||(idx===state.routeIndex&&state.targetInRange));
    if(!allowed){toast('Mission is not available yet.');return;}
    // Retain an in-progress turn if the passenger temporarily exited a mission.
    // Starting a different checkpoint begins again with Player 1.
    if(state.missionPlayerTurnId!==id){
      state.missionPlayerTurnId=id;
      state.missionPlayerTurn=1;
      save();
    }
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
    // Intermediate passengers hand directly to the next player once the
    // activation's own end animation has finished. Only the last passenger
    // sees the original Mission Complete / Continue screen.
    const players=Math.max(1,Math.min(4,Number(state.pitCrewPlayers)||1));
    const currentTurn=state.missionPlayerTurnId===state.missionOpen?Math.max(1,Number(state.missionPlayerTurn)||1):1;
    if(state.missionOpen!=='elf-radio'&&currentTurn<players){
      completeCurrent();
      return;
    }
    mc.closest('.mission-shell')?.classList.add('mission-overlay-active');
    mc.innerHTML=`<div class="completion panel mission-complete-dialog"><div class="check" aria-hidden="true"><span class="checkmark-icon checkmark-icon--large"></span></div><h2>Mission Complete</h2><button class="btn primary wide mission-complete-cta" id="returnRadar"><span>CONTINUE</span><img class="onboarding-cta-guide-arrow" src="./assets/arrow-right-guide.svg" alt="" aria-hidden="true"></button></div>`;
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
    mc.closest('.mission-shell')?.classList.add('mission-overlay-active');
    mc.innerHTML=`<div class="completion panel mission-complete-dialog"><div class="check" aria-hidden="true"><span class="checkmark-icon checkmark-icon--large"></span></div><h2>SIGNAL LOCKED</h2><button class="btn primary wide mission-complete-cta" id="returnElf"><span>CONTINUE</span><img class="onboarding-cta-guide-arrow" src="./assets/arrow-right-guide.svg" alt="" aria-hidden="true"></button></div>`;
    document.getElementById('returnElf').onclick=()=>{
      state={...state,elfUnlocked:true,elfPromptSeen:true,missionOpen:null,missionReturnNav:returnNav,nav:returnNav};
      save();render();
    };
    ping(880,.14,.05);haptic([30,35,70]);
  }
  function completeCurrent(){
    const id=state.missionOpen; const idx=checkpointIndex(id); if(idx<0) return;
    const players=Math.max(1,Math.min(4,Number(state.pitCrewPlayers)||1));
    const turn=state.missionPlayerTurnId===id?Math.max(1,Math.min(players,Number(state.missionPlayerTurn)||1)):1;
    if(turn<players){
      // Show a consistent handover after the completed player's existing
      // Mission Complete screen, but do not advance checkpoints yet.
      if(id==='lapland'){
        // Keep the current music position and radio override between players.
        // The track is stopped only on mission exit/final completion.
        laplandPreserveMusicForHandover=false;
      }
      state.missionPlayerTurnId=id;
      state.missionPlayerTurn=turn+1;
      save();
      const mc=document.getElementById('missionContent');
      if(!mc)return;
      mc.closest('.mission-shell')?.classList.add('mission-overlay-active');
      mc.innerHTML=`<div class="mission-player-changeover panel" role="dialog" aria-modal="true" aria-labelledby="playerChangeTitle"><div class="mission-player-changeover-elf" aria-hidden="true"><img src="./assets/pit-crew-santa-helmet-guide.png" alt=""></div><h2 id="playerChangeTitle"><span>YOUR TURN</span><span>PLAYER ${turn+1}</span></h2><button type="button" class="btn primary wide mission-player-changeover-cta" id="playerChangeContinue"><span>CONTINUE</span><img class="onboarding-cta-guide-arrow" src="./assets/arrow-right-guide.svg" alt="" aria-hidden="true"></button></div>`;
      const next=document.getElementById('playerChangeContinue');
      next?.addEventListener('click',()=>{
        if(state.missionOpen!==id||state.missionPlayerTurnId!==id)return;
        next.disabled=true;
        // Re-rendering resets the ten tiles, but must not restart the music.
        if(id==='lapland')laplandPreserveMusicForHandover=true;
        render();
      },{once:true});
      next?.focus();
      return;
    }
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
    state={...state,completed:done,available,missionOpen:null,missionPlayerTurn:1,missionPlayerTurnId:null,routeIndex,targetVisible:false,targetInRange:false,distance:null,lastMessage:'SEARCHING FOR NEXT RECOVERY SIGNAL',nav:returnNav};
    if(state.mode==='demo'){
      clearDemo();
      makeNoGpsCheckpointReady();
    }
    // GPS journeys continue to track location; No GPS has the next pit stop ready instantly.
    if(state.mode!=='demo') primeCurrentCircuitTarget();
    save();checkpointCompletionMessage(id);render();
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
    if(state.missionPlayerTurnId!=='entry'){
      state.missionPlayerTurnId='entry';
      state.missionPlayerTurn=1;
    }
    state={...state,missionOpen:'entry',missionReturnNav:state.nav||'radar',targetVisible:true,targetInRange:true,lastMessage:'CIRCUIT LINK SIGNAL DETECTED'};
    save();render();
  }

  // The search animation is theatrical; the outcome is always determined by real GPS.
  // A hard 10-second deadline limits prolonged searching even if permission is stalled.
  let locationOnboardingAttempt=0;
  let locationOnboardingOutcome=null;
  const LOCATION_SEARCH_MIN_MS=2500;
  const LOCATION_SEARCH_TIMEOUT_MS=10000;
  function startLiveExperience(){
    const attempt=++locationOnboardingAttempt;
    locationOnboardingOutcome=null;
    const started=Date.now();
    let settled=false;
    state.bootDone='location-finding';save();render();
    const hardDeadline=setTimeout(()=>finish({status:'failed',reason:'timeout'}),LOCATION_SEARCH_TIMEOUT_MS);
    function finish(outcome){
      if(settled||attempt!==locationOnboardingAttempt)return;
      settled=true;clearTimeout(hardDeadline);
      const minWait=Math.max(0,LOCATION_SEARCH_MIN_MS-(Date.now()-started));
      setTimeout(()=>{
        if(attempt!==locationOnboardingAttempt||state.onboarded||state.bootDone!=='location-finding')return;
        locationOnboardingOutcome=outcome;
        state.bootDone='location-result';save();render();
      },minWait);
    }
    if(!navigator.geolocation){finish({status:'failed',reason:'unavailable'});return;}
    try{
      navigator.geolocation.getCurrentPosition(pos=>{
        if(!Number.isFinite(pos.coords.latitude)||!Number.isFinite(pos.coords.longitude)){
          finish({status:'failed',reason:'unavailable'});return;
        }
        finish({status:'connected',position:pos});
      },err=>{
        finish({status:'failed',reason:err.code===1?'denied':err.code===3?'timeout':'unavailable'});
      },{enableHighAccuracy:true,timeout:LOCATION_SEARCH_TIMEOUT_MS,maximumAge:0});
    }catch{finish({status:'failed',reason:'unavailable'});}
  }
  function completeConnectedLocationOnboarding(){
    const outcome=locationOnboardingOutcome;
    if(state.bootDone!=='location-result'||outcome?.status!=='connected'||!outcome.position)return;
    locationOnboardingAttempt++;
    const pos=outcome.position;
    locationOnboardingOutcome=null;
    state={...state,onboarded:true,bootDone:true,mode:'live',gpsEnabled:true,nav:'radar',routeIndex:normaliseRouteIndex(state.routeIndex||ROUTE_START_INDEX),gpsAccuracy:pos.coords.accuracy,gpsCondition:gpsCondition(pos.coords.accuracy)};
    save();ensureOpeningMessage();render();startGpsWatch();processGps(normalisePosition(pos),true);
  }
