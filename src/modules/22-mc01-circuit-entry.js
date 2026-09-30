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
