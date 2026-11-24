  let mc01Timers=[];
  let mc01BloomEl=null;
  let mc01BloomAudio=null;
  let mc01TransferRaf=0;
  let mc01TransferProgress=0;

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
    cancelAnimationFrame(mc01TransferRaf);
    mc01TransferRaf=0;
    mc01TransferProgress=0;
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
    el.className='mc01-energy-bloom northern-airborne-brand mc01-circuit-brand-bloom';
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
    const chargeButton=document.getElementById('mc01ChargeButton');
    const markers=[...panel?.querySelectorAll('[data-mc01-installation]')||[]];
    if(!panel||!stateLabel||!stateValue||!transferFill||!chargeButton) return;

    stopMc01Activation();
    if(state.audio) getMc01BloomAudio();

    const renderProgress=value=>{
      const progress=Math.max(0,Math.min(100,value));
      mc01TransferProgress=progress;
      transferValue.textContent=`${Math.round(progress)}%`;
      transferFill.style.transform=`scaleX(${progress/100})`;
      // Marker reveals remain tied directly to the actual progress percentage.
      // No separate connector or additional marker-activation effect.
      const visible=Math.min(markers.length,Math.floor(progress*markers.length/100+1e-8));
      markers.forEach((marker,i)=>marker.classList.toggle('is-visible',i<visible));
      panel.style.setProperty('--mc01-energy-progress',String(progress/100));
    };
    const setProgress=(value,duration=0)=>{
      cancelAnimationFrame(mc01TransferRaf);
      mc01TransferRaf=0;
      const target=Math.max(0,Math.min(100,Number(value)||0));
      if(!duration){renderProgress(target);return;}
      const from=mc01TransferProgress;
      const start=performance.now();
      const step=now=>{
        if(!panel.isConnected||state.missionOpen!=='entry'){mc01TransferRaf=0;return;}
        const fraction=Math.min(1,(now-start)/duration);
        renderProgress(from+(target-from)*fraction);
        if(fraction<1)mc01TransferRaf=requestAnimationFrame(step);
        else mc01TransferRaf=0;
      };
      mc01TransferRaf=requestAnimationFrame(step);
    };
    const setStage=(stage,label,value)=>{
      if(!panel.isConnected||state.missionOpen!=='entry') return;
      panel.dataset.stage=stage;
      stateLabel.textContent=label;
      stateValue.textContent=value;
    };

    // The first of twelve locations is already active. Each additional tap
    // reveals exactly one marker and increases the transfer bar in lockstep.
    const markerCount=markers.length;
    let activated=markerCount>0?1:0;
    let sequenceStarted=false;
    setStage('detected','Circuit Link','Signal Detected');
    setProgress(markerCount?100/markerCount:0);
    chargeButton.disabled=markerCount<2;
    if(state.audio)ping(560,.08,.025);

    const pulseCircuit=()=>{
      panel.classList.remove('mc01-tap-pulse');
      // Reflow restarts the short, purely visual circuit glow for each tap.
      void panel.offsetWidth;
      panel.classList.add('mc01-tap-pulse');
      mc01Later(()=>panel.classList.remove('mc01-tap-pulse'),420);
    };
    const startFinalSequence=()=>{
      if(sequenceStarted)return;
      sequenceStarted=true;
      chargeButton.disabled=true;
      chargeButton.hidden=true;
      setProgress(100);
      setStage('routing','Circuit Link','Connecting');
      ping(640,.06,.025);
      haptic([18,28,24]);
      // Preserve the original Circuit Link routing, recovery and energy bloom
      // payoff, but start it only after the eleventh deliberate charge tap.
      mc01Later(()=>{
        setStage('transfer','Power Transfer','Routing to Santa-1');
        ping(720,.08,.03);
      },700);
      mc01Later(()=>{
        setStage('recovery','Recovery Sequence','Initiated');
        ping(880,.14,.05);
        haptic([30,35,70]);
      },1650);
      mc01Later(()=>showMc01EnergyBloom(),2450);
      // The established full-screen energy bloom remains for three seconds.
      mc01Later(()=>finishMc01EnergyBloom(),5450);
    };
    chargeButton.addEventListener('click',()=>{
      if(!panel.isConnected||state.missionOpen!=='entry'||sequenceStarted)return;
      if(activated>=markerCount)return;
      activated++;
      setProgress(activated*100/markerCount);
      pulseCircuit();
      ping(560+activated*18,.10,.075);
      haptic(18);
      if(activated>=markerCount)startFinalSequence();
    });
  }
