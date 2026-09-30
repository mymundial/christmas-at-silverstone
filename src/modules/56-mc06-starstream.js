  function bindArtifacts(){
    const field=document.getElementById('artifactField');
    const layer=document.getElementById('artifactLayer');
    const burstLayer=document.getElementById('artifactBurstLayer');
    const beam=document.getElementById('starstreamBeam');
    const progress=document.getElementById('artifactProgress');
    const stateEl=document.getElementById('artifactState');
    const canvas=document.getElementById('starstreamCanvas');
    const panel=field?.closest('.artifact-panel');
    const steps=[...document.querySelectorAll('[data-artifact-step]')];
    if(!field||!layer||!burstLayer||!beam||!progress||!stateEl||!canvas) return;

    const ENERGY_SIGNATURES=[
      {id:'green',name:'Green',rgb:'92,245,96'},
      {id:'pink',name:'Pink',rgb:'255,110,186'},
      {id:'purple',name:'Purple',rgb:'198,92,255'},
      {id:'yellow',name:'Yellow',rgb:'255,224,84'},
      {id:'blue',name:'Blue',rgb:'76,219,255'},
      {id:'red',name:'Red',rgb:'255,92,116'},
      {id:'orange',name:'Orange',rgb:'255,122,28'},
      {id:'white',name:'White',rgb:'247,250,255'}
    ];

    let cleared=0;
    let finished=false;
    let raf=0;
    let resizeObserver=null;
    let timers=[];
    let signatureBag=[];
    let liveItems=new Set();
    let capturedSignatures=[];
    const energyHitAudio=[
      './assets/power-pulse-energy-hit-1.mp3',
      './assets/power-pulse-energy-hit-2.mp3',
      './assets/power-pulse-energy-hit-3.mp3'
    ].map(src=>{
      const audio=new Audio(src);
      audio.preload='auto';
      audio.volume=.9;
      return audio;
    });
    const energyBoostAudio=new Audio('./assets/power-pulse-energy-boost.wav');
    energyBoostAudio.preload='auto';
    energyBoostAudio.volume=.92;
    let energyHitIndex=0;

    function playEnergyHit(){
      if(!state.audio)return;
      const audio=energyHitAudio[energyHitIndex++%energyHitAudio.length];
      try{
        audio.pause();
        audio.currentTime=0;
        audio.volume=.9;
        const play=audio.play();
        if(play&&typeof play.catch==='function')play.catch(()=>{});
      }catch{}
    }
    function playEnergyBoost(){
      if(!state.audio)return;
      try{
        energyBoostAudio.pause();
        energyBoostAudio.currentTime=0;
        energyBoostAudio.volume=.92;
        const play=energyBoostAudio.play();
        if(play&&typeof play.catch==='function')play.catch(()=>{});
      }catch{}
    }

    function clearTimers(){timers.forEach(clearTimeout);timers=[];}
    function later(fn,delay){const t=setTimeout(()=>{timers=timers.filter(id=>id!==t);fn();},delay);timers.push(t);return t;}
    function rand(min,max){return min+Math.random()*(max-min);}
    function intensity(){return cleared<3?1:cleared<7?2:3;}
    function stageConfig(){
      if(cleared<3) return {maxConcurrent:1,spawnMin:520,spawnMax:700,lifetimeMin:900,lifetimeMax:1100,armDelay:120};
      if(cleared<7) return {maxConcurrent:2,spawnMin:340,spawnMax:520,lifetimeMin:650,lifetimeMax:830,armDelay:105};
      return {maxConcurrent:3,spawnMin:230,spawnMax:380,lifetimeMin:460,lifetimeMax:620,armDelay:95};
    }
    function refillSignatureBag(){
      signatureBag=[...ENERGY_SIGNATURES];
      for(let i=signatureBag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[signatureBag[i],signatureBag[j]]=[signatureBag[j],signatureBag[i]];}
    }
    function nextSignature(){if(!signatureBag.length)refillSignatureBag();return signatureBag.pop();}
    function randomPos(){
      let best={x:18+Math.random()*64,y:18+Math.random()*62,score:-1};
      for(let attempt=0;attempt<18;attempt++){
        const candidate={x:18+Math.random()*64,y:18+Math.random()*62};
        let nearest=999;
        for(const item of liveItems){
          const dx=candidate.x-item.x;
          const dy=candidate.y-item.y;
          const d=Math.sqrt(dx*dx+dy*dy);
          nearest=Math.min(nearest,d);
        }
        if(!liveItems.size) return candidate;
        if(nearest>best.score) best={...candidate,score:nearest};
        if(nearest>=24) return candidate;
      }
      return {x:best.x,y:best.y};
    }

    function setIntensity(){
      const level=intensity();
      field.dataset.intensity=String(level);
      panel?.classList.toggle('is-live',cleared>0);
      panel?.classList.toggle('is-intense',cleared>=7);
    }

    function renderStability(){
      progress.textContent=`${cleared} / 10`;
      steps.forEach((step,i)=>{
        const isOn=i<cleared;
        const rgb=capturedSignatures[i]||'98,239,157';
        step.classList.toggle('on',isOn);
        step.style.setProperty('--artifact-rgb',rgb);
      });
      setIntensity();
    }

    function startStarstream(){
      const ctx=canvas.getContext('2d',{alpha:true});
      if(!ctx) return;
      const stars=[];
      const STAR_COUNT=150;
      let width=0,height=0,dpr=1,last=performance.now();

      function seed(star,far=false){
        let x=0,y=0;
        do{x=(Math.random()*2-1)*1.22;y=(Math.random()*2-1)*.92;}while(Math.abs(x)<.035&&Math.abs(y)<.035);
        star.x=x;
        star.y=y;
        star.z=far?.96+Math.random()*.24:.08+Math.random()*1.08;
        star.blue=Math.random();
        star.weight=.55+Math.random()*1.35;
      }
      for(let i=0;i<STAR_COUNT;i++){const star={};seed(star,false);stars.push(star);}

      function resize(){
        const rect=field.getBoundingClientRect();
        dpr=Math.min(2,window.devicePixelRatio||1);
        width=Math.max(1,Math.round(rect.width));
        height=Math.max(1,Math.round(rect.height));
        canvas.width=Math.round(width*dpr);
        canvas.height=Math.round(height*dpr);
        canvas.style.width=width+'px';
        canvas.style.height=height+'px';
        ctx.setTransform(dpr,0,0,dpr,0,0);
      }
      resize();
      if(window.ResizeObserver){resizeObserver=new ResizeObserver(resize);resizeObserver.observe(field);}else window.addEventListener('resize',resize);

      function frame(now){
        if(finished&&field.classList.contains('stabilised')===false) return;
        const dt=Math.min(.038,Math.max(.001,(now-last)/1000));
        last=now;
        ctx.clearRect(0,0,width,height);

        const level=Number(field.dataset.intensity)||1;
        const stable=field.classList.contains('stabilised');
        const speed=stable?.10:(level===1?.30:level===2?.43:.58);
        const focal=Math.min(width,height)*.58;
        const cx=width*.49,cy=height*.50;

        for(const star of stars){
          const previousZ=star.z;
          star.z-=speed*dt;
          if(star.z<.055){seed(star,true);continue;}

          const sx=cx+(star.x/star.z)*focal;
          const sy=cy+(star.y/star.z)*focal;
          const prevZ=previousZ+speed*dt*(level===3?3.1:2.45);
          const px=cx+(star.x/prevZ)*focal;
          const py=cy+(star.y/prevZ)*focal;
          if(sx<-80||sx>width+80||sy<-80||sy>height+80){seed(star,true);continue;}

          const proximity=Math.max(0,Math.min(1,1-star.z));
          const alpha=Math.min(.95,.16+proximity*.92);
          const blue=190+Math.round(star.blue*55);
          ctx.beginPath();
          ctx.moveTo(px,py);
          ctx.lineTo(sx,sy);
          ctx.lineWidth=Math.max(.55,star.weight*(.55+proximity*1.25));
          ctx.lineCap='round';
          ctx.strokeStyle=`rgba(${star.blue>.76?190:105},${blue},255,${alpha})`;
          ctx.stroke();

          if(proximity>.66){
            ctx.beginPath();
            ctx.arc(sx,sy,Math.max(.45,star.weight*.62),0,Math.PI*2);
            ctx.fillStyle=`rgba(224,249,255,${Math.min(.9,alpha)})`;
            ctx.fill();
          }
        }
        raf=requestAnimationFrame(frame);
      }
      raf=requestAnimationFrame(frame);
    }

    function removeSignature(item,className='popped',delay=220){
      if(!item||item.locked) return;
      item.locked=true;
      liveItems.delete(item);
      item.el.classList.add(className);
      later(()=>item.el.remove(),delay);
    }

    function signatureCentre(item){
      const fr=field.getBoundingClientRect(),r=item.el.getBoundingClientRect();
      return {x:r.left-fr.left+r.width/2,y:r.top-fr.top+r.height/2};
    }

    function spawnBurst(x,y,rgb){
      const flare=document.createElement('span');
      flare.className='artifact-flare is-emotion';
      flare.style.left=x+'px';flare.style.top=y+'px';
      flare.style.setProperty('--emotion-rgb',rgb);
      burstLayer.appendChild(flare);
      later(()=>flare.remove(),340);

      const streakCount=cleared>=7?12:9;
      for(let i=0;i<streakCount;i++){
        const streak=document.createElement('i');
        streak.className='artifact-streak is-emotion';
        const angle=(Math.PI*2/streakCount)*i+(Math.random()*.18-.09);
        const distance=(cleared>=7?86:68)+(Math.random()*16);
        streak.style.left=x+'px';streak.style.top=y+'px';
        streak.style.setProperty('--emotion-rgb',rgb);
        streak.style.setProperty('--dx',`${Math.cos(angle)*distance}px`);
        streak.style.setProperty('--dy',`${Math.sin(angle)*distance}px`);
        streak.style.setProperty('--rot',`${(angle*180/Math.PI).toFixed(1)}deg`);
        burstLayer.appendChild(streak);
        later(()=>streak.remove(),340);
      }

      const count=cleared>=7?14:10;
      for(let i=0;i<count;i++){
        const p=document.createElement('i');
        p.className='artifact-particle is-emotion';
        p.style.left=x+'px';p.style.top=y+'px';
        p.style.setProperty('--emotion-rgb',rgb);
        p.style.setProperty('--dx',`${(Math.random()-.5)*120}px`);
        p.style.setProperty('--dy',`${(Math.random()-.5)*120}px`);
        p.style.setProperty('--rot',`${Math.round((Math.random()-.5)*260)}deg`);
        burstLayer.appendChild(p);
        later(()=>p.remove(),420);
      }

      field.classList.remove('is-hit');
      void field.offsetWidth;
      field.classList.add('is-hit');
      later(()=>field.classList.remove('is-hit'),240);
    }

    function expireSignature(item){
      if(finished||!liveItems.has(item)||item.locked) return;
      removeSignature(item,'passed',180);
      if(stateEl) stateEl.textContent=cleared>=10?'Power stabilised':'';
    }

    function captureSignature(item){
      if(finished||!liveItems.has(item)||item.locked||!item.armed) return;
      const c=signatureCentre(item);
      spawnBurst(c.x,c.y,item.signature.rgb);
      removeSignature(item,'popped',210);
      cleared=Math.min(10,cleared+1);
      capturedSignatures[cleared-1]=item.signature.rgb;
      renderStability();
      playEnergyHit();
      haptic(18);
      if(stateEl) stateEl.textContent=cleared===10?'Power stabilised':'';
      if(cleared>=10){finish();return;}
      later(()=>{
        const cfg=stageConfig();
        if(!finished&&liveItems.size<cfg.maxConcurrent) createSignature();
      },60);
    }

    function createSignature(){
      if(finished) return;
      const cfg=stageConfig();
      if(liveItems.size>=cfg.maxConcurrent) return;
      const signature=nextSignature();
      const pos=randomPos();
      const el=document.createElement('button');
      el.type='button';
      el.className=`starstream-signature emotion-signature energy-${signature.id} is-entering`;
      el.style.left=pos.x+'%';
      el.style.top=pos.y+'%';
      el.style.setProperty('--emotion-rgb',signature.rgb);
      el.setAttribute('aria-label',`Capture ${signature.name.toLowerCase()} energy signature`);
      el.innerHTML=`
        <span class="signature-core power-pulse-energy-core" aria-hidden="true">
          <svg class="power-pulse-energy-icon" viewBox="66 0 66 126" focusable="false" aria-hidden="true">
            <path d="M83.34,125.93,98.42,75.57h-32L127.44,0,112.37,50.35h32ZM79,69.55H106.5L97.88,98.34l33.88-42H104.29l8.62-28.78Z"></path>
          </svg>
        </span>
        <span class="signature-scan" aria-hidden="true"></span>`;
      layer.appendChild(el);

      const item={el,signature,x:pos.x,y:pos.y,locked:false,armed:false};
      liveItems.add(item);

      later(()=>{
        if(finished||item.locked||!liveItems.has(item)) return;
        item.armed=true;
        el.classList.remove('is-entering');
      },cfg.armDelay);

      later(()=>expireSignature(item), rand(cfg.lifetimeMin,cfg.lifetimeMax));

      const tap=ev=>{
        ev.preventDefault();
        ev.stopPropagation();
        captureSignature(item);
      };
      if(window.PointerEvent) el.addEventListener('pointerdown',tap,{passive:false});
      el.addEventListener('click',tap,{passive:false});
    }

    function scheduleSpawn(){
      if(finished) return;
      const cfg=stageConfig();
      later(()=>{
        if(finished) return;
        if(liveItems.size<cfg.maxConcurrent) createSignature();
        scheduleSpawn();
      }, rand(cfg.spawnMin,cfg.spawnMax));
    }

    function finish(){
      finished=true;
      clearTimers();
      for(const item of liveItems){
        item.locked=true;
        item.el.classList.add('absorbed');
        setTimeout(()=>item.el.remove(),180);
      }
      liveItems.clear();
      panel?.classList.add('is-complete');
      field.classList.remove('is-hit');
      field.classList.add('stabilised');
      beam.classList.add('active');
      progress.textContent='10 / 10';
      haptic([28,24,58]);
      // Let the final capture hit land, then resolve into the dedicated Power Pulse boost.
      later(playEnergyBoost,140);
      setTimeout(()=>showCompletion('Power Stabilised','The positive energy signatures have been captured and stabilised, ready to be stored in the Spirit Core.'),900);
    }

    const blockFieldGesture=event=>{
      if(event.cancelable) event.preventDefault();
    };
    field.addEventListener('touchmove',blockFieldGesture,{passive:false});
    field.addEventListener('gesturestart',blockFieldGesture,{passive:false});

    renderStability();
    startStarstream();
    if(stateEl) stateEl.textContent='';
    createSignature();
    scheduleSpawn();

    cleanupMission=()=>{
      finished=true;
      clearTimers();
      if(raf)cancelAnimationFrame(raf);
      resizeObserver?.disconnect?.();
      for(const item of liveItems){item.el.remove();}
      liveItems.clear();
      [...energyHitAudio,energyBoostAudio].forEach(audio=>{try{audio.pause();audio.currentTime=0;}catch{}});
      field.removeEventListener('touchmove',blockFieldGesture);
      field.removeEventListener('gesturestart',blockFieldGesture);
    };
  }
