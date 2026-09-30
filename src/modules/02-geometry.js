
  function toRad(v){return v*Math.PI/180}
  function toDeg(v){return v*180/Math.PI}
  function distanceMetres(lat1,lng1,lat2,lng2){
    const R=6371000, dLat=toRad(lat2-lat1), dLng=toRad(lng2-lng1);
    const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
    return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
  }
  function bearingDegrees(lat1,lng1,lat2,lng2){
    const p1=toRad(lat1), p2=toRad(lat2), dl=toRad(lng2-lng1);
    const y=Math.sin(dl)*Math.cos(p2), x=Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(dl);
    return (toDeg(Math.atan2(y,x))+360)%360;
  }
  function gpsCondition(accuracy){
    if(!Number.isFinite(accuracy)) return 'WAITING';
    if(accuracy<=20) return 'GOOD';
    if(accuracy<=40) return 'FAIR';
    return 'POOR';
  }
  function distanceToActivation(cp,distance){
    const cfg=activeConfig(cp); if(!cfg || !Number.isFinite(distance)) return null;
    return Math.max(0,distance-(cfg.activationRadius||0));
  }

