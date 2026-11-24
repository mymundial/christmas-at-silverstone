  // Internally retain `demo` as the stored mode identifier so existing progress
  // survives upgrades. The visitor-facing experience is No GPS, not a demo.
  function makeNoGpsCheckpointReady(){
    if(state.mode!=='demo') return;
    const expectedIndex=normaliseProgressRouteIndex(state.routeIndex,state.completed);
    state.routeIndex=expectedIndex;
    state.gpsEnabled=false;
    state.gpsCondition='OFF';
    state.targetVisible=!!current();
    state.targetInRange=!!current();
    state.distance=null;
    state.demoRouteDistance=null;
    demoTrackPosition=null;
    demoTrackDistance=null;
    state.available=[]; // no out-of-order replays in the no-GPS journey
    save();
  }
  function startDemoExperience(){
    clearDemo();
    stopGpsWatch();
    lastGps=null;
    resetGeofenceRuntime();
    state={...state,onboarded:true,bootDone:true,mode:'demo',gpsEnabled:false,nav:'radar',completed:[],available:[],routeIndex:ROUTE_START_INDEX,targetVisible:true,targetInRange:true,distance:null,gpsCondition:'OFF',demoRouteDistance:null};
    makeNoGpsCheckpointReady();
    ensureOpeningMessage();
    render();
  }
  function clearDemo(){
    clearTimeout(demoTimer);clearInterval(demoInterval);
    demoTimer=null;demoInterval=null;
  }
  // Legacy entry points intentionally do not start any simulated movement.
  function rearmDemoRoute(){makeNoGpsCheckpointReady();}
  function forceDemoTarget(){makeNoGpsCheckpointReady();}
  function maybeStartDemoTarget(){makeNoGpsCheckpointReady();}
  function restoreDemoCircuitPosition(){return null;}
