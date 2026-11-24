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
      initSleighRepairScroll();
      return;
    }
    app.innerHTML=navShell();
    initSleighRepairScroll();
  }
  // A persistent visual scrollbar is needed because mobile Safari hides native
  // scrollbars even when overflow-y is set to scroll.
  function initSleighRepairScroll(){
    const list=document.querySelector('.nav-view[data-view="sleigh"] .sleigh-repair-list');
    const viewport=document.querySelector('.nav-view[data-view="sleigh"] .sleigh-repair-viewport');
    if(!list||!viewport) return;
    const thumb=viewport.querySelector('.sleigh-scroll-thumb');
    const update=()=>{
      const viewHeight=list.clientHeight;
      const fullHeight=list.scrollHeight;
      const overflowing=fullHeight>viewHeight+2;
      viewport.classList.toggle('can-scroll',overflowing);
      viewport.classList.toggle('at-bottom',!overflowing||list.scrollTop>=fullHeight-viewHeight-2);
      if(!thumb) return;
      const trackHeight=viewport.querySelector('.sleigh-scroll-track')?.clientHeight||0;
      const thumbHeight=overflowing&&fullHeight>0?Math.max(28,trackHeight*viewHeight/fullHeight):trackHeight;
      const travel=Math.max(0,trackHeight-thumbHeight);
      const progress=overflowing?(list.scrollTop/Math.max(1,fullHeight-viewHeight)):0;
      thumb.style.height=`${thumbHeight}px`;
      thumb.style.transform=`translateY(${travel*progress}px)`;
    };
    let scrollRestTimer;
    list.addEventListener('scroll',()=>{
      update();
      viewport.classList.add('is-scrolling');
      clearTimeout(scrollRestTimer);
      scrollRestTimer=setTimeout(()=>viewport.classList.remove('is-scrolling'),750);
    },{passive:true});
    if(typeof ResizeObserver!=='undefined'){
      const observer=new ResizeObserver(update);
      observer.observe(list);
      const content=list.querySelector('.sleigh-repair-rows');
      if(content) observer.observe(content);
    }
    update();
  }
  function brand(){return `<div class="brand brand-christmas"><img class="brand-lockup brand-lockup--master" src="./assets/brand/christmas-at-silverstone-master-light.svg" alt="Christmas at Silverstone"></div>`}
  function settingAudioIcon(){
    return `<svg class="mission-setting-svg audio-setting-svg" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9 10.2 12.2H7.5v7.6h2.7L14 23z"/><path d="M18 12.1a5.1 5.1 0 0 1 0 7.8"/><path d="M20.9 9.4a8.75 8.75 0 0 1 0 13.2"/></svg>`;
  }
  function navPitStopsIcon(){
    return `<svg class="nav-solid-icon" viewBox="42 0 123 126" aria-hidden="true"><path fill="currentColor" d="M103.37,5.15A46.07,46.07,0,0,0,87.87,94.6l15.5,26.25L118.88,94.6A46.07,46.07,0,0,0,103.37,5.15ZM116.14,89.7l-1,.32-11.79,20L91.58,90l-1-.32a40.53,40.53,0,1,1,25.54,0Zm19.08-34L124.31,33.06l-1.45-3-3.1,1.14a17.88,17.88,0,0,1-3.71,1,15.25,15.25,0,0,1-9.36-1.85,23.12,23.12,0,0,0-23.27.15,4.18,4.18,0,1,0-5.27,4.76L103.54,88l5.1-2.45L96.48,60.4a17.22,17.22,0,0,1,18.76-1l.15.09a20.74,20.74,0,0,0,8.8,2.67,20.38,20.38,0,0,0,9.09-1.45c.92-.37,3.47-1.57,3.47-1.57S135.65,56.61,135.22,55.72Zm-8,.74a15.17,15.17,0,0,1-9.35-1.85,23,23,0,0,0-11.46-3.07,23.5,23.5,0,0,0-2.64.15A23.12,23.12,0,0,0,94,55.12L84.9,36.19A20.16,20.16,0,0,1,106,35.57a17.44,17.44,0,0,0,13.84,1.62L129,56.11A13.61,13.61,0,0,1,127.23,56.46Z"/></svg>`;
  }
  function navSleighIcon(){
    return `<svg class="nav-solid-icon" viewBox="24 8 162 116" aria-hidden="true"><path fill="currentColor" d="M147.5,73.07a14.72,14.72,0,0,0-10.68-.19c-2-4.94-7.42-8-14.49-8H87.67c-7.08,0-12.51,3.08-14.5,8a14.72,14.72,0,0,0-10.68.19C59.32,74.4,54,78.12,54,88V98.66h3.69v18.46H70.84V103.89a13.35,13.35,0,0,1,2.45,4.88l.6,2.18H136.1l.6-2.18a13.37,13.37,0,0,1,2.46-4.88v13.24H152.3V98.67H156V88C156,78.12,150.68,74.4,147.5,73.07ZM138,82.77a5.37,5.37,0,1,1-5.37-5.37A5.38,5.38,0,0,1,138,82.77ZM77.39,77.4A5.37,5.37,0,1,1,72,82.77,5.38,5.38,0,0,1,77.39,77.4ZM131.7,105H78.29a18.64,18.64,0,0,0-1.77-3.41h57A19.28,19.28,0,0,0,131.7,105ZM97.08,96.71V85.92c0-4.17,1.7-6.28,5.06-6.28h5.71c3.36,0,5.06,2.11,5.06,6.28V96.71Zm53-3.88a23.78,23.78,0,0,0-12,4v-.15H118.49V85.92c0-7.21-4.17-11.86-10.64-11.86h-5.71c-6.46,0-10.64,4.65-10.64,11.86V96.71H72v.15a23.75,23.75,0,0,0-12-4V88c0-4.85,1.68-8.12,4.86-9.46A8.33,8.33,0,0,1,68,77.9a10.5,10.5,0,0,0-1.19,4.87A10.6,10.6,0,1,0,80.68,72.7a12,12,0,0,1,7-1.89h34.66a12,12,0,0,1,7,1.89,10.6,10.6,0,1,0,13.9,10.07A10.51,10.51,0,0,0,142,77.9a8.42,8.42,0,0,1,3.19.65c3.17,1.34,4.85,4.61,4.85,9.46ZM27.16,11.07V120.66h6V17.08h6V120.64h6V17.08H164.74V120.64h6V17.08h6V120.66h6V11.07ZM49.7,34H160.2V28H49.7Zm92.86,36.45a7.5,7.5,0,1,0-7.5-7.5A7.51,7.51,0,0,0,142.56,70.48Zm0-10.81A3.31,3.31,0,1,1,139.24,63,3.31,3.31,0,0,1,142.56,59.67Zm-9.76,3V55.85c0-7.48-5-10.83-10-10.83H87.14c-5,0-10,3.35-10,10.83v6.83a21,21,0,0,1,6-1.92V55.85c0-4,2.18-4.88,4-4.88h35.71c1.83,0,4,.85,4,4.88v4.91A20.88,20.88,0,0,1,132.8,62.68ZM74.93,63a7.5,7.5,0,1,0-7.49,7.5A7.51,7.51,0,0,0,74.93,63ZM64.12,63a3.32,3.32,0,1,1,3.32,3.31A3.32,3.32,0,0,1,64.12,63Z"/></svg>`;
  }
  function navIcon(id){
    const icons={
      radar:`<svg class="nav-line-icon" viewBox="0 0 32 24" aria-hidden="true" stroke="#ffffff" fill="none"><path d="M5 10.5a15.6 15.6 0 0 1 22 0"/><path d="M8.7 14.2a10.4 10.4 0 0 1 14.6 0"/><path d="M12.5 18a5 5 0 0 1 7 0"/><circle cx="16" cy="21" r="1.25" fill="#ffffff" stroke="none"/></svg>`,
      missions:navPitStopsIcon(),
      comms:`<svg class="nav-line-icon" viewBox="0 0 32 24" aria-hidden="true" stroke="#ffffff" fill="none"><path d="M6 13v-2a10 10 0 0 1 20 0v2"/><path d="M6 12.5h3.5v7H7.8c-1 0-1.8-.8-1.8-1.8z"/><path d="M26 12.5h-3.5v7h1.7c1 0 1.8-.8 1.8-1.8z"/><path d="M22.5 19.5c-1 1.3-2.5 2-4.5 2h-2"/></svg>`,
      sleigh:navSleighIcon()
    };
    return icons[id]||'';
  }
  function navBar(){ return `<nav class="nav" aria-label="Christmas at Silverstone">${navButton('radar','Tracker')}${navButton('missions','Pit Stops')}${navButton('sleigh','Sleigh')}${navButton('comms','COMMS')}</nav>`; }
  function navButton(id,label){
    const unread=id==='comms'?unreadCount():0;
    return `<button data-nav="${id}" class="${state.nav===id?'active':''}"><span class="ico">${navIcon(id)}${unread?`<span class="nav-badge">${unread>9?'9+':unread}</span>`:''}</span><span>${label}</span></button>`;
  }
  function topBar(){
    const progress=Math.max(0,Math.min(100,Number(recovery())||0));
    return `<header class="topbar"><div class="masthead-row">${brand()}<div class="pitcrew-status"><strong>SANTA'S<br>PIT CREW</strong><span>SLEIGH ${progress}% FIXED</span></div></div><div class="masthead-progress" aria-hidden="true"><span style="width:${progress}%"></span></div></header>`;
  }
  function statusStrip(){
    const cp=current();
    const activationDistance=distanceToActivation(cp,state.distance);
    const distanceValue=!cp?'–':state.mode==='demo'?'READY':state.targetVisible&&Number.isFinite(activationDistance)?`${Math.round(activationDistance)} M`:'SCAN...';
    const condition=state.mode==='demo'?'OFF':state.gpsEnabled===false?'OFF':state.gpsCondition;
    return `<section class="telemetry-block"><div class="telemetry-heading">MISSION TELEMETRY</div><div class="status-strip panel">
      <div class="status-cell"><div class="status-label">GPS Accuracy</div><div class="status-value gps-${condition.toLowerCase()}">${condition}</div></div>
      <div class="status-cell"><div class="status-label">Sleigh Rebuild</div><div class="status-value ${recovery()>=100?'is-complete':''}">${recovery()}%</div></div>
      <div class="status-cell"><div class="status-label">Next Checkpoint</div><div class="status-value">${distanceValue}</div></div>
    </div></section>`;
  }

  function radarMessage(cp){
    if(cp&&cp.playable&&(state.targetInRange||state.mode==='demo')){
      return `<div class="mission-card message-card panel target-message compact-target${(cp.id==='power'||cp.id==='spirit')?' partner-target':''}" id="radarMessage"><div><div class="kicker">${cp.location}</div>${(cp.id==='power'||cp.id==='spirit')?'<div class="radar-partner-line">IN PARTNERSHIP WITH CARE BEARS</div>':''}<h3>${cp.id==='spirit'?'CHRISTMAS SPIRIT<br>CHARGING STATION':cp.name}</h3>${state.mode==='demo'?'<p class="no-gps-checkpoint-hint">TAP WHEN YOU SEE THE CHECKPOINT</p>':''}</div><button class="btn small primary" data-start-mission="${cp.id}">${cp.type==='activation'?'Start Activation':cp.type==='radio'?'Tune Signal':cp.type==='diagnostics'?'Start Diagnostics':'Start Mission'}</button></div>`;
    }
    if(!cp){
      return `<div class="mission-card message-card panel complete-message compact-message final-radar-message" id="radarMessage"><div><div class="kicker">Mission Complete</div><h3>MEET SANTA AT HIS GROTTO</h3></div></div>`;
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
    if(state.nav==='radar'&&state.elfPromptSeen&&!state.pitCrewConfirmed){ app.innerHTML=shell(renderPitCrewOnboarding(),false); bindGlobal(); return; }
    if(state.nav==='comms') markAllMessagesRead();
    renderNavShell();
    bindGlobal();
    if(state.nav==='radar'){
      updateRadarLive();
      // In No GPS mode, checkpoints are available immediately; there are no simulated journeys.
    }
  }
  function renderLaunch(){
    // The Mission Briefing is the app entry screen; there is no splash/Start Mission gate.
    return renderOnboardStep(state.bootDone===false?'brief':state.bootDone);
  }
  function renderOnboardStep(step){
    const setupHeader=topBar();
    if(step==='location-finding'||step==='location-result'){
      const finding=step==='location-finding';
      const result=locationOnboardingOutcome;
      const connected=!finding&&result?.status==='connected';
      const failed=!finding&&!connected;
      const accuracy=connected&&Number.isFinite(result.position?.coords?.accuracy)?Math.max(1,Math.round(result.position.coords.accuracy)):null;
      const resultTitle=connected?'<span>LOCATION</span><span>CONNECTED!</span>':'<span>LOCATION</span><span>NOT CONNECTED</span>';
      const detail=connected
        ? `<span>Accurate to about ${accuracy===null?'—':`<strong>${accuracy} m</strong>`}.</span><span>We’ll tell you when a pit stop is close.</span>`
        : 'We couldn’t establish your location.<br>Check your signal and location settings,<br>then try again.';
      const controls=failed?`<button type="button" class="gps-status-demo-link" data-gps-status="demo"><span>CONTINUE WITHOUT GPS</span></button>`:'';
      const retryControl=failed?`<button type="button" class="btn primary wide gps-status-main-btn gps-retry-btn" data-gps-status="retry"><span>TRY AGAIN</span><img class="onboarding-cta-guide-arrow" src="./assets/arrow-right-guide.svg" alt="" aria-hidden="true"></button>`:'';
      const continueControl=connected?`<button type="button" class="btn primary wide gps-status-main-btn gps-retry-btn" data-gps-status="continue"><span>CONTINUE</span><img class="onboarding-cta-guide-arrow" src="./assets/arrow-right-guide.svg" alt="" aria-hidden="true"></button>`:'';
      const findingSpinner=finding?'<div class="gps-finding-spinner" aria-hidden="true"></div>':'';
      const findingTitle=finding?'<h1 class="gps-finding-title"><span>FINDING</span><span>YOU…</span></h1>':'';
      const resultVisual=!finding&&failed?'<div class="gps-error-symbol" aria-hidden="true">!</div>':connected?'<div class="gps-error-symbol gps-success-symbol" aria-hidden="true"><span class="checkmark-icon"></span></div>':'';
      const bodyTitle=!finding?`<h1 class="gps-status-compact-title">${resultTitle}</h1>`:'';
      const bodyCopy=finding
        ? '<span>Your phone may ask for permission.</span><span>Tap <strong>Allow</strong> so we can find you.</span>'
        : detail;
      return `<section class="onboard with-masthead setup-page gps-status-page ${finding?'gps-finding-page':connected?'gps-connected-page':'gps-failed-page'}">${setupHeader}
        <div class="gps-status-content">
          <p class="gps-status-kicker">STEP 2 OF 4 · LOCATION</p>
          <div class="gps-status-progress" aria-label="Onboarding step 2 of 4"><i class="complete"></i><i class="active"></i><i></i><i></i></div>
          <div class="gps-status-main" role="${finding?'status':'group'}" ${finding?'aria-live="polite"':''}>
            ${findingSpinner}${findingTitle}${resultVisual}${bodyTitle}
            <p class="${finding?'gps-finding-description':connected?'gps-connected-description':''}">${bodyCopy}</p>
            ${retryControl}${continueControl}${controls}
          </div>
        </div>
      </section>`;
    }
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
    if(step==='brief') return `<section class="onboard with-masthead setup-page briefing-page">${setupHeader}<div class="briefing-welcome">
      <p class="briefing-welcome-kicker">CALLING ALL ELVES!</p>
      <div class="briefing-welcome-progress" aria-label="Onboarding step 1 of 4"><i class="active"></i><i></i><i></i><i></i></div>
      <div class="briefing-welcome-intro"><h1><span class="line-1">UH OH!</span><span class="line-2">SANTA'S SLEIGH</span><span class="line-3">HAS BROKEN DOWN!</span></h1></div>
      <div class="briefing-welcome-art"><img src="./assets/mission-briefing-santa.webp" alt="Santa waving with his sack of presents"></div>
      <p class="briefing-welcome-description"><span>It’s stuck at Silverstone,</span><span>and Christmas is just around the corner.</span><span>Join Santa’s pit crew,</span><span>take on 12 pit stop challenges and</span><span>help get him back to the North Pole in time!</span></p>
      <button type="button" class="btn primary wide briefing-welcome-cta" data-onboard="location"><span>JOIN THE PIT CREW</span><img class="onboarding-cta-guide-arrow" src="./assets/arrow-right-guide.svg" alt="" aria-hidden="true"></button>
    </div></section>`;
    return `<section class="onboard with-masthead setup-page radar-setup-page location-permission-page">${setupHeader}<div class="location-permission-content">
      <p class="location-permission-kicker">STEP 2 OF 4 · LOCATION</p>
      <div class="location-permission-progress" aria-label="Onboarding step 2 of 4"><i class="complete"></i><i class="active"></i><i></i><i></i></div>
      <h1 class="location-permission-title"><span>LET’S FIND</span><span>YOUR POSITION</span><span>ON THE CIRCUIT!</span></h1>
      <p class="location-permission-description"><span>Enable location so we can track your journey,</span><span>find your next pit stop and unlock challenges</span><span>as you travel around Silverstone.</span></p>
      <div class="location-permission-benefits" aria-label="Location benefits">
        <div class="location-permission-benefit"><span class="location-permission-icon"><img src="./assets/location-circuit-official-guide.webp" alt="" aria-hidden="true"></span><span>See how far it is to your next pit stop</span></div>
        <div class="location-permission-benefit"><span class="location-permission-icon"><img src="./assets/north-pole-flag-brand.webp" alt="" aria-hidden="true"></span><span>Challenges unlock as you drive past</span></div>
      </div>
      <div class="location-permission-actions">
        <button type="button" class="btn primary wide location-permission-cta" data-location="request"><span>ENABLE LOCATION</span><img class="onboarding-cta-guide-arrow" src="./assets/arrow-right-guide.svg" alt="" aria-hidden="true"></button>
      </div>
    </div></section>`;
  }
  function renderPitCrewOnboarding(){
    const players=Math.max(1,Math.min(4,Number(state.pitCrewPlayers)||1));
    return `<section class="onboard with-masthead setup-page pitcrew-onboard-page">${topBar()}
      <div class="pitcrew-onboard-content">
        <p class="pitcrew-onboard-kicker">STEP 4 OF 4 · PIT CREW</p>
        <div class="pitcrew-onboard-progress" aria-label="Onboarding step 4 of 4"><i class="complete"></i><i class="complete"></i><i class="complete"></i><i class="active"></i></div>
        <h1 class="pitcrew-onboard-title"><span>SANTA IS COUNTING</span><span>ON YOU!</span></h1>
        <div class="pitcrew-players-panel">
          <div class="pitcrew-players-label">HOW MANY ELVES ARE PLAYING?</div>
          <div class="pitcrew-players-controls">
            <button type="button" class="pitcrew-player-adjust" data-pitcrew-players="-1" aria-label="Remove a passenger" ${players<=1?'disabled':''}>−</button>
            <div class="pitcrew-player-count" aria-live="polite"><strong>${players}</strong></div>
            <button type="button" class="pitcrew-player-adjust" data-pitcrew-players="1" aria-label="Add a passenger" ${players>=4?'disabled':''}>+</button>
          </div>
        </div>
        <div class="pitcrew-driver-warning"><div><strong>PASSENGERS ONLY</strong><p>Drivers, keep your eyes on the road and enjoy the lights. Leave the phone to your Pit Crew.</p></div></div>
        <button type="button" class="btn primary wide pitcrew-onboard-cta" data-pitcrew-confirm><span>LET’S GO!</span><img class="onboarding-cta-guide-arrow" src="./assets/arrow-right-guide.svg" alt="" aria-hidden="true"></button>
      </div>
    </section>`;
  }
  function renderElfOnboarding(){
    return `<section class="onboard with-masthead setup-page elf-setup-page">${topBar()}
      <div class="elf-onboard-content">
        <p class="elf-onboard-kicker">STEP 3 OF 4 · RADIO</p>
        <div class="elf-onboard-progress" aria-label="Onboarding step 3 of 4"><i class="complete"></i><i class="complete"></i><i class="active"></i><i></i></div>
        <h1 class="elf-onboard-title"><span>TURN UP</span><span>ELF FM!</span></h1>
        <div class="elf-onboard-art" aria-label="Two elves in racing suits">
          <div class="elf-onboard-portrait"><img src="./assets/elf-fm-elf-one.webp" alt="Elf in a red racing suit"></div>
          <div class="elf-onboard-portrait"><img src="./assets/elf-fm-elf-two.webp" alt="Second elf in a red racing suit"></div>
        </div>
        <p class="elf-onboard-description"><span>Tune in to <strong>87.7</strong> to listen to <strong>ELF FM</strong>.</span><span>The radio stays off until you turn it on!</span></p>
        <button type="button" class="btn primary wide elf-onboard-primary" data-elf-onboard="tune"><span>TURN ON ELF FM</span><img class="onboarding-cta-guide-arrow" src="./assets/arrow-right-guide.svg" alt="" aria-hidden="true"></button>
        <button type="button" class="elf-onboard-secondary" data-elf-onboard="continue">CONTINUE WITHOUT RADIO</button>
      </div>
    </section>`;
  }

  function renderRadar(){
    const cp=current();
    const modeClass=state.mode==='demo'?' demo-radar-page':'';
    const finalCircuitOverview=state.completed.includes('northern');
    const noGpsOverview=state.mode==='demo';
    const localVirtualCircuitMode=state.mode==='live'&&localTestEnabled&&localTestRouteStatus().ready;
    const circuitMode=noGpsOverview||state.completed.includes('entry')||finalCircuitOverview||localVirtualCircuitMode;
    const circuitLayer=(finalCircuitOverview||noGpsOverview)
      ? `<div class="track-radar-map final-overview" id="trackRadarMap" aria-hidden="true"><div class="track-radar-art" id="trackRadarArt"></div></div>`
      : circuitMode
        ? `<div class="track-radar-map waiting" id="trackRadarMap" aria-hidden="true" style="--circuit-radar-zoom:${CIRCUIT_RADAR_ZOOM}"><div class="track-radar-art" id="trackRadarArt"></div><span class="track-radar-target hidden" id="trackRadarTarget"></span></div>`
        : '';
    const userMarker=(finalCircuitOverview||noGpsOverview)?'':'<div class="user-dot"></div>';
    const targetMarker=!(finalCircuitOverview||noGpsOverview)&&cp?'<div class="target-dot hidden"></div>':'';
    return `<section class="radar-page${modeClass}">${statusStrip()}<section class="radar-zone" aria-label="Live checkpoint radar"><section class="radar-wrap"><div class="radar${circuitMode?' circuit-radar':''}${(finalCircuitOverview||noGpsOverview)?' circuit-overview-radar':''}">${circuitLayer}<div class="sweep"></div>${userMarker}${targetMarker}</div></section></section>${radarMessage(cp)}</section>`;
  }
  function missionStatus(cp){
    const idx=checkpointIndex(cp.id);
    if(state.completed.includes(cp.id)) return 'COMPLETE';
    if(state.mode==='demo') return checkpointIndex(cp.id)===state.routeIndex?'AVAILABLE':'LOCKED';
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
      const isCareBearsPartner=cp.id==='power'||cp.id==='spirit';
      const partnerCopy=isCareBearsPartner?'<div class="mission-partner-line">IN PARTNERSHIP WITH CARE BEARS</div>':'';
      const partnerHeart=isCareBearsPartner?'<img class="care-bears-index-heart" src="./assets/care-bears-heart-red.webp" alt="Care Bears">':'';
      return `<div class="mission-row panel ${status==='COMPLETE'?'done':''} ${status==='AVAILABLE'?'available':''} ${playable?'interactive':''} ${isCareBearsPartner?'partner-row':''}"${interaction}><div class="mission-index">${cp.mc.replace('MC-','')}</div><div class="mission-row-copy"><div class="kicker">${cp.location}</div><h3>${cp.name}</h3>${partnerCopy}</div><div class="row-action">${partnerHeart}<div class="row-status">${status}</div></div></div>`;
    }).join('');
    return `<section class="missions-log"><div class="missions-feed-viewport"><div class="missions-feed-scroll"><div class="list missions-list">${rows}</div></div></div></section>`;
  }
  function renderSleigh(){
    const r=recovery();
    // The ten approved rebuild systems correspond to checkpoints 01–10.
    // Their completion state and percentage remain driven by the existing
    // canonical mission state; this screen changes presentation only.
    const items=[
      ['entry','Battery'],
      ['velocity','Safety Check'],
      ['luffield','Radio'],
      ['power','Magic Engine'],
      ['spirit','Spirit Tank'],
      ['escapade','Reindeer Power'],
      ['comet','Steering'],
      ['jingle','Turbo Boosters'],
      ['lando','Landing Lights'],
      ['aurora','Sat-Nav']
    ];
    const firstPending=items.findIndex(([id])=>!state.completed.includes(id));
    const steps=items.map(([id,label],i)=>{
      const done=state.completed.includes(id);
      const next=!done&&i===firstPending;
      const status=done?'FIXED!':next?'UP NEXT':'NEEDS HELP';
      const kind=done?'done':next?'next':'pending';
      return `<div class="sleigh-repair-row ${kind}"><span class="sleigh-repair-dot" aria-hidden="true"></span><span class="sleigh-repair-name">${label}</span><span class="sleigh-repair-status">${status}</span></div>`;
    }).join('');
    const bars=items.map(([id],i)=>`<span class="sleigh-progress-segment${state.completed.includes(id)?' filled':''}" aria-hidden="true"></span>`).join('');
    return `<section class="sleigh-card sleigh-rebuild-redesign" aria-label="Santa's sleigh rebuild">
      <header class="sleigh-rebuild-heading"><div class="kicker">IN THE GARAGE</div><h1>HOW’S THE<br>SLEIGH?</h1></header>
      <div class="sleigh-reveal-frame" role="img" aria-label="Santa's sleigh ${r}% restored, with repaired sections revealed in colour">
        <img class="sleigh-reveal-grey" src="./assets/north-pole-brand-sleigh.webp" alt="" aria-hidden="true">
        <img class="sleigh-reveal-colour" src="./assets/north-pole-brand-sleigh.webp" alt="" aria-hidden="true" style="clip-path:inset(0 ${100-r}% 0 0)">
      </div>
      <div class="sleigh-progress-row"><div class="sleigh-progress-segments" role="progressbar" aria-label="Sleigh rebuild progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${r}">${bars}</div><strong class="sleigh-progress-number">${r}%</strong></div>
      <div class="sleigh-repair-viewport"><div class="sleigh-repair-list" role="region" aria-label="Sleigh systems" tabindex="0"><div class="sleigh-repair-rows">${steps}</div></div><div class="sleigh-scroll-track" aria-hidden="true"><div class="sleigh-scroll-thumb"></div></div></div>
    </section>`;
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
    const feed=[...state.messages].sort((a,b)=>b.timestamp-a.timestamp).map(m=>`<article class="comms-message panel ${m.read?'':'unread'}"><div class="comms-message-head"><div class="kicker">${messageActivationLabel(m)}</div><time datetime="${new Date(m.timestamp).toISOString()}">${formatMessageTime(m.timestamp)}</time></div>${['power','spirit','MC-04','MC-05'].includes(m.checkpointId)||['complete:power','complete:spirit'].includes(m.key)?'<div class="comms-partner-line">IN PARTNERSHIP WITH CARE BEARS</div>':''}<h3>${m.title}</h3><p>${m.body}</p></article>`).join('');
    const gpsOn=state.mode==='live'&&state.gpsEnabled!==false;
    const streamReady=Boolean(ELF_STREAM_URL);
    const radioButton=state.elfUnlocked
      ? `<button class="mission-setting-toggle radio-setting ${state.elfAudioOn?'on':'off'}" id="elfAudioToggle" data-elf-audio aria-pressed="${state.elfAudioOn?'true':'false'}" aria-label="ELF FM ${state.elfAudioOn?'on':'off'}" ${streamReady?'':'aria-disabled="true"'}><span class="mission-setting-icon"><img src="./assets/radio-setting-icon.svg" alt=""></span><span class="mission-setting-copy"><span>ELF FM</span></span></button>`
      : `<button class="mission-setting-toggle radio-setting off" data-tune-elf aria-pressed="false" aria-label="Tune ELF FM"><span class="mission-setting-icon"><img src="./assets/radio-setting-icon.svg" alt=""></span><span class="mission-setting-copy"><span>ELF FM</span></span></button>`;
    const gpsClass=state.mode==='demo'?'off':gpsOn?'on':'off';
    const settings=`<section class="mission-settings panel"><div class="mission-settings-head"><div class="kicker">Mission Settings</div></div><div class="mission-settings-grid"><div class="mission-setting-toggle mission-setting-status ${gpsClass}" aria-label="GPS Location ${state.mode==='demo'?'off':gpsOn?'active':state.gpsCondition.toLowerCase()}"><span class="mission-setting-icon"><img src="./assets/radar-setup-icon.svg" alt=""></span><span class="mission-setting-copy"><span>GPS Location</span></span></div><button class="mission-setting-toggle ${state.audio?'on':'off'}" data-mission-audio-setting aria-pressed="${state.audio?'true':'false'}" aria-label="Mission Audio ${state.audio?'on':'off'}"><span class="mission-setting-icon">${settingAudioIcon()}</span><span class="mission-setting-copy"><span>Mission Audio</span></span></button>${radioButton}</div></section>`;
    const feedBody=feed||'<div class="comms-empty panel">No transmissions received.</div>';
    return `${settings}<section class="comms-feed"><div class="comms-section-title"><span>Message Feed</span></div><div class="comms-feed-viewport"><div class="comms-feed-scroll">${feedBody}</div></div></section>`;
  }


  function missionHeader(cp){
    const pitStopNumber=String(cp.mc||'').replace('MC-','').padStart(2,'0');
    const label=`PIT STOP ${pitStopNumber} / ${cp.location}`;
    if(cp.type==='commsrelay'&&cp.id==='luffield'){
      return `<div class="mission-head luffield-head"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><h1><span>BOX, BOX,</span><span>HO, HO, HO!</span></h1><p class="support-copy luffield-subtitle"><span class="luffield-subtitle-first">Santa can’t hear us over the engine noise!</span><span class="luffield-subtitle-next">Connect the radio by tapping the links as the signal hits it,</span><span class="luffield-subtitle-next2">so we can call him into the pits.</span></p></div>`;
    }
    if(cp.type==='diagnostics'&&cp.id==='velocity'){
      return `<div class="mission-head diagnostics-head diagnostics-head--santa"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><h1><span>SANTA’S</span><span>PARC FERMÉ</span></h1><p class="support-copy"><span>All racing cars get checked in parc fermé, and</span><span>Santa’s sleigh is no different! Scan every part.</span></p></div>`;
    }
    if(cp.type==='diagnostics'){
      return `<div class="mission-head diagnostics-head"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><div class="diagnostics-brand"><img src="./assets/audi-rings-2026.webp" alt="Audi"></div><h1>${cp.name}</h1><p class="support-copy">${missionInstruction(cp.type)}</p></div>`;
    }
    if(cp.type==='activation'){
      return `<div class="mission-head mc01-head"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><h1>${cp.name}</h1><p class="support-copy"><span>Uh-oh, Santa's sleigh has run out of battery!</span><span>Connect to the circuit and power it back up.</span></p></div>`;
    }
    if(cp.type==='artifacts'){
      return `<div class="mission-head artifact-head powerup-head"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><div class="care-bears-partner-line">IN PARTNERSHIP WITH CARE BEARS</div><h1><span>PIT LANE</span><span>POWER-UP</span></h1><p class="support-copy">Sparkles of Christmas magic are zooming down the pit lane. Catch them to power up the sleigh!</p></div>`;
    }
    if(cp.type==='spirit'){
      return `<div class="mission-head spirit-head spirit-head--charging"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><div class="care-bears-partner-line">IN PARTNERSHIP WITH CARE BEARS</div><h1><span>CHRISTMAS SPIRIT</span><span>CHARGING STATION</span></h1><p class="support-copy spirit-subtitle"><span>The sleigh runs on Christmas spirit,</span><span>and it’s running low! Fill it back up.</span></p></div>`;
    }
    if(cp.type==='power'&&cp.id==='escapade'){
      return `<div class="mission-head raceway-head raceway-head--line"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><h1><span>REINDEER</span><span>RACING LINE</span></h1><p class="support-copy">How fast can you go following the racing line?</p></div>`;
    }
    if(cp.type==='comet'&&cp.id==='comet'){
      return `<div class="mission-head comet-head comet-head--corner"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><h1><span>COMET’S</span><span>CORNER</span></h1><p class="support-copy">Comet the reindeer is great at steering, but he needs your help with these twisty corners!</p></div>`;
    }
    if(cp.type==='jingle'){
      return `<div class="mission-head sleigh-speed-head"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><h1><span>SLEIGH SPEED</span><span>STRAIGHT</span></h1><p class="support-copy"><span>This is the fastest part of the track!</span><span>Score to give Santa a speed boost!</span></p></div>`;
    }
    if(cp.type==='lando'){
      return `<div class="mission-head landing-lights-head"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><h1><span>LANDO’S</span><span>LANDING LIGHTS</span></h1><p class="support-copy">Santa needs speedy reactions to land on all those rooftops. Are yours as quick as his?</p></div>`;
    }
    if(cp.type==='northern'){
      return `<div class="mission-head north-pole-head"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><h1><span>NORTH POLE</span><span>POSITION</span></h1><p class="support-copy"><span>The sleigh is on the grid and ready to fly.</span><span>Give Santa the green flag!</span></p></div>`;
    }
    if(cp.type==='lapland'){
      return `<div class="mission-head lapland-head"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><h1><span>LIGHTS OUT &amp;</span><span>SLEIGH AWAY</span></h1><p class="support-copy">Final checks, Pit Crew! Wake up every part you’ve fixed before the sleigh leaves the garage.</p></div>`;
    }
    return `<div class="mission-head"><div class="meta"><div class="kicker">${label}</div><button class="linkbtn" data-exit-mission>Exit Mission</button></div><h1>${cp.name}</h1><p class="support-copy">${missionInstruction(cp.type)}</p></div>`;
  }
  function missionInstruction(type){
    return ({
      activation:'Establish a link with the circuit and route power to Santa-1.',
      diagnostics:'Capture the racing data needed to rebuild Santa-1.',
      radio:'Tune the receiver to 87.7 ELF FM.',
      commsrelay:'Santa can’t hear us over the engine noise! Connect the radio by tapping the links as the signal hits it, so we can call him into the pits.',
      power:'Test Santa-1’s propulsion system.',
      spirit:'Store the energy signatures.',
      placeholder:'This checkpoint is reserved while the final installation game is developed.',
      artifacts:'Collect the energy signatures.',
      comet:'Calibrate Santa-1’s flight controls.',
      jingle:'Restore Santa-1’s guidance system.',
      lando:'Calibrate Santa-1’s flight response.',
      aurora:'Follow the Northern Lights to find the way home to the North Pole.',
      lapland:'Bring Santa-1’s launch systems online.',
      northern:'Authorise Santa-1 for departure.'
    })[type]||'';
  }
  function renderMission(id){
    const cp=id==='elf-radio'?ELF_RADIO_MISSION:CHECKPOINTS.find(c=>c.id===id); if(!cp) return '';
    // Only the twelve circuit activations show the shared multiplayer indicator.
    const multiplayer=cp.id!=='elf-radio'&&Math.max(1,Number(state.pitCrewPlayers)||1)>1;
    const turn=state.missionPlayerTurnId===id?Math.max(1,Math.min(Number(state.pitCrewPlayers)||1,Number(state.missionPlayerTurn)||1)):1;
    const indicator=multiplayer?`<div class="mission-player-turn" aria-label="Player ${turn}"><span class="mission-player-turn-elf" aria-hidden="true"><img src="./assets/pit-crew-santa-helmet-guide.png" alt=""></span><span>PLAYER ${turn}</span></div>`:'';
    // Insert the shared capsule as the first child of the existing game box.
    // Each game's own progress header/markers therefore follow underneath it;
    // when a completion/changeover replaces missionContent, the capsule leaves
    // with the game instead of remaining above the popup.
    const body=missionBody(cp);
    const gameBox=indicator
      ? body.replace(/^(<div\b[^>]*\bmission-instrument\b[^>]*>)/, `$1${indicator}`)
      : body;
    return `<div class="mission-shell mission-${cp.type}">${topBar()}${missionHeader(cp)}<div class="mission-content" id="missionContent">${gameBox}</div></div>`;
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
    // Use the radar's exact circuit asset and canonical checkpoint positions.
    const installationMarkers=CHECKPOINTS.filter(cp=>/^MC-(0[1-9]|1[0-2])$/.test(cp.mc)).map((cp,i)=>{
      const point=geoToCircuitPoint(cp.lat,cp.lng);
      if(!point) return '';
      const x=point.x.toFixed(2),y=point.y.toFixed(2);
      return `<g class="mc01-installation-marker" data-mc01-installation="${i}" aria-hidden="true" transform="translate(${x} ${y})"><circle class="mc01-installation-disc" r="3.1"></circle><circle class="mc01-installation-centre" r=".85"></circle></g>`;
    }).join('');
    return `<div class="mission-instrument panel mc01-panel mc01-brand-panel" id="mc01Activation" data-stage="detected">
      <div class="mc01-readout mc01-readout-top">
        <span class="mc01-bolt" aria-hidden="true"><img src="./assets/system-power.svg" alt=""></span>
        <div class="mc01-readout-copy"><span id="mc01StateLabel">Circuit Link</span><strong id="mc01State">Signal Detected</strong></div>
        <div class="mc01-signal-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      </div>
      <div class="mc01-track-stage" aria-label="Silverstone circuit with installation markers appearing as energy transfers">
        <div class="mc01-restored-track-energy" aria-hidden="true"></div>
        <svg class="mc01-branded-circuit" viewBox="0 0 210 126" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          <image href="./assets/f1-circuit-red-keyline.svg" width="210" height="126" preserveAspectRatio="xMidYMid meet"></image>
        </svg>
        <svg class="mc01-marker-overlay" viewBox="0 0 210 126" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
          ${installationMarkers}
        </svg>
      </div>
      <div class="mc01-transfer mc01-transfer-bottom" aria-label="Circuit Link energy transfer progress">
        <div class="mc01-transfer-meta"><span>Energy Transfer</span><strong id="mc01TransferValue">0%</strong></div>
        <div class="mc01-transfer-track"><i id="mc01TransferFill"></i></div>
        <button type="button" class="btn primary wide mc01-charge-cta" id="mc01ChargeButton"><span>TAP TO CHARGE</span><img class="onboarding-cta-guide-arrow" src="./assets/arrow-right-guide.svg" alt="" aria-hidden="true"></button>
      </div>
    </div>`;
  }

  function diagnosticsBody(){
    const sensors=[
      {name:'AERO',key:'aero',icon:'./assets/parc-ferme-aero.webp',viz:`<div class="mc02-icon mc02-icon-aero"><svg class="mc02-svg mc02-aero-svg" viewBox="0 0 210 126" aria-hidden="true"><path class="mc02-aero-frame-path" d="M27.16,11.07V120.66h6V17.08h6V120.64h6V17.08H164.74V120.64h6V17.08h6V120.66h6V11.07ZM49.7,34H160.2V28H49.7Z"/><path class="mc02-aero-ring-path" d="M105,41.51a39.27,39.27,0,1,0,39.27,39.26A39.3,39.3,0,0,0,105,41.51Zm0,72.88a33.62,33.62,0,1,1,33.62-33.62A33.66,33.66,0,0,1,105,114.39Z"/><g class="mc02-aero-fan-group"><path class="mc02-aero-blades-path" d="M105,114.39m14.35-27.73c-1.41.32-4.52.71-6.84-1.35a8.56,8.56,0,0,0,1-2.37c4.32-1.43,10.41-4.22,11.17-12,.86-8.82-8-15.09-14.52-16.73-3.49-.87-6.91.35-8.5,3.05-1.5,2.55-1,5.67,1.27,8.12,1,1.06,2.87,3.56,2.26,6.6H105a8.88,8.88,0,0,0-2.38.33c-3.4-3-8.85-6.9-16-3.68-8.07,3.67-9.09,14.46-7.23,21,1,3.45,3.76,5.8,6.89,5.83h.06c2.94,0,5.36-2,6.34-5.16.42-1.38,1.64-4.26,4.58-5.25a9.18,9.18,0,0,0,1.56,2c-.92,4.45-1.55,11.12,4.79,15.65A12.39,12.39,0,0,0,111,105c5.55,0,11.2-3.17,14.41-6.5,2.5-2.58,3.15-6.15,1.61-8.88S122.62,85.9,119.35,86.66Zm-23-7.24c-4.87,1.25-7.82,5.32-9,9.19-.08.27-.4,1.16-.94,1.16h0c-.41,0-1.15-.47-1.51-1.74-1.1-3.81-1-11.91,4.13-14.25,3.39-1.54,6.13-.29,8.85,1.91A8.6,8.6,0,0,0,96.33,79.42Zm10.19-19.27c.2-.35,1-.76,2.26-.44,3.85,1,10.82,5.09,10.27,10.7-.36,3.71-2.81,5.45-6.07,6.71a8.86,8.86,0,0,0-2.47-3.18c1.35-4.85-.7-9.43-3.46-12.39C106.85,61.34,106.24,60.62,106.52,60.15Zm-5.37,20.62A3.85,3.85,0,1,1,105,84.62,3.85,3.85,0,0,1,101.15,80.77Zm20.2,13.81c-2.76,2.85-9.82,6.82-14.41,3.54-3-2.16-3.31-5.16-2.77-8.6.27,0,.55,0,.83,0a8.71,8.71,0,0,0,3.16-.6c3.52,3.6,8.52,4.1,12.46,3.2.28-.07,1.21-.24,1.48.24S122.27,93.63,121.35,94.58Z"/></g></svg></div>`},
      {name:'STABILITY',key:'stability',icon:'./assets/parc-ferme-stability.webp',viz:`<div class="mc02-icon mc02-icon-stability"><span class="mc02-layer mc02-stability-car"></span><span class="mc02-layer mc02-stability-headlights"></span></div>`},
      {name:'POWER',key:'power',icon:'./assets/parc-ferme-power.webp',viz:`<div class="mc02-icon mc02-icon-power"><svg class="mc02-svg mc02-power-svg" viewBox="0 0 210 126" aria-hidden="true"><path class="mc02-power-gauge-path" d="M105,15.05A72.14,72.14,0,0,0,32.93,87.11a73,73,0,0,0,.77,10.57l.44,3,21.67-3.09-.84-6L39.28,93.82c-.22-2.22-.34-4.47-.34-6.71a65.69,65.69,0,0,1,13.47-39.9L64.67,57.39l3.85-4.63L56.26,42.58a65.89,65.89,0,0,1,45.86-21.44v16h6v-16a65.93,65.93,0,0,1,45.6,21.43L139.11,54.7,141.05,57a47.1,47.1,0,0,1,10.41,36.91l-.64,3.16,25,3.59.44-3a73.21,73.21,0,0,0,.77-10.58A72.15,72.15,0,0,0,105,15.05Z"/><g class="mc02-power-needle-group"><path class="mc02-power-needle-path" d="M171.32,117.08l-64-35.21.06,0-.12,0A5.77,5.77,0,0,0,99.39,89a5.89,5.89,0,0,0,3.16,3.34L170.41,119a1.08,1.08,0,0,0,.91-2Z"/></g></svg></div>`},
      {name:'CONTROL',key:'control',icon:'./assets/parc-ferme-control.webp',viz:`<div class="mc02-icon mc02-icon-control"><span class="mc02-layer mc02-control-wheel"></span><span class="mc02-layer mc02-control-ring"></span></div>`},
      {name:'TRACTION',key:'traction',icon:'./assets/parc-ferme-traction.webp',viz:`<div class="mc02-icon mc02-icon-traction"><span class="mc02-layer mc02-traction-car"></span><span class="mc02-layer mc02-traction-skids"></span><span class="mc02-layer mc02-traction-shine"></span></div>`},
      {name:'RESPONSE',key:'response',icon:'./assets/parc-ferme-response.webp',viz:`<div class="mc02-icon mc02-icon-response"><span class="mc02-layer mc02-response-cones"></span><span class="mc02-layer mc02-response-arrow"></span><span class="mc02-layer mc02-response-shine"></span></div>`}
    ];
    return `<div class="mission-instrument panel diagnostics-panel"><section class="diag-progress-card"><div class="diag-progress-copy"><div class="diag-progress-label">PARTS CHECKED</div><div class="diag-progress-value" id="diagProgressValue">0/6</div></div><div class="diag-progress-track" aria-label="Parts checked progress">${Array.from({length:6},(_,i)=>`<i data-diag-progress="${i}"></i>`).join('')}</div></section><div class="sensor-grid diagnostics-grid">${sensors.map((x,i)=>`<button class="sensor parc-scan-card sensor-${x.key}" data-sensor="${i}" data-diagnostic="${x.key}"><strong class="parc-card-title">${x.name}</strong><span class="sensor-viz-shell"><img class="parc-icon-art" src="${x.icon}" alt="" aria-hidden="true"></span><span class="state">Tap to scan</span></button>`).join('')}</div><button class="btn primary wide parc-complete-cta" id="diagComplete" disabled><span>COMPLETE SCAN</span><img class="onboarding-cta-guide-arrow" src="./assets/arrow-right-guide.svg" alt="" aria-hidden="true"></button></div>`;
  }

  function radioBody(){return `<div class="mission-instrument panel"><div class="wave transmission-wave" id="radioWave">${'<b></b>'.repeat(24)}</div><div class="frequency"><span id="freqVal">86.4</span> <small>FM</small></div><div class="range-wrap"><input id="freqRange" class="range" type="range" min="86" max="89" value="86.4" step="0.1"><div class="freq-marks"><span>86.0</span><span>87.0</span><span>88.0</span><span>89.0</span></div></div><div class="signal-state" id="signalState">Searching for signal</div><button class="btn primary wide" id="lockSignal" disabled><span>LOCK SIGNAL</span><img class="onboarding-cta-guide-arrow" src="./assets/arrow-right-guide.svg" alt="" aria-hidden="true"></button></div>`}
  function commsRelayBody(){
    return `<div class="mission-instrument panel comms-relay-panel">
      <div class="relay-progress-head"><span>RADIO LINKS</span><strong id="relayLockedCount">0/4</strong></div>
      <div class="relay-progress-track" aria-label="Radio links checked progress">${Array.from({length:4},(_,i)=>`<i data-relay-progress="${i}"></i>`).join('')}</div>
      <div class="relay-network" id="relayNetwork" aria-label="Radio signal linking North Pole to Santa">
        <svg class="relay-route" viewBox="0 0 100 150" preserveAspectRatio="none" aria-hidden="true">
          <line class="relay-hop-line" data-hop="0" x1="25" y1="25" x2="75" y2="25"></line>
          <line class="relay-hop-line" data-hop="1" x1="75" y1="25" x2="25" y2="75"></line>
          <line class="relay-hop-line" data-hop="2" x1="25" y1="75" x2="75" y2="75"></line>
          <line class="relay-hop-line" data-hop="3" x1="75" y1="75" x2="25" y2="125"></line>
          <line class="relay-hop-line" data-hop="4" x1="25" y1="125" x2="75" y2="125"></line>
        </svg>
        ${Array.from({length:5},(_,i)=>`<span class="relay-carrier-packet" data-carrier="${i}" aria-hidden="true"></span>`).join('')}
        <div class="relay-cell relay-endpoint relay-origin"><span class="relay-radio-icon"><img src="./assets/relay-transmitter-icon.svg" alt="" aria-hidden="true"><b>TX</b></span><small>NORTH POLE</small></div>
        ${[0,1,2,3].map(i=>`<div class="relay-cell relay-capture"><button class="relay-node ${i===0?'active':''}" data-relay="${i}" aria-label="Link ${i+1}"><span class="relay-target"></span><span class="relay-pulse"></span><span class="relay-core">${i+1}</span></button><small>LINK 0${i+1}</small></div>`).join('')}
        <div class="relay-cell relay-endpoint relay-destination"><span class="relay-receiver-icon"><img src="./assets/relay-receiver-hi-spec.svg" alt="" aria-hidden="true"><b>RADIO</b></span><small>SANTA</small></div>
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
          <div class="power-speed-hud"><span>MPH</span><strong><b id="powerSpeed">0</b><small>MPH</small></strong></div>
          <div class="power-propulsion-hud"><span>POWER</span><strong id="powerOutput">0%</strong></div>
        </div>
        <div class="power-rev-wrap"><div class="power-rev" id="powerRev">${revSegments}</div></div>
        <div class="power-road-scene" id="powerRoad">
          <div class="power-road-markers" aria-hidden="true"></div>
          <div class="power-sky-sprite" aria-hidden="true"></div>
          <div class="power-ground" aria-hidden="true">
            <div class="power-grass-plane"></div>
            <div class="power-road-plane"></div>
          </div>
          <div class="power-horizon-seam" aria-hidden="true"></div>
          <div class="power-speed-lines" aria-hidden="true">${Array.from({length:12},()=>'<i></i>').join('')}</div>
          <div class="power-car" id="powerCar">
            <img class="power-car-sprite" src="./assets/reindeer-racing-line-f1-up.webp" alt="Top-down Silverstone F1 racing car facing forwards">
            <span class="power-exhaust power-exhaust-left"></span><span class="power-exhaust power-exhaust-right"></span>
          </div>
          <div class="power-burst" id="powerBurst" aria-hidden="true"><i></i><i></i><i></i></div>
        </div>
        <div class="power-max-hold"><span>SPEED LOCK</span><div><i id="powerMaxFill"></i></div><strong id="powerMaxState">STANDBY</strong></div>
      </div>
      <div class="visually-hidden" id="powerState" aria-live="polite">Ready</div>
      <button class="btn primary wide power-accelerator" id="powerAccelerator" aria-label="Press and hold to accelerate">GO, GO GO!</button>
    </div>`;
  }
  function spiritBody(){
    const tankDefs=[
      {side:'left',index:0,key:'purple',rgb:'198,92,255',color:'#c65cff',name:'Purple energy',snowflake:1},
      {side:'left',index:1,key:'green',rgb:'92,245,96',color:'#5cf560',name:'Green energy',snowflake:2},
      {side:'left',index:2,key:'red',rgb:'255,92,116',color:'#ff5c74',name:'Red energy',snowflake:3},
      {side:'left',index:3,key:'blue',rgb:'76,219,255',color:'#4cdbff',name:'Light blue energy',snowflake:4},
      {side:'right',index:0,key:'yellow',rgb:'255,224,84',color:'#ffe054',name:'Yellow energy',snowflake:4},
      {side:'right',index:1,key:'pink',rgb:'255,110,186',color:'#ff6eba',name:'Pink energy',snowflake:3},
      {side:'right',index:2,key:'white',rgb:'247,250,255',color:'#f7faff',name:'White energy',snowflake:2},
      {side:'right',index:3,key:'orange',rgb:'255,122,28',color:'#ff7a1c',name:'Orange energy',snowflake:1}
    ];
    const tankCells=side=>tankDefs.filter(tank=>tank.side===side).map(tank=>`<div class="spirit-tank-cell spirit-tank-${tank.key}" data-spirit-tank="${tank.side}-${tank.index}" data-spirit-color="${tank.key}" data-spirit-rgb="${tank.rgb}" data-spirit-hex="${tank.color}" style="--tank-rgb:${tank.rgb};--tank-color:${tank.color};" aria-label="${tank.name} storage tank">
      <span class="spirit-tank-energy"></span>
      <button type="button" class="spirit-tank-power" data-spirit-charge="${tank.side}-${tank.index}" aria-label="Charge ${tank.name} tank"><span class="spirit-power-bolt" aria-hidden="true"><img src="./assets/care-bears-snowflake-${tank.snowflake}.webp" alt="" draggable="false"></span><span class="spirit-cell-state" aria-hidden="true">TAP TO FILL!</span></button>
    </div>`).join('');
    const stageDots=Array.from({length:8},(_,i)=>`<i data-spirit-stage-dot="${i}"></i>`).join('');
    return `<div class="mission-instrument panel spirit-panel spirit-panel--charging" id="spiritRig" data-stage="0">
      <div class="spirit-score"><span>CHRISTMAS SPIRIT</span><strong><b id="spiritStageNumber">0</b>/8</strong></div>
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
    return `<div class="mission-instrument panel artifact-panel pit-lane-powerup-panel">
      <div class="artifact-score"><span>SPARKLES CAUGHT</span><strong id="artifactProgress">0/8</strong></div>
      <div class="artifact-progress-track" aria-hidden="true">${Array.from({length:8},(_,i)=>`<i data-artifact-step="${i}"></i>`).join('')}</div>
      <div class="artifact-field" id="artifactField" data-intensity="1" aria-label="Pit Lane Power-Up sparkle playfield">
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
      <div class="jingle-progress-head"><span>SPEED BOOSTS</span><strong id="jingleLockCount">0 / 3</strong></div>
      <div class="jingle-lock-track" aria-label="Speed boosts progress">${[1,2,3].map(i=>`<i class="${i===1?'is-next':''}" data-jingle-beam="${i}"></i>`).join('')}</div>
      <div class="jingle-arena is-awaiting-start" id="jingleArena" tabindex="0" role="application" aria-label="Sleigh Speed Straight game. Start the puck, then tap or slide horizontally to steer the paddle and direct the puck into each target.">
        <div class="jingle-grid" aria-hidden="true"><img class="jingle-centre-mark" src="./assets/silverstone-s-mark.webp" alt=""></div>
        <div class="jingle-energy-rail rail-left" aria-hidden="true"><i></i></div>
        <div class="jingle-energy-rail rail-right" aria-hidden="true"><i></i></div>
        <div class="jingle-receiver" id="jingleReceiver" aria-hidden="true"><span></span><i></i></div>
        <div class="jingle-goal-flare" id="jingleGoalFlare" aria-hidden="true"></div>
        <div class="jingle-puck-trail" id="jinglePuckTrail" aria-hidden="true"></div>
        <button type="button" class="jingle-puck is-ready" id="jinglePuck" aria-label="Start Sleigh Speed Straight"><i></i><img class="jingle-play-icon" src="./assets/video-play.svg" alt="" aria-hidden="true"><strong class="jingle-puck-countdown" id="jingleCountdown"></strong></button>
        <div class="jingle-paddle" id="jinglePaddle" aria-hidden="true"><i></i></div>
        <div class="jingle-drag-prompt" id="jinglePrompt"><strong>TAP TO STEER</strong></div>
      </div>
      <div class="jingle-state" id="jingleState" aria-live="polite">Beam 01 ready</div>
    </div>`;
  }
  function landoBody(){
    return `<div class="mission-instrument panel lando-panel">
      <div class="lando-round-head"><span>REACTION TESTS</span><strong id="landoRound">1 / 4</strong></div>
      <div class="lando-progress-track" aria-label="Reaction test progress">
        ${[1,2,3,4].map(i=>`<span class="lando-progress-segment ${i===1?'active':''}" data-lando-progress="${i}"></span>`).join('')}
      </div>
      <div class="lando-gantry-art" id="landoGantry" aria-label="Five column start light gantry with four stacked lamps">
        <img src="./assets/lando-gantry.webp" alt="" aria-hidden="true">
        <div class="lando-light-overlay" aria-hidden="true">
          ${[0,1,2,3,4].map(col=>[0,1,2,3].map(row=>`<span class="lando-lamp" data-col="${col}" data-row="${row}"></span>`).join('')).join('')}
        </div>
      </div>
      <div class="lando-score-grid" aria-label="Recorded reaction times">
        ${[1,2,3,4].map(i=>`<div class="lando-result ${i===1?'active':''}" data-lando-result="${i}"><span class="lando-score-label">GO ${i}</span><strong class="lando-score-placeholder">—</strong></div>`).join('')}
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
      <div class="aurora-north" aria-hidden="true"><i></i></div>
      <div class="aurora-dial" id="auroraDial" data-active-ring="outer" role="group" aria-label="Aurora Apex navigation alignment instrument">
        <div class="aurora-field" aria-hidden="true"></div>
        <div class="aurora-target-line" aria-hidden="true"></div>
        <div class="aurora-capture-gate" aria-hidden="true"><i></i></div>
        <div class="aurora-lock-pointer" aria-hidden="true"></div>
        ${rings.map(key=>`<button type="button" class="aurora-ring aurora-ring-${key}" data-aurora-ring="${key}" aria-label="Lock ${key} navigation ring"><img src="./assets/aurora-ring-${key}.webp" alt="" aria-hidden="true"><span class="aurora-lock-notch" aria-hidden="true"></span></button>`).join('')}
        <div class="aurora-charge-pulse" aria-hidden="true"></div>
        <div class="aurora-final-wave" aria-hidden="true"></div>
        <div class="aurora-compass" aria-hidden="true"><span><img class="aurora-compass-mark" src="./assets/north-star-brand-guide.webp" alt=""></span></div>
      </div>
      <button class="btn primary wide aurora-align-btn" type="button" id="auroraAlignBtn">TAP TO ALIGN</button>
      <div class="visually-hidden" id="auroraState" aria-live="polite">Align the active navigation ring with the North Pole axis.</div>
    </div>`;
  }
  function laplandBody(){
    // Ten mission-linked systems, arranged as two balanced five-row columns.
    // Existing system names remain unchanged; MC01/MC02 add CIRCUITRY + DIAGNOSTIC.
    // Row-paired markup is interleaved so the visible columns read in mission order:
    // column 1 = 1–5, column 2 = 6–10.
    const partNames=['BATTERY','SAFETY CHECK','RADIO','MAGIC ENGINE','SPIRIT TANK',
      'REINDEER HARNESS','STEERING','TURBO BOOSTERS','LANDING LIGHTS','SAT-NAV'];
    const systems=[
      'circuitry','propulsion','diagnostic','guidance','comms',
      'control','power','response','core','navigation'
    ].map((key,i)=>({...systemStatusEntry(key),label:partNames[i]}));
    return `<div class="mission-instrument panel lapland-panel" id="laplandPanel" style="--lapland-charge:0">
      <section class="lapland-stage lapland-verification-stage" id="laplandVerificationStage">
        <div class="lapland-online-progress" id="laplandOnlineProgress">
          <div class="lapland-online-head"><span>PARTS AWAKE</span><strong id="laplandOnlineCount">0 / 10</strong></div>
          <div class="lapland-online-track" aria-label="Launch system wake progress">${Array.from({length:10},(_,i)=>`<i data-lapland-progress="${i}"></i>`).join('')}</div>
        </div>
        <div class="lapland-system-bank lapland-card-bank" aria-label="Tap each launch system to wake it for launch">
          ${systems.map(system=>`<button type="button" class="lapland-system-card is-${system.state}" data-verify-system="${system.key}" data-lapland-system="${system.key}" aria-label="Wake ${system.label}"><span class="lapland-card-name">${system.label}</span><span class="lapland-card-state" data-verify-status="${system.key}">TAP</span></button>`).join('')}
        </div>
      </section>
      <section class="lapland-stage lapland-transmission-stage" id="laplandTransmissionStage" hidden>
        <div class="incoming-transmission lapland-incoming lapland-elf-transmission" role="status" aria-label="Incoming ELF Engineering transmission">
          <div class="transmission-wave" aria-hidden="true">${'<b></b>'.repeat(24)}</div>
          <div class="kicker">INCOMING TRANSMISSION</div>
          <h2>ELF ENGINEERING</h2>
          <div class="signal-state lock">SIGNAL LOCKED</div>
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
  function northernBody(){return `<div class="mission-instrument panel northern-panel northern-brand-panel" id="northernPanel">
      <div class="northern-brand-sleigh-frame"><img src="./assets/north-pole-brand-sleigh.webp" alt="Santa's sleigh carrying presents, illustrated in the official Christmas at Silverstone brand style"></div>
      <div class="northern-conditions" aria-label="Final flight conditions">
        <div class="northern-condition" data-flight-check="0"><span>ROUTE</span><strong>WAIT</strong></div>
        <div class="northern-condition" data-flight-check="1"><span>SKIES</span><strong>WAIT</strong></div>
        <div class="northern-condition" data-flight-check="2"><span>REINDEER</span><strong>WAIT</strong></div>
      </div>
      <button class="btn primary wide northern-authorise-btn" id="authoriseFlight" disabled>
        <span class="northern-authorise-label">WAVE THE FLAG!</span>
        <span class="northern-flag-icon" aria-hidden="true"><img src="./assets/north-pole-flag-brand.webp" alt=""></span>
      </button>
      <div class="visually-hidden" id="northernHint" aria-live="polite">Final flight checks in progress.</div>
    </div>`}


