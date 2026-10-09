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
      startDemoExperience();
      toast('Demo route restarted.');
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
