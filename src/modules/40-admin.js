  const ADMIN_FIELD_STORAGE='silverstone-mc-field-test-v2';
  let adminGpsHistory=[];
  let adminRefreshTimer=null;

  function loadAdminFieldState(){
    const fallback={testTargetId:null,fieldLog:[],guestSnapshot:null,guestRouteTestActive:false,lastCapture:{}};
    try{
      const parsed=JSON.parse(localStorage.getItem(ADMIN_FIELD_STORAGE)||'{}');
      return {
        ...fallback,
        ...parsed,
        fieldLog:Array.isArray(parsed.fieldLog)?parsed.fieldLog.slice(-100):[],
        lastCapture:parsed.lastCapture&&typeof parsed.lastCapture==='object'?parsed.lastCapture:{}
      };
    }catch{return fallback;}
  }
  let adminFieldState=loadAdminFieldState();
  function saveAdminFieldState(){
    try{localStorage.setItem(ADMIN_FIELD_STORAGE,JSON.stringify({...adminFieldState,fieldLog:(adminFieldState.fieldLog||[]).slice(-100)}));}catch{}
  }
  function adminRouteCheckpoints(){return CHECKPOINTS.filter(cp=>cp.geofence!==false&&isRouteCheckpoint(cp));}
  function adminTestTarget(){
    const wanted=CHECKPOINTS.find(cp=>cp.id===adminFieldState.testTargetId&&cp.geofence!==false);
    return wanted||current()||adminRouteCheckpoints()[0]||null;
  }
  function adminDistance(cp,fix=lastGps){
    if(!cp||!fix)return null;
    const cfg=activeConfig(cp);
    return cfg?distanceMetres(fix.lat,fix.lng,cfg.lat,cfg.lng):null;
  }
  function adminFormatDistance(value){
    if(!Number.isFinite(value))return '—';
    if(value>=10000)return `${(value/1000).toFixed(1)} km`;
    if(value>=1000)return `${(value/1000).toFixed(2)} km`;
    return `${Math.round(value)} m`;
  }
  function adminNearest(fix=lastGps){
    if(!fix)return null;
    let best=null;
    adminRouteCheckpoints().forEach(cp=>{
      const distance=adminDistance(cp,fix);
      if(Number.isFinite(distance)&&(!best||distance<best.distance))best={cp,distance,cfg:activeConfig(cp)};
    });
    return best;
  }
  function adminGuestStatus(cp){
    if(!cp)return '—';
    const idx=checkpointIndex(cp.id);
    if(state.completed.includes(cp.id))return 'COMPLETED';
    if(state.available.includes(cp.id))return 'AVAILABLE';
    if(idx===normaliseProgressRouteIndex(state.routeIndex,state.completed))return state.targetInRange?'IN RANGE':'ROUTE TARGET';
    if(idx<state.routeIndex)return 'PASSED / PLAYABLE';
    return 'LOCKED';
  }
  function adminDiagnostic(cp,fix=lastGps){
    if(!cp)return null;
    const cfg=activeConfig(cp),distance=fix?distanceMetres(fix.lat,fix.lng,cfg.lat,cfg.lng):null;
    const accuracy=Number(fix?.accuracy);
    const detectionAccuracy=Number.isFinite(accuracy)&&accuracy<=DETECTION_ACCURACY_MAX;
    const activationAccuracy=Number.isFinite(accuracy)&&accuracy<=ACTIVATION_ACCURACY_MAX;
    const passAccuracy=Number.isFinite(accuracy)&&accuracy<=PASS_ACCURACY_MAX;
    const nextPassAccuracy=Number.isFinite(accuracy)&&accuracy<=NEXT_PASS_ACCURACY_MAX;
    const insideDetection=Number.isFinite(distance)&&distance<=cfg.detectionRadius;
    const insideActivation=Number.isFinite(distance)&&distance<=cfg.activationRadius;
    let expected='WAITING FOR GPS';
    if(fix){
      if(!detectionAccuracy)expected='POOR GPS — NO DETECTION';
      else if(!insideDetection)expected='APPROACH';
      else if(!insideActivation)expected='DETECTED';
      else if(!activationAccuracy)expected='DETECTED — WAITING FOR ACCURACY';
      else expected='ACTIVATION CONDITIONS MET';
    }
    return {cp,cfg,distance,accuracy,detectionAccuracy,activationAccuracy,passAccuracy,nextPassAccuracy,insideDetection,insideActivation,expected};
  }
  function adminCurrentFixAge(){return lastGps?Math.max(0,Date.now()-(Number(lastGps.timestamp)||Date.now())):null;}
  function adminCircuitPosition(fix=lastGps){
    if(!fix)return {point:null,projection:null};
    return {point:geoToCircuitPoint(fix.lat,fix.lng),projection:projectGeoToRoute(fix.lat,fix.lng)};
  }
  function adminRulePill(label,ok,waiting=false){return `<span class="admin-rule ${waiting?'waiting':ok?'ok':'no'}">${label}: ${waiting?'—':ok?'YES':'NO'}</span>`;}

  function renderAdmin(){
    if(adminRefreshTimer){clearInterval(adminRefreshTimer);adminRefreshTimer=null;}
    const target=adminTestTarget();
    if(target&&adminFieldState.testTargetId!==target.id){adminFieldState.testTargetId=target.id;saveAdminFieldState();}
    const overrideCount=Object.keys(overrides).length;
    const guestTarget=current();
    app.innerHTML=`<main class="admin-shell admin-shell-simple">
      <header class="admin-head admin-head-simple"><div><div class="kicker">Silverstone Mission Control · Working V2</div><h1>Field Test</h1><p>GPS, installation positions and route testing.</p></div><a class="btn secondary" href="/">Open Mission Control</a></header>

      <section class="admin-simple-section admin-gps-simple panel">
        <div class="admin-live-head"><div><div class="kicker">1 · GPS Status</div><h2 id="adminGpsStatus">${lastGps?gpsCondition(lastGps.accuracy):'Not Started'}</h2></div><button class="btn primary" id="adminStartGps">${lastGps?'Restart GPS':'Start Live GPS'}</button></div>
        <div class="admin-gps-primary">
          <div><span>Accuracy</span><strong id="adminAccuracy">—</strong></div>
          <div class="admin-gps-coords"><span>My Position</span><strong><span id="adminLat">—</span><br><span id="adminLng">—</span></strong></div>
          <div><span>Nearest Installation</span><strong id="adminNearest">—</strong><small id="adminNearestDistance">—</small></div>
        </div>
      </section>

      <section class="admin-simple-section admin-installation-simple panel">
        <div class="admin-section-head admin-simple-head"><div><div class="kicker">2 · Test Installation</div><h2>Select & Position</h2></div><span class="admin-source">SAFE TEST TARGET</span></div>
        <label class="admin-main-select">Installation<select id="adminTargetSelect">${adminRouteCheckpoints().map(cp=>`<option value="${cp.id}" ${cp.id===target?.id?'selected':''}>${cp.mc} · ${cp.name} · ${cp.location}</option>`).join('')}</select></label>
        ${adminCheckpoint(target)}
        <div class="admin-coordinate-mode ${overridesEnabled?'local-active':'master-active'}">
          <div><span>Coordinate Mode</span><strong>${overridesEnabled?'LOCAL TEST COORDINATES':'MASTER SILVERSTONE COORDINATES'}</strong><small>${overridesEnabled?`${overrideCount} saved override${overrideCount===1?'':'s'} available on this device.`:`${overrideCount?`${overrideCount} local override${overrideCount===1?' is':'s are'} parked. `:''}Canonical Silverstone positions are active.`}</small></div>
          <div class="admin-mode-actions"><button class="btn small ${overridesEnabled?'secondary':'success'}" id="adminUseMaster">Use Master</button><button class="btn small ${overridesEnabled?'success':'secondary'}" id="adminUseLocal" ${overrideCount?'':'disabled'}>Use Local</button></div>
        </div>
      </section>

      <section class="admin-simple-section admin-route-simple panel ${adminFieldState.guestRouteTestActive?'test-active':''}">
        <div class="admin-section-head admin-simple-head"><div><div class="kicker">3 · Route Testing</div><h2>Guest Progress</h2></div>${adminFieldState.guestRouteTestActive?'<span class="admin-source local">TEST ROUTE ACTIVE</span>':'<span class="admin-source">PROTECTED</span>'}</div>
        <div class="admin-route-readout">
          <div><span>Guest Next Checkpoint</span><strong id="adminRouteTarget">${guestTarget?.mc||'Complete'}</strong></div>
          <div><span>Field Test Target</span><strong id="adminTestTargetMetric">${target?.mc||'—'}</strong></div>
          <div><span>Target Guest State</span><strong id="adminActualState">${adminGuestStatus(target)}</strong></div>
        </div>
        <p class="admin-hint">Choosing an installation above does not change guest progress. Use the route-test button only when you deliberately want to exercise the real guest progression engine; the current guest state is saved first.</p>
        <div class="admin-primary-actions"><button class="btn secondary" id="adminSetGuestRoute">Test This Installation In Guest Route</button><button class="btn secondary" id="adminRestoreGuest" ${adminFieldState.guestSnapshot?'':'disabled'}>Restore Guest Progress</button></div>
      </section>

      <details class="admin-advanced panel">
        <summary><span><span class="kicker">Only if needed</span><strong>Advanced Diagnostics</strong></span><span class="admin-advanced-arrow">⌄</span></summary>
        <div class="admin-advanced-body">
          <div class="admin-metrics admin-advanced-metrics">
            <div><span>Fix Age</span><strong id="adminFixAge">—</strong></div><div><span>Route Distance</span><strong id="adminRouteDistance">—</strong></div><div><span>Test Distance</span><strong id="adminTestDistance">—</strong></div><div><span>Off Centreline</span><strong id="adminOffTrack">—</strong></div><div><span>SVG Position</span><strong id="adminSvgPoint">—</strong></div><div><span>Route Index</span><strong>${state.routeIndex}</strong></div><div><span>Completed</span><strong>${state.completed.length}</strong></div><div><span>Available</span><strong>${state.available.length}</strong></div>
          </div>
          <div class="admin-test-state admin-advanced-state"><span>Expected GPS State</span><strong id="adminExpectedState">—</strong></div>
          <div class="admin-rules" id="adminRuleReadout"></div>
          <p class="admin-hint">Activation: ${ACTIVATION_HITS_REQUIRED} good fixes / ~${(ACTIVATION_DWELL_MS/1000).toFixed(1)} s. Pass evidence: ~${(PASS_DWELL_MS/1000).toFixed(1)} s. Next-checkpoint confirmation: ~${(NEXT_PASS_DWELL_MS/1000).toFixed(1)} s.</p>
          <div class="admin-tool-buttons"><button class="btn secondary" id="adminSnapshot">Save Diagnostic Snapshot</button><button class="btn secondary" id="adminCopySnapshot">Copy Live Diagnostics</button><button class="btn secondary" id="adminExportLog" ${adminFieldState.fieldLog?.length?'':'disabled'}>Copy Field Log (${adminFieldState.fieldLog?.length||0})</button><button class="btn secondary" id="adminClearLog" ${adminFieldState.fieldLog?.length?'':'disabled'}>Clear Field Log</button></div>
          <div class="admin-advanced-divider"></div>
          <div><div class="kicker">Data Tools</div><h3>Overrides & Utilities</h3></div>
          <div class="admin-tool-buttons"><button class="btn secondary" id="adminExport">Copy Overrides JSON</button><button class="btn secondary" id="adminTestMessage">Send Test Message</button><button class="btn secondary" id="adminClearMessages">Clear Comms Feed</button><button class="btn secondary" id="adminResetOverrides">Reset All Overrides</button></div>
          <textarea id="adminImportText" class="admin-json" placeholder='Paste override JSON here to import'></textarea><button class="btn secondary" id="adminImport">Import JSON</button>
          <div class="admin-danger-zone"><button class="btn danger" id="adminResetProgress">Reset Mission Progress</button></div>
        </div>
      </details>
    </main>`;
    bindAdmin();updateAdminGps();
    adminRefreshTimer=setInterval(updateAdminGps,1000);
  }

  function adminCheckpoint(cp){
    if(!cp)return '';
    const o=overrides[cp.id];
    const effective=activeConfig(cp);
    const editCfg=o?{...cp,...o}:cp;
    const diag=adminDiagnostic(cp);
    const capture=adminFieldState.lastCapture?.[cp.id];
    const sourceLabel=o?(overridesEnabled?'LOCAL ACTIVE':'LOCAL SAVED'):'MASTER';
    return `<div class="admin-selected-installation ${o?'has-override':''}">
      <div class="admin-selected-head"><div><div class="kicker">${cp.mc} · ${cp.location}</div><h3>${cp.name}</h3></div><span class="admin-source ${o?'local':''}">${sourceLabel}</span></div>
      <div class="admin-installation-readout">
        <div><span>Master Position</span><strong>${cp.lat.toFixed(7)}<br>${cp.lng.toFixed(7)}</strong></div>
        <div><span>${o?'Local/Test Position':'Local/Test Position'}</span><strong>${o?`${Number(o.lat).toFixed(7)}<br>${Number(o.lng).toFixed(7)}`:'NOT SET'}</strong></div>
        <div><span>Distance From Me</span><strong data-admin-distance="${cp.id}">${adminFormatDistance(diag?.distance)}</strong></div>
        <div><span>Trigger Radius</span><strong>${effective.activationRadius} m</strong></div>
      </div>
      <div class="admin-coordinate-editor">
        <label>Latitude<input data-field="lat" data-id="${cp.id}" type="number" step="0.0000001" value="${editCfg.lat}"></label>
        <label>Longitude<input data-field="lng" data-id="${cp.id}" type="number" step="0.0000001" value="${editCfg.lng}"></label>
      </div>
      ${capture?`<div class="admin-capture-note">Last capture: ${Number(capture.lat).toFixed(7)}, ${Number(capture.lng).toFixed(7)} · accuracy ±${Math.round(capture.accuracy)} m · ${capture.samples} sample${capture.samples===1?'':'s'}</div>`:''}
      <div class="admin-primary-actions"><button class="btn primary" data-admin-current="${cp.id}">Capture My Position</button><button class="btn secondary" data-admin-save="${cp.id}">Save Local Position</button><button class="btn secondary" data-admin-reset="${cp.id}" ${o?'':'disabled'}>Restore Master</button></div>
      <details class="admin-installation-advanced"><summary>Installation settings</summary><div class="admin-installation-advanced-body"><div class="admin-fields"><label>Detection radius (m)<input data-field="detectionRadius" data-id="${cp.id}" type="number" min="10" max="500" step="1" value="${editCfg.detectionRadius}"></label><label>Activation radius (m)<input data-field="activationRadius" data-id="${cp.id}" type="number" min="5" max="200" step="1" value="${editCfg.activationRadius}"></label></div><button class="btn small secondary" data-admin-copycoords="${cp.id}">Copy Candidate Coordinates</button></div></details>
    </div>`;
  }

  function bindAdmin(){
    document.getElementById('adminStartGps')?.addEventListener('click',startAdminGps);
    document.getElementById('adminUseMaster')?.addEventListener('click',()=>{overridesEnabled=false;saveOverrideMode();renderAdmin();toast('Master Silverstone coordinates active.');});
    document.getElementById('adminUseLocal')?.addEventListener('click',()=>{if(!Object.keys(overrides).length){toast('No local overrides saved.');return;}overridesEnabled=true;saveOverrideMode();renderAdmin();toast('Local coordinate overrides active.');});
    document.getElementById('adminTargetSelect')?.addEventListener('change',e=>setAdminTestTarget(e.target.value));
    document.querySelectorAll('[data-admin-current]').forEach(b=>b.addEventListener('click',()=>captureAdminPosition(b.dataset.adminCurrent)));
    document.querySelectorAll('[data-admin-copycoords]').forEach(b=>b.addEventListener('click',()=>copyAdminCoords(b.dataset.adminCopycoords)));
    document.querySelectorAll('[data-admin-save]').forEach(b=>b.addEventListener('click',()=>saveAdminCheckpoint(b.dataset.adminSave)));
    document.querySelectorAll('[data-admin-reset]').forEach(b=>b.addEventListener('click',()=>{delete overrides[b.dataset.adminReset];saveOverrides();if(!Object.keys(overrides).length){overridesEnabled=false;saveOverrideMode();}renderAdmin();toast('Master position restored for this installation.');}));
    document.getElementById('adminSnapshot')?.addEventListener('click',captureAdminSnapshot);
    document.getElementById('adminCopySnapshot')?.addEventListener('click',copyAdminDiagnostics);
    document.getElementById('adminExportLog')?.addEventListener('click',copyAdminLog);
    document.getElementById('adminClearLog')?.addEventListener('click',()=>{adminFieldState.fieldLog=[];saveAdminFieldState();renderAdmin();toast('Field log cleared.');});
    document.getElementById('adminSetGuestRoute')?.addEventListener('click',setGuestRouteToTestTarget);
    document.getElementById('adminRestoreGuest')?.addEventListener('click',restoreGuestProgressSnapshot);
    document.getElementById('adminExport')?.addEventListener('click',async()=>{const json=JSON.stringify(overrides,null,2);await adminCopyText(json,'Override JSON copied.','JSON placed in the text box.');});
    document.getElementById('adminTestMessage')?.addEventListener('click',()=>{addMessage(`admin-test:${Date.now()}`,'MISSION CONTROL','TEST TRANSMISSION','This is a local Comms test message generated from the admin page.');toast('Test message added.');});
    document.getElementById('adminClearMessages')?.addEventListener('click',()=>{state.messages=[];state.messageSeq=0;state.messageAlert=false;save();toast('Comms feed cleared.');});
    document.getElementById('adminImport')?.addEventListener('click',()=>{try{const parsed=JSON.parse(document.getElementById('adminImportText').value||'{}');overrides=parsed&&typeof parsed==='object'?parsed:{};saveOverrides();overridesEnabled=Object.keys(overrides).length>0;saveOverrideMode();renderAdmin();toast('Overrides imported.');}catch{toast('Invalid JSON.');}});
    document.getElementById('adminResetOverrides')?.addEventListener('click',()=>{if(confirm('Reset all local coordinate overrides on this device? Master Silverstone coordinates are not affected.')){overrides={};saveOverrides();overridesEnabled=false;saveOverrideMode();renderAdmin();toast('All local overrides cleared.');}});
    document.getElementById('adminResetProgress')?.addEventListener('click',()=>{if(confirm('Reset all Mission Control guest progress on this device?')){state={...defaults};save();resetGeofenceRuntime();adminFieldState.guestSnapshot=null;adminFieldState.guestRouteTestActive=false;saveAdminFieldState();renderAdmin();toast('Guest progress reset.');}});
  }

  function setAdminTestTarget(id){
    const cp=CHECKPOINTS.find(c=>c.id===id&&c.geofence!==false);if(!cp)return;
    adminFieldState.testTargetId=id;saveAdminFieldState();renderAdmin();toast(`${cp.mc} selected for isolated diagnostics.`);
  }

  function recordAdminFix(fix){
    if(!fix)return;
    adminGpsHistory=[...adminGpsHistory,fix].filter(item=>Date.now()-(Number(item.timestamp)||0)<=20000).slice(-30);
  }
  function averagedAdminFix(){
    const now=Date.now();
    const recent=adminGpsHistory.filter(f=>now-(Number(f.timestamp)||0)<=12000&&Number.isFinite(f.lat)&&Number.isFinite(f.lng)&&Number.isFinite(Number(f.accuracy)));
    if(!recent.length)return lastGps?{...lastGps,samples:1}:null;
    const best=Math.min(...recent.map(f=>Number(f.accuracy)));
    const usable=recent.filter(f=>Number(f.accuracy)<=Math.max(15,best*1.8));
    let weightTotal=0,latTotal=0,lngTotal=0;
    usable.forEach(f=>{const a=Math.max(1,Number(f.accuracy));const w=1/(a*a);weightTotal+=w;latTotal+=f.lat*w;lngTotal+=f.lng*w;});
    return {lat:latTotal/weightTotal,lng:lngTotal/weightTotal,accuracy:best,timestamp:now,samples:usable.length};
  }
  function captureAdminPosition(id){
    if(!lastGps){toast('Start Live GPS first.');startAdminGps();return;}
    const fix=averagedAdminFix();if(!fix)return;
    const latField=document.querySelector(`[data-field="lat"][data-id="${id}"]`),lngField=document.querySelector(`[data-field="lng"][data-id="${id}"]`);
    if(!latField||!lngField)return;
    latField.value=Number(fix.lat).toFixed(8);lngField.value=Number(fix.lng).toFixed(8);
    adminFieldState.lastCapture[id]={lat:fix.lat,lng:fix.lng,accuracy:fix.accuracy,samples:fix.samples||1,timestamp:fix.timestamp};saveAdminFieldState();
    toast(`Position captured from ${fix.samples||1} recent GPS fix${(fix.samples||1)===1?'':'es'}. Save Local Override to apply it.`);
  }
  async function copyAdminCoords(id){
    const lat=Number(document.querySelector(`[data-field="lat"][data-id="${id}"]`)?.value),lng=Number(document.querySelector(`[data-field="lng"][data-id="${id}"]`)?.value);
    if(!Number.isFinite(lat)||!Number.isFinite(lng)){toast('Enter valid coordinates first.');return;}
    const cp=CHECKPOINTS.find(c=>c.id===id);
    await adminCopyText(`${lat.toFixed(8)}, ${lng.toFixed(8)}`,`${cp?.mc||id} candidate coordinates copied.`);
  }

  function saveAdminCheckpoint(id){
    const cp=CHECKPOINTS.find(c=>c.id===id); if(!cp)return;
    const lat=Number(document.querySelector(`[data-field="lat"][data-id="${id}"]`).value),lng=Number(document.querySelector(`[data-field="lng"][data-id="${id}"]`).value);
    if(!Number.isFinite(lat)||!Number.isFinite(lng)){toast('Enter valid coordinates.');return;}
    const next={lat,lng};
    if(cp.geofence!==false){
      const detectionRadius=Number(document.querySelector(`[data-field="detectionRadius"][data-id="${id}"]`).value),activationRadius=Number(document.querySelector(`[data-field="activationRadius"][data-id="${id}"]`).value);
      if(!Number.isFinite(detectionRadius)||!Number.isFinite(activationRadius)||activationRadius>=detectionRadius){toast('Detection radius must be larger than activation radius.');return;}
      next.detectionRadius=detectionRadius;next.activationRadius=activationRadius;
    }
    overrides[id]=next;saveOverrides();overridesEnabled=true;saveOverrideMode();renderAdmin();toast(`${cp.mc} local override saved and LOCAL mode enabled.`);
  }

  function startAdminGps(){
    if(!navigator.geolocation){toast('Geolocation unavailable.');return;}
    if(adminWatchId!==null)navigator.geolocation.clearWatch(adminWatchId);
    adminGpsHistory=[];
    adminWatchId=navigator.geolocation.watchPosition(pos=>{lastGps=normalisePosition(pos);recordAdminFix(lastGps);updateAdminGps();},()=>toast('Unable to read GPS. Check browser permission.'),{enableHighAccuracy:true,maximumAge:250,timeout:15000});
  }

  function updateAdminGps(){
    if(!IS_ADMIN||!document.getElementById('adminLat'))return;
    const target=adminTestTarget(),diag=adminDiagnostic(target),nearest=adminNearest(),guestTarget=current(),guestDistance=adminDistance(guestTarget),circuit=adminCircuitPosition();
    const setText=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
    setText('adminGpsStatus',lastGps?gpsCondition(lastGps.accuracy):'Not Started');
    setText('adminLat',lastGps?lastGps.lat.toFixed(7):'—');setText('adminLng',lastGps?lastGps.lng.toFixed(7):'—');
    setText('adminAccuracy',lastGps?`±${Math.round(lastGps.accuracy)} m`:'—');setText('adminFixAge',lastGps?`${(adminCurrentFixAge()/1000).toFixed(1)} s`:'—');
    setText('adminNearest',nearest?`${nearest.cp.mc} ${nearest.cp.name}`:'—');setText('adminNearestDistance',adminFormatDistance(nearest?.distance));
    setText('adminRouteTarget',guestTarget?.mc||'Complete');setText('adminRouteDistance',adminFormatDistance(guestDistance));
    setText('adminTestTargetMetric',target?.mc||'—');setText('adminTestDistance',adminFormatDistance(diag?.distance));
    setText('adminOffTrack',circuit.projection?adminFormatDistance(circuit.projection.offTrackDistance):'—');
    setText('adminSvgPoint',circuit.point?`${circuit.point.x.toFixed(1)}, ${circuit.point.y.toFixed(1)}`:'—');
    setText('adminExpectedState',diag?.expected||'—');setText('adminActualState',adminGuestStatus(target));
    const rules=document.getElementById('adminRuleReadout');if(rules&&diag)rules.innerHTML=adminRulePill(`GPS ≤${DETECTION_ACCURACY_MAX}m`,diag.detectionAccuracy,!lastGps)+adminRulePill(`Inside detection ${diag.cfg.detectionRadius}m`,diag.insideDetection,!lastGps)+adminRulePill(`GPS ≤${ACTIVATION_ACCURACY_MAX}m`,diag.activationAccuracy,!lastGps)+adminRulePill(`Inside activation ${diag.cfg.activationRadius}m`,diag.insideActivation,!lastGps)+adminRulePill(`Pass GPS ≤${PASS_ACCURACY_MAX}m`,diag.passAccuracy,!lastGps)+adminRulePill(`Next-pass GPS ≤${NEXT_PASS_ACCURACY_MAX}m`,diag.nextPassAccuracy,!lastGps);
    document.querySelectorAll('[data-admin-distance]').forEach(el=>{const cp=CHECKPOINTS.find(c=>c.id===el.dataset.adminDistance);el.textContent=adminFormatDistance(adminDistance(cp));});
  }

  function adminSnapshotPayload(){
    const target=adminTestTarget(),diag=adminDiagnostic(target),nearest=adminNearest(),circuit=adminCircuitPosition(),guestTarget=current();
    return {
      capturedAt:new Date().toISOString(),coordinateMode:overridesEnabled?'LOCAL_OVERRIDES':'MASTER',
      gps:lastGps?{lat:lastGps.lat,lng:lastGps.lng,accuracy:lastGps.accuracy,fixAgeMs:adminCurrentFixAge(),condition:gpsCondition(lastGps.accuracy)}:null,
      nearest:nearest?{id:nearest.cp.id,mc:nearest.cp.mc,name:nearest.cp.name,distanceM:nearest.distance}:null,
      testTarget:target?{id:target.id,mc:target.mc,name:target.name,source:diag?.cfg.source,lat:diag?.cfg.lat,lng:diag?.cfg.lng,distanceM:diag?.distance,detectionRadiusM:diag?.cfg.detectionRadius,activationRadiusM:diag?.cfg.activationRadius,expectedState:diag?.expected,guestState:adminGuestStatus(target),insideDetection:diag?.insideDetection,insideActivation:diag?.insideActivation,detectionAccuracyOk:diag?.detectionAccuracy,activationAccuracyOk:diag?.activationAccuracy}:null,
      guestProgress:{mode:state.mode,routeIndex:state.routeIndex,routeTarget:guestTarget?.id||null,completed:[...state.completed],available:[...state.available]},
      circuit:circuit.point?{svgX:circuit.point.x,svgY:circuit.point.y,offTrackDistanceM:circuit.projection?.offTrackDistance??null,routeProgress:circuit.projection?.progress??null}:null
    };
  }
  function captureAdminSnapshot(){
    const payload=adminSnapshotPayload();adminFieldState.fieldLog=[...(adminFieldState.fieldLog||[]),payload].slice(-100);saveAdminFieldState();renderAdmin();toast(`Diagnostic snapshot ${adminFieldState.fieldLog.length} saved.`);
  }
  async function copyAdminDiagnostics(){await adminCopyText(JSON.stringify(adminSnapshotPayload(),null,2),'Live diagnostics copied.','Diagnostics placed in the text box.');}
  async function copyAdminLog(){
    const payload={exportedAt:new Date().toISOString(),version:'2.0.0',entries:adminFieldState.fieldLog||[]};
    await adminCopyText(JSON.stringify(payload,null,2),'Field log copied.','Field log placed in the text box.');
  }
  async function adminCopyText(text,success='Copied.',fallback='Text placed in the box.'){
    try{await navigator.clipboard.writeText(text);toast(success);}
    catch{const box=document.getElementById('adminImportText');if(box)box.value=text;toast(fallback);}
  }

  function setGuestRouteToTestTarget(){
    const cp=adminTestTarget(),idx=checkpointIndex(cp?.id);if(!cp||idx<ROUTE_START_INDEX)return;
    if(!adminFieldState.guestSnapshot)adminFieldState.guestSnapshot=JSON.parse(JSON.stringify(state));
    adminFieldState.guestRouteTestActive=true;saveAdminFieldState();
    state={...state,onboarded:true,mode:'live',routeIndex:normaliseRouteIndex(idx),targetVisible:false,targetInRange:false,distance:null,missionOpen:null,nav:'radar'};resetGeofenceRuntime();save();renderAdmin();toast(`${cp.mc} set as guest route target. Original guest progress is saved for restore.`);
  }
  function restoreGuestProgressSnapshot(){
    if(!adminFieldState.guestSnapshot){toast('No guest progress snapshot saved.');return;}
    state={...defaults,...adminFieldState.guestSnapshot};save();resetGeofenceRuntime();adminFieldState.guestSnapshot=null;adminFieldState.guestRouteTestActive=false;saveAdminFieldState();renderAdmin();toast('Saved guest progress restored.');
  }
