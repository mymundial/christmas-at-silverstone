  let mc00ScanTimer = null;
  let mc00ScanRaf = null;

  function stopMc00Scan(){
    if(mc00ScanTimer){ clearInterval(mc00ScanTimer); mc00ScanTimer = null; }
    if(mc00ScanRaf){ cancelAnimationFrame(mc00ScanRaf); mc00ScanRaf = null; }
  }

  function continueMc00Sequence(mode){
    stopMc00Scan();
    set({ bootDone: 'brief' });
  }

  function bindMc00Scan(step){
    if(step!=='mc00-live') return;
    const card = document.querySelector('.mc00-card');
    const bar = document.getElementById('mc00ProgressFill');
    const value = document.getElementById('mc00ProgressValue');
    const progress = document.querySelector('.mc00-progress');
    const complete = document.getElementById('mc00CompleteBlock');
    const button = document.getElementById('mc00Continue');
    if(!card || !bar || !value || !progress || !complete || !button) return;

    stopMc00Scan();

    const scanSystems = [
      'circuitry','diagnostic','comms','power','core',
      'propulsion','guidance','control','response','navigation'
    ].map((key,index)=>({ key, start:index*10, end:(index+1)*10 }));

    let progressValue = 0;
    const lastStates = new Map();

    const setSystemState = (key,nextState)=>{
      const previous=lastStates.get(key);
      if(previous===nextState) return;
      lastStates.set(key,nextState);
      const item=document.querySelector(`[data-mc00-system="${key}"]`);
      const status=document.querySelector(`[data-mc00-status="${key}"]`);
      if(!item||!status) return;
      item.classList.remove('is-standby','is-checking','is-offline','is-online');
      item.classList.add(`is-${nextState}`);
      status.textContent=nextState==='checking'?'Checking':nextState==='offline'?'Offline':nextState==='online'?'Online':'Standby';
      // Ten evenly spaced scan pings: 0%, 10% ... 90%.
      // Navigation is deliberately on the same cadence as every other system.
      if(previous&&nextState==='checking') ping(620,.05,.018);
    };

    const paint = ()=>{
      bar.style.transform = `scaleX(${progressValue/100})`;
      value.textContent = `${progressValue}%`;
      progress.setAttribute('aria-valuenow', String(progressValue));

      scanSystems.forEach(system=>{
        const nextState = progressValue < system.start
          ? 'standby'
          : progressValue < system.end
            ? 'checking'
            : 'offline';
        setSystemState(system.key,nextState);
      });

      if(progressValue >= 100){
        stopMc00Scan();
        card.classList.add('is-complete');
        complete.hidden = false;
      }
    };

    scanSystems.forEach(system=>setSystemState(system.key,'standby'));
    paint();
    card.classList.remove('is-complete');
    complete.hidden = true;

    mc00ScanTimer = setInterval(()=>{
      progressValue = Math.min(100, progressValue + 1);
      paint();
      if(progressValue === 100){
        ping(860,.12,.05);
        haptic([20,35,65]);
      }
    }, 45);
  }
