  function bindJingle(){
    const panel=document.getElementById('jinglePanel');
    const arena=document.getElementById('jingleArena');
    const puck=document.getElementById('jinglePuck');
    const trail=document.getElementById('jinglePuckTrail');
    const paddle=document.getElementById('jinglePaddle');
    const receiver=document.getElementById('jingleReceiver');
    const goalFlare=document.getElementById('jingleGoalFlare');
    const prompt=document.getElementById('jinglePrompt');
    const stateEl=document.getElementById('jingleState');
    const lockCount=document.getElementById('jingleLockCount');
    const countdownEl=document.getElementById('jingleCountdown');
    if(!panel||!arena||!puck||!trail||!paddle||!receiver||!stateEl) return;

    let beam=1;
    let running=false;
    let started=false;
    let dragging=false;
    let raf=0;
    let launchTimer=0;
    let finishTimer=0;
    let buzzerTimer=0;
    let countdownTimers=[];
    let last=performance.now();
    let lastStrikeAt=0;
    let lastPostAt=0;
    let bounds={w:0,h:0,paddleW:0,paddleH:0,paddleY:0,puckR:9,goalW:0,goalLeft:0,goalRight:0,apertureLeft:0,apertureRight:0,goalBottom:0};
    let paddleX=0;
    let puckX=0;
    let puckY=0;
    let vx=0;
    let vy=0;
    let previousPuck={x:0,y:0};
    const speeds=[0,0.245,0.285,0.325];
    const goalWidths=[null,'clamp(240px,78%,300px)','clamp(210px,68%,260px)','clamp(180px,58%,220px)'];

    const strikePool=Array.from({length:3},()=>{
      const a=new Audio('./assets/jingle-puck-strike.mp3');
      a.preload='auto';
      return a;
    });
    const postPool=Array.from({length:2},()=>{
      const a=new Audio('./assets/jingle-post-hit.mp3');
      a.preload='auto';
      return a;
    });
    const goalAudio=new Audio('./assets/jingle-goal.mp3');
    goalAudio.preload='auto';
    const buzzerAudio=new Audio('./assets/jingle-buzzer.mp3');
    buzzerAudio.preload='auto';
    const countdownAudio=new Audio('./assets/arena-game-countdown.mp3');
    countdownAudio.preload='auto';
    countdownAudio.volume=.86;
    let strikeIndex=0;
    let postIndex=0;

    function beamEl(n){return document.querySelector(`[data-jingle-beam="${n}"]`);}
    function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
    function playAudio(el,volume=1,rate=1){
      if(!state.audio||!el) return;
      try{
        el.pause();
        el.currentTime=0;
        el.volume=clamp(volume,0,1);
        el.playbackRate=rate;
        const play=el.play();
        if(play&&typeof play.catch==='function') play.catch(()=>{});
      }catch{}
    }
    function playStrike(volume=.62,rate=1){
      if(!state.audio) return;
      const now=performance.now();
      if(now-lastStrikeAt<70) return;
      lastStrikeAt=now;
      const el=strikePool[strikeIndex++%strikePool.length];
      playAudio(el,volume,rate);
    }
    function playPost(side){
      if(!state.audio) return;
      const now=performance.now();
      if(now-lastPostAt<90) return;
      lastPostAt=now;
      const el=postPool[postIndex++%postPool.length];
      playAudio(el,.64,side==='left'?.97:1.03);
    }
    function setPaddleX(x){
      const half=bounds.paddleW/2;
      paddleX=clamp(x,half+10,bounds.w-half-10);
      paddle.style.transform=`translate3d(${paddleX-half}px,0,0)`;
    }
    function setPuckPosition(){
      const r=bounds.puckR;
      puck.style.transform=`translate3d(${puckX-r}px,${puckY-r}px,0)`;
      const dx=puckX-previousPuck.x;
      const dy=puckY-previousPuck.y;
      const length=clamp(Math.hypot(dx,dy)*10,16,58);
      const angle=Math.atan2(dy,dx)*180/Math.PI;
      trail.style.width=`${length}px`;
      trail.style.transform=`translate3d(${puckX}px,${puckY}px,0) rotate(${angle+180}deg)`;
    }
    function updateBounds(preservePaddle=true){
      const rect=arena.getBoundingClientRect();
      bounds.w=rect.width;
      bounds.h=rect.height;
      bounds.paddleW=paddle.offsetWidth;
      bounds.paddleH=paddle.offsetHeight;
      bounds.paddleY=paddle.offsetTop;
      bounds.puckR=puck.offsetWidth/2;
      bounds.goalW=receiver.offsetWidth;
      bounds.goalLeft=parseFloat(receiver.style.left||'50')/100*bounds.w-bounds.goalW/2;
      bounds.goalRight=bounds.goalLeft+bounds.goalW;
      const apertureW=bounds.goalW*.5;
      const goalCenter=bounds.goalLeft+bounds.goalW/2;
      bounds.apertureLeft=goalCenter-apertureW/2;
      bounds.apertureRight=goalCenter+apertureW/2;
      bounds.goalBottom=receiver.offsetTop+receiver.offsetHeight;
      if(!preservePaddle||!paddleX) setPaddleX(bounds.w/2);
      else setPaddleX(paddleX);
    }
    function setReceiverForBeam(n){
      receiver.style.left='50%';
      receiver.style.width=goalWidths[n]||'';
      receiver.dataset.beam=String(n);
      requestAnimationFrame(()=>requestAnimationFrame(()=>updateBounds()));
    }
    function pulseRail(side){
      const rail=arena.querySelector(`.rail-${side}`);
      if(!rail) return;
      rail.classList.remove('is-hit');
      void rail.offsetWidth;
      rail.classList.add('is-hit');
      setTimeout(()=>rail.classList.remove('is-hit'),180);
    }
    function pulsePost(){
      receiver.classList.remove('is-post-hit');
      void receiver.offsetWidth;
      receiver.classList.add('is-post-hit');
      setTimeout(()=>receiver.classList.remove('is-post-hit'),170);
    }
    function resetPuckAtReceiver(){
      updateBounds();
      const rect=receiver.getBoundingClientRect();
      const arenaRect=arena.getBoundingClientRect();
      puckX=rect.left-arenaRect.left+rect.width/2;
      puckY=Math.max(bounds.goalBottom+28,62);
      previousPuck={x:puckX,y:puckY};
      setPuckPosition();
    }
    function launchPuck(fromReceiver=false,keepPosition=false){
      clearTimeout(launchTimer);
      updateBounds();
      if(fromReceiver) resetPuckAtReceiver();
      else if(!keepPosition){
        puckX=bounds.w/2;
        puckY=Math.min(bounds.h*.35,bounds.paddleY-90);
        previousPuck={x:puckX,y:puckY};
        setPuckPosition();
      }
      const speed=speeds[beam];
      const lateral=(beam===1?.28:(beam===2?.36:.43))*(Math.random()<.5?-1:1);
      vx=speed*lateral;
      vy=Math.sqrt(Math.max(.001,speed*speed-vx*vx));
      running=true;
      last=performance.now();
      stateEl.textContent=`Beam 0${beam} live`;
    }
    function scheduleLaunch(fromReceiver=false,delay=420){
      running=false;
      clearTimeout(launchTimer);
      launchTimer=setTimeout(()=>launchPuck(fromReceiver),delay);
    }
    function normaliseVelocity(speed){
      const mag=Math.hypot(vx,vy)||1;
      vx=vx/mag*speed;
      vy=vy/mag*speed;
    }
    function paddleHit(){
      const half=bounds.paddleW/2;
      const offset=clamp((puckX-paddleX)/half,-1,1);
      const speed=speeds[beam];
      vx=vx*.28+offset*speed*.84;
      vy=-Math.abs(vy||speed);
      normaliseVelocity(speed);
      puckY=bounds.paddleY-bounds.puckR-1;
      paddle.classList.remove('is-hit');
      void paddle.offsetWidth;
      paddle.classList.add('is-hit');
      setTimeout(()=>paddle.classList.remove('is-hit'),170);
      playStrike(.68,1+(Math.random()-.5)*.07);
      haptic(14);
    }
    function postHit(side){
      const speed=speeds[beam];
      puckY=bounds.goalBottom+bounds.puckR+1;
      vy=Math.abs(vy||speed);
      const lateral=Math.max(Math.abs(vx),speed*.22);
      vx=side==='left'?Math.abs(lateral):-Math.abs(lateral);
      normaliseVelocity(speed);
      pulsePost();
      playPost(side);
      haptic(10);
    }
    function missedPaddle(){
      running=false;
      stateEl.textContent=`Beam 0${beam} relaunching`;
      arena.classList.add('is-missed');
      haptic([14,24,14]);
      setTimeout(()=>arena.classList.remove('is-missed'),260);
      scheduleLaunch(true,520);
    }
    function markBeamCharged(n){
      const current=beamEl(n);
      current?.classList.remove('is-next');
      current?.classList.add('is-charged');
      current?.setAttribute('aria-label',`Guidance lock ${n} complete`);
      const next=beamEl(n+1);
      next?.classList.add('is-next');
      if(lockCount)lockCount.textContent=`${n} / 3`;
    }
    function finishGame(){
      running=false;
      panel.classList.add('is-complete');
      arena.classList.add('is-complete');
      stateEl.textContent='GUIDANCE LOCKED';
      clearTimeout(buzzerTimer);
      countdownTimers.forEach(clearTimeout);countdownTimers=[];
      buzzerTimer=setTimeout(()=>{
        playAudio(buzzerAudio,.78,1);
        haptic([30,28,70]);
      },780);
      finishTimer=setTimeout(()=>showCompletion('Guidance Locked','Santa-1’s guidance system is locked and ready for flight.'),2450);
    }
    function scoreGoal(){
      if(!running) return;
      running=false;
      const scoredBeam=beam;
      markBeamCharged(scoredBeam);
      stateEl.textContent=`BEAM 0${scoredBeam} CHARGED`;
      goalFlare.classList.remove('is-active');
      void goalFlare.offsetWidth;
      goalFlare.classList.add('is-active');
      receiver.classList.add('is-charged');
      puck.classList.add('is-absorbed');
      playAudio(goalAudio,.86,1);
      haptic([22,18,42]);
      setTimeout(()=>{
        goalFlare.classList.remove('is-active');
        if(scoredBeam<3){
          puck.classList.remove('is-absorbed');
          receiver.classList.remove('is-charged');
        }
      },520);
      if(scoredBeam===3){
        finishGame();
        return;
      }
      beam++;
      setTimeout(()=>{
        setReceiverForBeam(beam);
        stateEl.textContent=`Beam 0${beam} ready`;
        scheduleLaunch(true,380);
      },620);
    }
    function tick(now){
      const dt=Math.min(26,now-last);
      last=now;
      if(running){
        previousPuck={x:puckX,y:puckY};
        puckX+=vx*dt;
        puckY+=vy*dt;
        const r=bounds.puckR;
        const minX=r+4;
        const maxX=bounds.w-r-4;
        if(puckX<minX&&vx<0){
          const overrun=minX-puckX;
          puckX=minX+overrun;
          vx=Math.abs(vx);
          pulseRail('left');playStrike(.2,.93);
        }
        if(puckX>maxX&&vx>0){
          const overrun=puckX-maxX;
          puckX=maxX-overrun;
          vx=-Math.abs(vx);
          pulseRail('right');playStrike(.2,1.05);
        }

        if(vy<0&&puckY-r<=bounds.goalBottom){
          if(puckX>=bounds.apertureLeft&&puckX<=bounds.apertureRight){
            scoreGoal();
          }else if(puckX>=bounds.goalLeft&&puckX<=bounds.goalRight){
            postHit(puckX<((bounds.goalLeft+bounds.goalRight)/2)?'left':'right');
          }else if(puckY-r<=6){
            const minY=r+6;
            const overrun=minY-puckY;
            puckY=minY+Math.max(0,overrun);
            vy=Math.abs(vy);
            playStrike(.18,.97);
          }
        }

        if(running&&vy>0&&puckY+r>=bounds.paddleY&&previousPuck.y+r<bounds.paddleY+bounds.paddleH){
          const half=bounds.paddleW/2;
          if(puckX>=paddleX-half-r*.35&&puckX<=paddleX+half+r*.35) paddleHit();
        }
        if(running&&puckY-r>bounds.h) missedPaddle();
        setPuckPosition();
      }
      raf=requestAnimationFrame(tick);
    }
    function pointerToPaddle(e){
      const rect=arena.getBoundingClientRect();
      setPaddleX(e.clientX-rect.left);
    }
    function startCountdown(){
      if(started)return;
      started=true;
      running=false;
      prompt?.classList.add('is-hidden');
      arena.classList.remove('is-awaiting-start');
      arena.classList.add('is-counting');
      puck.classList.remove('is-ready');
      puck.classList.add('is-countdown');
      puck.setAttribute('aria-label','Jingle Beams countdown');
      trail.style.opacity='0';
      updateBounds(false);
      puckX=bounds.w/2;
      puckY=bounds.h/2;
      previousPuck={x:puckX,y:puckY};
      setPuckPosition();
      if(countdownEl)countdownEl.textContent='3';
      stateEl.textContent='Guidance start sequence';
      if(state.audio){
        try{
          countdownAudio.currentTime=0;
          const play=countdownAudio.play();
          if(play&&typeof play.catch==='function')play.catch(()=>{});
        }catch{}
      }
      countdownTimers.push(setTimeout(()=>{if(countdownEl)countdownEl.textContent='2';},1000));
      countdownTimers.push(setTimeout(()=>{if(countdownEl)countdownEl.textContent='1';},2000));
      countdownTimers.push(setTimeout(()=>{
        if(countdownEl)countdownEl.textContent='';
        puck.classList.remove('is-countdown');
        puck.setAttribute('aria-label','Jingle Beams puck');
        arena.classList.remove('is-counting');
        arena.classList.add('is-live');
        updateBounds(false);
        puckX=bounds.w/2;
        puckY=bounds.h/2;
        previousPuck={x:puckX,y:puckY};
        setPuckPosition();
        trail.style.opacity='';
        launchPuck(false,true);
      },3000));
    }
    function onPointerDown(e){
      dragging=true;
      try{arena.setPointerCapture?.(e.pointerId);}catch{}
      e.preventDefault();
      try{arena.focus({preventScroll:true});}catch{arena.focus();}
      pointerToPaddle(e);
    }
    function onPointerMove(e){
      if(!dragging) return;
      e.preventDefault();
      pointerToPaddle(e);
    }
    function onPointerUp(e){
      dragging=false;
      try{arena.releasePointerCapture?.(e.pointerId);}catch{}
    }
    function onKeyDown(e){
      if(!['ArrowLeft','ArrowRight','a','A','d','D'].includes(e.key)) return;
      e.preventDefault();
      updateBounds();
      setPaddleX(paddleX+(['ArrowLeft','a','A'].includes(e.key)?-28:28));
    }
    function onResize(){
      updateBounds();
      if(!running&&!panel.classList.contains('is-complete')&&!arena.classList.contains('is-counting')) resetPuckAtReceiver();
    }

    // Hold on a visible play control. The user's tap starts the 3-2-1 sequence
    // synchronously, keeping the attached countdown audio reliable on iOS.
    setReceiverForBeam(1);
    updateBounds(false);
    puckX=bounds.w/2;
    puckY=bounds.h/2;
    previousPuck={x:puckX,y:puckY};
    setPuckPosition();
    trail.style.opacity='0';
    const stopStartBubble=event=>event.stopPropagation();
    const startFromPuck=event=>{event.preventDefault();event.stopPropagation();startCountdown();};
    puck.addEventListener('pointerdown',stopStartBubble);
    puck.addEventListener('click',startFromPuck);
    arena.addEventListener('pointerdown',onPointerDown,{passive:false});
    arena.addEventListener('pointermove',onPointerMove,{passive:false});
    arena.addEventListener('pointerup',onPointerUp);
    arena.addEventListener('pointercancel',onPointerUp);
    arena.addEventListener('keydown',onKeyDown);
    window.addEventListener('resize',onResize);
    raf=requestAnimationFrame(tick);

    cleanupMission=()=>{
      cancelAnimationFrame(raf);
      clearTimeout(launchTimer);
      clearTimeout(finishTimer);
      clearTimeout(buzzerTimer);
      countdownTimers.forEach(clearTimeout);countdownTimers=[];
      arena.removeEventListener('pointerdown',onPointerDown);
      arena.removeEventListener('pointermove',onPointerMove);
      arena.removeEventListener('pointerup',onPointerUp);
      arena.removeEventListener('pointercancel',onPointerUp);
      arena.removeEventListener('keydown',onKeyDown);
      puck.removeEventListener('pointerdown',stopStartBubble);
      puck.removeEventListener('click',startFromPuck);
      window.removeEventListener('resize',onResize);
      [...strikePool,...postPool,goalAudio,buzzerAudio,countdownAudio].forEach(a=>{try{a.pause();a.currentTime=0;}catch{}});
    };
  }
