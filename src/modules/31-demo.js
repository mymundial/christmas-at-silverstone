  function startDemoExperience(){
    clearDemo();
    stopGpsWatch();
    lastGps=null;
    demoHoldUntil=Date.now()+900;
    demoTrackPosition=null;
    demoTrackDistance=null;
    state={...state,onboarded:true,bootDone:true,mode:'demo',gpsEnabled:false,nav:'radar',completed:[],available:[],routeIndex:1,targetVisible:false,targetInRange:false,distance:null,gpsCondition:'DEMO',demoRouteDistance:null};
    save();
    ensureOpeningMessage();
    render();
    ping(480,.07,.025);
    maybeStartDemoTarget(650);
  }
  function clearDemo(){clearTimeout(demoTimer);clearInterval(demoInterval);demoTimer=null;demoInterval=null;}
  function rearmDemoRoute(delay=350){
    if(state.mode!=='demo') return;
    const expectedIndex=normaliseProgressRouteIndex(state.routeIndex,state.completed);
    if(expectedIndex!==state.routeIndex){state.routeIndex=expectedIndex;save();}
    const arm=()=>{
      if(state.mode!=='demo'||state.nav!=='radar'||state.missionOpen||state.routeIndex!==expectedIndex||state.targetInRange) return;
      if(demoTimer===null&&demoInterval===null) forceDemoTarget(0);
    };
    setTimeout(arm,Math.max(0,Number(delay)||0));
    // Fallback in case a navigation/render transition interrupted the first timer.
    setTimeout(arm,2600);
  }

  function setDemoCircuitPosition(routeDistance){
    if(routeDistance===null||routeDistance===undefined||!Number.isFinite(Number(routeDistance))) return null;
    const routePoint=routePointAtDistance(Number(routeDistance));
    demoTrackDistance=routePoint.distance;
    demoTrackPosition={lat:routePoint.lat,lng:routePoint.lng,accuracy:5,timestamp:Date.now()};
    state.demoRouteDistance=routePoint.distance;
    return routePoint;
  }

  function restoreDemoCircuitPosition(){
    if(state.mode!=='demo'||!state.completed.includes('entry')) return null;
    if(demoTrackPosition&&Number.isFinite(demoTrackPosition.lat)&&Number.isFinite(demoTrackPosition.lng)) return demoTrackPosition;

    const persisted=state.demoRouteDistance;
    if(persisted!==null&&persisted!==undefined&&Number.isFinite(Number(persisted))){
      const routePoint=setDemoCircuitPosition(Number(persisted));
      return routePoint?demoTrackPosition:null;
    }

    // Older/demo sessions can reach the post-MC01 radar without a persisted
    // route distance. Seed from the checkpoint the guest is actually at, or
    // otherwise from the most recently completed route checkpoint.
    let seedCp=null;
    const activeCp=current();
    if(state.targetInRange&&activeCp) seedCp=activeCp;
    if(!seedCp){
      for(let i=Math.min(CHECKPOINTS.length-1,Math.max(ROUTE_START_INDEX,state.routeIndex-1));i>=ROUTE_START_INDEX;i--){
        const candidate=CHECKPOINTS[i];
        if(candidate&&state.completed.includes(candidate.id)){seedCp=candidate;break;}
      }
    }
    const seedCfg=activeConfig(seedCp);
    const projected=seedCfg?projectGeoToRoute(seedCfg.lat,seedCfg.lng):null;
    if(!projected) return null;
    const routePoint=setDemoCircuitPosition(projected.distance);
    save();
    return routePoint?demoTrackPosition:null;
  }
  function demoRouteSeedDistance(cp){
    if(Number.isFinite(demoTrackDistance)) return normaliseRouteDistance(demoTrackDistance);
    const restored=restoreDemoCircuitPosition();
    if(restored&&Number.isFinite(demoTrackDistance)) return normaliseRouteDistance(demoTrackDistance);
    const targetIndex=checkpointIndex(cp?.id);
    for(let i=targetIndex-1;i>=ROUTE_START_INDEX;i--){
      const previous=CHECKPOINTS[i];
      if(!previous||!state.completed.includes(previous.id)) continue;
      const previousCfg=activeConfig(previous);
      if(!previousCfg) continue;
      const projected=projectGeoToRoute(previousCfg.lat,previousCfg.lng);
      if(projected) return projected.distance;
    }
    return null;
  }

  function beginDemoCircuitApproach(cp,cfg){
    const targetProjection=projectGeoToRoute(cfg.lat,cfg.lng);
    if(!targetProjection) return false;
    const activationRadius=Number(cfg.activationRadius)||30;
    const startDistance=demoRouteSeedDistance(cp);
    if(!Number.isFinite(startDistance)) return false;

    // Travel continuously forward around the calibrated lap. Demo compresses time
    // but never teleports, reverses, or cuts across the circuit between missions.
    const routeTravel=forwardRouteDistance(startDistance,targetProjection.distance);
    const tickMs=100;
    const speedMetresPerSecond=180;
    let travelled=0;

    const updatePosition=(routeDistance,remainingRouteDistance)=>{
      const routePoint=setDemoCircuitPosition(routeDistance);
      const d=distanceMetres(routePoint.lat,routePoint.lng,cfg.lat,cfg.lng);
      state.distance=Math.max(0,Number.isFinite(remainingRouteDistance)?remainingRouteDistance:d);
      state.bearing=bearingDegrees(routePoint.lat,routePoint.lng,cfg.lat,cfg.lng);
      // Post-MC01 Demo navigation always exposes the next checkpoint from the
      // moment the previous mission is cleared, rather than waiting to enter
      // the normal live detection radius.
      state.targetVisible=true;
      state.targetInRange=false;
      save();updateRadarLive();
      return d;
    };

    const finishAtTarget=()=>{
      const routePoint=setDemoCircuitPosition(targetProjection.distance);
      const d=distanceMetres(routePoint.lat,routePoint.lng,cfg.lat,cfg.lng);
      state.targetVisible=true;state.targetInRange=true;state.distance=d;
      state.bearing=bearingDegrees(routePoint.lat,routePoint.lng,cfg.lat,cfg.lng);
      unlockMission(cp.id);save();updateRadarLive();ping(700,.08,.04);haptic(30);
    };

    let d=updatePosition(startDistance,routeTravel);
    if(routeTravel<1){finishAtTarget();return true;}

    demoInterval=setInterval(()=>{
      if(!canRunDemoTarget()){clearInterval(demoInterval);demoInterval=null;return;}
      const activeCp=current();const activeCfg=activeConfig(activeCp);
      if(!activeCp||!activeCfg||activeCp.id!==cp.id){clearInterval(demoInterval);demoInterval=null;return;}
      travelled=Math.min(routeTravel,travelled+speedMetresPerSecond*(tickMs/1000));
      d=updatePosition(startDistance+travelled,routeTravel-travelled);
      if(travelled>=routeTravel){
        clearInterval(demoInterval);demoInterval=null;finishAtTarget();
      }
    },tickMs);
    return true;
  }

  function beginDemoApproach(){
    if(!canRunDemoTarget()) return;
    const cp=current();
    const cfg=activeConfig(cp);
    if(!cp||!cfg) return;
    const activationRadius=Number(cfg.activationRadius)||30;
    if(state.completed.includes('entry')&&cp.id!=='entry'&&beginDemoCircuitApproach(cp,cfg)) return;
    let d=state.targetVisible&&Number.isFinite(state.distance)
      ? Math.max(activationRadius,state.distance)
      : 180;
    state.targetVisible=true;
    state.targetInRange=false;
    state.distance=d;
    state.bearing=Number.isFinite(state.bearing)?state.bearing:35;
    save();updateRadarLive();
    if(d<=activationRadius){
      state.targetInRange=true;state.distance=activationRadius;unlockMission(cp.id);save();updateRadarLive();ping(700,.08,.04);haptic(30);return;
    }
    demoInterval=setInterval(()=>{
      if(!canRunDemoTarget()){clearInterval(demoInterval);demoInterval=null;return;}
      const activeCp=current();
      const activeCfg=activeConfig(activeCp);
      if(!activeCp||!activeCfg){clearInterval(demoInterval);demoInterval=null;return;}
      const activeRadius=Number(activeCfg.activationRadius)||30;
      d-=16;
      state.distance=Math.max(activeRadius,d);
      state.bearing=(state.bearing+2)%360;
      if(d<=activeRadius){
        clearInterval(demoInterval);demoInterval=null;
        state.targetInRange=true;state.distance=activeRadius;unlockMission(activeCp.id);save();updateRadarLive();ping(700,.08,.04);haptic(30);
      }else{save();updateRadarLive();}
    },650);
  }
  function forceDemoTarget(delay=250){
    if(state.mode!=='demo'||state.nav!=='radar'||state.missionOpen||!current()) return;
    clearDemo();
    demoTimer=setTimeout(()=>{demoTimer=null;beginDemoApproach();},Math.max(0,Number(delay)||0));
  }
  function canRunDemoTarget(){
    return state.mode==='demo'&&state.nav==='radar'&&(state.elfPromptSeen||state.elfUnlocked)&&!state.missionOpen&&!!current()&&!state.targetInRange;
  }
  function maybeStartDemoTarget(delay=500){
    if(!canRunDemoTarget()||demoTimer!==null||demoInterval!==null) return;
    const wait=Math.max(0,Number(delay)||0,demoHoldUntil-Date.now());
    demoTimer=setTimeout(()=>{
      demoTimer=null;
      // If the guest opened another panel during the wait, stop here. The
      // next Radar render will call maybeStartDemoTarget() again.
      if(!canRunDemoTarget()) return;
      beginDemoApproach();
    },wait);
  }

