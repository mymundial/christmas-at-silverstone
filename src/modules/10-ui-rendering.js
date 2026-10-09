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
    return `<span class="nav-mask nav-mask-sleigh" aria-hidden="true"></span>`;
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


