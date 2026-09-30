  function bindDiagnostics(){
    const done=new Set();
    const durations=[1600,1900,1700,1200,1680,2050];
    const scanAudioPaths=[
      './assets/mc02-scan-aero.mp3',
      './assets/mc02-scan-stability.mp3',
      './assets/mc02-scan-power.mp3',
      './assets/mc02-scan-control.mp3',
      './assets/mc02-scan-traction.mp3',
      './assets/mc02-scan-response.mp3'
    ];
    const scanAudio=scanAudioPaths.map(src=>{
      const audio=new Audio(src);
      audio.preload='auto';
      audio.volume=.72;
      return audio;
    });
    const captureAudio=new Audio('./assets/mc02-scan-capture.mp3');
    captureAudio.preload='auto';
    captureAudio.volume=.82;
    const submitAudio=new Audio('./assets/mc02-mission-complete.mp3');
    submitAudio.preload='auto';
    submitAudio.volume=.82;
    let busy=false;
    let activeScanAudio=null;
    let fadeTimer=null;

    function playOneShot(audio){
      if(!state.audio||!audio)return;
      try{
        audio.pause();
        audio.currentTime=0;
        const play=audio.play();
        if(play&&typeof play.catch==='function')play.catch(()=>{});
      }catch{}
    }

    function stopDiagnosticScanFx(fade=true){
      if(fadeTimer){clearInterval(fadeTimer);fadeTimer=null;}
      const audio=activeScanAudio;
      if(!audio)return;
      const finish=()=>{
        try{audio.pause();audio.currentTime=0;audio.volume=.72;}catch{}
        if(activeScanAudio===audio)activeScanAudio=null;
      };
      if(!fade||audio.paused){finish();return;}
      const from=Math.max(.01,audio.volume);
      let step=0;
      fadeTimer=setInterval(()=>{
        step+=1;
        try{audio.volume=Math.max(0,from*(1-step/6));}catch{}
        if(step>=6){
          clearInterval(fadeTimer);fadeTimer=null;finish();
        }
      },24);
    }

    function playDiagnosticScanFx(index){
      if(!state.audio)return;
      stopDiagnosticScanFx(false);
      const audio=scanAudio[index];
      if(!audio)return;
      activeScanAudio=audio;
      try{
        audio.pause();
        audio.currentTime=0;
        audio.volume=.72;
        const play=audio.play();
        if(play&&typeof play.catch==='function')play.catch(()=>{if(activeScanAudio===audio)activeScanAudio=null;});
      }catch{if(activeScanAudio===audio)activeScanAudio=null;}
    }

    scanAudio.forEach(audio=>audio.addEventListener('ended',()=>{
      if(activeScanAudio===audio){audio.volume=.72;activeScanAudio=null;}
    }));

    document.querySelectorAll('[data-sensor]').forEach(btn=>btn.onclick=()=>{
      const i=Number(btn.dataset.sensor);
      if(done.has(i)||busy)return;
      busy=true;
      document.querySelectorAll('[data-sensor]').forEach(other=>{ if(other!==btn&&!other.classList.contains('done')) other.classList.add('scan-locked'); });
      btn.classList.add('active');
      btn.querySelector('.state').textContent='Scanning…';
      playDiagnosticScanFx(i);
      haptic(12);
      setTimeout(()=>{
        stopDiagnosticScanFx(true);
        done.add(i);
        btn.classList.remove('active');
        btn.classList.add('done');
        btn.querySelector('.state').innerHTML='Captured <span class="checkmark-icon checkmark-icon--inline" aria-hidden="true"></span>';
        document.querySelectorAll('[data-sensor]').forEach(other=>other.classList.remove('scan-locked'));
        playOneShot(captureAudio);
        haptic(24);
        busy=false;
        if(done.size===6)document.getElementById('diagComplete').disabled=false;
      },durations[i]||1800);
    });
    document.getElementById('diagComplete').onclick=()=>{
      stopDiagnosticScanFx(false);
      playOneShot(submitAudio);
      showCompletion('Performance Scan Complete','The racing performance data has been captured and is ready to support Santa-1’s recovery systems.');
    };
  }
