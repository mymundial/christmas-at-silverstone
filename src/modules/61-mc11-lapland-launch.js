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
