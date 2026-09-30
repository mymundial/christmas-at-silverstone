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
