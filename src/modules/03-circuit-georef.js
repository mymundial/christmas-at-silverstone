  /*
   * Silverstone GP circuit georeferencing.
   *
   * The visual circuit asset is an affine representation of the real GP circuit.
   * This calibration maps latitude/longitude into the 210 x 126 viewBox used by
   * assets/f1-circuit.svg. Checkpoint coordinates remain the single source of
   * truth: changing a checkpoint lat/lng automatically changes its circuit-SVG
   * position everywhere that geoToCircuitPoint() is used.
   *
   * Calibration source: OpenStreetMap Silverstone Circuit relation 51162,
   * matched against the centreline extracted from f1-circuit.svg.
   */
  const CIRCUIT_GEOREFERENCE = Object.freeze({
    originLat:52.0723241768421,
    originLng:-1.015653955789474,
    earthRadius:6371000,
    cosOriginLat:0.6146662830500618,
    viewBoxWidth:210,
    viewBoxHeight:126,
    // [east metres, north metres, 1] × matrix => [svgX, svgY]
    affine:Object.freeze([
      Object.freeze([0.00725814726,-0.0912500082]),
      Object.freeze([-0.0885797520,-0.00718978806]),
      Object.freeze([95.2143520,57.0416177])
    ])
  });

  // Simplified centreline of the current Silverstone GP circuit in lap order.
  // Points are [lat, lng]. The first point is repeated at the end to close the lap.
  // The simplification retains extra vertices through corners while straights use
  // fewer points. It is used for route progress and Demo Mode movement; the visual
  // SVG placement itself uses the affine calibration above.
  const SILVERSTONE_GP_ROUTE = Object.freeze([
    [52.0713853,-1.0095038],[52.0710283,-1.0092896],[52.0706261,-1.0094674],[52.0703708,-1.0099406],
    [52.0701312,-1.0105863],[52.0696242,-1.0113830],[52.0684607,-1.0124189],[52.0674961,-1.0132389],
    [52.0661730,-1.0143761],[52.0649526,-1.0154831],[52.0639144,-1.0166265],[52.0636366,-1.0170729],
    [52.0635173,-1.0178241],[52.0636829,-1.0185520],[52.0641325,-1.0190474],[52.0646522,-1.0194926],
    [52.0654181,-1.0204477],[52.0659547,-1.0212495],[52.0664893,-1.0219824],[52.0665210,-1.0223762],
    [52.0662795,-1.0227850],[52.0662756,-1.0232990],[52.0667237,-1.0239336],[52.0671113,-1.0242179],
    [52.0674523,-1.0243291],[52.0676956,-1.0241939],[52.0678435,-1.0240046],[52.0682609,-1.0234867],
    [52.0693366,-1.0221521],[52.0705464,-1.0206510],[52.0709772,-1.0201111],[52.0712576,-1.0196489],
    [52.0713301,-1.0189555],[52.0712662,-1.0180557],[52.0711802,-1.0170492],[52.0712436,-1.0163800],
    [52.0714672,-1.0157059],[52.0724757,-1.0136593],[52.0724857,-1.0131601],[52.0722297,-1.0129562],
    [52.0715511,-1.0126176],[52.0713919,-1.0123275],[52.0714576,-1.0120478],[52.0716431,-1.0118685],
    [52.0720530,-1.0116256],[52.0724390,-1.0114836],[52.0727853,-1.0114372],[52.0730095,-1.0114735],
    [52.0731445,-1.0116012],[52.0732314,-1.0117476],[52.0737199,-1.0126005],[52.0750079,-1.0148965],
    [52.0759323,-1.0165518],[52.0769957,-1.0184893],[52.0771544,-1.0191290],[52.0770866,-1.0197104],
    [52.0767966,-1.0200546],[52.0762189,-1.0201437],[52.0758331,-1.0205840],[52.0758167,-1.0211887],
    [52.0759651,-1.0215190],[52.0762608,-1.0217051],[52.0765120,-1.0216047],[52.0768042,-1.0213630],
    [52.0771545,-1.0210848],[52.0776564,-1.0206664],[52.0780531,-1.0201193],[52.0783590,-1.0194970],
    [52.0785660,-1.0187273],[52.0786532,-1.0178209],[52.0786915,-1.0171968],[52.0788052,-1.0152527],
    [52.0789308,-1.0127209],[52.0789384,-1.0122953],[52.0788330,-1.0117639],[52.0786714,-1.0114256],
    [52.0784522,-1.0111833],[52.0780046,-1.0109273],[52.0775156,-1.0107016],[52.0768832,-1.0104812],
    [52.0760817,-1.0103385],[52.0747434,-1.0102347],[52.0743517,-1.0101794],[52.0739838,-1.0099654],
    [52.0738005,-1.0097931],[52.0735288,-1.0095574],[52.0733936,-1.0095288],[52.0731811,-1.0095852],
    [52.0729402,-1.0097305],[52.0726765,-1.0098867],[52.0723941,-1.0100402],[52.0721130,-1.0100972],
    [52.0719580,-1.0100732],[52.0716805,-1.0098832],[52.0713853,-1.0095038]
  ]);

  function geoToCircuitMeters(lat,lng){
    const g=CIRCUIT_GEOREFERENCE;
    return {
      x:toRad(lng-g.originLng)*g.earthRadius*g.cosOriginLat,
      y:toRad(lat-g.originLat)*g.earthRadius
    };
  }

  function geoToCircuitPoint(lat,lng){
    if(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng))) return null;
    const metres=geoToCircuitMeters(Number(lat),Number(lng));
    const m=CIRCUIT_GEOREFERENCE.affine;
    return {
      x:metres.x*m[0][0]+metres.y*m[1][0]+m[2][0],
      y:metres.x*m[0][1]+metres.y*m[1][1]+m[2][1]
    };
  }


  // Radar uses the original filled circuit SVG as the visible road shape while
  // GPS/Demo movement still follows SILVERSTONE_GP_ROUTE. The visible SVG is
  // pulled back further so the fixed centre marker is clearly wider than the
  // circuit ribbon while still retaining useful local track context.
  const CIRCUIT_RADAR_ZOOM=1.3;

  function forwardRouteDistance(fromDistance,toDistance){
    return normaliseRouteDistance(Number(toDistance)-Number(fromDistance));
  }

  const SILVERSTONE_ROUTE_METRES = SILVERSTONE_GP_ROUTE.map(([lat,lng])=>{
    const p=geoToCircuitMeters(lat,lng);return {lat,lng,x:p.x,y:p.y};
  });
  const SILVERSTONE_ROUTE_SEGMENTS=[];
  let SILVERSTONE_ROUTE_LENGTH=0;
  for(let i=0;i<SILVERSTONE_ROUTE_METRES.length-1;i++){
    const a=SILVERSTONE_ROUTE_METRES[i],b=SILVERSTONE_ROUTE_METRES[i+1];
    const length=Math.hypot(b.x-a.x,b.y-a.y);
    SILVERSTONE_ROUTE_SEGMENTS.push({i,a,b,start:SILVERSTONE_ROUTE_LENGTH,length});
    SILVERSTONE_ROUTE_LENGTH+=length;
  }

  function normaliseRouteDistance(distance){
    const length=SILVERSTONE_ROUTE_LENGTH;
    if(!length) return 0;
    return ((Number(distance)||0)%length+length)%length;
  }

  function routePointAtDistance(distance){
    const d=normaliseRouteDistance(distance);
    let seg=SILVERSTONE_ROUTE_SEGMENTS[SILVERSTONE_ROUTE_SEGMENTS.length-1];
    for(const candidate of SILVERSTONE_ROUTE_SEGMENTS){
      if(d<=candidate.start+candidate.length){seg=candidate;break;}
    }
    const t=seg.length?Math.max(0,Math.min(1,(d-seg.start)/seg.length)):0;
    return {
      lat:seg.a.lat+(seg.b.lat-seg.a.lat)*t,
      lng:seg.a.lng+(seg.b.lng-seg.a.lng)*t,
      distance:d,
      progress:SILVERSTONE_ROUTE_LENGTH?d/SILVERSTONE_ROUTE_LENGTH:0,
      segmentIndex:seg.i
    };
  }

  function projectGeoToRoute(lat,lng){
    if(!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng))) return null;
    const q=geoToCircuitMeters(Number(lat),Number(lng));
    let best=null;
    for(const seg of SILVERSTONE_ROUTE_SEGMENTS){
      const vx=seg.b.x-seg.a.x,vy=seg.b.y-seg.a.y;
      const len2=vx*vx+vy*vy;
      const raw=len2?((q.x-seg.a.x)*vx+(q.y-seg.a.y)*vy)/len2:0;
      const t=Math.max(0,Math.min(1,raw));
      const x=seg.a.x+vx*t,y=seg.a.y+vy*t;
      const off=Math.hypot(q.x-x,q.y-y);
      if(!best||off<best.offTrackDistance){
        const distance=seg.start+seg.length*t;
        best={
          lat:seg.a.lat+(seg.b.lat-seg.a.lat)*t,
          lng:seg.a.lng+(seg.b.lng-seg.a.lng)*t,
          distance,
          progress:SILVERSTONE_ROUTE_LENGTH?distance/SILVERSTONE_ROUTE_LENGTH:0,
          offTrackDistance:off,
          segmentIndex:seg.i
        };
      }
    }
    return best;
  }

  function routePointBeforeGeo(lat,lng,metresBefore=180){
    const projected=projectGeoToRoute(lat,lng);
    if(!projected) return null;
    return routePointAtDistance(projected.distance-Math.max(0,Number(metresBefore)||0));
  }

  function localTestRouteStatus(){
    const ids=LOCAL_TEST_PRESET.checkpointIds;
    const configuredIds=ids.filter(id=>{
      const point=LOCAL_TEST_PRESET.points?.[id];
      return Number.isFinite(Number(point?.lat))&&Number.isFinite(Number(point?.lng));
    });
    return {
      id:LOCAL_TEST_PRESET.id,
      name:LOCAL_TEST_PRESET.name,
      total:ids.length,
      captured:configuredIds.length,
      configured:configuredIds.length,
      capturedIds:configuredIds,
      missingIds:ids.filter(id=>!configuredIds.includes(id)),
      ready:configuredIds.length===ids.length,
      fixed:true
    };
  }

  function localTestCheckpointSequence(){
    return LOCAL_TEST_PRESET.checkpointIds
      .map(id=>{
        const cp=CHECKPOINTS.find(item=>item.id===id);
        const point=LOCAL_TEST_PRESET.points?.[id];
        return cp&&point?{cp,point}:null;
      })
      .filter(Boolean);
  }

  function localTestVirtualProjection(lat,lng){
    if(!localTestEnabled||!Number.isFinite(Number(lat))||!Number.isFinite(Number(lng))) return null;
    const status=localTestRouteStatus();
    if(!status.ready) return null;
    const checkpoints=localTestCheckpointSequence();
    if(checkpoints.length<2) return null;

    const originPoint=checkpoints[0].point;
    const originLat=Number(originPoint.lat),originLng=Number(originPoint.lng);
    const earthRadius=CIRCUIT_GEOREFERENCE.earthRadius;
    const cosOrigin=Math.cos(toRad(originLat));
    const toLocalMetres=(pointLat,pointLng)=>({
      x:toRad(Number(pointLng)-originLng)*earthRadius*cosOrigin,
      y:toRad(Number(pointLat)-originLat)*earthRadius
    });

    const points=checkpoints.map(({cp,point})=>{
      const p=toLocalMetres(point.lat,point.lng);
      return {cp,point,lat:Number(point.lat),lng:Number(point.lng),x:p.x,y:p.y};
    });
    const q=toLocalMetres(lat,lng);
    let best=null;

    // Culcheth is a linear rehearsal route from MC01 to MC12. Do not create a
    // synthetic MC12→MC01 closing segment: that could make the start/end of the
    // village walk map onto the wrong side of Silverstone.
    for(let i=0;i<points.length-1;i++){
      const a=points[i],b=points[i+1];
      const vx=b.x-a.x,vy=b.y-a.y;
      const len2=vx*vx+vy*vy;
      const raw=len2?((q.x-a.x)*vx+(q.y-a.y)*vy)/len2:0;
      const t=Math.max(0,Math.min(1,raw));
      const x=a.x+vx*t,y=a.y+vy*t;
      const off=Math.hypot(q.x-x,q.y-y);
      if(!best||off<best.localOffRouteDistance) best={segmentIndex:i,t,localOffRouteDistance:off,a,b};
    }
    if(!best) return null;

    const masterA=projectGeoToRoute(best.a.cp.lat,best.a.cp.lng);
    const masterB=projectGeoToRoute(best.b.cp.lat,best.b.cp.lng);
    if(!masterA||!masterB) return null;
    const masterSpan=forwardRouteDistance(masterA.distance,masterB.distance);
    const mapped=routePointAtDistance(masterA.distance+masterSpan*best.t);
    return {
      ...mapped,
      virtual:true,
      presetId:LOCAL_TEST_PRESET.id,
      presetName:LOCAL_TEST_PRESET.name,
      localSegmentIndex:best.segmentIndex,
      localSegmentT:best.t,
      localOffRouteDistance:best.localOffRouteDistance,
      fromId:best.a.cp.id,
      toId:best.b.cp.id
    };
  }

