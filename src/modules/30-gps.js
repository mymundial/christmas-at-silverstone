  function startGpsWatch(){
    if(state.gpsEnabled===false||gpsWatchId!==null||!navigator.geolocation) return;
    gpsWatchId=navigator.geolocation.watchPosition(pos=>processGps(normalisePosition(pos)),err=>{
      if(err.code===1){stopGpsWatch();state.gpsEnabled=false;}
      state.gpsCondition=err.code===1?'DENIED':'WAITING';save();updateRadarLive();
    },{enableHighAccuracy:true,maximumAge:1000,timeout:15000});
  }
  function normalisePosition(pos){return {lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy,timestamp:pos.timestamp||Date.now()};}
  function stopGpsWatch(){
    if(gpsWatchId!==null&&navigator.geolocation){try{navigator.geolocation.clearWatch(gpsWatchId);}catch{}}
    gpsWatchId=null;
  }
  function disableGpsSetting(){
    stopGpsWatch();
    lastGps=null;
    resetGeofenceRuntime();
    state={...state,gpsEnabled:false,gpsCondition:'OFF',gpsAccuracy:null,targetVisible:false,targetInRange:false,distance:null};
    save();render();toast('GPS location off.');
  }
  function enableGpsSetting(){
    if(!navigator.geolocation){toast('Location services are unavailable on this device.');return;}
    state.gpsEnabled=true;state.gpsCondition='WAITING';save();render();
    navigator.geolocation.getCurrentPosition(pos=>{
      clearDemo();
      state={...state,mode:'live',gpsEnabled:true,gpsAccuracy:pos.coords.accuracy,gpsCondition:gpsCondition(pos.coords.accuracy),targetVisible:false,targetInRange:false,distance:null};
      save();render();startGpsWatch();processGps(normalisePosition(pos),true);toast('GPS location on.');
    },err=>{
      state.gpsEnabled=false;state.gpsCondition=err.code===1?'DENIED':'OFF';save();render();toast(err.code===1?'Location permission was denied.':'Unable to enable GPS location.');
    },{enableHighAccuracy:true,timeout:10000,maximumAge:0});
  }
  function toggleGpsSetting(){
    const gpsOn=state.mode==='live'&&state.gpsEnabled!==false;
    if(gpsOn) disableGpsSetting(); else enableGpsSetting();
  }
  function processGps(fix,force=false){
    if(!fix||!Number.isFinite(fix.lat)||!Number.isFinite(fix.lng)) return;
    lastGps=fix;
    state.gpsAccuracy=fix.accuracy;state.gpsCondition=gpsCondition(fix.accuracy);
    if(IS_ADMIN){updateAdminGps();return;}
    if(!state.onboarded||state.mode!=='live'){save();return;}
    if(state.missionOpen){save();return;}
    const cp=current();
    if(!cp){state.targetVisible=false;state.targetInRange=false;state.distance=null;save();updateRadarLive();return;}
    const cfg=activeConfig(cp);
    const d=distanceMetres(fix.lat,fix.lng,cfg.lat,cfg.lng);
    const bearing=bearingDegrees(fix.lat,fix.lng,cfg.lat,cfg.lng);
    state.distance=d;state.bearing=bearing;
    const now=Date.now();
    const accuracy=Number(fix.accuracy);
    const reliable=Number.isFinite(accuracy)&&accuracy<=ACTIVATION_ACCURACY_MAX;
    const passReliable=Number.isFinite(accuracy)&&accuracy<=PASS_ACCURACY_MAX;
    const detectable=Number.isFinite(accuracy)&&accuracy<=DETECTION_ACCURACY_MAX&&d<=cfg.detectionRadius;
    const exitRadius=(cfg.activationRadius||30);
    const nextCp=nextRouteCheckpoint(state.routeIndex);
    const nextCfg=activeConfig(nextCp);
    const nextDistance=nextCfg&&nextCfg.geofence!==false?distanceMetres(fix.lat,fix.lng,nextCfg.lat,nextCfg.lng):Infinity;

    // Passing because the following checkpoint is nearby is intentionally much
    // stricter than ordinary detection. This avoids overlapping detection zones
    // skipping a mission: the next checkpoint must be close to its activation
    // zone, the current checkpoint must clearly be behind us, and the evidence
    // must persist across multiple good fixes.
    const nextPassRadius=nextCfg?(nextCfg.activationRadius||30)+20:0;
    const strongNextEvidence=Boolean(
      nextCfg&&
      Number.isFinite(accuracy)&&accuracy<=NEXT_PASS_ACCURACY_MAX&&
      nextDistance<=nextPassRadius&&
      d>exitRadius+15
    );
    if(strongNextEvidence){
      if(!nextPassSince) nextPassSince=now;
    } else nextPassSince=null;
    const nextPassConfirmed=Boolean(nextPassSince&&now-nextPassSince>=NEXT_PASS_DWELL_MS);

    const registerActivationFix=()=>{
      if(reliable&&d<=cfg.activationRadius){
        if(!activationSince) activationSince=now;
        activationHits++;
        return activationHits>=ACTIVATION_HITS_REQUIRED&&now-activationSince>=ACTIVATION_DWELL_MS;
      }
      activationHits=0;activationSince=null;
      return false;
    };

    if(cp.type==='activation'){
      state.targetVisible=detectable;state.targetInRange=false;
      const activationConfirmed=registerActivationFix();
      save();updateRadarLive();
      if(activationConfirmed||nextPassConfirmed) triggerCircuitEntry();
      return;
    }

    if(!inRangeLatched){
      // Once Circuit Link has been completed the circuit itself becomes the
      // navigation environment, so the current/next checkpoint remains visible
      // even when it is outside the old proximity-only detection radius.
      state.targetVisible=state.completed.includes('entry')?true:detectable;

      // `available` is persisted when a checkpoint has already been entered.
      // This lets a refresh recover the same leave-without-completing behaviour:
      // once a reliable fix confirms the guest is outside that activation radius,
      // navigation can hand off to the next checkpoint without forcing re-entry.
      if(state.available.includes(cp.id)&&passReliable&&d>exitRadius){
        state.targetInRange=false;
        if(!outsideSince) outsideSince=now;
        if(now-outsideSince>=PASS_DWELL_MS){passCurrentCheckpoint('left unlocked activation');if(lastGps)setTimeout(()=>processGps(lastGps,true),25);return;}
      } else {
        outsideSince=null;
        if(registerActivationFix()){
          inRangeLatched=true;state.targetVisible=true;state.targetInRange=true;unlockMission(cp.id);ping(700,.08,.04);haptic(30);
        }
      }
    } else {
      state.targetVisible=true;state.targetInRange=true;
      // Do not advance a checkpoint on a weak GPS fix. The guest must remain
      // outside the exit radius with a reasonably accurate fix for the full
      // dwell period before the route moves on.
      if(passReliable&&d>exitRadius){
        if(!outsideSince) outsideSince=now;
        if(now-outsideSince>=PASS_DWELL_MS){passCurrentCheckpoint('exit radius');if(lastGps)setTimeout(()=>processGps(lastGps,true),25);return;}
      } else outsideSince=null;
    }

    if(nextPassConfirmed&&!state.targetInRange){
      passCurrentCheckpoint('next checkpoint confirmed');
      if(lastGps)setTimeout(()=>processGps(lastGps,true),25);
      return;
    }
    save();updateRadarLive();
  }

  function activeRadarGeoPosition(){
    if(state.mode==='demo'){
      if(demoTrackPosition&&Number.isFinite(demoTrackPosition.lat)&&Number.isFinite(demoTrackPosition.lng)) return demoTrackPosition;
      const restored=restoreDemoCircuitPosition();
      if(restored) return restored;
      return null;
    }
    if(lastGps&&Number.isFinite(lastGps.lat)&&Number.isFinite(lastGps.lng)) return lastGps;
    return null;
  }
  function activeRadarCircuitGeoPosition(){
    const fix=activeRadarGeoPosition();
    if(!fix) return null;
    if(state.mode==='live'&&localTestEnabled){
      const virtual=localTestVirtualProjection(fix.lat,fix.lng);
      if(virtual) return virtual;
    }
    return fix;
  }
  function circuitRadarTargetPoint(cp,cfg){
    if(!cp||!cfg) return null;
    if(state.mode==='live'&&localTestEnabled&&localTestRouteStatus().ready){
      // Local coordinates drive geofences, but the visible target remains at the
      // equivalent Silverstone checkpoint so the village walk rehearses the
      // actual circuit journey without feeding local lat/lng into the affine map.
      return geoToCircuitPoint(cp.lat,cp.lng);
    }
    return geoToCircuitPoint(cfg.lat,cfg.lng);
  }

  function primeCurrentCircuitTarget(){
    if(!state.completed.includes('entry')) return false;
    const cp=current();
    const cfg=activeConfig(cp);
    if(!cp||!cfg) return false;
    const fix=activeRadarGeoPosition();
    if(!fix) return false;

    let distance=distanceMetres(fix.lat,fix.lng,cfg.lat,cfg.lng);
    if(state.mode==='demo'){
      const fromDistance=Number.isFinite(demoTrackDistance)
        ? normaliseRouteDistance(demoTrackDistance)
        : projectGeoToRoute(fix.lat,fix.lng)?.distance;
      const targetProjection=projectGeoToRoute(cfg.lat,cfg.lng);
      if(Number.isFinite(fromDistance)&&targetProjection) distance=forwardRouteDistance(fromDistance,targetProjection.distance);
    }

    state.targetVisible=true;
    state.targetInRange=false;
    state.distance=distance;
    state.bearing=bearingDegrees(fix.lat,fix.lng,cfg.lat,cfg.lng);
    return true;
  }
  function updateCircuitRadar(cp,cfg){
    const map=document.getElementById('trackRadarMap');
    const art=document.getElementById('trackRadarArt');
    const target=document.getElementById('trackRadarTarget');
    if(!map||!art) return;
    const fix=activeRadarCircuitGeoPosition();
    if(!fix){map.classList.add('waiting');if(target)target.classList.add('hidden');return;}
    const userPoint=geoToCircuitPoint(fix.lat,fix.lng);
    if(!userPoint){map.classList.add('waiting');if(target)target.classList.add('hidden');return;}
    // Keep the user fixed at 50/50 while the original circuit SVG moves below
    // them. Position the artwork completely before revealing the layer so a
    // refresh can never paint the SVG at its uninitialised 0/0 browser default.
    const zoom=CIRCUIT_RADAR_ZOOM;
    const unitPct=zoom*100/CIRCUIT_GEOREFERENCE.viewBoxWidth;
    art.style.left=`calc(50% - ${userPoint.x*unitPct}%)`;
    art.style.top=`calc(50% - ${userPoint.y*unitPct}%)`;
    if(target&&cp&&cfg){
      const targetPoint=circuitRadarTargetPoint(cp,cfg);
      if(targetPoint){
        target.style.left=`calc(50% + ${(targetPoint.x-userPoint.x)*unitPct}%)`;
        target.style.top=`calc(50% + ${(targetPoint.y-userPoint.y)*unitPct}%)`;
        target.classList.toggle('hidden',!state.targetVisible);
      }else target.classList.add('hidden');
    }
    map.classList.remove('waiting');
  }

  function updateRadarLive(){
    if(IS_ADMIN||state.nav!=='radar'||state.missionOpen) return;
    updateCommsBadge();
    const cp=current(); const cfg=activeConfig(cp);
    const gpsValue=document.querySelector('.status-cell:first-child .status-value');
    if(gpsValue){const condition=state.mode==='demo'?'DEMO':state.gpsCondition;gpsValue.textContent=condition;gpsValue.className=`status-value gps-${condition.toLowerCase()}`;}
    const sleighValue=document.querySelector('.status-cell:nth-child(2) .status-value'); if(sleighValue)sleighValue.textContent=`${recovery()}%`;
    const checkpointValue=document.querySelector('.status-cell:last-child .status-value');
    if(checkpointValue){const d=distanceToActivation(cp,state.distance);checkpointValue.textContent=!cp?'GARAGES':state.targetVisible&&Number.isFinite(d)?`${Math.round(d)} M`:'SEARCHING';}
    const target=document.querySelector('.target-dot');
    const finalCircuitOverview=state.completed.includes('northern');
    const localVirtualCircuitMode=state.mode==='live'&&localTestEnabled&&localTestRouteStatus().ready;
    const circuitMode=state.completed.includes('entry')||finalCircuitOverview||localVirtualCircuitMode;
    if(finalCircuitOverview){
      if(target) target.classList.add('hidden');
      // Final mission state is a static full-circuit overview. GPS/Demo movement
      // no longer translates the artwork, but the radar sweep remains active.
    }else if(circuitMode){
      if(target) target.classList.add('hidden');
      updateCircuitRadar(cp,cfg);
    }else if(target&&cp&&cfg){
      const radial=state.targetInRange?5:Math.max(8,Math.min(39,(Number.isFinite(state.distance)?state.distance/cfg.detectionRadius:1)*39));
      const ang=(Number.isFinite(state.bearing)?state.bearing:0)-90;
      const x=50+Math.cos(toRad(ang))*radial, y=50+Math.sin(toRad(ang))*radial;
      target.style.left=`${x}%`;target.style.top=`${y}%`;target.classList.toggle('hidden',!state.targetVisible);
    }
    const msg=document.getElementById('radarMessage'); if(!msg)return;
    const holder=document.createElement('div');holder.innerHTML=radarMessage(cp).trim();const fresh=holder.firstElementChild;
    if(!fresh)return;
    if(msg.innerHTML!==fresh.innerHTML||msg.className!==fresh.className){
      msg.className=fresh.className;msg.innerHTML=fresh.innerHTML;
      const b=msg.querySelector('[data-start-mission]');if(b)b.addEventListener('click',()=>openMission(b.dataset.startMission));
      const read=msg.querySelector('[data-read-messages]');if(read)read.addEventListener('click',()=>{markAllMessagesRead();set({nav:'comms'});});
      const dismiss=msg.querySelector('[data-dismiss-messages]');if(dismiss)dismiss.addEventListener('click',dismissMessageAlert);
    }
  }

