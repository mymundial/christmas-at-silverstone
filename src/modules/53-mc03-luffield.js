  function bindCommsRelay(){
    const nodes=[...document.querySelectorAll('[data-relay]')];
    const hops=[...document.querySelectorAll('[data-hop]')];
    const stateEl=document.getElementById('relayState');
    const progressCount=document.getElementById('relayLockedCount');
    const progressHead=document.querySelector('.relay-progress-head');
    const progressBars=[...document.querySelectorAll('[data-relay-progress]')];
        const cycles=[1900,1650,1450,1300];
    const relayFxShort=new Audio('./assets/mc03-relay-success-short.mp3');
    const relayFxFull=new Audio('./assets/mc03-relay-success-full.mp3');
    const relayFxMiss=new Audio('./assets/mc03-relay-miss.mp3');
    [relayFxShort,relayFxFull,relayFxMiss].forEach(a=>{a.preload='auto';try{a.load();}catch{}});
    function playRelayFx(a,volume=.9){
      if(!state.audio||!a)return;
      try{a.pause();a.currentTime=0;a.volume=volume;const p=a.play();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch{}
    }
    function stopRelayFx(){[relayFxShort,relayFxFull,relayFxMiss].forEach(a=>{try{a.pause();a.currentTime=0;}catch{}});}
    let stage=0,phase=0,start=performance.now(),raf=0,locked=false,finishing=false;
    const santa=getSantaCommsAudio();
    try{santa.load();}catch{}
    const routeSvg=document.querySelector('.relay-route');
    const relayNetwork=document.getElementById('relayNetwork');
    const carrierPackets=[...document.querySelectorAll('[data-carrier]')];
    let carrierSegments=[];
    let capturePhase=.66;
    const routePoints=[document.querySelector('.relay-origin .relay-radio-icon'),...nodes,document.querySelector('.relay-destination .relay-receiver-icon')];
    function alignRelayRoute(){
      if(!routeSvg||!relayNetwork)return;
      const sr=routeSvg.getBoundingClientRect();
      const nr=relayNetwork.getBoundingClientRect();
      if(!sr.width||!sr.height||!nr.width||!nr.height)return;
      const toSvgPoint=(el)=>{const r=el?.getBoundingClientRect();return r?{x:((r.left+r.width/2-sr.left)/sr.width)*100,y:((r.top+r.height/2-sr.top)/sr.height)*150}:null;};
      const toPixelPoint=(el)=>{const r=el?.getBoundingClientRect();return r?{x:r.left+r.width/2-nr.left,y:r.top+r.height/2-nr.top}:null;};
      const svgPts=routePoints.map(toSvgPoint);
      const pixelPts=routePoints.map(toPixelPoint);
      hops.forEach((line,i)=>{const a=svgPts[i],b=svgPts[i+1];if(!a||!b)return;line.setAttribute('x1',a.x.toFixed(3));line.setAttribute('y1',a.y.toFixed(3));line.setAttribute('x2',b.x.toFixed(3));line.setAttribute('y2',b.y.toFixed(3));});
      carrierSegments=Array.from({length:Math.max(0,pixelPts.length-1)},(_,i)=>({a:pixelPts[i],b:pixelPts[i+1]}));
      const activePulse=nodes[stage]?.querySelector('.relay-pulse');
      const activeTarget=nodes[stage]?.querySelector('.relay-target');
      if(activePulse&&activeTarget){
        const pulseDiameter=activePulse.offsetWidth;
        const targetDiameter=activeTarget.offsetWidth;
        if(pulseDiameter&&targetDiameter){
          capturePhase=Math.max(.1,Math.min(.95,((targetDiameter/pulseDiameter)-.42)/1.28));
        }
      }
    }
    const onRelayResize=()=>alignRelayRoute();
    window.addEventListener('resize',onRelayResize);
    requestAnimationFrame(alignRelayRoute);
    function draw(now){
      if(finishing)return;
      const cycle=cycles[stage]||1300;
      phase=((now-start)%cycle)/cycle;
      const pulse=nodes[stage]?.querySelector('.relay-pulse');
      if(pulse){
        const scale=.42+phase*1.28;
        pulse.style.transform=`translate(-50%,-50%) scale(${scale})`;
        pulse.style.opacity=String(Math.max(.08,1-phase*.72));
      }
      if(carrierPackets.length){
        carrierPackets.forEach((packet,i)=>{
          const isLive=i===stage||hops[i]?.classList.contains('locked');
          const segment=carrierSegments[i];
          if(!isLive||!segment?.a||!segment?.b||phase>capturePhase){packet.style.opacity='0';return;}
          const raw=Math.max(0,Math.min(1,phase/capturePhase));
          const eased=raw*raw*(3-2*raw);
          const x=segment.a.x+(segment.b.x-segment.a.x)*eased;
          const y=segment.a.y+(segment.b.y-segment.a.y)*eased;
          const angle=Math.atan2(segment.b.y-segment.a.y,segment.b.x-segment.a.x)*180/Math.PI;
          const edgeFade=Math.min(1,raw/.07,(1-raw)/.045);
          packet.style.left=`${x}px`;
          packet.style.top=`${y}px`;
          packet.style.opacity=String(Math.max(0,edgeFade));
          packet.style.transform=`translate(-100%,-50%) rotate(${angle}deg)`;
        });
      }
      raf=requestAnimationFrame(draw);
    }
    function arm(nextStage){
      stage=nextStage;phase=0;start=performance.now();locked=false;
      nodes.forEach((n,i)=>n.classList.toggle('active',i===stage));
      hops.forEach((h,i)=>h.classList.toggle('active',i===stage&&!h.classList.contains('locked')));
      carrierPackets.forEach(packet=>packet.style.opacity='0');
      requestAnimationFrame(alignRelayRoute);
      stateEl.textContent=`Relay 0${stage+1} armed`;
      if(progressCount)progressCount.textContent=`${stage} / 4`;
      progressHead?.classList.remove('is-complete');
      progressBars.forEach((bar,i)=>{
        bar.classList.toggle('on',i<stage);
        bar.classList.remove('complete');
      });
    }
    function showIncomingTransmission(){
      finishing=true;cancelAnimationFrame(raf);
      const mc=document.getElementById('missionContent');if(!mc)return;
      mc.innerHTML=`<div class="mission-instrument panel incoming-transmission"><div class="transmission-wave">${'<b></b>'.repeat(24)}</div><div class="kicker">Incoming Transmission</div><h2>SANTA-1</h2><div class="signal-state lock" id="incomingState">Signal locked</div></div>`;
      const radioWasOn=Boolean(state.elfAudioOn&&elfAudioEl&&!elfAudioEl.paused);
      const previousRadioVolume=radioWasOn?elfAudioEl.volume:1;
      let stopDuck=()=>{};
      // Narrative transmissions take priority over ELF FM. Keep a trace of the
      // station underneath rather than stopping/restarting the live stream.
      if(radioWasOn) stopDuck=rampElementVolume(elfAudioEl,0,420);
      if(state.audio) startStatic(.05);
      let introStatic=null,santaDelay=null,fallback=null,tailTimer=null,finished=false;
      const finish=()=>{
        if(finished)return;finished=true;
        clearTimeout(introStatic);clearTimeout(santaDelay);clearTimeout(fallback);clearTimeout(tailTimer);stopStatic();
        if(radioWasOn&&elfAudioEl){elfAudioEl.volume=0;rampElementVolume(elfAudioEl,previousRadioVolume,520);}
        setTimeout(()=>showCompletion('Comms Link Restored','Communications have been established and Mission Control is now connected to Santa-1.'),260);
      };
      const playSanta=()=>{
        stopStatic();
        if(!state.audio){setTimeout(finish,1050);return;}
        try{
          santa.currentTime=0;santa.volume=1;
          const play=santa.play();
          if(play&&typeof play.catch==='function') play.catch(()=>finish());
          santa.onended=()=>{
            startStatic(.028);
            tailTimer=setTimeout(()=>{stopStatic();finish();},220);
          };
          santa.onerror=()=>finish();
          fallback=setTimeout(finish,14000);
        }catch{finish();}
      };
      // Give the carrier/static its own beat, then leave a clean gap before
      // Santa begins so the opening Ho Ho Ho is never masked by the noise.
      introStatic=setTimeout(()=>{stopStatic();},430);
      santaDelay=setTimeout(playSanta,900);
      santaTransmissionCleanup=()=>{
        clearTimeout(introStatic);clearTimeout(santaDelay);clearTimeout(fallback);clearTimeout(tailTimer);stopDuck();
        if(santaCommsEl){santaCommsEl.onended=null;santaCommsEl.onerror=null;try{santaCommsEl.pause();santaCommsEl.currentTime=0;}catch{}}
        if(radioWasOn&&elfAudioEl)elfAudioEl.volume=previousRadioVolume;
        stopStatic();
      };
      cleanupMission=()=>stopSantaTransmission(true);
    }
    nodes.forEach((node,i)=>node.onclick=()=>{
      if(i!==stage||locked||finishing)return;
      // The moving pulse intersects the fixed capture ring around 67% of the cycle.
      const hit=phase>=.53&&phase<=.80;
      if(!hit){
        node.classList.add('miss');stateEl.textContent='Signal missed · retry current relay.';haptic([16,28,16]);playRelayFx(relayFxMiss,.82);
        setTimeout(()=>node.classList.remove('miss'),280);start=performance.now();return;
      }
      locked=true;node.classList.remove('active');node.classList.add('locked');
      hops[stage]?.classList.remove('active');
      hops[stage]?.classList.add('locked');
      carrierPackets.forEach(packet=>packet.style.opacity='0');
      if(progressCount)progressCount.textContent=`${stage+1} / 4`;
      progressBars.forEach((bar,i)=>bar.classList.toggle('on',i<=stage));
      if(stage===3){
        progressHead?.classList.add('is-complete');
        progressBars.forEach(bar=>bar.classList.add('complete'));
      }
      stateEl.textContent=stage===3?'Transmission path locked.':'Relay locked · signal strengthened.';
      playRelayFx(stage===3?relayFxFull:relayFxShort,stage===3?.95:.9);haptic([20,25,38]);
      if(stage===3){
        hops.forEach(h=>h.classList.add('locked'));
        const dest=document.querySelector('.relay-destination');dest?.classList.add('locked');
        const receiverIcon=dest?.querySelector('.relay-receiver-icon img');
        if(receiverIcon) receiverIcon.src='./assets/relay-receiver-hi-spec-green.svg';
        // Prime the Santa media element inside the final user gesture, but at
        // zero volume. This preserves reliable mobile playback while the
        // visible carrier/static intro and clean pause happen afterwards.
        if(state.audio){
          try{
            santa.currentTime=0;santa.volume=0;
            const prime=santa.play();
            if(prime&&typeof prime.then==='function') prime.then(()=>{try{santa.pause();santa.currentTime=0;santa.volume=1;}catch{}}).catch(()=>{});
          }catch{}
        }
        setTimeout(()=>showIncomingTransmission(),2350);
      }else setTimeout(()=>arm(stage+1),460);
    });
    cleanupMission=()=>{cancelAnimationFrame(raf);window.removeEventListener('resize',onRelayResize);stopRelayFx();stopSantaTransmission(true);};
    hops[0]?.classList.add('active');
    requestAnimationFrame(alignRelayRoute);
    raf=requestAnimationFrame(draw);
  }

