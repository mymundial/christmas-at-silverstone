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
