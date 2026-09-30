  async function completeElfTuning(){
    stopStatic();
    state.elfUnlocked=true;
    const audio=getElfAudio();
    let playing=false;
    if(audio){
      try{
        audio.volume=1;
        await audio.play();
        playing=true;
      }catch{
        playing=false;
      }
    }
    elfTunerPreviewActive=false;
    state.elfAudioOn=playing;
    save();
    showRadioCompletion();
    if(!playing) toast('Signal tuned. Use ELF FM in Comms to start the stream.');
  }
  function bindRadio(){
    const range=document.getElementById('freqRange'), val=document.getElementById('freqVal'), st=document.getElementById('signalState'), btn=document.getElementById('lockSignal'), wave=document.getElementById('radioWave');
    startStatic(.095);
    startElfTunerPreview().then(started=>{if(!started) st.textContent='Move the tuner to locate the signal';});
    let wasLocked=false;
    const update=()=>{
      const f=Number(range.value);
      val.textContent=f.toFixed(1);
      const delta=Math.abs(f-87.7);
      const distanceMix=Math.max(0,Math.min(1,delta/1.1));
      setStatic(.006+distanceMix*.089);
      setElfTunerPreview(delta);
      if(delta<.051){
        st.textContent='Signal acquired';st.classList.add('lock');btn.disabled=false;wave.classList.add('locked');
        if(!wasLocked){ping(920,.06,.02);haptic(20);wasLocked=true;}
      } else {
        wasLocked=false;
        st.textContent=delta<.15?'Signal almost clear…':delta<.4?'Signal resolving…':delta<.8?'Weak signal…':'Searching for signal';
        st.classList.remove('lock');btn.disabled=true;wave.classList.remove('locked');
      }
    };
    range.oninput=update;update();
    btn.onclick=()=>{completeElfTuning();};
    cleanupMission=()=>{stopStatic();stopElfTunerPreview();};
  }
