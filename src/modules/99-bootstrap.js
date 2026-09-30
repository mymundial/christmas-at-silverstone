
  if(IS_ADMIN){renderAdmin();}
  else {
    if(state.onboarded) ensureOpeningMessage();
    render();
    if(state.onboarded&&state.mode==='live'&&state.gpsEnabled!==false) startGpsWatch();
    if(state.onboarded&&state.mode==='demo'&&state.nav==='radar'&&!state.missionOpen){setTimeout(maybeStartDemoTarget,350);rearmDemoRoute(850);}
  }
})();
