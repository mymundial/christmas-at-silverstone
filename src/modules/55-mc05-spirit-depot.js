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
