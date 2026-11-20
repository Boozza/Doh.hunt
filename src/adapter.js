// ================= STANDALONE (Leaflet + GPS) =================
const STANDALONE=true;
(function seed(){const S=__SEED__;for(const [code,ids] of Object.entries(S)){try{if(localStorage.getItem('hp_fl_'+code)===null)localStorage.setItem('hp_fl_'+code,JSON.stringify(ids))}catch(e){}}})();
function applyStatus(ch){const MAP={destroyed:'destroyed',degraded:'damaged',damaged:'damaged',restored:'ok',reactivated:'ok',ok:'ok'};
  const idx=new Map();DATA.cities.forEach(c=>c.inv.forEach(i=>idx.set(i[0],i)));
  Object.entries(ch||{}).forEach(([id,v])=>{const i=idx.get(id);if(!i||!v)return;const st=MAP[v.type];if(st){i[4]=st;i[5]=v.type+' on '+(v.date||'')+' (invader-spotter)'}});
  NEWS.changes=ch||{}}
applyStatus(__CHANGES__);NEWS.items=__ITEMS__;ADJ={LDN:860};
// live data files (updated daily in the repo → Netlify redeploys)
fetch('data/status.json?'+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{if(!d||!d.changes)return;applyStatus(d.changes);
  if(d.updated)$('src').textContent=DATA.source.replace(/to \d+ \w+ \d+/,'')+' · status checked '+d.updated;
  try{renderNews()}catch(e){};if(city){route=null;$('result').hidden=true;refresh()}}).catch(()=>{});
fetch('data/news.json?'+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{if(d&&Array.isArray(d.items)){NEWS.items=d.items;try{renderNews()}catch(e){}}}).catch(()=>{});
setTimeout(()=>{const n=$('adjnote');if(n){n.textContent='* London includes +860 for LDN_163–193, which have no points in the community data (calibrated to the official score of 12,120 on 19 Nov 2026).';n.hidden=false}},0);
$('map').style.display='none';
{const a=$('mc-row'),b=$('mc-list');if(a)a.remove();if(b)b.remove()}
const lmapEl=document.createElement('div');lmapEl.id='lmap';lmapEl.style.cssText='position:absolute;inset:0';$('screen').prepend(lmapEl);
const LM=L.map(lmapEl,{zoomControl:false,preferCanvas:true}).setView([51.5,-0.12],13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(LM);
const LR=L.canvas({padding:.3,tolerance:10});let LInv=L.layerGroup().addTo(LM),LRoute=L.layerGroup().addTo(LM),LStart=L.layerGroup().addTo(LM),LMe=L.layerGroup().addTo(LM);
let lastView='';
function kToZoom(k,lat){return Math.max(2,Math.min(19,Math.log2(k*360*Math.cos(lat*Math.PI/180)/256)))}
function draw(){
  if(!city)return;
  const vk=view.lat.toFixed(5)+','+view.lon.toFixed(5)+','+Math.round(view.k);
  if(vk!==lastView&&view.k>1){LM.setView([view.lat,view.lon],kToZoom(view.k,view.lat));lastView=vk}
  LInv.clearLayers();LRoute.clearLayers();LStart.clearLayers();
  const order=route?new Map(route.stops.map((s,j)=>[s[0],j+1])):null;
  for(const i of city.inv){const st=i[4],fl=flashed.has(i[0]);
    if(!visible(i))continue;
    const dead=st==='destroyed'||st==='hidden';
    const m=L.circleMarker([i[1],i[2]],{renderer:LR,radius:fl||dead?5:8,weight:selected&&selected[0]===i[0]?4:(st==='ok'?1.5:2),color:selected&&selected[0]===i[0]?'#ffd90f':(st==='ok'?'#0a0d1c':'#ffffff'),dashArray:st==='damaged'?'3 3':null,fillColor:dead?'#59607f':fl?'#6b7399':ptColor(i[3]),fillOpacity:fl||dead?.6:.95,interactive:false}).addTo(LInv);
    if(order&&order.has(i[0]))m.bindTooltip(String(order.get(i[0])),{permanent:true,direction:'right',className:'rnum',offset:[6,0]});    const rc=recentCh(i[0]);if(rc){const col=CH_COL[rc.type]||'#fff';L.circleMarker([i[1],i[2]],{renderer:LR,radius:14,weight:3,color:col,fill:false,interactive:false}).addTo(LInv);
      L.marker([i[1],i[2]],{icon:L.divIcon({className:'',html:'<div class="chb" style="background:'+col+'">'+(rc.type==='destroyed'?'✕':(rc.type==='degraded'||rc.type==='damaged')?'!':'↑')+'</div>',iconSize:[16,16],iconAnchor:[-6,22]}),interactive:false,keyboard:false}).addTo(LInv)}
  }
  if(route&&route.path.length>1){
    if(route.geo&&route.geo.length===(route.path.length-1)){route.geo.forEach((g,j)=>{const leg=route.legs&&route.legs[j];const ride=leg&&leg.m!=='walk';
      L.polyline(ride||!g?[route.path[j],route.path[j+1]]:g,ride||!g?{color:'#ff5aa8',weight:3,dashArray:'4 8',opacity:.9}:{color:'#ff5aa8',weight:5,opacity:.9}).addTo(LRoute)})}
    else L.polyline(route.path,{color:'#ff5aa8',weight:4,dashArray:'8 6'}).addTo(LRoute)}
  if(HOTEL)L.marker([HOTEL.lat,HOTEL.lon],{icon:L.divIcon({className:'',html:'<div class="flag" style="font-size:24px">🏨</div>',iconSize:[28,28],iconAnchor:[14,14]})}).bindTooltip(HOTEL.name||'Hotel').addTo(LStart);
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
  if(watchId===null){watchId=navigator.geolocation.watchPosition(p=>{ME=[p.coords.latitude,p.coords.longitude];meAcc=p.coords.accuracy;LMe.clearLayers();L.circle(ME,{radius:meAcc,color:'#2b8cff',weight:1,fillOpacity:.1}).addTo(LMe);L.circleMarker(ME,{radius:8,color:'#fff',weight:3,fillColor:'#2b8cff',fillOpacity:1}).addTo(LMe);if(!gpsOn){gpsOn=true;LM.setView(ME,16)}if(HUNT&&!$('hunt').hidden)renderHunt();updMeBtn()},e=>toast('Location blocked: '+e.message),{enableHighAccuracy:true,maximumAge:5000})}
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
const bk=document.createElement('div');bk.className='inline';bk.innerHTML='<button class="btn y" id="bkup">⬇ Backup my flashes</button><span class="note">Saves a text file you can paste back into Import on any device.</span>';$('appcount').after(bk);
$('bkup').onclick=()=>{const all=[];DATA.cities.concat([SPACE]).forEach(c=>flashedOf(c.code).forEach(id=>all.push(id)));dlBlob(new Blob([all.sort().join(', ')],{type:'text/plain'}),'my-flashed-invaders.txt');toast('Backup saved: '+all.length+' invaders')};
document.querySelectorAll('#gallery,#gal-n').forEach(e=>{const p=e.closest('.grid2>div');if(p)p.hidden=true});

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
  if(!force){try{const v=JSON.parse(localStorage.getItem(key)||'null');if(v&&Date.now()-v.t<30*864e5)return v.h}catch(e){}}
  const [lo0,la0,lo1,la1]=c.bbox,pad=.03,bb=[la0-pad,lo0-pad,la1+pad,lo1+pad].map(x=>x.toFixed(4)).join(',');
  const q=`[out:json][timeout:50];(nwr["tourism"~"^(hotel|apartment|guest_house)$"]["brand"~"${BRAND_RX}",i](${bb});nwr["tourism"="hotel"]["operator"~"Marriott",i](${bb});nwr["tourism"="hotel"]["name"~"${NAME_RX}",i](${bb}););out center tags;`;
  const j=await overpass(q);const seen=new Set(),h=[];
  for(const e of j.elements||[]){const t=e.tags||{},lat=e.lat??(e.center&&e.center.lat),lon=e.lon??(e.center&&e.center.lon);if(lat==null||!t.name||!brandMatch(t))continue;const k=t.name.toLowerCase();if(seen.has(k))continue;seen.add(k);const b=brandOf(t);
    h.push({name:t.name,lat,lon,brand:b[0],tier:b[2],addr:[t['addr:street'],t['addr:housenumber']].filter(Boolean).join(' '),web:t.website||t['contact:website']||''})}
  try{localStorage.setItem(key,JSON.stringify({t:Date.now(),h}))}catch(e){}return h}
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
