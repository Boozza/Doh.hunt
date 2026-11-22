// ================= STANDALONE (Leaflet + GPS) =================
const STANDALONE=true;
// pixel-alien marker drawn on Leaflet's canvas renderer (fast for thousands of points)
const AlienM=L.CircleMarker.extend({_updatePath(){const r=this._renderer;if(!r._drawing||this._empty())return;const p=this._point,c=r._ctx,o=this.options,s=o.cell;
  drawAlien(c,p.x,p.y,s,o.fillColor,o.fillOpacity);const hw=4.5*s,hh=3*s;
  if(o.dash){c.save();c.strokeStyle='#fff';c.lineWidth=1;c.setLineDash([2,2]);c.strokeRect(p.x-hw-3,p.y-hh-3,hw*2+6,hh*2+6);c.restore()}
  if(o.sel){c.save();c.strokeStyle='#ffd90f';c.lineWidth=2.5;c.strokeRect(p.x-hw-6,p.y-hh-6,hw*2+12,hh*2+12);c.restore()}}});
(function seed(){const S=__SEED__;for(const [code,ids] of Object.entries(S)){try{if(localStorage.getItem('hp_fl_'+code)===null)localStorage.setItem('hp_fl_'+code,JSON.stringify(ids))}catch(e){}}})();
function applyStatus(ch){const MAP={destroyed:'destroyed',degraded:'damaged',damaged:'damaged',restored:'ok',reactivated:'ok',ok:'ok'};
  const idx=new Map();DATA.cities.forEach(c=>c.inv.forEach(i=>idx.set(i[0],i)));
  Object.entries(ch||{}).forEach(([id,v])=>{const i=idx.get(id);if(!i||!v)return;const st=MAP[v.type];if(st){i[4]=st;i[5]=v.type+' on '+(v.date||'')+' (invader-spotter)'}});
  NEWS.changes=ch||{}}
applyStatus(__CHANGES__);NEWS.items=__ITEMS__;ADJ={};
const DATA_URL='https://raw.githubusercontent.com/Boozza/Doh-data/main/';
const getData=f=>fetch(DATA_URL+f+'?t='+Math.floor(Date.now()/3e5),{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).catch(()=>fetch('data/'+f,{cache:'no-store'}).then(r=>r.ok?r.json():null));
// live data files (updated daily in the repo → Netlify redeploys)
getData('status.json').then(d=>{if(!d||!d.changes)return;applyStatus(d.changes);
  if(d.updated)$('src').textContent=DATA.source.replace(/to \d+ \w+ \d+/,'')+' · status checked '+d.updated;
  try{renderNews()}catch(e){};if(city){route=null;$('result').hidden=true;refresh()}}).catch(()=>{});
getData('news.json').then(d=>{if(d&&Array.isArray(d.items)){NEWS.items=d.items;try{renderNews()}catch(e){}}}).catch(()=>{});
$('map').style.display='none';
{const a=$('mc-row'),b=$('mc-list');if(a)a.remove();if(b)b.remove()}
const lmapEl=document.createElement('div');lmapEl.id='lmap';lmapEl.style.cssText='position:absolute;inset:0';$('screen').prepend(lmapEl);
const LM=L.map(lmapEl,{zoomControl:false,preferCanvas:true}).setView([51.5,-0.12],13);
const OSMA='© OpenStreetMap contributors';
const BASES={osm:['https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',OSMA,'Streets','abc'],hot:['https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',OSMA+', tiles HOT/OSM France','Humanitarian','abc'],dark:['https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',OSMA,'Dark','abc']};
let BASE='osm';try{BASE=localStorage.getItem('hp_base')||'osm'}catch(e){};if(!BASES[BASE])BASE='osm';
let BL=null;function setBase(k){if(BL)LM.removeLayer(BL);BASE=k;const b=BASES[k];BL=L.tileLayer(b[0],{maxZoom:19,subdomains:b[3],attribution:b[1],className:k==='dark'?'tiles-dark':''}).addTo(LM);BL.bringToBack();try{localStorage.setItem('hp_base',k)}catch(e){};lmapEl.classList.toggle('darkbase',k==='dark')}
setBase(BASE);
const LR=L.canvas({padding:.3,tolerance:10});let LInv=L.layerGroup().addTo(LM),LRoute=L.layerGroup().addTo(LM),LStart=L.layerGroup().addTo(LM),LMe=L.layerGroup().addTo(LM);
let lastView='';
function kToZoom(k,lat){return Math.max(2,Math.min(19,Math.log2(k*360*Math.cos(lat*Math.PI/180)/256)))}
function draw(){
  if(!city)return;
  const vk=view.lat.toFixed(5)+','+view.lon.toFixed(5)+','+Math.round(view.k);
  if(vk!==lastView&&view.k>1){LM.setView([view.lat,view.lon],kToZoom(view.k,view.lat));lastView=vk}
  LInv.clearLayers();LRoute.clearLayers();LStart.clearLayers();
  const order=route?new Map(route.stops.map((s,j)=>[s[0],j+1])):null;
  const LBLC=[];
  for(const i of city.inv){const st=i[4],fl=flashed.has(i[0]);
    if(!visible(i))continue;
    const dead=st==='destroyed'||st==='hidden';
    const zf=Math.max(.8,Math.min(1.4,(LM.getZoom()-12)/4+.8)),cs=alienCell(i[3])*zf*(fl||dead?.7:1);
    const m=new AlienM([i[1],i[2]],{renderer:LR,radius:4.5*cs+2,cell:cs,sel:!!(selected&&selected[0]===i[0]),dash:st==='damaged'||st==='degraded',fillColor:dead?'#59607f':fl?'#6b7399':ptColor(i[3]),fillOpacity:fl||dead?.7:1,interactive:false}).addTo(LInv);
    if(order&&order.has(i[0]))m.bindTooltip(String(order.get(i[0])),{permanent:true,direction:'right',className:'rnum',offset:[6,0]});
    else if(LM.getZoom()>=14&&!dead)LBLC.push({i,m});    const rc=recentCh(i[0]);if(rc){const col=CH_COL[rc.type]||'#fff';L.circleMarker([i[1],i[2]],{renderer:LR,radius:14,weight:3,color:col,fill:false,interactive:false}).addTo(LInv);
      L.marker([i[1],i[2]],{icon:L.divIcon({className:'',html:'<div class="chb" style="background:'+col+'">'+(rc.type==='destroyed'?'✕':(rc.type==='degraded'||rc.type==='damaged')?'!':'↑')+'</div>',iconSize:[16,16],iconAnchor:[-6,22]}),interactive:false,keyboard:false}).addTo(LInv)}
  }
  if(LBLC.length){const sz=LM.getSize();const pts=LBLC.map(o=>{const q=LM.latLngToContainerPoint([o.i[1],o.i[2]]);return {i:o.i,x:q.x,y:q.y,m:o.m}}).filter(p=>p.x>=0&&p.y>=0&&p.x<=sz.x&&p.y<=sz.y);
    for(const p of lblPick(pts))p.m.bindTooltip(p.i[0],{permanent:true,direction:'right',className:'ilbl',offset:[7,0]})}
  if(route&&route.path.length>1){
    if(route.geo&&route.geo.length===(route.path.length-1)){route.geo.forEach((g,j)=>{const leg=route.legs&&route.legs[j];const ride=leg&&leg.m!=='walk';
      L.polyline(ride||!g?[route.path[j],route.path[j+1]]:g,ride||!g?{color:'#ff5aa8',weight:3,dashArray:'4 8',opacity:.9}:{color:'#ff5aa8',weight:5,opacity:.9}).addTo(LRoute)})}
    else L.polyline(route.path,{color:'#ff5aa8',weight:4,dashArray:'8 6'}).addTo(LRoute)}
  if(HOTEL)L.marker([HOTEL.lat,HOTEL.lon],{icon:L.divIcon({className:'',html:'<div class="hpin">'+pxi('hotel',20)+'</div>',iconSize:[30,30],iconAnchor:[15,15]})}).bindTooltip(HOTEL.name||'Hotel').addTo(LStart);
  if(!(startSrc==='hotel'&&HOTEL))L.marker(start,{icon:L.divIcon({className:'',html:'<div class="flag">'+(startSrc==='gps'?'◎':'⚑')+'</div>',iconSize:[24,24],iconAnchor:[4,22]})}).addTo(LStart);
}
function fitCity(){LM.invalidateSize();const [lo0,la0,lo1,la1]=city.bbox;LM.fitBounds([[la0,lo0],[la1,lo1]]);lastView='';view.k=0}
function fitRoute(){if(route&&route.path.length>1){LM.fitBounds(route.path,{padding:[30,30]});view.k=0}}
function resize(){LM.invalidateSize()}
new ResizeObserver(()=>LM.invalidateSize()).observe($('screen'));window.addEventListener('orientationchange',()=>setTimeout(()=>LM.invalidateSize(),300));
setTimeout(()=>LM.invalidateSize(),200);
$('zin').onclick=()=>LM.zoomIn();$('zout').onclick=()=>LM.zoomOut();$('fit').onclick=fitCity;
LM.on('click',e=>{if(hotelMode){hotelMode=false;$('hint').hidden=true;$('hint').textContent='Tap the map to set your start';saveHotel({lat:e.latlng.lat,lon:e.latlng.lng,name:'Hotel'});toast('Hotel saved – it is now your start point');return}if(startMode){startSrc='pin';try{localStorage.setItem('hp_src_'+city.code,'pin')}catch(_){};start=[e.latlng.lat,e.latlng.lng];try{localStorage.setItem('hp_start_'+city.code,JSON.stringify(start))}catch(_){};startMode=false;$('startmode').classList.remove('on');$('hint').hidden=true;route=null;$('result').hidden=true;refresh()}else{const cp=e.containerPoint;let best=null,bd=26;for(const i of city.inv){if(!visible(i))continue;const q=LM.latLngToContainerPoint([i[1],i[2]]);const d=Math.hypot(q.x-cp.x,q.y-cp.y);if(d<bd){bd=d;best=i}}
  if(best)showCard(best);else{selected=null;$('card').hidden=true;draw()}}});
// plan() sets view for the route; translate to fitBounds after each plan
const _runPlan=runPlan;runPlan=function(){_runPlan();view.k=0;fitRoute()};$('plan').onclick=runPlan;
// ---- GPS
let ME=null,meAcc=0,gpsOn=false,watchId=null;
const gpsBtn=document.createElement('button');gpsBtn.textContent='◎';gpsBtn.title='Show my location';gpsBtn.setAttribute('aria-label','Show my location');$('fit').after(gpsBtn);
gpsBtn.onclick=()=>{if(!navigator.geolocation){toast('No GPS on this device.');return}
  if(watchId===null){watchId=navigator.geolocation.watchPosition(p=>{ME=[p.coords.latitude,p.coords.longitude];meAcc=p.coords.accuracy;LMe.clearLayers();L.circle(ME,{radius:meAcc,color:'#2b8cff',weight:1,fillOpacity:.1}).addTo(LMe);L.circleMarker(ME,{radius:8,color:'#fff',weight:3,fillColor:'#2b8cff',fillOpacity:1}).addTo(LMe);if(!gpsOn){gpsOn=true;LM.setView(ME,16)}if(HUNT&&!$('hunt').hidden)renderHunt();updMeBtn();onFix()},e=>toast('Location blocked: '+e.message),{enableHighAccuracy:true,maximumAge:5000})}
  else if(ME)LM.setView(ME,Math.max(LM.getZoom(),16));gpsBtn.classList.add('on')};
function updMeBtn(){const b=$('me-start');if(b)b.hidden=!ME}
function prevPoint(){if(ME)return ME;if(!HUNT)return start;for(let k=HUNT.idx-1;k>=0;k--){const i=invById(HUNT.stops[k]);if(i&&(HUNT.got.includes(i[0])||HUNT.missed.includes(i[0])))return [i[1],i[2]]}return HUNT.start}
// ---- downloads without the Claude runtime
function dlBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
async function saveCard(s){const cv2=document.createElement('canvas');cv2.width=1080;cv2.height=1920;await drawCard(cv2,s);cv2.toBlob(b=>{dlBlob(b,`hunt-${s.city}-${s.date}.png`);const m=$('h-msg');if(m)m.textContent='Saved. Post it as a Story.'},'image/png')}
$('export').onclick=()=>{const q=s=>'"'+String(s).replace(/"/g,'""')+'"';const rows=[['name','latitude','longitude','points','status','photos'].join(',')];candidates().forEach(i=>rows.push([q(i[0]),i[1],i[2],i[3],q(i[4]),q(photos(i[0]))].join(',')));dlBlob(new Blob([rows.join('\n')],{type:'text/csv'}),'invaders-'+city.code+'-to-hunt.csv');$('exportmsg').textContent='Saved.'};
// sessions + backup in localStorage
const _close=renderHuntEnd;renderHuntEnd=function(){_close();const done=$('h-done'),x=$('h-x');const wrap=fn=>()=>{try{const l=JSON.parse(localStorage.getItem('hp_sessions')||'[]');if(HUNT&&HUNT.got.length){l.unshift(Object.assign({},HUNT));localStorage.setItem('hp_sessions',JSON.stringify(l.slice(0,30)))}}catch(e){};fn()};if(done){const f=done.onclick;done.onclick=wrap(f)}if(x){const f=x.onclick;x.onclick=wrap(f)}};
try{SESSIONS=JSON.parse(localStorage.getItem('hp_sessions')||'[]')}catch(e){}
// (gallery shown: photos are stored on this device)

// ---- start from live location
function getFix(){return new Promise(res=>{if(ME)return res(ME);if(!navigator.geolocation)return res(null);navigator.geolocation.getCurrentPosition(p=>res([p.coords.latitude,p.coords.longitude]),()=>res(null),{enableHighAccuracy:true,timeout:8000,maximumAge:30000})})}
const _rp2=runPlan;runPlan=async function(){
  if(startSrc==='gps'){const fix=await getFix();if(fix){start=fix.slice();renderStartNote()}else toast('Could not get your location – using the last start point')}
  _rp2()};
$('plan').onclick=runPlan;
// hotel button in Leaflet-version: also offer "use my location as hotel"
const useHere=document.createElement('button');useHere.className='btn';useHere.textContent='◎ I\'m at the hotel now';$('h-paste').after(useHere);
useHere.onclick=async()=>{const f=await getFix();if(!f){toast('Location not available');return}saveHotel({lat:f[0],lon:f[1],name:'Hotel'});toast('Hotel saved from your location')};
// ---- robust tap handling (touch devices): pick nearest invader on short taps
(function(){let d=null,last=0;const el=lmapEl;
 el.addEventListener('pointerdown',e=>{d={x:e.clientX,y:e.clientY,t:Date.now()}},true);
 el.addEventListener('pointerup',e=>{if(!d)return;const moved=Math.hypot(e.clientX-d.x,e.clientY-d.y),dt=Date.now()-d.t;d=null;
   if(moved>12||dt>600||hotelMode||startMode)return;if(e.target.closest&&e.target.closest('.leaflet-control,.maptools,.leaflet-popup,.leaflet-marker-icon'))return;
   const r=el.getBoundingClientRect();const cp={x:e.clientX-r.left,y:e.clientY-r.top};let best=null,bd=28;
   for(const i of city.inv){if(!visible(i))continue;const q=LM.latLngToContainerPoint([i[1],i[2]]);const dd=Math.hypot(q.x-cp.x,q.y-cp.y);if(dd<bd){bd=dd;best=i}}
   if(best){last=Date.now();window.__lastPick=last;showCard(best)}},true);
 LM.on('click',e=>{if(window.__lastPick&&Date.now()-window.__lastPick<500)L.DomEvent.stop(e)});
})();

// ================= MARRIOTT HOTELS LAYER (OpenStreetMap / Overpass) =================
const MB=[ // [label, regex, tier]  tier: L luxury, P premium, S select
 ['Ritz-Carlton',/ritz.?carlton/i,'L'],['St. Regis',/st\.? ?regis/i,'L'],['JW Marriott',/\bjw marriott/i,'L'],['Luxury Collection',/luxury collection/i,'L'],['W Hotels',/^w hotels?$|\bw hotels\b/i,'L'],['EDITION',/\bedition\b/i,'L'],['Bvlgari',/b[vu]lgari/i,'L'],
 ['Autograph Collection',/autograph collection/i,'P'],['Tribute Portfolio',/tribute portfolio/i,'P'],['Le Méridien',/m[ée]ridien/i,'P'],['Westin',/westin/i,'P'],['Sheraton',/sheraton/i,'P'],['Renaissance',/renaissance/i,'P'],['Delta Hotels',/delta hotels/i,'P'],['Gaylord',/gaylord/i,'P'],['Design Hotels',/design hotels/i,'P'],
 ['Courtyard',/courtyard/i,'S'],['AC Hotels',/\bac hotel/i,'S'],['Aloft',/aloft/i,'S'],['Moxy',/moxy/i,'S'],['Four Points',/four points/i,'S'],['Residence Inn',/residence inn/i,'S'],['Fairfield',/fairfield/i,'S'],['SpringHill Suites',/springhill/i,'S'],['Element',/^element\b|element by westin/i,'S'],['TownePlace',/towneplace/i,'S'],['Protea',/protea/i,'S'],['City Express',/city express/i,'S'],
 ['Marriott',/marriott/i,'P']];
const MTIER={L:['#ffd90f','Luxury'],P:['#ff5aa8','Premium'],S:['#3ee0ff','Select']};
const BRAND_RX='Marriott|Sheraton|Westin|Courtyard|Moxy|Renaissance|Ritz.?Carlton|Aloft|M[eé]ridien|AC Hotel|Four Points|St\\.? ?Regis|Luxury Collection|Autograph Collection|Element|Residence Inn|Fairfield|SpringHill|Tribute Portfolio|EDITION|Delta Hotels|W Hotels|B[vu]lgari|Protea|TownePlace|Gaylord|City Express';
const NAME_RX='Marriott|Sheraton|Westin|Courtyard by|Moxy|Renaissance [A-Z]|Ritz.?Carlton|Aloft|Le M[eé]ridien|AC Hotel|Four Points|St\\.? ?Regis|Luxury Collection|Autograph Collection|Residence Inn|Fairfield Inn|SpringHill Suites|Tribute Portfolio|Delta Hotels|TownePlace|Protea Hotel|B[vu]lgari Hotel|Element by Westin';
let LMar=L.layerGroup().addTo(LM),MAR=null,marOn=false,marCode=null;
function brandMatch(t){const txt=[t.brand,t.operator,t.name].filter(Boolean).join(' | ');return MB.some(b=>b[1].test(txt))}
function brandOf(t){const txt=[t.brand,t.operator,t.name].filter(Boolean).join(' | ');for(const b of MB)if(b[1].test(t.brand||''))return b;for(const b of MB)if(b[1].test(txt))return b;return MB[MB.length-1]}
function marHav(a,b,c,d){const R=6371,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180,h=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
function huntScore(h){let n1=0,p1=0,n3=0;for(const i of city.inv){const st=i[4];if(st==='destroyed'||st==='hidden'||flashed.has(i[0]))continue;const d=marHav(h.lat,h.lon,i[1],i[2]);if(d<=1){n1++;p1+=i[3]}if(d<=2.5)n3++}return {n1,p1,n3}}
async function overpass(q){const eps=['https://overpass-api.de/api/interpreter','https://overpass.kumi.systems/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter'];let err;
  for(const u of eps){try{const r=await fetch(u,{method:'POST',body:'data='+encodeURIComponent(q),headers:{'Content-Type':'application/x-www-form-urlencoded'}});if(r.ok)return await r.json();err=r.status}catch(e){err=e}}throw err}
async function loadMarriott(force){const c=city;if(!c||!c.bbox)return [];const key='hp_mar_'+c.code;
  if(!force){try{const v=JSON.parse(localStorage.getItem(key)||'null');if(v&&Date.now()-v.t<30*864e5)return withExtra(v.h)}catch(e){}}
  const [lo0,la0,lo1,la1]=c.bbox,pad=.03,bb=[la0-pad,lo0-pad,la1+pad,lo1+pad].map(x=>x.toFixed(4)).join(',');
  const q=`[out:json][timeout:50];(nwr["tourism"~"^(hotel|apartment|guest_house)$"]["brand"~"${BRAND_RX}",i](${bb});nwr["tourism"="hotel"]["operator"~"Marriott",i](${bb});nwr["tourism"="hotel"]["name"~"${NAME_RX}",i](${bb}););out center tags;`;
  let j;try{j=await overpass(q)}catch(e){const x=withExtra([]);if(x.length)return x;throw e}const seen=new Set(),h=[];
  for(const e of j.elements||[]){const t=e.tags||{},lat=e.lat??(e.center&&e.center.lat),lon=e.lon??(e.center&&e.center.lon);if(lat==null||!t.name||!brandMatch(t))continue;const k=t.name.toLowerCase();if(seen.has(k))continue;seen.add(k);const b=brandOf(t);
    h.push({name:t.name,lat,lon,brand:b[0],tier:b[2],addr:[t['addr:street'],t['addr:housenumber']].filter(Boolean).join(' '),web:t.website||t['contact:website']||''})}
  try{localStorage.setItem(key,JSON.stringify({t:Date.now(),h}))}catch(e){}return withExtra(h)}
function withExtra(h){const x=(typeof MC_EXTRA!=='undefined'&&city&&MC_EXTRA[city.code])||[];for(const e of x)if(!h.some(k=>k.name===e.n))h.push({name:e.n,lat:e.lat,lon:e.lon,brand:e.b,tier:e.t,addr:e.addr||'',web:''});return h}
function gmaps(h){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(h.name+' '+city.name)}
function setBaseFrom(h){saveHotel({lat:h.lat,lon:h.lon,name:h.name});toast(h.name+' is now your base');renderMar()}
function marPopup(h,s){return `<div style="min-width:200px;font:13px/1.35 var(--f-body);color:#111"><b>${escapeHtml(h.name)}</b><br><span style="color:#555">${escapeHtml(h.brand)} · ${MTIER[h.tier][1]}</span><br>👾 <b>${s.n1}</b> to hunt within 1 km (${s.p1} pts)<br>🚕 ${s.n3} within 2.5 km<div style="display:flex;gap:6px;margin-top:8px"><button class="mpb y" data-mset="1">Set as my base</button><a class="mpb" href="${gmaps(h)}" target="_blank" rel="noopener">Maps</a></div></div>`}
function renderMar(){LMar.clearLayers();const box=$('mh-list');if(!marOn||!MAR){if(box)box.innerHTML='';return}
  const rows=MAR.map(h=>({h,s:huntScore(h)})).sort((a,b)=>b.s.n1-a.s.n1||b.s.p1-a.s.p1||b.s.n3-a.s.n3);
  for(const {h,s} of rows){const col=MTIER[h.tier][0],cur=HOTEL&&Math.abs(HOTEL.lat-h.lat)<1e-5&&Math.abs(HOTEL.lon-h.lon)<1e-5;
    const m=L.marker([h.lat,h.lon],{icon:L.divIcon({className:'',html:`<div class="mpin${cur?' cur':''}" style="--c:${col}">M<i>${s.n1}</i></div>`,iconSize:[30,30],iconAnchor:[15,15]}),zIndexOffset:cur?1000:0}).addTo(LMar);
    m.bindPopup(()=>marPopup(h,s),{maxWidth:260});m.on('popupopen',e=>{const b=e.popup.getElement().querySelector('[data-mset]');if(b)b.onclick=()=>{LM.closePopup();setBaseFrom(h)}})}
  if(!box)return;
  box.innerHTML=rows.length?`<div class="note">${rows.length} Marriott-family hotels · ranked by invaders left to hunt within 1 km</div>`+rows.slice(0,15).map((r,k)=>`<div class="mrow"><span class="mdot" style="background:${MTIER[r.h.tier][0]}"></span><div class="mtx"><b>${escapeHtml(r.h.name)}</b><span>${escapeHtml(r.h.brand)} · 👾 ${r.s.n1} ≤1 km (${r.s.p1} pts) · ${r.s.n3} ≤2.5 km</span></div><button class="btn" data-mz="${k}" aria-label="Show on map">◎</button><button class="btn g" data-ms="${k}">Set</button></div>`).join(''):'<div class="note">No Marriott-family hotels found on OpenStreetMap for this city. Use Find hotel or Paste location.</div>';
  box.querySelectorAll('[data-ms]').forEach(b=>b.onclick=()=>setBaseFrom(rows[+b.dataset.ms].h));
  box.querySelectorAll('[data-mz]').forEach(b=>b.onclick=()=>{const h=rows[+b.dataset.mz].h;window.scrollTo({top:0,behavior:'smooth'});LM.setView([h.lat,h.lon],16);view.k=0})}
async function marToggle(force){if(marOn&&!force){marOn=false;$('mh-btn').classList.remove('on');renderMar();return}
  marOn=true;$('mh-btn').classList.add('on');const box=$('mh-list');box.innerHTML='<div class="note">Loading Marriott hotels…</div>';
  try{MAR=await loadMarriott(force);marCode=city.code;renderMar();if(MAR.length&&!force){const b=L.latLngBounds(MAR.map(h=>[h.lat,h.lon]));if(HOTEL)b.extend([HOTEL.lat,HOTEL.lon]);LM.fitBounds(b,{padding:[30,30],maxZoom:15});view.k=0}}
  catch(e){box.innerHTML='<div class="note">Could not load hotels right now (map server busy or offline). Try again in a minute.</div>'}}
async function hotelSearch(q){const box=$('mh-res');box.innerHTML='<div class="note">Searching…</div>';const [lo0,la0,lo1,la1]=city.bbox;
  try{const r=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=0&viewbox=${lo0},${la1},${lo1},${la0}&q=${encodeURIComponent(q)}`,{headers:{'Accept-Language':'en'}});const j=await r.json();
    if(!j.length){box.innerHTML='<div class="note">Nothing found. Try adding the city name.</div>';return}
    box.innerHTML=j.map((x,k)=>`<div class="mrow"><div class="mtx"><b>${escapeHtml(x.name||x.display_name.split(',')[0])}</b><span>${escapeHtml(x.display_name.split(',').slice(1,4).join(','))}</span></div><button class="btn g" data-hs="${k}">Set</button></div>`).join('');
    box.querySelectorAll('[data-hs]').forEach(b=>b.onclick=()=>{const x=j[+b.dataset.hs];box.innerHTML='';$('mh-sbox').hidden=true;setBaseFrom({lat:+x.lat,lon:+x.lon,name:x.name||x.display_name.split(',')[0]});LM.setView([+x.lat,+x.lon],15);view.k=0})}
  catch(e){box.innerHTML='<div class="note">Search is unavailable right now.</div>'}}
(function(){const row=document.createElement('div');row.className='inline';
  row.innerHTML='<button class="btn y" id="mh-btn">Ⓜ Marriott hotels</button><button class="btn" id="mh-find">🔎 Find hotel</button><button class="btn" id="mh-ref" hidden title="Reload from OpenStreetMap">↻</button>';
  const sb=document.createElement('div');sb.className='inline';sb.id='mh-sbox';sb.hidden=true;sb.innerHTML='<input type="text" id="mh-q" placeholder="Hotel name, e.g. Courtyard Rome Central Park" aria-label="Hotel name"><button class="btn g" id="mh-go">Search</button>';
  const res=document.createElement('div');res.id='mh-res';const list=document.createElement('div');list.id='mh-list';
  const hb=document.querySelector('.hotelbox');hb.append(row,sb,res,list);
  $('mh-btn').onclick=()=>{marToggle();$('mh-ref').hidden=!marOn};$('mh-ref').onclick=()=>marToggle(true);
  $('mh-find').onclick=()=>{sb.hidden=!sb.hidden;if(!sb.hidden)$('mh-q').focus()};
  $('mh-go').onclick=()=>{const q=$('mh-q').value.trim();if(q)hotelSearch(q)};$('mh-q').addEventListener('keydown',e=>{if(e.key==='Enter')$('mh-go').click()});
  const _lc=loadCity;loadCity=function(code){_lc(code);MAR=null;$('mh-res').innerHTML='';if(marOn){marOn=false;marToggle()}else renderMar()};
  const _rf=refresh;refresh=function(){_rf();if(marOn&&MAR&&marCode===city.code)renderMar()};
})();

// ================= STREET ROUTING (OSRM foot profile, routing.openstreetmap.de) =================
const OSRM='https://routing.openstreetmap.de/routed-foot';
let RM=null; // {city, idx:Map(key->i), dist:[[m]]}
const pk=p=>p[0].toFixed(5)+','+p[1].toFixed(5);
ROADD=(a,b)=>{if(!RM||RM.city!==city.code)return null;const i=RM.idx.get(pk(a)),j=RM.idx.get(pk(b));if(i==null||j==null)return null;const d=RM.dist[i][j];return d==null?null:d/1000};
async function osrmTable(pts){const url=OSRM+'/table/v1/foot/'+pts.map(p=>p[1].toFixed(6)+','+p[0].toFixed(6)).join(';')+'?annotations=distance';
  const ctl=new AbortController();const tm=setTimeout(()=>ctl.abort(),15000);try{const r=await fetch(url,{signal:ctl.signal});const j=await r.json();if(j.code!=='Ok')throw new Error(j.code);return j.distances}finally{clearTimeout(tm)}}
async function buildMatrix(){
  const cfg=travelCfg();const budget=+$('budget').value||60;const timeMode=mode==='time';
  const fast=cfg.travel==='walk'?cfg.v:(cfg.travel==='transit'?TRANSIT.kmh:TAXI.kmh);
  const reach=(timeMode?budget/60*fast:(cfg.travel==='walk'?budget:50))*(+$('days').value>1?1.6:1);
  const base=(a,b)=>hav(a,b)*1.3;
  let C=candidates().map(i=>[i[1],i[2]]).filter(p=>base(start,p)<=reach+0.05).sort((a,b)=>base(start,a)-base(start,b));
  for(const N of [99,60,40]){const pts=[start].concat(C.slice(0,N));const key=city.code+'|'+pts.map(pk).join(';');
    if(RM&&RM.key===key)return true;
    try{const dist=await osrmTable(pts);const idx=new Map();pts.forEach((p,i)=>idx.set(pk(p),i));RM={city:city.code,key,idx,dist,n:pts.length};return true}catch(e){if(String(e).includes('Abort'))break}}
  RM=null;return false}
async function ensureGeo(rt){if(!rt||rt.geo||!rt.path||rt.path.length<2||!RM)return;
  const legs=rt.legs||[];const geo=new Array(rt.path.length-1).fill(null);
  // group consecutive walk legs into one request (max 40 points each)
  let j=0;const jobs=[];while(j<rt.path.length-1){if(legs[j]&&legs[j].m!=='walk'){j++;continue}let k=j;while(k<rt.path.length-1&&!(legs[k]&&legs[k].m!=='walk')&&k-j<39)k++;jobs.push([j,k]);j=k}
  try{for(const [a,b] of jobs){const pts=rt.path.slice(a,b+1);const url=OSRM+'/route/v1/foot/'+pts.map(p=>p[1].toFixed(6)+','+p[0].toFixed(6)).join(';')+'?overview=full&geometries=geojson&steps=false';
      const r=await fetch(url);const jj=await r.json();if(jj.code!=='Ok')continue;const line=jj.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);
      // split the full line into legs by nearest vertex to each waypoint
      let cut=[0];let from=0;for(let w=1;w<pts.length;w++){let best=from,bd=1e9;for(let v=from;v<line.length;v++){const d=Math.abs(line[v][0]-pts[w][0])+Math.abs(line[v][1]-pts[w][1]);if(d<bd){bd=d;best=v}}cut.push(best);from=best}
      for(let w=0;w<pts.length-1;w++)geo[a+w]=line.slice(cut[w],cut[w+1]+1)}
    rt.geo=geo;if(rt===route)draw()}catch(e){}}
const _rp3=runPlan;runPlan=async function(){const b=$('plan');const t=b.textContent;b.textContent='Routing streets…';b.disabled=true;
  if(startSrc==='gps'){const fix=await getFix();if(fix){start=fix.slice()}}
  let ok=false;try{ok=await buildMatrix()}catch(e){}
  b.textContent=t;b.disabled=false;
  await _rp3();
  if(!ok)toast('Street routing unavailable – using estimated distances');};
$('plan').onclick=runPlan;
const _plan0=plan;plan=function(o){const r=_plan0(o);if(!(o&&o.quiet))ensureGeo(route);return r};
const _sd=showDay;showDay=function(d){_sd(d);ensureGeo(route)};
const _rr=renderResult;renderResult=function(loop,el){_rr(loop,el);const host=el||$('result');if(RM&&RM.city===city.code&&route&&route.stops&&route.stops.length){const n=document.createElement('div');n.className='note';n.textContent='🛣 Walking distances follow real streets (OpenStreetMap).';host.appendChild(n)}};

// ================= v22 STANDALONE EXTRAS =================
var themeMap=null;
// basemap switch
{const b=document.createElement('button');b.id='basebtn';b.title='Map style';b.setAttribute('aria-label','Map style');const lab=()=>b.textContent=BASE==='dark'?'🌙':BASE==='hot'?'H':'🗺';lab();gpsBtn.after(b);
 b.onclick=()=>{const ks=Object.keys(BASES);setBase(ks[(ks.indexOf(BASE)+1)%ks.length]);lab();try{localStorage.setItem('hp_base_manual','1')}catch(e){};toast('Map: '+BASES[BASE][2])};
 function themeMapF(e){let man=false;try{man=localStorage.getItem('hp_base_manual')==='1'}catch(x){}if(man)return;const k=(e==='light'||e==='field')?'osm':'dark';if(BASES[k]&&k!==BASE){setBase(k);lab()}}
 themeMap=themeMapF}
// offline: service worker caches the app, data and every map tile you have viewed
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
window.addEventListener('offline',()=>toast('Offline – using the saved app, data and map tiles'));
window.addEventListener('online',()=>toast('Back online'));
// keep marks safe: persistent storage + Home Screen hint
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}
(function(){const standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone;let dis='';try{dis=localStorage.getItem('hp_a2hs')||''}catch(e){}
 const ios=/iPhone|iPad|iPod/.test(navigator.userAgent);if(standalone||(dis&&dis>new Date(Date.now()-14*864e5).toISOString()))return;
 const d=document.createElement('div');d.className='trip';d.id='a2hs';d.innerHTML=`<span>📲 <b>Add to Home Screen</b> so your flashes stay saved${ios?' (Share ⬆ → Add to Home Screen)':' (browser menu → Install app / Add to Home screen)'}. Safari can clear sites you haven't opened for a week.</span><button class="btn" id="a2hs-x" aria-label="Dismiss">✕</button>`;
 $('p-plan').prepend(d);$('a2hs-x').onclick=()=>{d.remove();try{localStorage.setItem('hp_a2hs',new Date().toISOString())}catch(e){}}})();
// trip from the daily watch (public data repo)
/* trip is private: it lives in the signed-in account (Supabase), cached on this device */
try{const t=JSON.parse(localStorage.getItem('hp_trip')||'null');if(t)setTrip(t)}catch(e){}
getData('fixes.json').then(f=>{if(f&&f.fixes){const loc=(()=>{try{return JSON.parse(localStorage.getItem('hp_fixes')||'{}')}catch(e){return {}}})();const m=Object.assign({},f.fixes);Object.entries(loc).forEach(([k,v])=>{if(!m[k]||String(v[2]||'')>=String(m[k][2]||''))m[k]=v});applyFixes(m,true)}}).catch(()=>{});
// live weather & daylight for the selected city (Open-Meteo)
const WXC={};
function liveWx(){if(!city||!city.bbox)return;if(TRIP&&tripCity()&&tripCity().code===city.code&&TRIP.days&&TRIP.days.length)return;const code=city.code;
  const hit=WXC[code];if(hit&&Date.now()-hit.t<36e5){WX=hit.wx;renderWx();return}
  const [lo0,la0,lo1,la1]=city.bbox;const u=`https://api.open-meteo.com/v1/forecast?latitude=${((la0+la1)/2).toFixed(3)}&longitude=${((lo0+lo1)/2).toFixed(3)}&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,precipitation_sum&hourly=precipitation_probability&timezone=auto&forecast_days=3`;
  fetch(u).then(r=>r.ok?r.json():null).then(j=>{const days=wxFromOM(j);if(!days)return;const wx={city:code,days,src:'Open-Meteo, local time'};WXC[code]={t:Date.now(),wx};if(city&&city.code===code){WX=wx;renderWx()}}).catch(()=>{})}
const _lcW=loadCity;loadCity=function(c){const r=_lcW.apply(this,arguments);try{liveWx()}catch(e){}return r};
// GPS: nearest invader chip, proximity alert, compass, screen wake lock
let HEADING=null,lastNear='',NEARCUR=null,WL=null;
const near=document.createElement('div');near.id='near';near.className='near';near.hidden=true;
near.innerHTML='<span class="arrow" id="near-ar">▲</span><span><b id="near-id"></b> <span id="near-d"></span> <span id="near-p"></span></span><button class="btn g" id="near-fl" hidden>✓ Flashed</button><button class="btn" id="near-cmp" title="Compass" aria-label="Compass">🧭</button>';
$('screen').appendChild(near);
armConfirm($('near-fl'),()=>{if(NEARCUR){flashWithUndo(NEARCUR[0],true);renderNear()}});
function nearestOpen(){if(!ME||!city)return null;let b=null,bd=1e9;for(const i of city.inv){if(flashed.has(i[0])||EXCL.has(i[0])||MISSING.has(i[0]))continue;if(!(i[4]==='ok'||i[4]==='damaged'||i[4]==='unknown'))continue;const d=hav(ME,[i[1],i[2]]);if(d<bd){bd=d;b=i}}return b?{i:b,d:bd}:null}
function beep(){try{const A=window.AudioContext||window.webkitAudioContext;const a=beep.a||(beep.a=new A());const o=a.createOscillator(),g=a.createGain();o.type='square';o.frequency.value=880;g.gain.value=.06;o.connect(g);g.connect(a.destination);o.start();o.frequency.setValueAtTime(1320,a.currentTime+.12);o.stop(a.currentTime+.26)}catch(e){}}
function renderNear(){const n=nearestOpen();if(!n||n.d>5){near.hidden=true;NEARCUR=null;return}near.hidden=false;NEARCUR=n.i;const m=Math.round(n.d*1000);
  $('near-id').textContent=n.i[0];$('near-d').textContent=m<1000?m+' m':(m/1000).toFixed(1)+' km';$('near-p').textContent=n.i[3]+' pts';$('near-p').style.color=ptColor(n.i[3]);
  $('near-fl').hidden=m>60;near.classList.toggle('hot',m<=40);near.dataset.b=bearing(ME,[n.i[1],n.i[2]]);updArrows();
  if(m<=40&&lastNear!==n.i[0]){lastNear=n.i[0];if(navigator.vibrate)navigator.vibrate([200,100,200]);beep();toast(n.i[0]+' is about '+m+' m away!')}}
function updArrows(){const b=+near.dataset.b||0;$('near-ar').style.transform=`rotate(${HEADING==null?b:b-HEADING}deg)`;
  const ha=document.querySelector('#hunt .h-dir .arrow');if(ha&&ha.dataset.b!=null)ha.style.transform=`rotate(${HEADING==null?+ha.dataset.b:+ha.dataset.b-HEADING}deg)`}
let arRaf=0;function onHeading(e){const h=e.webkitCompassHeading!=null?e.webkitCompassHeading:(e.absolute&&e.alpha!=null?360-e.alpha:null);if(h==null)return;HEADING=h;if(!arRaf)arRaf=requestAnimationFrame(()=>{arRaf=0;updArrows()})}
function enableCompass(){const go=()=>{window.addEventListener('deviceorientationabsolute',onHeading,true);window.addEventListener('deviceorientation',onHeading,true);$('near-cmp').classList.add('on');toast('Compass on – arrows now point where to walk')};
  if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==='function')DeviceOrientationEvent.requestPermission().then(s=>s==='granted'?go():toast('Compass permission was not given')).catch(()=>toast('Compass not available'));else go()}
$('near-cmp').onclick=enableCompass;
async function wake(){try{if(navigator.wakeLock&&!WL){WL=await navigator.wakeLock.request('screen');WL.addEventListener('release',()=>{WL=null})}}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&(gpsOn||(HUNT&&!$('hunt').hidden)))wake()});
function onFix(){renderNear();wake()}
const _rhN=renderHunt;renderHunt=function(){const r=_rhN.apply(this,arguments);const ha=document.querySelector('#hunt .h-dir .arrow');if(ha){const m=/rotate\(([-\d.]+)deg\)/.exec(ha.style.transform||'');if(m)ha.dataset.b=m[1];updArrows()}if(HUNT&&!$('hunt').hidden)wake();return r};
const _rfN=refresh;refresh=function(){const r=_rfN.apply(this,arguments);if(ME)renderNear();return r};

// ---- search / hover / labels: Leaflet versions
screenPos=(la,lo)=>{const p=LM.latLngToContainerPoint([la,lo]);return [p.x,p.y]};
focusInv=i=>{LM.setView([i[1],i[2]],Math.max(LM.getZoom(),18))};
LM.on('move zoom',()=>{try{placePulse()}catch(e){}});
LM.on('zoomend moveend',()=>{if(LM.getZoom()>=14)draw()});
let lblOn=false;LM.on('zoomend',()=>{const on=LM.getZoom()>=14;if(on!==lblOn){lblOn=on;draw()}});

// ---- my photos, stored on this device (IndexedDB) – the Claude version keeps them in its own storage
const PDB=new Promise(res=>{try{const r=indexedDB.open('doh-photos',1);r.onupgradeneeded=()=>r.result.createObjectStore('p');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)}catch(e){res(null)}});
async function pAll(){const d=await PDB;if(!d)return {};return new Promise(res=>{const out={};try{const rq=d.transaction('p').objectStore('p').openCursor();rq.onsuccess=()=>{const c=rq.result;if(c){out[c.key]=c.value;c.continue()}else res(out)};rq.onerror=()=>res(out)}catch(e){res(out)}})}
async function pPut(k,v){const d=await PDB;if(!d)return false;return new Promise(res=>{try{const tx=d.transaction('p','readwrite');tx.objectStore('p').put(v,k);tx.oncomplete=()=>res(true);tx.onerror=()=>res(false)}catch(e){res(false)}})}
pAll().then(all=>{Object.entries(all).forEach(([id,v])=>{if(v&&v.blob)PHOTOS[id]={code:id,url:URL.createObjectURL(v.blob),date:v.date||''}});try{renderGallery()}catch(e){}});
async function pDel(k){const d=await PDB;if(!d)return;return new Promise(res=>{try{const tx=d.transaction('p','readwrite');tx.objectStore('p').delete(k);tx.oncomplete=()=>res(true);tx.onerror=()=>res(false)}catch(e){res(false)}})}
storePhoto=async function(id,blob,date){date=date||TODAY();if(!(await pPut(id,{blob,date})))throw new Error('Could not save on this device');if(PHOTOS[id]&&PHOTOS[id].url&&PHOTOS[id].url.startsWith('blob:'))URL.revokeObjectURL(PHOTOS[id].url);PHOTOS[id]={code:id,url:URL.createObjectURL(blob),date};return PHOTOS[id]};
removePhoto=async function(id){const p=PHOTOS[id];delete PHOTOS[id];await pDel(id);if(p&&p.url&&p.url.startsWith('blob:'))URL.revokeObjectURL(p.url)};
pickPhoto=async function(id,after){const inp=document.createElement('input');inp.type='file';inp.accept='image/*';
  inp.onchange=async()=>{const f=inp.files[0];if(!f)return;try{const blob=await shrink(f,1400);const date=new Date().toISOString().slice(0,10);
    if(!(await pPut(id,{blob,date}))){toast('Could not save the photo on this device');return}
    if(PHOTOS[id]&&PHOTOS[id].url&&PHOTOS[id].url.startsWith('blob:'))URL.revokeObjectURL(PHOTOS[id].url);
    PHOTOS[id]={code:id,url:URL.createObjectURL(blob),date};toast('Photo saved for '+id+' (on this device)');renderGallery();after&&after()}catch(e){toast('Photo failed – try again')}};
  inp.click()};

// ================= v33 LIVE GUIDANCE (street route on the map, turn hints, re-routing) =================
const LNav=L.layerGroup().addTo(LM);
let NAV=null;
const IOS=/iPhone|iPad|iPod/.test(navigator.userAgent);
const navBar=document.createElement('div');navBar.id='navbar';navBar.className='navbar';navBar.hidden=true;
navBar.innerHTML='<div class="nb-turn"><span class="nb-ic" id="nb-ic">⬆</span><span id="nb-txt"></span></div><div class="nb-sub"><b id="nb-id"></b><span id="nb-rem"></span><span class="sp"></span><button class="btn g" id="nb-fl" hidden>✓ Flashed</button><button class="btn" id="nb-skip" hidden title="Skip to the next stop">Skip ›</button><a class="btn" id="nb-ext" target="_blank" rel="noopener" title="Open in Google Maps">↗</a><button class="btn" id="nb-x" aria-label="Stop guidance">✕</button></div>';
$('screen').appendChild(navBar);
const fmtM=m=>m<1000?Math.round(m/10)*10+' m':(m/1000).toFixed(1)+' km';
const MANI={left:'⬅','slight left':'↖','sharp left':'↙',right:'➡','slight right':'↗','sharp right':'↘',straight:'⬆',uturn:'↩'};
function stepTxt(s){const m=s.maneuver||{},t=m.type,mod=m.modifier||'',on=s.name?' onto '+s.name:'';
  if(t==='arrive')return ['🎯','Keep going – the invader is there'];
  if(t==='depart')return ['⬆','Start walking'+(s.name?' on '+s.name:'')];
  if(t==='roundabout'||t==='rotary'||t==='roundabout turn')return ['🔄','Go round the roundabout'+on];
  const verb=mod==='uturn'?'Turn around':mod==='slight left'?'Bear left':mod==='slight right'?'Bear right':mod.includes('left')?'Turn left':mod.includes('right')?'Turn right':'Continue';
  return [MANI[mod]||'⬆',verb+on]}
function xy(p,ref){return [(p[1]-ref[1])*111320*Math.cos(ref[0]*Math.PI/180),(p[0]-ref[0])*111320]}
function projLine(p,line){let best=1e9,bj=0;for(let j=0;j<line.length-1;j++){const a=xy(line[j],p),b=xy(line[j+1],p),dx=b[0]-a[0],dy=b[1]-a[1],L2=dx*dx+dy*dy;let u=L2?-(a[0]*dx+a[1]*dy)/L2:0;u=Math.max(0,Math.min(1,u));const d=Math.hypot(a[0]+u*dx,a[1]+u*dy);if(d<best){best=d;bj=j}}return {d:best,j:bj}}
async function navRoute(){if(!NAV||!ME||NAV.busy)return;const nv=NAV;nv.busy=true;nv.t=Date.now();
  try{const u=OSRM+'/route/v1/foot/'+ME[1].toFixed(6)+','+ME[0].toFixed(6)+';'+nv.dest[1].toFixed(6)+','+nv.dest[0].toFixed(6)+'?overview=full&geometries=geojson&steps=true';
    const ctl=new AbortController();const tm=setTimeout(()=>ctl.abort(),12000);const j=await fetch(u,{signal:ctl.signal}).then(r=>r.json());clearTimeout(tm);
    if(j.code!=='Ok'||!j.routes.length)throw 0;const r=j.routes[0];const line=r.geometry.coordinates.map(c=>[c[1],c[0]]);
    const cum=new Array(line.length).fill(0);for(let v=line.length-2;v>=0;v--)cum[v]=cum[v+1]+hav(line[v],line[v+1])*1000;
    let from=0;const steps=r.legs[0].steps.map(s=>{const loc=[s.maneuver.location[1],s.maneuver.location[0]];let bv=from,bd=1e9;for(let v=from;v<line.length;v++){const d=Math.abs(line[v][0]-loc[0])+Math.abs(line[v][1]-loc[1]);if(d<bd){bd=d;bv=v}}from=bv;return {v:bv,tx:stepTxt(s)}});
    Object.assign(nv,{line,cum,steps,ok:true})}
  catch(e){Object.assign(nv,{line:[ME.slice(),nv.dest],cum:[hav(ME,nv.dest)*1000,0],steps:[],ok:false})}
  nv.busy=false;if(nv===NAV){drawNav();updNav()}}
function drawNav(){LNav.clearLayers();if(!NAV)return;
  if(NAV.line){L.polyline(NAV.line,{color:'#0a0d1c',weight:9,opacity:.7,interactive:false}).addTo(LNav);L.polyline(NAV.line,{color:'#22e3ff',weight:5,opacity:.95,dashArray:NAV.ok?null:'6 8',interactive:false}).addTo(LNav)}
  L.circleMarker(NAV.dest,{radius:16,color:'#22e3ff',weight:3,fill:false,interactive:false}).addTo(LNav)}
function updNav(){if(!NAV)return;navBar.hidden=false;$('nb-id').textContent=NAV.id;
  $('nb-ext').href='https://www.google.com/maps/dir/?api=1&travelmode=walking&destination='+NAV.dest[0]+','+NAV.dest[1];
  $('nb-skip').hidden=!(NAV.hunt&&HUNT);
  if(!ME){$('nb-ic').textContent='📡';$('nb-txt').textContent='Waiting for your location…';$('nb-rem').textContent='';$('nb-fl').hidden=true;return}
  const dDest=hav(ME,NAV.dest)*1000;$('nb-fl').hidden=dDest>60||flashed.has(NAV.id);
  if(!NAV.line){if(!NAV.busy)navRoute();$('nb-ic').textContent='⏳';$('nb-txt').textContent='Finding a walking route…';return}
  const pr=projLine(ME,NAV.line);
  if(NAV.ok&&pr.d>40&&dDest>40&&Date.now()-NAV.t>12000){$('nb-ic').textContent='↻';$('nb-txt').textContent='Off route – finding a new way…';navRoute();return}
  const rem=NAV.ok?hav(ME,NAV.line[pr.j+1])*1000+NAV.cum[pr.j+1]:dDest*1.3;
  const v=travelCfg().v||4.5;$('nb-rem').textContent=' · '+fmtM(rem)+' · ~'+Math.max(1,Math.round(rem/1000/v*60))+' min';
  navBar.classList.toggle('hot',dDest<=40);
  if(dDest<=30){$('nb-ic').textContent='🎯';$('nb-txt').textContent='You\'re there (~'+Math.round(dDest)+' m) – look up and around!';return}
  if(!NAV.ok){const b=bearing(ME,NAV.dest);$('nb-ic').innerHTML='<span style="display:inline-block;transform:rotate('+(HEADING==null?b:b-HEADING)+'deg)">▲</span>';$('nb-txt').textContent='Head this way – street routing is offline';return}
  const k=NAV.steps.findIndex((s,n)=>n>0&&s.v>pr.j);
  if(k<0){$('nb-ic').textContent='🎯';$('nb-txt').textContent='Almost there – '+fmtM(dDest);return}
  const s=NAV.steps[k],dk=Math.max(0,rem-NAV.cum[s.v]);$('nb-ic').textContent=s.tx[0];
  $('nb-txt').textContent=(dk<25?'Now: ':'In '+fmtM(dk)+': ')+s.tx[1];
  if(dk<25&&NAV.lastBuzz!==k){NAV.lastBuzz=k;if(navigator.vibrate)navigator.vibrate(120)}}
function startNav(i,fromHunt){if(!i)return;if(!navigator.geolocation){toast('No GPS on this device – use 🧭 Navigate ↗ instead');return}
  if(watchId===null)gpsBtn.click();
  NAV={id:i[0],dest:[i[1],i[2]],line:null,steps:[],t:0,busy:false,follow:true,hunt:!!fromHunt,fit:true};
  selected=null;$('card').hidden=true;if(!$('hunt').hidden){$('hunt').hidden=true;$('resume').hidden=false}
  LNav.clearLayers();drawNav();updNav();wake();if(ME)navRoute();try{$('screen').scrollIntoView({behavior:'smooth',block:'end'})}catch(e){}toast('Guiding you to '+i[0]+' – drag the map to look around, ◎ to follow again')}
function stopNav(){NAV=null;LNav.clearLayers();navBar.hidden=true;navBar.classList.remove('hot');try{renderNear()}catch(e){}}
function navNextStop(){if(HUNT&&HUNT.idx<HUNT.stops.length){const n=invById(HUNT.stops[HUNT.idx]);if(n){startNav(n,true);return true}}return false}
$('nb-x').onclick=stopNav;
armConfirm($('nb-fl'),()=>{if(!NAV)return;const id=NAV.id;
  if(NAV.hunt&&HUNT&&HUNT.stops[HUNT.idx]===id){huntFlash(id);if(!navNextStop()){stopNav()}}else{flashWithUndo(id,true);stopNav()}});
$('nb-skip').onclick=()=>{if(!HUNT)return;HUNT.skipped.push(HUNT.stops[HUNT.idx]);HUNT.idx++;saveHunt();if(!navNextStop()){stopNav();renderHunt()}};
LM.on('dragstart',()=>{if(NAV)NAV.follow=false});
gpsBtn.addEventListener('click',()=>{if(NAV){NAV.follow=true;if(ME)LM.panTo(ME)}});
const _onFixNav=onFix;onFix=function(){_onFixNav();if(!NAV)return;if(!NAV.line&&!NAV.busy){navRoute().then(()=>{if(NAV&&NAV.fit&&NAV.line&&ME){NAV.fit=false;LM.fitBounds(NAV.line.concat([ME]),{padding:[60,60],maxZoom:18})}})}else updNav();
  if(NAV&&NAV.follow&&!NAV.fit)LM.panTo(ME,{animate:true})};
// card: in-app guidance + Apple Maps on iPhone/iPad
const _ceNav=cardExtras;cardExtras=function(i){_ceNav(i);const a=$('c-nav');if(!a)return;
  const g=document.createElement('button');g.className='btn g';g.id='c-guide';g.textContent='🧭 Guide me';g.title='Walking route on this map, with turn hints';g.onclick=()=>startNav(i,!!(HUNT&&HUNT.stops[HUNT.idx]===i[0]));a.before(g);
  if(IOS){const ap=document.createElement('a');ap.className='btn';ap.target='_blank';ap.rel='noopener';ap.href=`https://maps.apple.com/?daddr=${i[1]},${i[2]}&dirflg=w`;ap.textContent='Apple Maps ↗';a.after(ap)}};
// hunt mode: guide the current stop on the map
const _rhNav=renderHunt;renderHunt=function(){const r=_rhNav.apply(this,arguments);const nav=document.querySelector('#hunt .h-nav');
  if(nav&&HUNT&&HUNT.idx<HUNT.stops.length){const b=document.createElement('button');b.className='go h-nav';b.style.background='var(--cyan)';b.textContent='🧭 GUIDE ON MAP';b.onclick=()=>navNextStop();nav.before(b)}
  if(NAV&&NAV.hunt&&HUNT&&HUNT.stops[HUNT.idx]!==NAV.id&&$('hunt').hidden)navNextStop();
  if(!HUNT&&NAV&&NAV.hunt)stopNav();return r};
const _lcNav=loadCity;loadCity=function(){stopNav();return _lcNav.apply(this,arguments)};
// one tap: hunt nearby = plan from your live location with your Plan settings, start the hunt, guide to stop 1
{const hb=document.createElement('button');hb.id='huntnear';hb.textContent='🎯';hb.title='Hunt nearby: route from where you are, start guiding';hb.setAttribute('aria-label','Hunt nearby');gpsBtn.after(hb);
 hb.onclick=async()=>{if(!city)return;if(HUNT){$('resume').click();return}
  if(watchId===null)gpsBtn.click();toast('Getting your location…');const fix=await getFix();if(!fix){toast('I need your location for a hunt nearby');return}
  const [lo0,la0,lo1,la1]=city.bbox;if(fix[0]<la0-0.2||fix[0]>la1+0.2||fix[1]<lo0-0.3||fix[1]>lo1+0.3){toast('You are not in '+city.name+' – pick your city first');return}
  startSrc='gps';try{localStorage.setItem('hp_src_'+city.code,'gps')}catch(e){};start=fix.slice();hb.disabled=true;
  try{await runPlan()}catch(e){}hb.disabled=false;
  if(!route||!route.stops.length){toast('Nothing open within your Plan budget here – raise it in the Plan tab');return}
  startHunt();navNextStop();toast('Hunt started: '+HUNT.stops.length+' stops · '+route.pts+' pts')}}

/* ---- v39 · Supabase cloud sync (Netlify only) ---- */
const SB={url:'https://rngabsumhzvckouwcufd.supabase.co',key:'sb_publishable_DbpG5P-HmkvJeznh-OGOdw_TeSqkoFr',c:null,uid:null,email:'',applying:false,state:'off',last:'',ch:null,timer:null,busy:false};
const sbLS=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}};
const sbSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
function sbDirty(){return sbLS('hp_sb_dirty',{})}
function sbMark(k){const d=sbDirty();d[k]=1;sbSet('hp_sb_dirty',d);clearTimeout(SB.timer);SB.timer=setTimeout(sbFlush,800)}
/* every local write of flashed/fixes goes through localStorage – catch it there */
(function(){const _set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){
  const watch=this===window.localStorage&&!SB.applying&&typeof k==='string'&&(k.startsWith('hp_fl_')||k==='hp_fixes');let old=null;if(watch)try{old=this.getItem(k)}catch(e){}
  _set.call(this,k,v);if(!watch||old===String(v))return;try{if(!this.getItem('hp_sb_on'))return}catch(e){return}
  if(k.startsWith('hp_fl_'))sbMark('flashed/'+k.slice(6));else if(k==='hp_fixes')sbMark('fixes')}})();
function sbLoad(){if(window.supabase)return Promise.resolve(window.supabase);return new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';s.onload=()=>res(window.supabase);s.onerror=()=>rej(new Error('Could not load sync library'));document.head.appendChild(s)})}
function sbUI(){const b=$('sb-btn');if(b){const st=SB.uid?(SB.state==='sync'?'sync':SB.state==='err'?'err':'ok'):'off';b.dataset.st=st;
    b.title=SB.uid?('Sync now ('+SB.email+(st==='err'?' – last sync failed':st==='sync'?' – syncing…':' – synced')+')'):'Sign in to sync your devices';b.setAttribute('aria-label',b.title)}
  const p=$('sb-panel');if(!p||p.hidden)return;
  const msg='<div id="sb-msg" class="muted" style="min-height:1em"></div>';
  if(SB.uid)p.innerHTML=`<b>☁ Account</b><div>Signed in as <b>${escapeHtml(SB.email)}</b></div><div class="muted">Flashed, location fixes and photos sync between your devices.${SB.last?' Last sync '+escapeHtml(SB.last)+'.':''}${SB.state==='err'?' Last attempt failed.':''}</div>
   <div class="inline" style="gap:6px;flex-wrap:wrap"><button class="btn y" id="sb-now">Sync now</button><button class="btn" id="sb-out">Sign out</button></div>
   <div class="muted" style="margin-top:4px">Password (to sign in on other devices without an email link)</div>
   <div class="inline" style="gap:6px"><input id="sb-pw" type="password" autocomplete="new-password" placeholder="new password (6+ chars)" style="flex:1;min-width:0"><button class="btn" id="sb-setpw">Set</button></div>${msg}`;
  else p.innerHTML=`<b>☁ Sign in to sync</b><div class="muted">Optional – the app works without an account. Use the same login on every device.</div>
   <input id="sb-mail" type="email" autocomplete="email" placeholder="email">
   <input id="sb-pw" type="password" autocomplete="current-password" placeholder="password">
   <div class="inline" style="gap:6px;flex-wrap:wrap"><button class="btn y" id="sb-in">Sign in</button><button class="btn" id="sb-up">Create account</button></div>
   <div class="muted" style="margin-top:4px">No password yet? Get a one-time link</div>
   <div class="inline" style="gap:6px;flex-wrap:wrap"><button class="btn" id="sb-send">Email me a link</button><input id="sb-code" inputmode="numeric" placeholder="or code" style="width:90px"><button class="btn" id="sb-ver">Use code</button></div>${msg}`;
  const on=(id,f)=>{const e=$(id);if(e)e.onclick=f};const say=t=>{const m=$('sb-msg');if(m)m.textContent=t};
  const mail=()=>{const m=(($('sb-mail')&&$('sb-mail').value)||'').trim();if(m)sbSet('hp_sb_mail',m);return m};const pw=()=>($('sb-pw')&&$('sb-pw').value)||'';
  const run=async(f,ok)=>{try{const {error}=await f();say(error?('Failed: '+error.message):(ok||''))}catch(e){say('Failed: '+(e.message||e))}};
  on('sb-now',()=>sbFull(true));on('sb-out',async()=>{try{await SB.c.auth.signOut()}catch(e){}try{localStorage.removeItem('hp_sb_on');localStorage.removeItem('hp_sb_dirty');localStorage.removeItem('hp_trip')}catch(e){}try{setTrip(null)}catch(e){}});
  on('sb-setpw',()=>{if(pw().length<6){say('At least 6 characters');return}say('Saving…');run(()=>SB.c.auth.updateUser({password:pw()}),'Password set – use it to sign in on your other devices.')});
  on('sb-in',()=>{const m=mail();if(!m||!pw()){say('Enter email and password');return}say('Signing in…');run(()=>SB.c.auth.signInWithPassword({email:m,password:pw()}))});
  on('sb-up',()=>{const m=mail();if(!m||pw().length<6){say('Enter email and a password (6+ chars)');return}say('Creating…');
    run(async()=>{const r=await SB.c.auth.signUp({email:m,password:pw(),options:{emailRedirectTo:location.origin+location.pathname}});if(!r.error&&!r.data.session)say('Check your email to confirm the account, then sign in.');return r})});
  on('sb-send',()=>{const m=mail();if(!/.+@.+\..+/.test(m)){say('Enter your email');return}say('Sending…');run(()=>SB.c.auth.signInWithOtp({email:m,options:{emailRedirectTo:location.origin+location.pathname}}),'Check your email and open the link on this device.')});
  on('sb-ver',()=>{const m=mail()||sbLS('hp_sb_mail',''),t=(($('sb-code')&&$('sb-code').value)||'').trim();if(!m||!t){say('Enter email and code');return}run(()=>SB.c.auth.verifyOtp({email:m,token:t,type:'email'}))});
  const mi=$('sb-mail');if(mi&&!mi.value)mi.value=sbLS('hp_sb_mail','')||''}
function sbState(s){SB.state=s;if(s==='ok')SB.last=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});sbUI()}
async function sbUp(key,value){const {error}=await SB.c.from('kv').upsert({owner:SB.uid,key,value,updated_at:new Date().toISOString()},{onConflict:'owner,key'});if(error)throw error}
function sbLocalVal(k){if(k.startsWith('flashed/'))return {ids:sbLS('hp_fl_'+k.slice(8),[])};if(k==='fixes')return {fixes:sbLS('hp_fixes',{})};return null}
async function sbFlush(){if(!SB.uid||SB.busy)return;const d=sbDirty(),ks=Object.keys(d);if(!ks.length)return;SB.busy=true;sbState('sync');let bad=false;
  for(const k of ks){try{if(k.startsWith('photo+/'))await sbPhotoUp(k.slice(7));else if(k.startsWith('photo-/'))await sbPhotoDel(k.slice(7));else{const v=sbLocalVal(k);if(v)await sbUp(k,v)}
    const n=sbDirty();delete n[k];sbSet('hp_sb_dirty',n)}catch(e){bad=true;console.warn('sync',k,e)}}
  SB.busy=false;sbState(bad?'err':'ok');if(!bad&&Object.keys(sbDirty()).length)sbFlush()}
/* apply server values locally without pushing them back */
function sbApplyFlashed(code,ids){if(!Array.isArray(ids))return;SB.applying=true;try{localStorage.setItem('hp_fl_'+code,JSON.stringify(ids))}catch(e){}SB.applying=false;
  const s=new Set(ids);allFlashed[code]=s;if(city&&city.code===code){flashed=new Set(ids);route=null;$('result').hidden=true;try{refresh();if(selected&&!$('card').hidden)showCard(selected)}catch(e){}}else{try{renderScore()}catch(e){}}}
tripChanged=function(t){try{localStorage.setItem('hp_trip',JSON.stringify(t))}catch(e){}if(typeof SB!=='undefined'&&SB.uid)sbUp('trip',t).catch(()=>{})};
function sbApplyTrip(t){try{localStorage.setItem('hp_trip',JSON.stringify(t))}catch(e){}try{setTrip(t)}catch(e){}}
function sbApplyFixes(f){if(!f)return;const loc=sbLS('hp_fixes',{});let ch=false;Object.entries(f).forEach(([id,v])=>{if(JSON.stringify(loc[id])!==JSON.stringify(v)){loc[id]=v;ch=true}});
  if(!ch)return;SB.applying=true;try{localStorage.setItem('hp_fixes',JSON.stringify(loc))}catch(e){}SB.applying=false;applyFixes(f,true)}
async function sbPhotoGet(id,path,date){if(PHOTOS[id])return;const {data,error}=await SB.c.storage.from('photos').download(path);if(error||!data)throw error||new Error('no data');
  await pPut(id,{blob:data,date:date||''});PHOTOS[id]={code:id,url:URL.createObjectURL(data),date:date||''}}
async function sbPhotoUp(id){const all=await pAll();const v=all[id];if(!v||!v.blob)return;const path=SB.uid+'/'+id;
  const {error}=await SB.c.storage.from('photos').upload(path,v.blob,{upsert:true,contentType:v.blob.type||'image/jpeg'});if(error)throw error;await sbUp('photos/'+id,{path,date:v.date||''});const kn=new Set(sbLS('hp_sb_ph_'+SB.uid,[]));kn.add(id);sbSet('hp_sb_ph_'+SB.uid,[...kn])}
async function sbPhotoDel(id){await SB.c.storage.from('photos').remove([SB.uid+'/'+id]);const {error}=await SB.c.from('kv').delete().eq('owner',SB.uid).eq('key','photos/'+id);if(error)throw error;const kn=new Set(sbLS('hp_sb_ph_'+SB.uid,[]));kn.delete(id);sbSet('hp_sb_ph_'+SB.uid,[...kn])}
const _sbStore=storePhoto,_sbRemove=removePhoto;
storePhoto=async function(id,blob,date){const r=await _sbStore(id,blob,date);if(SB.uid){const d=sbDirty();delete d['photo-/'+id];sbSet('hp_sb_dirty',d);sbMark('photo+/'+id)}return r};
removePhoto=async function(id){const r=await _sbRemove(id);if(SB.uid){const d=sbDirty();delete d['photo+/'+id];sbSet('hp_sb_dirty',d);sbMark('photo-/'+id)}return r};
async function sbFull(loud){if(!SB.uid||SB.busy)return;SB.busy=true;sbState('sync');
  try{const {data:rows,error}=await SB.c.from('kv').select('key,value');if(error)throw error;
    const srv={};rows.forEach(r=>srv[r.key]=r.value);const first=!sbLS('hp_sb_merged_'+SB.uid,false);const dirty=sbDirty();
    const codes=new Set(Object.keys(srv).filter(k=>k.startsWith('flashed/')).map(k=>k.slice(8)));
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('hp_fl_'))codes.add(k.slice(6))}
    for(const code of codes){const k='flashed/'+code,loc=sbLS('hp_fl_'+code,null),sv=srv[k]&&srv[k].ids;
      if(!sv){if(loc&&loc.length)dirty[k]=1;continue}
      if(dirty[k])continue; /* local change waiting to go up wins */
      if(first&&loc){const u=[...new Set(loc.concat(sv))].sort();sbApplyFlashed(code,u);if(u.length!==sv.length)dirty[k]=1}
      else if(JSON.stringify(loc||[])!==JSON.stringify(sv))sbApplyFlashed(code,sv)}
    if(srv.trip&&srv.trip.city!==undefined)sbApplyTrip(srv.trip);else getData('trip.json').then(t=>{if(t&&t.city){sbApplyTrip(t);sbUp('trip',t).catch(()=>{})}}).catch(()=>{});
    const sf=(srv.fixes&&srv.fixes.fixes)||{};sbApplyFixes(sf);const lf=sbLS('hp_fixes',{});if(Object.keys(lf).some(id=>!sf[id]||JSON.stringify(sf[id])!==JSON.stringify(lf[id])))dirty.fixes=1;
    const local=await pAll();const sp=Object.keys(srv).filter(k=>k.startsWith('photos/'));let got=0;
    const known=new Set(sbLS('hp_sb_ph_'+SB.uid,[]));let gone=0;
    for(const id of Object.keys(local)){if(!(local[id]&&local[id].blob)||srv['photos/'+id]||dirty['photo-/'+id]||dirty['photo+/'+id])continue;
      if(known.has(id)){await _sbRemove(id);gone++}else dirty['photo+/'+id]=1}
    for(const k of sp){const id=k.slice(7);if(dirty['photo-/'+id]||local[id])continue;try{await sbPhotoGet(id,srv[k].path,srv[k].date);got++}catch(e){console.warn('photo',id,e)}}
    if(got||gone)try{renderGallery()}catch(e){}
    sbSet('hp_sb_ph_'+SB.uid,sp.map(k=>k.slice(7)));
    sbSet('hp_sb_dirty',dirty);sbSet('hp_sb_merged_'+SB.uid,true);SB.busy=false;sbState('ok');
    if(loud||first)toast(first?'Cloud sync on – this device is now in sync':'Synced'+(got?' · '+got+' photos downloaded':''));
    await sbFlush()}catch(e){SB.busy=false;sbState('err');console.warn('sync',e);if(loud)toast('Sync failed – check your connection')}}
function sbRT(){if(SB.ch)SB.c.removeChannel(SB.ch);SB.ch=SB.c.channel('kv-'+SB.uid).on('postgres_changes',{event:'*',schema:'public',table:'kv',filter:'owner=eq.'+SB.uid},async p=>{
  const r=p.new&&p.new.key?p.new:p.old;if(!r||!r.key)return;if(r.owner&&r.owner!==SB.uid)return;const k=r.key,dirty=sbDirty();
  if(p.eventType==='DELETE'){if(k.startsWith('photos/')){const id=k.slice(7);if(PHOTOS[id]&&!dirty['photo+/'+id]){await _sbRemove(id);try{renderGallery()}catch(e){}}}return}
  if(dirty[k])return;const v=p.new.value||{};
  if(k.startsWith('flashed/'))sbApplyFlashed(k.slice(8),v.ids);else if(k==='fixes')sbApplyFixes(v.fixes);else if(k==='trip')sbApplyTrip(v);
  else if(k.startsWith('photos/')){try{await sbPhotoGet(k.slice(7),v.path,v.date);renderGallery()}catch(e){}}
  sbState('ok')}).subscribe()}
async function sbInit(){try{const lib=await sbLoad();SB.c=lib.createClient(SB.url,SB.key,{auth:{persistSession:true,detectSessionInUrl:true,autoRefreshToken:true,flowType:'implicit'}});
  SB.c.auth.onAuthStateChange((ev,ses)=>{const u=ses&&ses.user;const was=SB.uid;SB.uid=u?u.id:null;SB.email=u?u.email||'':'';if(u)sbSet('hp_sb_on',1);
    if(SB.uid&&SB.uid!==was){sbUI();setTimeout(()=>{sbFull(false);sbRT()},0);if(/access_token|code=/.test(location.hash+location.search))history.replaceState(null,'',location.pathname)}
    if(!SB.uid&&was){if(SB.ch)SB.c.removeChannel(SB.ch);SB.ch=null;sbState('off')}sbUI()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&SB.uid)sbFull(false)});window.addEventListener('online',()=>{if(SB.uid)sbFull(false)})}
  catch(e){SB.state='err';sbUI()}}
(function sbMount(){const th=$('thbtn');if(!th)return;const CL=['...XXX.....','..XXXXX.XX.','.XXXXXXXXXX','XXXXXXXXXXX','XXXXXXXXXXX','.XXXXXXXXX.'];
  const b=document.createElement('button');b.className='btn thbtn sbbtn';b.id='sb-btn';b.setAttribute('aria-expanded','false');
  b.innerHTML='<svg class="pxi" viewBox="0 0 11 9" width="22" height="18" aria-hidden="true" shape-rendering="crispEdges" fill="currentColor">'+CL.map((r,y)=>[...r].map((c,x)=>c==='X'?`<rect x="${x}" y="${y+1}" width="1" height="1"/>`:'').join('')).join('')+'</svg><i class="sbdot"></i>';
  const cv=document.createElement('button');cv.className='btn thbtn sbcar';cv.id='sb-acct';cv.title='Account';cv.setAttribute('aria-label','Account and sign-in');cv.setAttribute('aria-expanded','false');cv.textContent='▾';
  th.parentNode.insertBefore(b,th);th.parentNode.insertBefore(cv,th);
  const p=document.createElement('div');p.id='sb-panel';p.className='thmenu sbpanel';p.hidden=true;document.body.appendChild(p);
  p.addEventListener('click',e=>e.stopPropagation());
  const tog=e=>{e.stopPropagation();p.hidden=!p.hidden;cv.setAttribute('aria-expanded',String(!p.hidden));sbUI();if(!p.hidden){const f=$('sb-mail');if(f&&!f.value)f.focus()}};
  cv.onclick=tog;b.onclick=e=>{if(!SB.uid){tog(e);return}e.stopPropagation();sbFull(true)};
  const shut=()=>{if(!p.hidden){p.hidden=true;cv.setAttribute('aria-expanded','false')}};document.addEventListener('click',shut);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')shut()});
  sbUI();sbInit()})();

/* ---- v41 · world map (Leaflet) ---- */
const WLay=L.layerGroup();let worldOn=false,wPrev=null,wFloat=null;
function wBubble(n,cls,pct,label){return L.divIcon({className:'',iconSize:[0,0],html:`<div class="wbub ${cls}"><div class="n">${n}</div><div class="p"><i style="width:${Math.round(pct*100)}%"></i></div>${label?`<div class="t">${escapeHtml(label)}</div>`:''}</div>`})}
function renderWorldMap(){if(!worldOn)return;WLay.clearLayers();const W=worldStats().filter(w=>isFinite(w.lat)&&isFinite(w.lon));const z=LM.getZoom();
  const pts=W.map(w=>({w,p:LM.latLngToLayerPoint([w.lat,w.lon])})).sort((a,b)=>(b.w.mine-a.w.mine)||(b.w.alive-a.w.alive));const used=new Set(),R=46;
  pts.forEach((a,ai)=>{if(used.has(ai))return;used.add(ai);const grp=[a];
    pts.forEach((b,bi)=>{if(!used.has(bi)&&a.p.distanceTo(b.p)<R){used.add(bi);grp.push(b)}});
    if(grp.length===1){const w=a.w;const cls=w.mine?(w.left===0&&w.alive?'mine done':'mine'):'';
      const m=L.marker([w.lat,w.lon],{icon:wBubble(w.mine&&w.left===0&&w.alive?'✓':w.left,cls,w.pct,z>=4||w.mine?w.c.code+(z>=5?' · '+cityLabel(w.c):''):''),keyboard:true,title:cityLabel(w.c)+': '+w.left+' left · '+w.fl+' flashed'});
      m.on('click',()=>goCity(w.c.code));WLay.addLayer(m)}
    else{const left=grp.reduce((s,g)=>s+g.w.left,0),alive=grp.reduce((s,g)=>s+g.w.alive,0),got=grp.reduce((s,g)=>s+g.w.got,0),anyMine=grp.some(g=>g.w.mine);
      const lat=grp.reduce((s,g)=>s+g.w.lat,0)/grp.length,lon=grp.reduce((s,g)=>s+g.w.lon,0)/grp.length;
      const m=L.marker([lat,lon],{icon:wBubble(left,'cl'+(anyMine?' mine':''),alive?got/alive:0,grp.length+' cities'),title:grp.map(g=>g.w.c.code).join(', ')});
      m.on('click',()=>{const b=L.latLngBounds(grp.map(g=>[g.w.lat,g.w.lon]));LM.fitBounds(b.pad(.4),{maxZoom:Math.max(z+2,6)})});WLay.addLayer(m)}})}
function worldLayers(on){[LInv,LRoute,LStart,LMar,LNav].forEach(g=>{try{on?LM.removeLayer(g):LM.addLayer(g)}catch(e){}})}
worldIsOn=()=>worldOn;
openWorld=function(){if(worldOn){hideWorldGrid();closeWorld(true);return}worldOn=true;$('wbtn').setAttribute('aria-pressed','true');wPrev=[LM.getCenter(),LM.getZoom()];$('card').hidden=true;worldLayers(true);LM.addLayer(WLay);
  const W=worldStats();wFloat=document.createElement('div');wFloat.className='wfloat';wFloat.innerHTML=`<b style="color:var(--yellow)">WORLD</b><span>${escapeHtml(worldSummary(W))}</span><button class="btn" id="wf-list">☰ List</button><button class="btn" id="wf-x" aria-label="Back to city">✕</button>`;
  $('screen').appendChild(wFloat);$('wf-list').onclick=()=>{$('world').hidden?showWorldGrid():hideWorldGrid()};$('wf-x').onclick=()=>closeWorld(true);
  const mine=W.filter(w=>w.mine);if(mine.length){LM.fitBounds(L.latLngBounds(mine.map(w=>[w.lat,w.lon])).pad(.25),{maxZoom:4})}else LM.setView([35,10],2);setTimeout(renderWorldMap,50)};
function closeWorld(back){if(!worldOn)return;worldOn=false;$('wbtn').setAttribute('aria-pressed','false');LM.removeLayer(WLay);worldLayers(false);if(wFloat){wFloat.remove();wFloat=null}if(back&&wPrev)LM.setView(wPrev[0],wPrev[1])}
LM.on('zoomend',()=>{if(worldOn)renderWorldMap()});
const _goCity=goCity;goCity=function(code){const same=city&&city.code===code;closeWorld(false);_goCity(code);if(same)try{fitCity()}catch(e){}};
