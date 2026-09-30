const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const root = __dirname;
const dist = path.join(root, 'dist');
const failures = [];
const warnings = [];
const notes = [];
const checks = [];

function ok(name, detail='') { checks.push({name, detail}); }
function fail(name, detail='') { failures.push({name, detail}); }
function warn(name, detail='') { warnings.push({name, detail}); }
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
function exists(rel) { return fs.existsSync(path.join(root, rel)); }
function hashFile(abs) { return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex'); }
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out=[];
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    const abs=path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(abs));
    else if (entry.isFile()) out.push(abs);
  }
  return out;
}
function relFrom(base, abs){ return path.relative(base, abs).split(path.sep).join('/'); }
function formatBytes(n){
  if(n<1024) return `${n} B`;
  if(n<1024*1024) return `${(n/1024).toFixed(1)} KB`;
  return `${(n/1024/1024).toFixed(2)} MB`;
}

// 1) Build + generated bundle validity.
try {
  execFileSync(process.execPath, [path.join(root, 'build.js')], {cwd:root, stdio:'pipe'});
  ok('Production build', 'npm build equivalent completed successfully');
} catch (err) {
  fail('Production build', String(err.stderr || err.message));
}
try {
  execFileSync(process.execPath, ['--check', path.join(root,'src','main.js')], {cwd:root, stdio:'pipe'});
  ok('Generated JavaScript syntax', 'src/main.js parses successfully in Node');
} catch (err) {
  fail('Generated JavaScript syntax', String(err.stderr || err.message));
}

// 2) Confirm dist carries only generated runtime, not dev source modules.
const distFiles = walk(dist);
const distRel = distFiles.map(f=>relFrom(dist,f));
const distBytes = distFiles.reduce((n,f)=>n+fs.statSync(f).size,0);
if (distRel.some(r=>r.startsWith('src/modules/'))) fail('Production source hygiene','Development modules found in dist');
else ok('Production source hygiene','No development modules are deployed');

const forbiddenExt = new Set(['.png','.jpg','.jpeg','.wav','.ttf','.otf']);
const forbiddenFiles = distRel.filter(r=>forbiddenExt.has(path.extname(r).toLowerCase()) || /(^|\/)(?:_?test|temp)[^/]*\./i.test(r));
if (forbiddenFiles.length) fail('Production file types', forbiddenFiles.join(', '));
else ok('Production file types','No PNG/JPEG/WAV/TTF/OTF or test/temp files in dist');

if (distBytes <= 7*1024*1024) ok('Deployment footprint', `${formatBytes(distBytes)} across ${distFiles.length} files`);
else warn('Deployment footprint', `${formatBytes(distBytes)} exceeds the 7 MB audit target`);

// 3) Generated payload must match canonical source files exactly.
for (const rel of ['src/main.js','src/styles.css']) {
  const a=path.join(root,rel), b=path.join(dist,rel);
  if (!fs.existsSync(b)) fail('Generated payload', `${rel} missing from dist`);
  else if (hashFile(a)!==hashFile(b)) fail('Generated payload', `${rel} differs between source and dist`);
  else ok(`Generated payload: ${rel}`,'Source and dist are byte-identical');
}

// 4) Static reference scan.
const runtimeTextFiles = ['index.html','admin/index.html','src/main.js','src/styles.css','manifest.webmanifest'];
const sourceText = Object.fromEntries(runtimeTextFiles.map(rel=>[rel,read(rel)]));
const refs = new Set();
for (const [rel, text] of Object.entries(sourceText)) {
  for (const m of text.matchAll(/(?:src|href)=["']([^"'#]+)["']/gi)) refs.add(m[1]);
  for (const m of text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) refs.add(m[1]);
  for (const m of text.matchAll(/["'`]((?:\.\/)?(?:assets|fonts|src)\/[A-Za-z0-9._\-/${}]+)["'`]/g)) refs.add(m[1]);
}
// Expand the single intentional dynamic asset family.
for (const key of ['inner','middle','outer']) refs.add(`./assets/aurora-ring-${key}.webp`);

function normaliseRuntimeRef(ref) {
  if (!ref || /^(?:https?:|data:|#|mailto:|tel:)/i.test(ref)) return null;
  if (ref.includes('${')) return null;
  ref = ref.split('?')[0].split('#')[0];
  ref = ref.replace(/^(?:\.\.\/)+/,'').replace(/^\.\//,'').replace(/^\//,'');
  if (!ref || ref==='admin') return null;
  return ref;
}
const missingRefs=[];
for (const ref of refs) {
  const n=normaliseRuntimeRef(ref);
  if (!n || n==='worker.scriptURL') continue;
  if (!fs.existsSync(path.join(dist,n))) missingRefs.push(ref);
}
if (missingRefs.length) fail('Runtime references', `Missing: ${[...new Set(missingRefs)].join(', ')}`);
else ok('Runtime references','All static runtime asset/font/script/style references resolve');

// Every shipped asset/font should be used.
const referencedNormalised = new Set([...refs].map(normaliseRuntimeRef).filter(Boolean));
const shippedAssetFont = distRel.filter(r=>r.startsWith('assets/')||r.startsWith('fonts/'));
const unused = shippedAssetFont.filter(r=>!referencedNormalised.has(r));
if (unused.length) fail('Dead production assets', unused.join(', '));
else ok('Dead production assets','Every deployed asset and font is referenced');

// No legacy source-format references should remain.
const legacyRefMatches=[];
for (const [rel,text] of Object.entries(sourceText)) {
  const m=text.match(/\.(?:png|jpe?g|wav|ttf|otf)(?=["')\s?#]|$)/ig);
  if(m) legacyRefMatches.push(`${rel}: ${[...new Set(m)].join(', ')}`);
}
if (legacyRefMatches.length) fail('Legacy format references', legacyRefMatches.join(' | '));
else ok('Legacy format references','No runtime references to retired PNG/JPEG/WAV/TTF/OTF files');

// 5) Asset signatures.
function sig(abs,n=12){ return fs.readFileSync(abs).subarray(0,n); }
const badSignatures=[];
for (const abs of distFiles) {
  const ext=path.extname(abs).toLowerCase();
  const b=sig(abs,16);
  const r=relFrom(dist,abs);
  if(ext==='.webp' && !(b.toString('ascii',0,4)==='RIFF' && b.toString('ascii',8,12)==='WEBP')) badSignatures.push(r);
  if(ext==='.woff2' && b.toString('ascii',0,4)!=='wOF2') badSignatures.push(r);
  if(ext==='.mp3') {
    const id3=b.toString('ascii',0,3)==='ID3';
    const frame=b[0]===0xFF && (b[1]&0xE0)===0xE0;
    if(!id3 && !frame) badSignatures.push(r);
  }
}
if (badSignatures.length) fail('Asset file integrity', badSignatures.join(', '));
else ok('Asset file integrity','WebP, WOFF2 and MP3 signatures match their extensions');

// 6) CSS structural sanity.
const css=sourceText['src/styles.css'];
const open=(css.match(/{/g)||[]).length, close=(css.match(/}/g)||[]).length;
if(open!==close) fail('CSS brace balance', `${open} opening vs ${close} closing braces`);
else ok('CSS brace balance', `${open} rule blocks balanced`);

// 7) Vercel/static configuration.
try {
  const v=JSON.parse(read('vercel.json'));
  if(v.outputDirectory!=='dist' || v.buildCommand!=='npm run build') fail('Vercel configuration','Expected buildCommand npm run build and outputDirectory dist');
  else ok('Vercel configuration','Static build targets dist with npm run build');
} catch(e){ fail('Vercel configuration',e.message); }

if(/<base\s+href=["']\/["']\s*\/?/i.test(sourceText['admin/index.html'])) ok('Admin asset base','/admin uses root-relative base for shared runtime assets');
else fail('Admin asset base','admin/index.html is missing <base href="/">');

// 8) Service-worker retirement state: retained only as a cleanup shim.
const sw=read('sw.js');
if(/addEventListener\(['"]fetch['"]/.test(sw) || /caches\.open\(/.test(sw)) fail('Service-worker retirement','sw.js still intercepts or creates runtime caches');
else if(/registration\.unregister\(\)/.test(sw) && /caches\.delete/.test(sw)) ok('Service-worker retirement','Retirement shim only: no fetch interception; clears legacy caches and unregisters');
else warn('Service-worker retirement','Could not verify retirement behaviour');

// 9) Mission-route static integrity.
const runtime=sourceText['src/main.js'];
const checkpointBlock=(runtime.match(/const CHECKPOINTS = \[([\s\S]*?)\n  \];/)||[])[1]||'';
const checkpointIds=[...checkpointBlock.matchAll(/\{id:'([^']+)'/g)].map(m=>m[1]);
const checkpointTypes=[...checkpointBlock.matchAll(/type:'([^']+)'/g)].map(m=>m[1]);
const expectedIds=['gantry','entry','velocity','luffield','power','spirit','escapade','comet','jingle','lando','aurora','lapland','northern'];
if(JSON.stringify(checkpointIds)!==JSON.stringify(expectedIds)) fail('Mission route','Checkpoint route/order differs from audited baseline');
else ok('Mission route',`${checkpointIds.length} checkpoints present in expected order`);
const handled = new Set(['qr','activation','diagnostics','commsrelay','power','spirit','artifacts','comet','jingle','lando','aurora','lapland','northern']);
const unhandled=[...new Set(checkpointTypes)].filter(t=>!handled.has(t));
if(unhandled.length) fail('Mission handlers',`Unhandled checkpoint types: ${unhandled.join(', ')}`);
else ok('Mission handlers','Every route checkpoint type has an audited render/bind or automatic flow');

if(/const checks=\['entry','velocity','luffield','power','spirit','escapade','comet','jingle','lando','aurora'\]/.test(runtime) && /const systemKeys=\['circuitry','diagnostic','comms','power','core','propulsion','guidance','control','response','navigation'\]/.test(runtime) && !/const checks=\[[^\]]*'elf-radio'/.test(runtime)) {
  ok('Lapland Launch dependency','Launch initialisation follows the approved MC-01 to MC-10 ten-system sequence');
} else fail('Lapland Launch dependency','Launch initialisation does not match the approved MC-01 to MC-10 system sequence');

// 10) Reindeer Raceway acceleration-game mobile protections.
const powerCssOK = /-webkit-touch-callout:none\s*!important/.test(css) && /\.power-accelerator[\s\S]*touch-action:none/.test(css);
const powerJsOK = /button\.addEventListener\(['"]contextmenu['"],e=>e\.preventDefault\(\)\)/.test(runtime);
const fixedGeometry = /--speed-stretch:1/.test(css) && !/setProperty\(['"]--speed-stretch/.test(runtime);
if(powerCssOK && powerJsOK) ok('Reindeer Raceway hold control','iOS selection/callout suppression and context-menu prevention are present');
else fail('Reindeer Raceway hold control','Long-press protection is incomplete');
if(fixedGeometry) ok('Reindeer Raceway high-speed geometry','Speed stretch remains fixed; JS does not scale scenery with velocity');
else fail('Reindeer Raceway high-speed geometry','Dynamic scene scaling appears to be present');

// 11) Circuit georeference integrity.
const georef=read('src/modules/03-circuit-georef.js');
if(/const CIRCUIT_GEOREFERENCE/.test(georef) && /function geoToCircuitPoint\(/.test(georef) && /const SILVERSTONE_GP_ROUTE/.test(georef)) {
  ok('Circuit georeference','Real-world coordinate calibration and GP route centreline are present');
} else fail('Circuit georeference','Circuit coordinate calibration is missing or incomplete');
if(/geoToCircuitPoint\(cp\?\.lat,cp\?\.lng\)/.test(runtime) && /geoToCircuitPoint\(fix\.lat,fix\.lng\)/.test(runtime) && /geoToCircuitPoint\(cfg\.lat,cfg\.lng\)/.test(runtime)) {
  ok('Coordinate single source','MC01, live radar and checkpoint markers derive SVG position from master lat/lng');
} else fail('Coordinate single source','A circuit marker still appears to bypass the master lat/lng mapping');
if(
  /beginDemoCircuitApproach/.test(runtime) &&
  /demoTrackDistance/.test(runtime) &&
  /forwardRouteDistance\(startDistance,targetProjection\.distance\)/.test(runtime) &&
  /updatePosition\(startDistance\+travelled,routeTravel-travelled\)/.test(runtime) &&
  !/targetProjection\.distance-remaining/.test(runtime)
) {
  ok('Circuit demo route','Post-MC01 Demo Mode persists lap position and travels continuously forward along the calibrated route');
} else fail('Circuit demo route','Demo Mode is not using continuous calibrated route progression');

if(
  /const CIRCUIT_RADAR_ZOOM=1\.3/.test(georef) &&
  /style=\"--circuit-radar-zoom:\$\{CIRCUIT_RADAR_ZOOM\}\"/.test(runtime) &&
  /\.track-radar-art\{[\s\S]*?f1-circuit\.svg/.test(css) &&
  !/CIRCUIT_RADAR_POLYLINE_POINTS/.test(runtime) &&
  !/track-radar-line/.test(runtime)
) {
  ok('Circuit radar artwork','Radar renders the original circuit SVG at the refined 1.3x scale');
} else fail('Circuit radar artwork','Radar is not using the original circuit SVG at the approved refined scale');

if(
  /demoRouteDistance:null/.test(runtime) &&
  /state\.demoRouteDistance=routePoint\.distance/.test(runtime) &&
  /function restoreDemoCircuitPosition\(/.test(runtime) &&
  /track-radar-map waiting/.test(runtime) &&
  /\.track-radar-map\.waiting\{opacity:0;\}/.test(css) &&
  /map\.classList\.remove\('waiting'\)/.test(runtime)
) {
  ok('Circuit radar bootstrap','Unpositioned circuit art stays hidden; Demo lap distance is persisted and restored after refresh');
} else fail('Circuit radar bootstrap','Circuit radar refresh/bootstrap protections are incomplete');

if(
  /function primeCurrentCircuitTarget\(/.test(runtime) &&
  /primeCurrentCircuitTarget\(\);[\s\S]*?rearmDemoRoute\(0\)/.test(runtime) &&
  /state\.targetVisible=state\.completed\.includes\('entry'\)\?true:detectable/.test(runtime) &&
  /state\.available\.includes\(cp\.id\)&&passReliable&&d>exitRadius/.test(runtime) &&
  /const PASS_DWELL_MS = 1200;/.test(runtime) &&
  /state\.distance=Math\.max\(0,Number\.isFinite\(remainingRouteDistance\)\?remainingRouteDistance:d\)/.test(runtime)
) {
  ok('Checkpoint handoff','Completed missions expose the next circuit checkpoint immediately; skipped unlocked activations advance after leaving their radius; Demo counts down route metres');
} else fail('Checkpoint handoff','Immediate next-marker or leave-without-completing checkpoint handoff logic is incomplete');

if(
  /\.radar\.circuit-radar \.user-dot\{[\s\S]*?z-index:6;[\s\S]*?width:12px;[\s\S]*?background:#fff;[\s\S]*?border:0;[\s\S]*?0 0 26px rgba\(116,225,255,\.9\)/.test(css) &&
  /\.track-radar-art\{[\s\S]*?background:#69d4ef;[\s\S]*?filter:none;[\s\S]*?opacity:1;/.test(css) &&
  /\.track-radar-target\{[\s\S]*?width:20px;[\s\S]*?background:transparent;[\s\S]*?border:0;[\s\S]*?box-shadow:none;/.test(css) &&
  /\.target-dot::before,\.track-radar-target::before\{[\s\S]*?width:10px;[\s\S]*?background:#c8f5ff;[\s\S]*?checkpointBeaconFlash/.test(css) &&
  /\.radar\.circuit-radar \.track-radar-target::before\{[\s\S]*?width:12px;[\s\S]*?background:#fff;[\s\S]*?0 0 26px rgba\(116,225,255,\.9\)/.test(css) &&
  /\.target-dot::after,\.track-radar-target::after\{[\s\S]*?width:18px;[\s\S]*?checkpointBeaconRing/.test(css) &&
  /\.radar\.circuit-radar \.sweep\{z-index:5;pointer-events:none;\}/.test(css)
) {
  ok('Circuit radar hierarchy','Guest marker stays above the sweep; circuit remains full-opacity/unblurred; installation targets use the approved flashing beacon core/ring treatment beneath the sweep');
} else fail('Circuit radar hierarchy','Circuit/user/installation beacon visual hierarchy or sweep layering does not match the approved treatment');

if(
  /const finalCircuitOverview=state\.completed\.includes\('northern'\)/.test(runtime) &&
  /track-radar-map final-overview/.test(runtime) &&
  /const userMarker=finalCircuitOverview\?'':'<div class=\"user-dot\"><\/div>'/.test(runtime) &&
  /if\(finalCircuitOverview\)\{[\s\S]*?no longer translates the artwork/.test(runtime) &&
  /\.track-radar-map\.final-overview \.track-radar-art\{[\s\S]*?left:50%!important;[\s\S]*?top:50%!important;[\s\S]*?width:84%;[\s\S]*?height:50\.4%;[\s\S]*?translate\(-50%,-50%\)/.test(css)
) {
  ok('Final circuit overview','Northern Flight completion shows the full centred circuit with no user/checkpoint navigation markers while the radar sweep remains active');
} else fail('Final circuit overview','Post-MC12 full-circuit completion state is incomplete');

if(
  /silverstone-s-mark\.webp/.test(runtime) &&
  /christmas-magic-01\.mp3/.test(runtime) &&
  /setStage\('routing','Circuit Link','Energy Routing',50\)/.test(runtime) &&
  /setStage\('recovery','Recovery Sequence','Initiated',100\)/.test(runtime) &&
  /},4950\);/.test(runtime) &&
  /},7950\);/.test(runtime) &&
  /finishMc01EnergyBloom/.test(runtime) &&
  /Energy Transfer Complete<\/h1><\/div>/.test(runtime) &&
  !/Energy Transfer Complete<\/h1><p>/.test(runtime) &&
  /\.mc01-energy-bloom\.is-exiting/.test(css)
) {
  ok('MC01 energy bloom','Scan registers 25/50/75/100, holds 100% for 750 ms, shows ENERGY TRANSFER COMPLETE for 3.0 s, then reveals the completion card without returning to the scan');
} else fail('MC01 energy bloom','MC01 scan pacing or direct bloom-to-completion handoff is incomplete');

if(
  /const outcome=copy\|\|title\|\|'';/.test(runtime) &&
  /<div class=\"completion panel\"><div class=\"check\">✓<\/div><h2>Mission Complete<\/h2>/.test(runtime) &&
  !/<div class=\"kicker\">Mission Complete<\/div><h2>\$\{title\}<\/h2>/.test(runtime) &&
  /activation:'You have now entered the live circuit zone\.'/.test(runtime) &&
  !/mc01-brand/.test(runtime) &&
  /showCompletion\('Circuit Link Complete','Kinetic energy generated on track has created enough power to initiate Santa-1’s recovery\.'\)/.test(runtime) &&
  /\.completion p\{color:#a9c8d5;font-size:var\(--challenge-support-size\);line-height:var\(--challenge-support-line\);font-weight:400;max-width:380px;/.test(css)
) {
  ok('Mission completion hierarchy','Activation completion cards use a single MISSION COMPLETE heading with mission-specific outcome copy; MC01 also announces entry into the live circuit zone');
} else fail('Mission completion hierarchy','Completion-card hierarchy or MC01 completion copy does not match the approved system');

if(
  /setStage\('detected','Circuit Link','Signal Detected',0\)/.test(runtime) &&
  /setStage\('routing','Circuit Link','Connection Establishing',25\)/.test(runtime) &&
  /setStage\('routing','Circuit Link','Energy Routing',50\)/.test(runtime) &&
  /setStage\('transfer','Power Transfer','Routing to Santa-1',75\)/.test(runtime) &&
  /setStage\('recovery','Recovery Sequence','Initiated',100\)/.test(runtime) &&
  !/Track Energy/.test(runtime) &&
  !/Circuit Energy/.test(runtime)
) {
  ok('MC01 scan language','Circuit Link terminology stays consistent through detection, connection, routing, transfer and recovery');
} else fail('MC01 scan language','MC01 scan-stage terminology does not match the approved Circuit Link sequence');

const mc01Audio=path.join(root,'assets','christmas-magic-01.mp3');
const mc01Mark=path.join(root,'assets','silverstone-s-mark.webp');
if(
  fs.existsSync(mc01Audio) && fs.statSync(mc01Audio).size<=64*1024 &&
  fs.existsSync(mc01Mark) && fs.statSync(mc01Mark).size<=12*1024
) {
  ok('MC01 web assets',`Bloom audio ${formatBytes(fs.statSync(mc01Audio).size)}; S mark ${formatBytes(fs.statSync(mc01Mark).size)}`);
} else fail('MC01 web assets','Bloom audio or S mark exceeds the intended web-optimised footprint');

if(
  !/id="relayMeter"/.test(runtime) &&
  /\['ACQUIRED','ROUTED','STRONG','LOCKED'\]/.test(runtime) &&
  /const hit=phase>=\.53&&phase<=\.80/.test(runtime) &&
  /const scale=\.42\+phase\*1\.28/.test(runtime) &&
  /\.relay-node,\.relay-radio-icon,\.relay-receiver-icon\{width:76px;height:76px;\}/.test(css) &&
  /\.relay-node \.relay-target\{inset:7px/.test(css) &&
  /\.relay-node \.relay-pulse\{width:46px;height:46px/.test(css) &&
  /Pass 7\.38\.16 — MC03 visual polish only/.test(css) &&
  /\.relay-node\.active\{[\s\S]*?border-color:rgba\(119,226,255,\.94\)/.test(css) &&
  /Pass 7\.38\.17 — MC03 route-state polish only/.test(css) &&
  /\.relay-hop-line\.active\{[\s\S]*?stroke-dasharray:none/.test(css) &&
  /\.relay-hop-line\.locked\{[\s\S]*?stroke-dasharray:none/.test(css) &&
  /stroke-dasharray:2\.4 3\.6/.test(css) &&
  /hops\.forEach\(\(h,i\)=>h\.classList\.toggle\('active',i===stage/.test(runtime) &&
  /hops\[0\]\?\.classList\.add\('active'\)/.test(runtime)
) {
  ok('MC03 visual-only polish','Pre-redesign relay geometry/timing remain intact; route states are dashed future, solid active and solid completed, with node surfaces masking the centre-aligned links.');
} else fail('MC03 visual-only polish','Relay geometry/timing changed or the approved visual-only polish is incomplete');

if(
  /commsrelay:'Establish communications with Santa-1\.'/ .test(runtime) &&
  /<small>TRANSMITTER<\/small>/.test(runtime) &&
  /<small>RELAY 0\$\{i\+1\}<\/small>/.test(runtime) &&
  /<small>RECEIVER<\/small>/.test(runtime) &&
  !/MISSION CONTROL<\/small>/.test(runtime) &&
  !/RECEIVER<br>SANTA-1/.test(runtime) &&
  /class="relay-meter"><span>Signal Strength<\/span><div><i id="relayMeterFill"><\/i><\/div><\/div>/.test(runtime) &&
  /new Audio\('\.\/assets\/mc03-relay-success-short\.mp3'\)/.test(runtime) &&
  /new Audio\('\.\/assets\/mc03-relay-success-full\.mp3'\)/.test(runtime) &&
  /new Audio\('\.\/assets\/mc03-relay-miss\.mp3'\)/.test(runtime) &&
  /playRelayFx\(stage===3\?relayFxFull:relayFxShort/.test(runtime) &&
  /playRelayFx\(relayFxMiss/.test(runtime) &&
  /setTimeout\(\(\)=>showIncomingTransmission\(\),2350\)/.test(runtime) &&
  /const hit=phase>=\.53&&phase<=\.80/.test(runtime) &&
  /const scale=\.42\+phase\*1\.28/.test(runtime) &&
  /Array\.from\(\{length:5\}/.test(runtime) &&
  /data-carrier=/.test(runtime) &&
  /const carrierPackets=\[\.\.\.document\.querySelectorAll\('\[data-carrier\]'\)\]/.test(runtime) &&
  /hops\[i\]\?\.classList\.contains\('locked'\)/.test(runtime) &&
  /packet\.style\.left/.test(runtime) &&
  /packet\.style\.top/.test(runtime) &&
  !/data-energy=/.test(runtime) &&
  /Pass 7\.38\.22 — MC03 restrained success state \+ persistent relay energy/.test(css) &&
  /\.relay-node::before\{[\s\S]*?display:none!important/.test(css) &&
  /\.relay-node \.relay-target\{[\s\S]*?inset:9px/.test(css) &&
  /\.relay-node \.relay-core\{[\s\S]*?width:31px;[\s\S]*?height:31px/.test(css) &&
  /\.relay-node \.relay-pulse\{[\s\S]*?width:46px;[\s\S]*?height:46px/.test(css) &&
  /\.relay-node:not\(\.active\) \.relay-pulse\{display:none!important;\}/.test(css) &&
  /\.relay-hop-line\.locked\{[\s\S]*?stroke:rgba\(87,239,145,\.88\)/.test(css) &&
  /\.relay-node\.locked\{[\s\S]*?border-color:rgba\(92,194,228,\.58\)/.test(css) &&
  /\.relay-meter>span\{[\s\S]*?text-align:center/.test(css)
) {
  ok('MC03 restrained relay-success pass','Capture ring diameter is reduced, the redundant concentric ring is removed, relay nodes remain cyan, completed links turn green, and travelling packets persist on completed links without changing hit timing.');
} else fail('MC03 restrained relay-success pass','MC03 capture geometry, success colour state, persistent packets, centred meter, audio, or frozen timing is incomplete');

if(
  /let capturePhase=\.66/.test(runtime) &&
  /capturePhase=Math\.max\(\.1,Math\.min\(\.95,\(\(targetDiameter\/pulseDiameter\)-\.42\)\/1\.28\)\)/.test(runtime) &&
  /const raw=Math\.max\(0,Math\.min\(1,phase\/capturePhase\)\)/.test(runtime) &&
  /phase>capturePhase/.test(runtime) &&
  !/carrierStart/.test(runtime) &&
  /Pass 7\.38\.25 — MC03 synchronized timing cue \+ restored miss bump/.test(css) &&
  /\.relay-node\.miss\{[\s\S]*?transform:scale\(\.94\)/.test(css) &&
  /\.relay-node\.miss \.relay-target\{[\s\S]*?255,105,105/.test(css)
) {
  ok('MC03 synchronized timing cue','Travelling packets and the active node pulse share one measured cycle phase; packet arrival coincides with the dotted capture ring and the miss bump/red target feedback is restored.');
} else fail('MC03 synchronized timing cue','Shared packet/node timing or combined miss feedback is incomplete');


if(
  /Complete Scan<\/button>/.test(runtime) &&
  /Tap to scan/.test(runtime) &&
  /Capture the racing data needed to rebuild Santa-1\./.test(runtime) &&
  /The racing performance data has been captured and is ready to support Santa-1’s recovery systems\./.test(runtime) &&
  /mc02-aero-svg/.test(runtime) && /mc02-aero-frame-path/.test(runtime) && /mc02-aero-fan-group/.test(runtime) &&
  /mc02-icon-stability/.test(runtime) && /mc02-stability-car/.test(runtime) && /mc02-stability-headlights/.test(runtime) &&
  /mc02-power-svg/.test(runtime) && /mc02-power-gauge-path/.test(runtime) && /mc02-power-needle-group/.test(runtime) &&
  /mc02-icon-control/.test(runtime) && /mc02-control-wheel/.test(runtime) && /mc02-control-ring/.test(runtime) &&
  /mc02-icon-traction/.test(runtime) && /mc02-traction-car/.test(runtime) && /mc02-traction-skids/.test(runtime) &&
  /mc02-icon-response/.test(runtime) && /mc02-response-cones/.test(runtime) && /mc02-response-arrow/.test(runtime) &&
  /Pass 7\.38\.38: MC-02 Aero \/ Power optical centring correction/.test(css) &&
  /mc02-icon-aero\{width:65px;height:39px;left:calc\(50% - 9px\)!important;/.test(css) &&
  /mc02-icon-power\{width:68px;height:41px;left:calc\(50% - 8px\)!important;/.test(css) &&
  /sensor-aero\.active \.mc02-aero-fan-group[\s\S]*?mc02AeroFanSpin/.test(css) &&
  /sensor-aero\.done \.mc02-aero-fan-path[\s\S]*?var\(--green\)/.test(css) &&
  /sensor-stability\.active \.mc02-icon-stability[\s\S]*?mc02StabilityTilt/.test(css) &&
  /sensor-stability\.done \.mc02-stability-headlights[\s\S]*?var\(--green\)/.test(css) &&
  /sensor-power\.active \.mc02-power-needle-group[\s\S]*?mc02PowerNeedleSweep/.test(css) &&
  /transform-origin:105px 87px/.test(css) &&
  /mc02AeroFanSpin 1\.55s linear 1 forwards/.test(css) &&
  /to\{transform:rotate\(720deg\)\}/.test(css) &&
  /30%\{transform:rotate\(-228deg\)\}/.test(css) &&
  /38%\{transform:rotate\(-228deg\)\}/.test(css) &&
  /from\{background-position:50% -145%\}[\s\S]*?to\{background-position:50% 145%\}/.test(css) &&
  /mc02-control-mid-ring\.svg/.test(css) &&
  /sensor-control\.active \.mc02-icon-control[\s\S]*?mc02ControlRightAndBack/.test(css) &&
  /sensor-control\.done \.mc02-control-ring[\s\S]*?var\(--green\)/.test(css) &&
  /sensor-traction\.active \.mc02-traction-car[\s\S]*?animation:none/.test(css) &&
  /sensor-traction\.done \.mc02-traction-skids[\s\S]*?var\(--green\)/.test(css) &&
  /mc02TractionColourFlow/.test(css) &&
  /sensor-response\.done \.mc02-response-arrow[\s\S]*?var\(--green\)/.test(css) &&
  /mc02ResponseFlow/.test(css) &&
  !/sensor\.done \.mc02-layer:not/.test(css) &&
  ['mc02-stability-front-car.svg','mc02-stability-headlights.svg','mc02-control-mid-ring.svg','mc02-traction-car.svg','mc02-traction-skids.svg','mc02-response-cones.svg','mc02-response-arrow.svg'].every(name=>exists(`assets/${name}`))
) {
  ok('MC02 component animation suite','Velocity Vault keeps the approved icon placement while animating only the intended source component; captured state remains selective green with the rest of each icon cyan.');
} else fail('MC02 component animation suite','MC02 component mapping, pivot animation, selective completion colour, or required SVG assets are incomplete');

// 12) External runtime dependencies / launch notes.
const urls=[...runtime.matchAll(/https:\/\/[^'"`\s)]+/g)].map(m=>m[0]);
const uniqueUrls=[...new Set(urls)];
if(uniqueUrls.length) notes.push(`External runtime URL(s): ${uniqueUrls.join(', ')}`);
if(runtime.includes('Test stream for ELF FM')) warn('ELF FM stream','Current build still identifies the Radio Mast URL as a test stream; replace before final public launch if a production stream is supplied');

// 13) Manifest note.
try {
  const manifest=JSON.parse(read('manifest.webmanifest'));
  if(Array.isArray(manifest.icons) && manifest.icons.length===0) warn('Web app manifest','No install icon is defined. This does not affect normal browser use, only add-to-home-screen presentation.');
} catch(e){ fail('Web app manifest',e.message); }

// Emit report.
console.log('Silverstone Mission Control — production audit');
console.log('='.repeat(48));
for(const c of checks) console.log(`PASS  ${c.name}${c.detail?` — ${c.detail}`:''}`);
for(const w of warnings) console.log(`WARN  ${w.name}${w.detail?` — ${w.detail}`:''}`);
for(const f of failures) console.log(`FAIL  ${f.name}${f.detail?` — ${f.detail}`:''}`);
for(const n of notes) console.log(`NOTE  ${n}`);
console.log('-'.repeat(48));
console.log(`${checks.length} passed, ${warnings.length} warning(s), ${failures.length} failure(s).`);
if(failures.length) process.exit(1);
