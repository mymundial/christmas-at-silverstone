
  // Warm mission artwork after the first render so later pages do not flash
  // unloaded icons/backgrounds on mobile Safari. Critical first-screen assets
  // remain declared as <link rel="preload"> in index.html.
  const missionImagePreloads = [
    './assets/radar-bezel.webp',
    './assets/mc02-control-mid-ring.svg','./assets/mc02-response-arrow.svg','./assets/mc02-response-cones.svg',
    './assets/mc02-stability-front-car.svg','./assets/mc02-stability-headlights.svg','./assets/mc02-traction-car.svg','./assets/mc02-traction-skids.svg',
    './assets/care-bears-logo.png','./assets/lando-gantry.webp',
    './assets/aurora-sky.webp','./assets/aurora-ring-outer.webp','./assets/aurora-ring-middle.webp','./assets/aurora-ring-inner.webp',
    './assets/las-vegas-logo-white.svg',
    './assets/sleigh-stage-2.webp','./assets/sleigh-stage-3.webp','./assets/sleigh-stage-4.webp','./assets/sleigh-stage-5.webp'
  ];
  const warmMissionImages=()=>missionImagePreloads.forEach(src=>{const img=new Image();img.decoding='async';img.src=src;});
  if('requestIdleCallback' in window) requestIdleCallback(warmMissionImages,{timeout:1400});
  else setTimeout(warmMissionImages,350);

  if(IS_ADMIN){renderAdmin();}
  else {
    if(state.onboarded) ensureOpeningMessage();
    render();
    if(state.onboarded&&state.mode==='live'&&state.gpsEnabled!==false) startGpsWatch();
    if(state.onboarded&&state.mode==='demo'&&state.nav==='radar'&&!state.missionOpen){setTimeout(maybeStartDemoTarget,350);rearmDemoRoute(850);}
  }
})();
