  function bindComet(){
    const dirClass={L:'left',D:'down',U:'up',R:'right'};
    const keys=['L','D','U','R'];
    const game=document.getElementById('cometGame');
    const panel=game?.closest('.comet-panel');
    const notesLayer=document.getElementById('cometNotes');
    const progress=document.getElementById('cometProgress');
    const stateEl=document.getElementById('cometState');
    const flash=document.getElementById('cometHitFlash');
    const judgement=document.getElementById('cometJudgement');
    const comboEl=document.getElementById('cometCombo');
    const instruction=document.getElementById('cometInstruction');
    const steps=[...document.querySelectorAll('[data-comet-step]')];
    if(!game||!notesLayer||!progress||!stateEl||!flash||!judgement||!comboEl) return;

    // Structural lane ownership: every direction gets its own fixed 25% lane
    // container. Notes are created inside their designated lane, so a LEFT
    // signal cannot ever render in DOWN/UP/RIGHT (and vice versa).
    notesLayer.innerHTML='';
    const laneHosts={};
    keys.forEach((key,index)=>{
      const host=document.createElement('div');
      host.className=`comet-note-lane comet-note-lane-${dirClass[key]}`;
      host.dataset.cometNoteLane=key;
      Object.assign(host.style,{
        position:'absolute',
        top:'0',
        bottom:'0',
        left:`${index*25}%`,
        width:'25%',
        pointerEvents:'none',
        overflow:'visible'
      });
      notesLayer.appendChild(host);
      laneHosts[key]=host;
    });

    const BPM=129.2;
    const BEAT=60/BPM;
    const BEAT_OFFSET=.62;
    const TRAVEL_BEATS=3.35;
    const TARGET_Y=.80;
    const PERFECT_WINDOW=.085;
    const GOOD_WINDOW=.21;
    const MISS_WINDOW=.31;

    let correct=0;
    let combo=0;
    let finished=false;
    let raf=0;
    let spawnTimer=0;
    let judgementTimer=0;
    let beatPulseTimer=0;
    let clockStart=performance.now();
    let lastBeat=-1;
    let lastLane='';
    let notes=[];
    let music=null;
    let completionSfx=null;
    // Capture whether ELF FM was genuinely playing before Comet Curve took
    // audio priority. Used as a second restore path after mission teardown.
    const cometRadioWasPlaying=beginMissionAudioRadioOverride('comet');
    let signalCount=0;
    let nextSpawnAt=BEAT_OFFSET;

    function clock(){ return Math.max(0,(performance.now()-clockStart)/1000); }
    function spawnGapBeats(){ return correct<3?1.5:correct<7?1.25:1; }
    function arrowMarkup(key){
      return `<span class="comet-arrow-icon comet-arrow-${dirClass[key]}" aria-hidden="true"><i></i><i></i></span><span class="comet-tail"></span>`;
    }
    function chooseLane(){
      const pool=keys.filter(k=>k!==lastLane);
      const lane=pool[Math.floor(Math.random()*pool.length)]||keys[Math.floor(Math.random()*keys.length)];
      lastLane=lane;
      return lane;
    }
    function startMusic(){
      if(!state.audio) return;
      beginMissionAudioRadioOverride('comet');
      try{
        music=new Audio('./assets/comet-curve-rhythm.mp3');
        music.preload='auto';
        music.volume=.66;
        music.loop=true;
        music.currentTime=0;
        const play=music.play();
        if(play&&typeof play.catch==='function') play.catch(()=>endMissionAudioRadioOverride('comet'));
      }catch{music=null;endMissionAudioRadioOverride('comet');}
    }
    function ensureMusic(){
      if(!state.audio||!music||!music.paused) return;
      music.play().catch(()=>{});
    }
    function stopMusic(){
      if(!music) return;
      try{
        music.loop=false;
        music.volume=0;
        music.pause();
        music.currentTime=0;
        music.removeAttribute('src');
        music.load();
      }catch{}
      music=null;
    }
    function playCompletionSound(){
      if(!state.audio){endMissionAudioRadioOverride('comet');return;}
      try{
        completionSfx=new Audio('./assets/comet-curve-complete.mp3');
        completionSfx.preload='auto';
        completionSfx.volume=.86;
        completionSfx.currentTime=0;
        let released=false;
        const releaseRadio=()=>{
          if(released)return;
          released=true;
          endMissionAudioRadioOverride('comet');
          // Some mobile browsers can leave a zero-volume stream suspended even
          // after the first restore request. Reassert the user's enabled radio
          // state after the completion sting without requiring a toggle cycle.
          if(cometRadioWasPlaying) setTimeout(()=>ensureElfRadioPlayback(1,520),180);
        };
        completionSfx.onended=releaseRadio;
        completionSfx.onerror=releaseRadio;
        const play=completionSfx.play();
        if(play&&typeof play.catch==='function') play.catch(releaseRadio);
      }catch{completionSfx=null;endMissionAudioRadioOverride('comet');}
    }
    function stopCompletionSound(){
      if(!completionSfx) return;
      try{completionSfx.pause();completionSfx.currentTime=0;}catch{}
      completionSfx=null;
    }
    function pulseBeat(){
      game.classList.remove('beat-pulse');
      void game.offsetWidth;
      game.classList.add('beat-pulse');
      clearTimeout(beatPulseTimer);
      beatPulseTimer=setTimeout(()=>game.classList.remove('beat-pulse'),105);
    }
    function showJudgement(text,type){
      clearTimeout(judgementTimer);
      judgement.textContent=text;
      judgement.className=`comet-judgement show ${type}`;
      judgementTimer=setTimeout(()=>{judgement.className='comet-judgement';},500);
    }
    function updateCombo(){
      comboEl.textContent=combo>=2?`COMBO ${String(combo).padStart(2,'0')}`:'';
      comboEl.classList.toggle('show',combo>=2);
    }
    function pulseLane(key,type){
      const lane=document.querySelector(`[data-comet-lane="${key}"]`);
      if(!lane) return;
      lane.classList.remove('hit','miss');
      void lane.offsetWidth;
      lane.classList.add(type);
      setTimeout(()=>lane.classList.remove(type),220);
    }
    function scheduleNextSpawn(){
      clearTimeout(spawnTimer);
      if(finished) return;
      const t=clock();
      if(nextSpawnAt<=t+.04) nextSpawnAt=t+.08;
      spawnTimer=setTimeout(()=>{
        if(finished) return;
        spawn(nextSpawnAt);
        nextSpawnAt+=spawnGapBeats()*BEAT;
        scheduleNextSpawn();
      },Math.max(0,(nextSpawnAt-t)*1000));
    }
    function spawn(spawnAt=clock()){
      if(finished) return;
      const laneKey=chooseLane();
      const targetTime=spawnAt+(TRAVEL_BEATS*BEAT);
      const el=document.createElement('div');
      el.className=`comet-note active ${dirClass[laneKey]}`;
      el.dataset.lane=laneKey;
      el.dataset.direction=laneKey;
      // Position only within the note's own lane container. The lane itself
      // owns the horizontal placement; the note is always centred at 50%.
      el.style.left='50%';
      el.style.top='5%';
      el.innerHTML=arrowMarkup(laneKey);
      laneHosts[laneKey].appendChild(el);
      notes.push({laneKey,dirKey:laneKey,el,spawnTime:spawnAt,targetTime,hit:false});
      signalCount++;
      if(signalCount===2&&instruction) instruction.classList.add('recede');
      if(!raf) raf=requestAnimationFrame(frame);
    }
    function removeNote(note,status='miss'){
      if(!note||!notes.includes(note)) return;
      note.hit=status==='hit';
      note.el.classList.remove('active');
      note.el.classList.add(status);
      setTimeout(()=>note.el.remove(),190);
      notes=notes.filter(n=>n!==note);
    }
    function triggerMissVisual(key){
      pulseLane(key,'miss');
      game.classList.remove('miss-shock');
      void game.offsetWidth;
      game.classList.add('miss-shock');
      setTimeout(()=>game.classList.remove('miss-shock'),260);
    }
    function registerMiss(key,message='SIGNAL MISSED',note=null){
      if(finished) return;
      triggerMissVisual(key);
      if(note) removeNote(note,'miss');
      combo=0;
      updateCombo();
      showJudgement('MISS','miss');
      stateEl.textContent=message;
      ping(180,.09,.025);
      haptic([18,20,28]);
    }
    function hitNote(note,error){
      if(finished||!note) return;
      const perfect=error<=PERFECT_WINDOW;
      pulseLane(note.laneKey,'hit');
      removeNote(note,'hit');
      flash.classList.remove('active');
      void flash.offsetWidth;
      flash.classList.add('active');
      setTimeout(()=>flash.classList.remove('active'),280);

      correct++;
      combo++;
      updateCombo();
      progress.textContent=`${correct} / 10`;
      steps[correct-1]?.classList.add('on');
      showJudgement(perfect?'PERFECT':'GOOD',perfect?'perfect':'good');
      ping(perfect?880:720,.055,perfect?.022:.016);
      haptic(perfect?[24,18,28]:20);
      stateEl.textContent=combo>=3?`SYNCED · COMBO ${combo}`:'SIGNAL LOCK';

      if(correct>=10){
        finished=true;
        cancelAnimationFrame(raf);raf=0;
        clearTimeout(spawnTimer);
        notes.forEach(n=>n.el.remove());notes=[];
        game.classList.add('complete');
        panel?.classList.add('is-complete');
        document.querySelectorAll('.comet-btn').forEach(b=>b.disabled=true);
        comboEl.classList.remove('show');
        judgement.textContent='LOCKED';
        judgement.className='comet-judgement show complete';
        stateEl.textContent='LOCKED';
        // Hard-stop the rhythm loop before starting the dedicated
        // completion payoff: the two audio sources must never overlap.
        stopMusic();
        playCompletionSound();
        haptic([30,22,60]);
        setTimeout(()=>showCompletion('Flight Controls Calibrated','Santa-1’s flight controls have been calibrated and are responding correctly.'),900);
      }
    }
    function frame(){
      if(finished){raf=0;return;}
      const t=clock();
      const beatIndex=Math.floor((t-BEAT_OFFSET)/BEAT);
      if(beatIndex>=0&&beatIndex!==lastBeat){lastBeat=beatIndex;pulseBeat();}

      notes.slice().forEach(note=>{
        let y=.05;
        if(t<=note.targetTime){
          const p=Math.max(0,Math.min(1,(t-note.spawnTime)/(note.targetTime-note.spawnTime)));
          y=.05+((TARGET_Y-.05)*p);
        }else{
          const p=Math.max(0,Math.min(1,(t-note.targetTime)/MISS_WINDOW));
          y=TARGET_Y+((.97-TARGET_Y)*p);
        }
        note.el.style.top=(y*100)+'%';
        if(t-note.targetTime>MISS_WINDOW){
          registerMiss(note.laneKey,'SIGNAL MISSED',note);
        }
      });
      raf=requestAnimationFrame(frame);
    }

    document.querySelectorAll('.comet-btn[data-arrow]').forEach(btn=>btn.onclick=()=>{
      if(finished) return;
      ensureMusic();
      const key=btn.dataset.arrow;
      const t=clock();
      const laneNotes=notes
        .filter(n=>n.laneKey===key)
        .map(n=>({note:n,error:Math.abs(t-n.targetTime),delta:t-n.targetTime}))
        .sort((a,b)=>a.error-b.error);
      const candidate=laneNotes[0];

      if(!candidate||candidate.error>MISS_WINDOW){
        const activeNear=notes.some(n=>Math.abs(t-n.targetTime)<=MISS_WINDOW);
        if(activeNear) registerMiss(key,'INPUT ERROR');
        else { stateEl.textContent='WAIT FOR THE LINE'; haptic(7); }
        return;
      }

      if(candidate.error>GOOD_WINDOW){
        registerMiss(key,'TIMING LOST',candidate.note);
        return;
      }
      hitNote(candidate.note,candidate.error);
    });

    cleanupMission=()=>{
      cancelAnimationFrame(raf);
      clearTimeout(spawnTimer);
      clearTimeout(judgementTimer);
      clearTimeout(beatPulseTimer);
      notes.forEach(n=>n.el.remove());
      notes=[];
      stopMusic();
      stopCompletionSound();
      endMissionAudioRadioOverride('comet');
      if(cometRadioWasPlaying) ensureElfRadioPlayback(1,520);
    };

    clockStart=performance.now();
    startMusic();
    nextSpawnAt=BEAT_OFFSET;
    scheduleNextSpawn();
    raf=requestAnimationFrame(frame);
  }
