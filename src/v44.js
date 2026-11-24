/* ================= v44 · bottom navigation, cities page, thumbnails, hunt history ================= */
(function v44(){
const H=document.documentElement;
const PX={
  map:['##..##..#','#.##.#.##','#..#.#..#','#..#.#..#','#..#.#..#','#..#.#..#','##.#.##.#','..##..###'],
  cities:['.....#...','.##..#...','.##.###..','.##.###.#','###.###.#','#########','#.#.#.#.#','#########'],
  hunt:['....#....','..#####..','.#..#..#.','.#.....#.','###.#.###','.#.....#.','.#..#..#.','..#####..','....#....'],
  news:['#######..','#.....#..','#.###.###','#.....#.#','#.###.#.#','#.....#.#','#.###.#.#','########.'],
  me:['...###...','..#####..','..#####..','...###...','.........','..#####..','.#######.','#########','#########']};
const pxSvg=rows=>{const w=rows[0].length,h=rows.length;let r='';rows.forEach((s,y)=>{for(let x=0;x<w;x++)if(s[x]==='#')r+=`<rect x="${x}" y="${y}" width="1" height="1"/>`});return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true" shape-rendering="crispEdges" fill="currentColor">${r}</svg>`};
const TABS=[['map','Map'],['cities','Cities'],['hunt','Hunt'],['news','News'],['me','Me']];
const nav=document.createElement('nav');nav.className='bnav';nav.id='bnav';nav.setAttribute('aria-label','Main');
nav.innerHTML=TABS.map(([k,l])=>`<button data-n="${k}" class="${k==='hunt'?'nh':''}"><span class="ni">${pxSvg(PX[k])}</span>${l}${k==='news'?'<span class="nbdg" id="nav-nb" hidden></span>':''}</button>`).join('');
document.body.appendChild(nav);
const pg=document.createElement('div');pg.id='citiespg';pg.setAttribute('role','region');pg.setAttribute('aria-label','Cities');document.body.appendChild(pg);
// Me: sub-sections
const P=document.querySelector('.panel');
const ms=document.createElement('div');ms.className='seg';ms.id='mesub';
ms.innerHTML='<button data-t="t-score">Score</button><button data-t="t-album">Album</button><button data-t="t-mark">Mark · import</button>';
{const q=P&&P.querySelector('.mfquick');if(q)q.after(ms);else if(P)P.prepend(ms)}
ms.onclick=e=>{const b=e.target.closest('button');if(!b)return;const t=$(b.dataset.t);if(t)t.click();setSheet('full')};
const TAB2NAV={'t-plan':'hunt','t-list':'map','t-news':'news','t-score':'me','t-album':'me','t-mark':'me'};
let CUR='map';
function navMark(k){CUR=k;nav.querySelectorAll('button').forEach(b=>b.toggleAttribute('aria-current',b.dataset.n===k));nav.querySelectorAll('button[aria-current]').forEach(b=>b.setAttribute('aria-current','page'));
  ['map','cities','hunt','news','me'].forEach(n=>H.classList.toggle('nav-'+n,n===k));
  ms.querySelectorAll('button').forEach(b=>b.classList.toggle('on',$(b.dataset.t)&&$(b.dataset.t).getAttribute('aria-selected')==='true'))}
document.querySelectorAll('.tabs [role=tab]').forEach(t=>t.addEventListener('click',()=>{const k=TAB2NAV[t.id];if(k)navMark(k)}));
function closeOverlays(k){try{document.querySelectorAll('.thmenu:not([hidden])').forEach(m=>m.hidden=true);const tb=$('thbtn');if(tb)tb.setAttribute('aria-expanded','false');const sa=$('sb-acct');if(sa)sa.setAttribute('aria-expanded','false')}catch(e){}
  const sb=$('srchbox');if(sb)sb.hidden=true;
  if(k!=='map'){try{hideWorldGrid()}catch(e){}try{if(typeof closeWorld==='function')closeWorld(false)}catch(e){}if(!$('card').hidden){selected=null;$('card').hidden=true;try{draw()}catch(e){}}}}
window.closeOverlays=closeOverlays;
function navGo(k,sub){const same=k===CUR;closeOverlays(k);
  if(k==='cities'){navMark('cities');renderCities();if(same)pg.scrollTo({top:0,behavior:'smooth'});return}
  if(k==='map'){$('t-list').click();navMark('map');setSheet('peek');if(same){try{fitCity()}catch(e){}}return}
  if(k==='hunt'){$('t-plan').click();navMark('hunt');setSheet(same&&MF.st==='half'?'full':'half');return}
  if(k==='news'){$('t-news').click();navMark('news');setSheet('full');if(same)$('p-news').scrollTo({top:0,behavior:'smooth'});return}
  if(k==='me'){const cur=['t-score','t-album','t-mark'].find(id=>$(id).getAttribute('aria-selected')==='true');const t=$(sub||cur||'t-score');t.click();navMark('me');setSheet('full');renderRecent();if(same&&!sub){const b=document.querySelector('.panel .tabbody:not([hidden])');if(b)b.scrollTo({top:0,behavior:'smooth'})}}}
window.navGo=navGo;
nav.onclick=e=>{const b=e.target.closest('button');if(b)navGo(b.dataset.n)};
// nav height → sheet sizes
function navH(){if(!MF.on)return 0;const r=nav.getBoundingClientRect();return r.height?Math.round(innerHeight-r.top+6):0}
const _set=window.setSheet;
window.setSheet=function(st){_set(st);if(!MF.on||innerWidth>=900)return;const nh=navH();H.style.setProperty('--nav-h',nh+'px');
  const hd=$('mf-handle'),q=P.querySelector('.mfquick');const peek=Math.round((hd?hd.offsetHeight:0)+(q&&getComputedStyle(q).display!=='none'?q.offsetHeight:0)+(H.classList.contains('nav-me')?ms.offsetHeight+6:0)+nh+4);
  let v=parseFloat(getComputedStyle(H).getPropertyValue('--sheet-h'))||0;
  if(st==='peek')v=peek;else if(st==='half')v=Math.max(v,peek+180);
  H.style.setProperty('--sheet-h',v+'px')};
// hunt mode: hide the sheet and the world while hunting, back to peek when it is minimised or closed
{const hu=$('hunt');let was=!hu.hidden;new MutationObserver(()=>{const on=!hu.hidden;if(on===was)return;was=on;if(on){closeOverlays('hunt')}else{try{setSheet('peek')}catch(e){}}}).observe(hu,{attributes:true,attributeFilter:['hidden']})}
// a hunt in progress: START resumes it instead of starting over
const huntOn=()=>typeof HUNT!=='undefined'&&HUNT&&city&&HUNT.city===city.code&&HUNT.idx<HUNT.stops.length;
{const g=$('mf-go'),_o=g.onclick;g.onclick=e=>{if(huntOn()&&$('hunt').hidden){$('resume').click();return}_o&&_o(e)}}
const _gl=mfGoLabel;mfGoLabel=function(){_gl();const g=$('mf-go');if(g&&huntOn())g.textContent='RESUME ▶'};
{const r=$('result');if(r)r.addEventListener('click',e=>{if(e.target.closest('#huntgo')&&huntOn()){e.stopImmediatePropagation();e.preventDefault();$('resume').click()}},true)}
{const hu=$('hunt');new MutationObserver(()=>{try{mfGoLabel()}catch(e){}}).observe(hu,{attributes:true,attributeFilter:['hidden']})}
// score pill → Me
{const p=$('mf-pill');if(p)p.onclick=()=>navGo('me','t-score')}
// news badge mirror
{const src=$('nbadge'),dst=$('nav-nb');const mir=()=>{dst.textContent=src.textContent;dst.hidden=src.hidden||!+src.textContent||CUR==='news'};new MutationObserver(mir).observe(src,{attributes:true,childList:true,characterData:true,subtree:true});mir()}
// keyboard open → hide nav
if(window.visualViewport)visualViewport.addEventListener('resize',()=>H.classList.toggle('kb',visualViewport.height<innerHeight*0.72));

// ---------- thumbnails (invader-spotter close-ups)
// The Claude version runs in a sandbox that blocks pictures and data from other sites: no external images there.
const EXT=!/Claude\)/.test((document.querySelector('footer')||{}).textContent||'');
function refUrl(id){if(!EXT)return '';const u=spotUrl(id);return /grosplan/.test(u)?u:''}
window.refUrl=refUrl;
function thumbFor(id,cls){const p=(typeof PHOTOS!=='undefined')&&PHOTOS[id];const u=p?blobUrl(p):refUrl(id);return u?`<img class="${cls||'ithumb'}" src="${u}" alt="" data-id="${id}" loading="lazy" referrerpolicy="no-referrer" onerror="thErr(this)">`:''}
window.thErr=el=>{if(el.classList.contains('ithumb')){el.remove();return}const s=document.createElement('span');s.className='more';s.textContent=String(el.dataset.id||'').split('_')[1]||'?';s.style.fontSize='13px';el.replaceWith(s)};
const IDRE=/\b([A-Z]{2,5}_\d{1,4})\b/;
function decorate(ul){if(!ul)return;ul.querySelectorAll(':scope>li').forEach(li=>{if(li.querySelector('.ithumb')||li._th)return;li._th=1;
  let id=li.dataset.id||(li.querySelector('[data-fl]')||{dataset:{}}).dataset.fl;if(!id){const m=IDRE.exec(li.textContent||'');id=m&&m[1]}
  if(!id||!INVBY.has(id))return;const t=thumbFor(id,'ithumb');if(!t)return;const box=li.children.length>1?li.children[1]:li;box.insertAdjacentHTML('afterbegin',t)})}
function watch(id){const el=$(id);if(!el)return;const run=()=>{if(el.tagName==='UL'||el.tagName==='OL')decorate(el);else el.querySelectorAll('ul,ol').forEach(decorate)};new MutationObserver(run).observe(el,{childList:true,subtree:true});run()}
['targets','result','srchres','newslist'].forEach(watch);
// card: close-up next to the title
const _showCard=showCard;
showCard=function(i){_showCard(i);try{const c=$('card'),u=refUrl(i[0]);if(!u||c.querySelector('.cref'))return;const d=document.createElement('div');d.className='cref';
  d.innerHTML=`<img src="${u}" alt="Close-up of ${i[0]}" loading="lazy" referrerpolicy="no-referrer" title="Tap to enlarge"><span class="src">close-up: invader-spotter</span>`;
  const im=d.querySelector('img');im.onerror=()=>d.remove();im.onclick=()=>im.classList.toggle('big');const h=c.querySelector('h3');(h||c.firstChild).after(d)}catch(e){}};

// album: flashed slots without my own photo show the close-up (marked, so own photos stay distinguishable)
const _ra=renderAlbum;
renderAlbum=function(){_ra();if(!EXT)return;try{$('alb-grid').querySelectorAll('button[data-id]').forEach(b=>{const sl=b.querySelector('.alb-slot.got');if(!sl||sl.querySelector('img'))return;const u=refUrl(b.dataset.id);if(!u)return;
  const im=document.createElement('img');im.className='ref';im.loading='lazy';im.referrerPolicy='no-referrer';im.alt='Close-up of '+b.dataset.id;im.onerror=()=>{im.remove();sl.classList.remove('hasref')};im.src=u;sl.classList.add('hasref');sl.prepend(im)})}catch(e){}};
// ---------- relative dates on news
function relDay(d){if(!d)return '';const t=Date.parse(d);if(!t)return d.slice(5);const n=Math.floor((Date.now()-t)/864e5);if(n<=0)return 'today';if(n===1)return 'yesterday';if(n<7)return n+' days ago';return new Date(t).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
const _rn=renderNews;
renderNews=function(){_rn();try{const ul=$('newslist');ul.classList.add('ncards');ul.querySelectorAll(':scope>li').forEach((li,k)=>{const r=NEWSROWS[k];const d=li.querySelector('.d');if(r&&d&&r.date){d.textContent=relDay(r.date);d.title=r.date}})}catch(e){}};

// ---------- hunt history (private: this device + your own sync, never the public repos)
let HIST=null;try{HIST=JSON.parse(localStorage.getItem('hp_hist')||'null')}catch(e){}
window.getHist=()=>HIST;
window.setHist=function(h){HIST=h&&h.cities?h:null;try{if(HIST)localStorage.setItem('hp_hist',JSON.stringify(HIST));else localStorage.removeItem('hp_hist')}catch(e){};try{renderRecent();if(CUR==='cities')renderCities()}catch(e){}};
window.histChanged=function(h){if(typeof db!=='undefined'&&db&&canWrite)db.doc('meta/history').set(h).catch(()=>{})};
let histDb=false;const hiT=setInterval(()=>{if(histDb)return clearInterval(hiT);if(typeof db!=='undefined'&&db){histDb=true;db.doc('meta/history').onSnapshot(s=>{const v=s.exists?s.data():null;if(v&&v.cities)setHist(v)},()=>{})}},2000);
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtRange(a,b){const A=a.split('-').map(Number),B=(b||a).split('-').map(Number);if(a===b||!b)return `${A[2]} ${MON[A[1]-1]} ${A[0]}`;
  if(A[0]===B[0]&&A[1]===B[1])return `${A[2]}–${B[2]} ${MON[A[1]-1]} ${A[0]}`;if(A[0]===B[0])return `${A[2]} ${MON[A[1]-1]} – ${B[2]} ${MON[B[1]-1]} ${A[0]}`;return `${A[2]} ${MON[A[1]-1]} ${A[0]} – ${B[2]} ${MON[B[1]-1]} ${B[0]}`}
const ptsOf=ids=>ids.reduce((s,id)=>{const h=INVBY.get(id);return s+(h?h[1][3]||0:0)},0);
function strip(ids,max){max=max||4;const show=ids.slice(0,max);return `<div class="tstrip">${show.map(id=>thumbFor(id,'')||'').join('')}${ids.length>max?`<span class="more">+${ids.length-max}</span>`:''}</div>`}
function allVisits(){if(!HIST)return [];const out=[];Object.entries(HIST.cities).forEach(([code,v])=>(v.visits||[]).forEach(x=>out.push(Object.assign({code},x))));return out.sort((a,b)=>b.from.localeCompare(a.from))}
function cityName(code){const c=CITYBY.get(code);return c?(c.name&&c.name!==c.code?c.name:c.code):code}
// Me → "My recent flashes"
const rb=document.createElement('div');rb.id='recentbox';
{const sc=$('p-score');if(sc)sc.prepend(rb)}
function renderRecent(){const V=allVisits();
  rb.innerHTML=`<div class="rh"><span class="lbl">MY RECENT FLASHES</span><label class="btn" style="cursor:pointer">📥 History file<input type="file" id="hist-in" accept=".json,application/json" hidden></label></div>`+
  (V.length?V.slice(0,8).map((v,k)=>`<div class="rv" data-k="${k}"><div class="t"><span><b>${escapeHtml(cityName(v.code))}</b> · ${fmtRange(v.from,v.to)}</span><span>${v.ids.length} flashed · ${ptsOf(v.ids).toLocaleString()} pts</span></div>${strip(v.ids,5)}</div>`).join('')
   :'<p class="note" style="margin:0">Load your hunt history file (made from your photo library) to see each visit with its real dates.</p>');
  rb.querySelectorAll('.rv').forEach(el=>el.onclick=()=>{const v=V[+el.dataset.k];if(!v)return;if(!city||city.code!==v.code){goCity(v.code)}navGo('me','t-album')});
  const fi=$('hist-in');if(fi)fi.onchange=async()=>{const f=fi.files[0];if(!f)return;try{const j=JSON.parse(await f.text());if(!j||!j.cities)throw 0;setHist(j);histChanged(j);toast('Hunt history loaded: '+allVisits().length+' visits')}catch(e){toast('That file is not a hunt history file')}fi.value=''}}
renderRecent();

// ---------- cities page
let FAV=new Set();try{FAV=new Set(JSON.parse(localStorage.getItem('hp_fav')||'[]'))}catch(e){}
let CF='all';try{CF=localStorage.getItem('hp_cf')||'all'}catch(e){}
let CQ='',CMORE=false;
function ownPhoto(code){if(typeof PHOTOS==='undefined')return null;let best=null;for(const [id,p] of Object.entries(PHOTOS)){if(id.split('_')[0]!==code)continue;if(!best||(p.date||'')>(best.date||''))best=p}return best?blobUrl(best):null}
function hue(s){let h=0;for(const ch of s)h=(h*31+ch.charCodeAt(0))%360;return h}
function cityScore(w){const r=cityRow(w.c.code);return r?r.pts+(r.n?100:0):0}
function spaceStat(){const f=flashedOf('SPACE');const up=SPACE.inv.filter(i=>i[4]==='ok');const got=up.filter(i=>f.has(i[0])).length;return {c:SPACE,alive:up.length,left:up.length-got,pl:up.filter(i=>!f.has(i[0])).reduce((a,i)=>a+i[3],0),got,fl:f.size,pct:up.length?got/up.length:0,mine:f.size>0,space:true}}
// representative city photo: Wikipedia lead image (free licences, credited on the card); own photo / colour as fallback
// City photo candidates, best first: Wikidata "image" (P18, one curated photo) → Wikivoyage banner (P948) → Wikipedia lead image → Openverse (CC search) → my own photo.
// 🖼 on a card cycles through them; the choice is remembered per city.
let CIMG={};try{CIMG=JSON.parse(localStorage.getItem('hp_cimg3')||'{}')}catch(e){}
let CPICK={};try{CPICK=JSON.parse(localStorage.getItem('hp_cpick')||'{}')}catch(e){}
const CIST={ok:0,fail:0,why:''};
const WTITLE={'New York':'New York City','Redu':'Redu, Belgium','Contis':'Contis-Plage','Grude':'Grude','Luberon':'Luberon','Newcastle':'Newcastle upon Tyne','Bhutan':'Thimphu','Pau':'Pau, Pyrénées-Atlantiques','Faro':'Faro, Portugal','Anzere':'Anzère','Perth':'Perth'};
const cimgSave=()=>{try{localStorage.setItem('hp_cimg3',JSON.stringify(CIMG))}catch(e){}};
const fileUrl=(f,w)=>'https://commons.wikimedia.org/wiki/Special:FilePath/'+encodeURIComponent(f.replace(/ /g,'_'))+'?width='+w;
const fileTo=f=>({u:fileUrl(f,960),alt:fileUrl(f,1280),l:'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(f.replace(/ /g,'_')),by:'Wikimedia Commons'});
async function claims(q,prop){const r=await fetch(`https://www.wikidata.org/w/api.php?action=wbgetclaims&entity=${q}&property=${prop}&format=json&origin=*`);if(!r.ok)return [];const j=await r.json();
  return ((j.claims||{})[prop]||[]).filter(c=>c.rank!=='deprecated').sort((a,b)=>(b.rank==='preferred')-(a.rank==='preferred')).map(c=>c.mainsnak&&c.mainsnak.datavalue&&c.mainsnak.datavalue.value).filter(v=>typeof v==='string'&&!/\.svg$/i.test(v))}
async function cityCands(name){if(CIMG[name])return CIMG[name];let err='',ok=false;
  const wiki=(async()=>{const out=[];try{const r=await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/'+encodeURIComponent((WTITLE[name]||name).replace(/ /g,'_')));
    if(!r.ok)return out;ok=true;const j=await r.json();if(j.type==='disambiguation')return out;const q=j.wikibase_item;
    const [p18,p948]=q?await Promise.all([claims(q,'P18').catch(()=>[]),claims(q,'P948').catch(()=>[])]):[[],[]];
    p18.slice(0,2).forEach(f=>out.push(fileTo(f)));p948.slice(0,1).forEach(f=>out.push(Object.assign(fileTo(f),{by:'Wikivoyage'})));
    const t=j.thumbnail&&j.thumbnail.source,o=j.originalimage;if(t&&!/\.svg/i.test(t))out.push({u:o&&o.width&&o.width<=960?o.source:t.replace(/\/\d+px-/,'/960px-'),alt:t,l:(j.content_urls&&j.content_urls.desktop&&j.content_urls.desktop.page)||'',by:'Wikipedia'})}catch(e){err=String(e.message||e)}return out})();
  const ov=(async()=>{const out=[];try{const r=await fetch('https://api.openverse.org/v1/images/?q='+encodeURIComponent(name+' city skyline')+'&page_size=6&aspect_ratio=wide&mature=false');if(r.ok){ok=true;const j=await r.json();
    (j.results||[]).filter(z=>z.url&&!/\.svg/i.test(z.url)).slice(0,3).forEach(x=>out.push({u:x.thumbnail||x.url,alt:x.url,l:x.foreign_landing_url||'',by:(x.creator?x.creator+' · ':'')+(x.license?'CC '+String(x.license).toUpperCase():'Openverse')}))}}catch(e){err=String(e.message||e)}return out})();
  const [a,b]=await Promise.all([wiki,ov]);const seen=new Set();const L=a.concat(b).filter(x=>!seen.has(x.u)&&seen.add(x.u));
  if(!ok){CIST.why=err||'offline';return null}CIMG[name]=L;cimgSave();return L}
function loadImg(u){return new Promise((res,rej)=>{if(!u)return rej();const im=new Image();im.referrerPolicy='no-referrer';im.onload=()=>res(u);im.onerror=rej;im.src=u})}
// ---------- v48 · flag banners for city cards (pixel style, faded) – drawn in the app, so they work offline and in the Claude version
const CTRY={BTA:'FR',CAZ:'FR',CLR:'FR',CON:'FR',FTBL:'FR',LBR:'FR',LCT:'FR',NA:'FR',RN:'FR',VLMO:'FR',LND:'GB',NOO:'NL',RDU:'BE',GRU:'BA',HALM:'SE',VSB:'SE',POTI:'BO',SL:'KR',LDN:'GB',MAN:'GB',NCL:'GB',PA:'FR',AMI:'FR',AIX:'FR',AVI:'FR',BAB:'FR',CAPF:'FR',CHAR:'BE',DIJ:'FR',FRQ:'FR',GRN:'FR',LIL:'FR',LY:'FR',MARS:'FR',MTB:'FR',MPL:'FR',NIM:'FR',ORLN:'FR',PRP:'FR',PAU:'FR',TLS:'FR',VRS:'FR',REUN:'FR',
  WN:'AT',NY:'US',LA:'US',SD:'US',MIA:'US',ROM:'IT',RA:'IT',HK:'HK',TK:'JP',BGK:'TH',ELT:'IL',ANVR:'BE',BXL:'BE',AMS:'NL',RTD:'NL',ANZR:'CH',BSL:'CH',BRN:'CH',GNV:'CH',LSN:'CH',BRC:'ES',BBO:'ES',MLGA:'ES',MEN:'ES',
  BRL:'DE',KLN:'DE',FKF:'DE',MUN:'DE',BT:'BT',CCU:'MX',DJN:'KR',DJBA:'TN',DHK:'BD',IST:'TR',KAT:'NP',FAO:'PT',LJU:'SI',MRAK:'MA',RBA:'MA',MLB:'AU',PRT:'AU',MBSA:'KE',SP:'BR',VRN:'IN'};
const tri=(a,b,c,v)=>v?`<svg viewBox="0 0 3 2"><rect width="1" height="2" fill="${a}"/><rect x="1" width="1" height="2" fill="${b}"/><rect x="2" width="1" height="2" fill="${c}"/></svg>`:`<svg viewBox="0 0 3 3" preserveAspectRatio="none"><rect width="3" height="1" fill="${a}"/><rect y="1" width="3" height="1" fill="${b}"/><rect y="2" width="3" height="1" fill="${c}"/></svg>`;
const UJ=`<clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#t)" stroke="#C8102E" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/>`;
const star=(cx,cy,r,f)=>{let d='';for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,q=k%2?r*.4:r;d+=(k?'L':'M')+(cx+q*Math.cos(a)).toFixed(2)+','+(cy+q*Math.sin(a)).toFixed(2)}return `<path d="${d}Z" fill="${f}"/>`};
const FLAG={SE:`<svg viewBox="0 0 16 10"><rect width="16" height="10" fill="#006AA7"/><rect x="5" width="2" height="10" fill="#FECC00"/><rect y="4" width="16" height="2" fill="#FECC00"/></svg>`,
  BO:tri('#D52B1E','#F9E300','#007934'),
  BA:`<svg viewBox="0 0 30 15"><rect width="30" height="15" fill="#002395"/><path d="M8,0 H23 V15Z" fill="#FECB00"/>${[0,1,2,3,4,5,6].map(k=>star(6.5+k*2.2,1+k*2.15,.9,'#fff')).join('')}</svg>`,
  KR:`<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="5" fill="#0047A0"/><path d="M10,10 a5,5 0 0,1 10,0 a2.5,2.5 0 0,1 -5,0 a2.5,2.5 0 0,0 -5,0Z" fill="#CD2E3A"/>${[[5.5,4.5],[24.5,4.5],[5.5,15.5],[24.5,15.5]].map(([x,y])=>`<rect x="${x-2}" y="${y-1.6}" width="4" height="3.2" fill="#000" transform="rotate(${(x<15)===(y<10)?-34:34} ${x} ${y})"/>`).join('')}</svg>`,
  GB:`<svg viewBox="0 0 60 30">${UJ}</svg>`,FR:tri('#0055A4','#fff','#EF4135',1),IT:tri('#009246','#fff','#CE2B37',1),BE:tri('#000','#FDDA24','#EF3340',1),MX:`<svg viewBox="0 0 3 2"><rect width="1" height="2" fill="#006847"/><rect x="1" width="1" height="2" fill="#fff"/><rect x="2" width="1" height="2" fill="#CE1126"/><circle cx="1.5" cy="1" r=".28" fill="#8C6A2F"/></svg>`,
  AT:tri('#C8102E','#fff','#C8102E'),NL:tri('#AE1C28','#fff','#21468B'),DE:tri('#000','#DD0000','#FFCE00'),
  TH:`<svg viewBox="0 0 9 6"><rect width="9" height="6" fill="#A51931"/><rect y="1" width="9" height="4" fill="#F4F5F8"/><rect y="2" width="9" height="2" fill="#2D2A4A"/></svg>`,
  JP:`<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><circle cx="15" cy="10" r="6" fill="#BC002D"/></svg>`,
  BD:`<svg viewBox="0 0 10 6"><rect width="10" height="6" fill="#006A4E"/><circle cx="4.5" cy="3" r="2" fill="#F42A41"/></svg>`,
  US:`<svg viewBox="0 0 19 10"><rect width="19" height="10" fill="#B22234"/>${[1,3,5,7,9,11].map(k=>`<rect y="${k*10/13}" width="19" height="${10/13}" fill="#fff"/>`).join('')}<rect width="7.6" height="${70/13}" fill="#3C3B6E"/></svg>`,
  CH:`<svg viewBox="0 0 32 32"><rect width="32" height="32" fill="#DA291C"/><rect x="13" y="6" width="6" height="20" fill="#fff"/><rect x="6" y="13" width="20" height="6" fill="#fff"/></svg>`,
  ES:`<svg viewBox="0 0 3 2"><rect width="3" height="2" fill="#AA151B"/><rect y=".5" width="3" height="1" fill="#F1BF00"/></svg>`,
  IL:`<svg viewBox="0 0 22 16"><rect width="22" height="16" fill="#fff"/><rect y="1.5" width="22" height="2.5" fill="#0038B8"/><rect y="12" width="22" height="2.5" fill="#0038B8"/><path d="M11,4.6 L14.3,10.3 H7.7Z M11,11.4 L7.7,5.7 H14.3Z" fill="none" stroke="#0038B8" stroke-width=".8"/></svg>`,
  HK:`<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#DE2910"/>${[0,1,2,3,4].map(k=>`<ellipse cx="15" cy="6.6" rx="1.9" ry="3.4" fill="#fff" transform="rotate(${k*72} 15 10)"/>`).join('')}</svg>`,
  TR:`<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#E30A17"/><circle cx="11" cy="10" r="5" fill="#fff"/><circle cx="12.3" cy="10" r="4" fill="#E30A17"/>${star(17.5,10,2.2,'#fff')}</svg>`,
  TN:`<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#E70013"/><circle cx="15" cy="10" r="5" fill="#fff"/><circle cx="15" cy="10" r="3.7" fill="#E70013"/><circle cx="15.9" cy="10" r="3" fill="#fff"/>${star(16.1,10,2,'#E70013')}</svg>`,
  MA:`<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#C1272D"/><path d="M15,5.5 L17.6,13.6 L10.8,8.6 H19.2 L12.4,13.6Z" fill="none" stroke="#006233" stroke-width=".9"/></svg>`,
  PT:`<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#FF0000"/><rect width="12" height="20" fill="#006600"/><circle cx="12" cy="10" r="3.6" fill="#FFE900"/><circle cx="12" cy="10" r="2.2" fill="#FF0000"/></svg>`,
  SI:`<svg viewBox="0 0 3 3" preserveAspectRatio="none"><rect width="3" height="1" fill="#fff"/><rect y="1" width="3" height="1" fill="#0000FF"/><rect y="2" width="3" height="1" fill="#FF0000"/><path d="M.55,.6 h.6 v.75 q-.3,.25 -.6,0Z" fill="#0000FF" stroke="#FF0000" stroke-width=".05"/></svg>`,
  AU:`<svg viewBox="0 0 60 30"><rect width="60" height="30" fill="#012169"/><svg width="30" height="15" viewBox="0 0 60 30">${UJ}</svg>${star(15,23,3.4,'#fff')}${star(45,8,1.8,'#fff')}${star(52,13,1.8,'#fff')}${star(45,25,1.8,'#fff')}${star(39,14,1.8,'#fff')}</svg>`,
  KE:`<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><rect width="30" height="5.4" fill="#000"/><rect y="7" width="30" height="6" fill="#BB0000"/><rect y="14.6" width="30" height="5.4" fill="#006600"/><ellipse cx="15" cy="10" rx="2.6" ry="5" fill="#BB0000" stroke="#000" stroke-width=".6"/></svg>`,
  BR:`<svg viewBox="0 0 30 21"><rect width="30" height="21" fill="#009C3B"/><path d="M15,2 L28,10.5 L15,19 L2,10.5Z" fill="#FFDF00"/><circle cx="15" cy="10.5" r="4.6" fill="#002776"/></svg>`,
  IN:`<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#fff"/><rect width="30" height="6.67" fill="#FF9933"/><rect y="13.33" width="30" height="6.67" fill="#138808"/><circle cx="15" cy="10" r="2.6" fill="none" stroke="#000080" stroke-width=".6"/></svg>`,
  NP:`<svg viewBox="0 0 30 20"><rect width="30" height="20" fill="#14182f"/><path d="M9,1 L21,9 H12 L21,19 H9Z" fill="#DC143C" stroke="#003893" stroke-width="1"/><circle cx="12" cy="13.5" r="1.6" fill="#fff"/></svg>`,
  BT:`<svg viewBox="0 0 30 20"><path d="M0,0 H30 L0,20Z" fill="#FFD520"/><path d="M30,0 V20 H0Z" fill="#FF4E12"/><ellipse cx="15" cy="10" rx="6" ry="2" fill="#fff" transform="rotate(-33 15 10)"/></svg>`};
const FLAGPX={};
function flagPx(cc){if(cc in FLAGPX)return Promise.resolve(FLAGPX[cc]);const svg=FLAG[cc];if(!svg)return Promise.resolve(null);
  return new Promise(res=>{const im=new Image();im.onload=()=>{try{const cv=document.createElement('canvas');cv.width=36;cv.height=18;const x=cv.getContext('2d');x.drawImage(im,0,0,36,18);FLAGPX[cc]=cv.toDataURL('image/png')}catch(e){FLAGPX[cc]=null}res(FLAGPX[cc])};im.onerror=()=>{FLAGPX[cc]=null;res(null)};
    im.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg.replace(/ preserveAspectRatio="[^"]*"/,'').replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" width="360" height="180" '))})}
let CBG='photo';try{CBG=localStorage.getItem('hp_cbg')||(EXT?'photo':'flag')}catch(e){CBG=EXT?'photo':'flag'}
function flagBg(el){const cc=CTRY[el.dataset.c];if(!cc)return;flagPx(cc).then(u=>{if(!u||CBG!=='flag')return;el.classList.add('fbg');
  el.style.setProperty('--cbg',`repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 2px,transparent 2px 4px),linear-gradient(rgba(18,23,54,.45),rgba(18,23,54,.45)),url('${u}') center/cover`)})}

let CIO=null;
async function wikiBg(el,step){if(!EXT)return;const code=el.dataset.c,c=CITYBY.get(code);if(!c||!c.name||c.name===c.code)return;
  const L=(await cityCands(c.name))||[];const own=ownPhoto(code);const all=L.concat(own?[{u:own,by:'my photo',own:true}]:[]);
  if(!all.length){CIST.fail++;return}
  let k=(CPICK[code]||0)%all.length;if(step){k=(k+1)%all.length}
  for(let n=0;n<all.length;n++){const v=all[(k+n)%all.length];let u=null;try{u=await loadImg(v.u)}catch(e){try{u=await loadImg(v.alt)}catch(e2){}}
    if(!u)continue;k=(k+n)%all.length;if(step||CPICK[code]){CPICK[code]=k;try{localStorage.setItem('hp_cpick',JSON.stringify(CPICK))}catch(e){}}CIST.ok++;
    el.style.setProperty('--cbg',`url('${u}')`);let a=el.querySelector('.cc-cred');if(!a){el.insertAdjacentHTML('beforeend','<a class="cc-cred" target="_blank" rel="noopener"></a>');a=el.querySelector('.cc-cred');a.onclick=e=>e.stopPropagation()}
    a.textContent='📷 '+(v.by||'')+(all.length>1?` · ${k+1}/${all.length}`:'');if(v.l)a.href=v.l;else a.removeAttribute('href');return}
  CIST.fail++;CIST.why='image blocked'}
function renderCities(){const W=worldStats().concat([spaceStat()]);const all=DATA.cities.concat([SPACE]);
  const tot=DATA.cities.reduce((s,c)=>s+c.inv.length,0);const fl=all.reduce((s,c)=>s+flashedOf(c.code).size,0);const pct=tot?fl/tot:0;
  const mine=W.filter(w=>w.mine),done=mine.filter(w=>w.alive&&w.left===0);const pts=W.reduce((s,w)=>s+cityScore(w),0);
  const alive=W.reduce((s,w)=>s+w.got,0);
  let L=W.slice();if(CF==='mine')L=L.filter(w=>w.mine);else if(CF==='done')L=L.filter(w=>w.mine&&w.alive&&w.left===0);else if(CF==='fav')L=L.filter(w=>FAV.has(w.c.code));else if(CF==='new')L=L.filter(w=>!w.mine);
  if(CQ){const q=CQ.toLowerCase();L=L.filter(w=>w.c.code.toLowerCase().includes(q)||String(w.c.name||'').toLowerCase().includes(q))}
  L.sort((a,b)=>(FAV.has(b.c.code)-FAV.has(a.c.code))||(b.mine-a.mine)||(b.fl-a.fl)||(b.pl-a.pl));
  const card=w=>{const c=w.c,h=HIST&&HIST.cities[c.code],bg=ownPhoto(c.code),hu=hue(c.code);
    if(w.space)return `<div class="ccard space" data-c="SPACE" role="group" aria-label="Space">
      <div class="cc-top"><span class="cc-code">SPACE</span><button class="cc-star${FAV.has('SPACE')?' on':''}" data-fav="SPACE" aria-label="Favourite" aria-pressed="${FAV.has('SPACE')}">${FAV.has('SPACE')?'★':'☆'}</button></div>
      <div class="cc-name">Space <small>(ISS)</small></div>${w.left?`<button class="cc-mark" id="cc-space">✓ Mark SPACE_02 flashed</button>`:'<span class="cc-pill done">✓ complete</span>'}
      <div class="cc-stats"><span>📷 <b>${w.fl}</b> flashed</span><span>🎯 <b>${w.alive}</b> active</span>${w.mine?`<span>⭐ <b>${cityScore(w).toLocaleString()}</b> pts</span>`:''}</div>
      <div class="cc-bar"><i style="width:${Math.round(w.pct*100)}%"></i></div></div>`;
    const style=bg?`--cbg:url('${bg}')`:`--cbg:linear-gradient(135deg,hsl(${hu} 55% 32%),hsl(${(hu+60)%360} 60% 18%))`;
    const pill=!w.alive?'<span class="cc-pill">none active</span>':w.mine&&w.left===0?'<span class="cc-pill done">✓ complete</span>':`<span class="cc-pill">${w.left} left to flash · ${w.pl.toLocaleString()} pts</span>`;
    const vs=h?(h.visits||[]):[];const un=h?(h.unknown||[]):[];
    const hist=vs.length?`<details class="cc-hist"><summary>🕓 ${vs.length} visit${vs.length>1?'s':''} · ${vs.map(v=>MON[+v.from.slice(5,7)-1]+' '+v.from.slice(0,4)).join(' → ')}</summary><ol>${vs.slice().reverse().map(v=>`<li><div class="vh"><b>${fmtRange(v.from,v.to)}</b><span>${v.ids.length} · ${ptsOf(v.ids).toLocaleString()} pts</span></div>${strip(v.ids,5)}</li>`).join('')}${un.length?`<li><div class="vh"><b>Date unknown</b><span>${un.length} · ${ptsOf(un).toLocaleString()} pts</span></div>${strip(un,5)}<details class="unfix"><summary>✎ Set the visit for each one</summary>${un.map(id=>`<div class="unrow"><span>${id}</span><select data-ufix="${id}" data-c="${c.code}" aria-label="Visit for ${id}"><option value="-1">date unknown</option>${vs.map((v,k)=>`<option value="${k}">${fmtRange(v.from,v.to)}</option>`).join('')}</select></div>`).join('')}</details></li>`:''}</ol></details>`:'';
    return `<div class="ccard" data-c="${c.code}" style="${style}" role="button" tabindex="0" aria-label="Open ${escapeHtml(cityName(c.code))} on the map">
      <div class="cc-top"><button class="cc-code" data-pic="${c.code}" aria-label="${c.code} – tap for another photo" title="Tap for another photo">${c.code}</button><span class="cc-acts"><button class="cc-star${FAV.has(c.code)?' on':''}" data-fav="${c.code}" aria-label="Favourite" aria-pressed="${FAV.has(c.code)}">${FAV.has(c.code)?'★':'☆'}</button></span></div>
      <div class="cc-name">${escapeHtml(cityName(c.code))} ${c.name&&c.name!==c.code?`<small>(${c.code})</small>`:''}</div>${pill}
      <div class="cc-stats"><span>📷 <b>${w.fl}</b> flashed</span><span>🎯 <b>${w.alive}</b> active</span>${w.mine?`<span>⭐ <b>${cityScore(w).toLocaleString()}</b> pts</span>`:''}</div>
      <div class="cc-bar"><i style="width:${Math.round(w.pct*100)}%"></i></div>${hist}</div>`};
  const chips=[['all','All'],['mine',`Visited (${mine.length})`],['done',`Complete (${done.length})`],['fav','★ Favourites'],['new','Not started']];
  pg.innerHTML=`<div class="cp-inner">
    <div class="cp-tot" id="cp-tot"><div class="r1"><b>TOTAL FLASHED</b><span><span class="big">${fl.toLocaleString()}</span> / ${tot.toLocaleString()} (${Math.round(pct*100)}%)</span></div>
      <div class="cp-bar"><i style="width:${Math.max(1,pct*100).toFixed(1)}%"></i></div>
      <div class="r1"><span class="note">${mine.length} cities · ${pts.toLocaleString()} pts</span><span class="note">${CMORE?'less ▴':'more ▾'}</span></div>
      ${CMORE?`<div class="cp-more"><span>Still up among my flashes: <b>${alive}</b> · gone since: <b>${fl-alive}</b></span><span>Cities complete: <b>${done.length}</b> · active left in my cities: <b>${mine.reduce((s,w)=>s+w.left,0)}</b> (${mine.reduce((s,w)=>s+w.pl,0).toLocaleString()} pts)</span>${!EXT?'<span>City photos: your own (outside photos work in the Netlify app)</span>':''}<span ${EXT?'':'hidden'}>City photos: ${CIST.ok} loaded${CIST.fail?` · ${CIST.fail} failed${CIST.why?' ('+escapeHtml(CIST.why)+')':''}`:''}</span>${HIST?`<span>Visits on record: <b>${allVisits().length}</b> since ${allVisits().slice(-1)[0]?allVisits().slice(-1)[0].from.slice(0,4):'–'}</span>`:''}</div>`:''}</div>
    <div class="cp-row"><input id="cp-q" type="search" placeholder="Search for a city" value="${escapeHtml(CQ)}" aria-label="Search for a city"><button class="btn" id="cp-bg" title="Card backgrounds: photos or flags">${CBG==='flag'?'🖼 Photos':'🏳 Flags'}</button><button class="btn" id="cp-world" title="World map">🌍 Map</button></div>
    <div class="cp-chips" id="cp-chips">${chips.map(([k,l])=>`<button data-f="${k}" class="${k===CF?'on':''}">${l}</button>`).join('')}</div>
    ${L.map(card).join('')||'<p class="note">No city here.</p>'}</div>`;
  $('cp-tot').onclick=()=>{CMORE=!CMORE;renderCities()};
  const qi=$('cp-q');qi.oninput=()=>{CQ=qi.value;const p=qi.selectionStart;renderCities();const n=$('cp-q');n.focus();try{n.setSelectionRange(p,p)}catch(e){}};
  $('cp-bg').onclick=()=>{CBG=CBG==='flag'?'photo':'flag';try{localStorage.setItem('hp_cbg',CBG)}catch(e){};renderCities()};
  $('cp-world').onclick=()=>{navGo('map');setTimeout(()=>{try{openWorld()}catch(e){}},60)};
  $('cp-chips').onclick=e=>{const b=e.target.closest('button');if(!b)return;CF=b.dataset.f;try{localStorage.setItem('hp_cf',CF)}catch(x){};renderCities()};
  pg.querySelectorAll('[data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();const k=b.dataset.fav;FAV.has(k)?FAV.delete(k):FAV.add(k);try{localStorage.setItem('hp_fav',JSON.stringify([...FAV]))}catch(x){};renderCities()});
  pg.querySelectorAll('[data-pic]').forEach(b=>b.onclick=e=>{e.stopPropagation();const el=b.closest('.ccard');if(CBG==='flag'&&!el.dataset.ph){el.dataset.ph='1';el.classList.remove('fbg');if(!EXT){const o=ownPhoto(el.dataset.c);if(o)el.style.setProperty('--cbg',`url('${o}')`);return}wikiBg(el,false);return}wikiBg(el,true)});
  pg.querySelectorAll('[data-ufix]').forEach(sel=>{sel.onclick=e=>e.stopPropagation();sel.onchange=()=>{assignVisit(sel.dataset.c,sel.dataset.ufix,+sel.value);const row=sel.closest('.unrow');if(row&&+sel.value>=0){row.classList.add('done');sel.disabled=true;toast(sel.dataset.ufix+' → '+sel.options[sel.selectedIndex].text)}}});
  pg.querySelectorAll('.cc-hist').forEach(d=>d.addEventListener('click',e=>e.stopPropagation()));
  {const m=$('cc-space');if(m)m.onclick=e=>{e.stopPropagation();const f=new Set(flashedOf('SPACE'));f.add('SPACE_02');allFlashed.SPACE=f;try{localStorage.setItem('hp_fl_SPACE',JSON.stringify([...f]))}catch(x){};try{renderScore()}catch(x){};toast('SPACE_02 marked flashed');renderCities()}}
  if(CIO)CIO.disconnect();CIO='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(en=>{if(en.isIntersecting){CIO.unobserve(en.target);wikiBg(en.target)}}),{root:pg,rootMargin:'300px'}):null;
  if(CBG==='flag'){pg.querySelectorAll('.ccard:not(.space)').forEach(flagBg)}else pg.querySelectorAll('.ccard:not(.space)').forEach(el=>{if(CIO)CIO.observe(el);else wikiBg(el)});
  pg.querySelectorAll('.ccard:not(.space)').forEach(el=>{const go=()=>{navGo('map');goCity(el.dataset.c)};el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter')go()}})}
window.renderCities=renderCities;
/* ================= v47 · map-only zoom, photo viewer, text size, live Hunt tab, safe hunts, manual visit dates ================= */
// 1) zoom only on the map: block page pinch / double-tap zoom (the map and the photo viewer handle their own gestures)
document.addEventListener('gesturestart',e=>e.preventDefault(),{passive:false});
document.addEventListener('gesturechange',e=>e.preventDefault(),{passive:false});
document.addEventListener('touchmove',e=>{if(e.touches&&e.touches.length>1&&!e.target.closest('#lmap,#map,.leaflet-container,#pview'))e.preventDefault()},{passive:false});
{const m=document.querySelector('meta[name=viewport]');if(m&&!/maximum-scale/.test(m.content))m.content+=',maximum-scale=1,user-scalable=no'}

// 2) full-screen photo viewer with pinch zoom
const pv=document.createElement('div');pv.id='pview';pv.hidden=true;pv.setAttribute('role','dialog');pv.setAttribute('aria-label','Photo');
pv.innerHTML='<img alt=""><button class="pv-x" aria-label="Close">✕</button><span class="pv-cap"></span>';document.body.appendChild(pv);
const pvi=pv.querySelector('img');let PZ={s:1,x:0,y:0},pvP=new Map(),pd=0,lastTap=0,moved=false;
const pvApply=()=>{pvi.style.transform=`translate(${PZ.x}px,${PZ.y}px) scale(${PZ.s})`};
function openPhoto(src,cap){pvi.src=src;pv.querySelector('.pv-cap').textContent=cap||'';PZ={s:1,x:0,y:0};pvApply();pv.hidden=false}
window.openPhoto=openPhoto;
const pvClose=()=>{pv.hidden=true;pvi.removeAttribute('src')};
pv.querySelector('.pv-x').onclick=pvClose;
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pv.hidden)pvClose()});
pv.addEventListener('pointerdown',e=>{if(e.target.closest('.pv-x'))return;pv.setPointerCapture(e.pointerId);pvP.set(e.pointerId,[e.clientX,e.clientY]);moved=false;if(pvP.size===2){const [a,b]=[...pvP.values()];pd=Math.hypot(a[0]-b[0],a[1]-b[1])}});
pv.addEventListener('pointermove',e=>{if(!pvP.has(e.pointerId))return;const p0=pvP.get(e.pointerId);pvP.set(e.pointerId,[e.clientX,e.clientY]);
  if(pvP.size===2){const [a,b]=[...pvP.values()];const d=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pd){PZ.s=Math.min(6,Math.max(1,PZ.s*d/pd));if(PZ.s===1){PZ.x=PZ.y=0}}pd=d;moved=true;pvApply()}
  else if(PZ.s>1){PZ.x+=e.clientX-p0[0];PZ.y+=e.clientY-p0[1];if(Math.abs(e.clientX-p0[0])+Math.abs(e.clientY-p0[1])>2)moved=true;pvApply()}
  else if(Math.abs(e.clientY-p0[1])>3){moved=true}});
pv.addEventListener('pointerup',e=>{pvP.delete(e.pointerId);if(pvP.size<2)pd=0;if(moved)return;const t=Date.now();
  if(t-lastTap<300){PZ=PZ.s>1?{s:1,x:0,y:0}:{s:2.5,x:0,y:0};pvApply();lastTap=0}else{lastTap=t;setTimeout(()=>{if(lastTap===t&&PZ.s===1&&e.target!==pvi)pvClose()},310)}});
pv.addEventListener('wheel',e=>{e.preventDefault();PZ.s=Math.min(6,Math.max(1,PZ.s*Math.exp(-e.deltaY*0.002)));if(PZ.s===1)PZ.x=PZ.y=0;pvApply()},{passive:false});
document.addEventListener('click',e=>{const im=e.target.closest&&e.target.closest('#card img,.h-ph,#recentbox .tstrip img,.cc-hist .tstrip img');if(!im||!im.src)return;
  e.preventDefault();e.stopPropagation();openPhoto(im.dataset.full||im.src,im.alt||im.dataset.id||'')},true);

// 3) text size (Look menu)
const FS=[1,1.12,1.25,1.4];let fsI=0;try{fsI=Math.min(3,Math.max(0,+localStorage.getItem('hp_fs')||0))}catch(e){}
const fsApply=()=>H.style.setProperty('--fs',FS[fsI]);fsApply();
const _rtm=renderThemeMenu;renderThemeMenu=function(){_rtm();if(thMenu.hidden)return;const r=document.createElement('div');r.className='fsrow';
  r.innerHTML=`<span>Text size</span><button class="btn" id="fs-m" aria-label="Smaller text" ${fsI?'':'disabled'}>A−</button><b>${Math.round(FS[fsI]*100)}%</b><button class="btn" id="fs-p" aria-label="Larger text" ${fsI<3?'':'disabled'}>A+</button>`;
  const lbl=thMenu.querySelector('.check');thMenu.insertBefore(r,lbl);
  const set=d=>{fsI=Math.min(3,Math.max(0,fsI+d));try{localStorage.setItem('hp_fs',fsI)}catch(e){};fsApply();renderThemeMenu();try{setSheet(MF.st)}catch(e){}};
  $('fs-m').onclick=()=>set(-1);$('fs-p').onclick=()=>set(1)};

// 4–7) live Hunt tab, no floating Resume, Plan inside hunt mode, no silent overwrite
const huntLive=()=>typeof HUNT!=='undefined'&&HUNT&&HUNT.stops&&HUNT.idx<HUNT.stops.length;
const hbn=nav.querySelector('[data-n=hunt]');const hbLbl=document.createElement('span');hbLbl.className='nhl';hbLbl.textContent='Hunt';
[...hbn.childNodes].forEach(n=>{if(n.nodeType===3)n.remove()});hbn.appendChild(hbLbl);
function huntBtn(){const on=huntLive();hbn.classList.toggle('live',!!on);hbLbl.textContent=on?`${HUNT.idx}/${HUNT.stops.length}`:'Hunt';hbn.setAttribute('aria-label',on?`Back to the hunt in ${HUNT.cityName||HUNT.city}, stop ${HUNT.idx+1} of ${HUNT.stops.length}`:'Hunt')}
window.huntBtn=huntBtn;
const _sh=saveHunt;saveHunt=function(){_sh();huntBtn()};
function openLiveHunt(){closeOverlays('hunt');navMark('hunt');$('resume').click()}
const _ng=navGo;navGo=function(k,sub){if(k==='hunt'&&!sub&&huntLive()&&$('hunt').hidden){openLiveHunt();return}_ng(k,sub)};window.navGo=navGo;
const _rh=renderHunt;renderHunt=function(){_rh();huntBtn();const top=$('hunt').querySelector('.h-top');if(!top||!huntLive()||$('h-plan'))return;
  const b=document.createElement('button');b.className='btn';b.id='h-plan';b.textContent='Plan';b.title='Open the planner – the hunt keeps running';
  b.onclick=()=>{$('hunt').hidden=true;$('t-plan').click();navMark('hunt');setSheet('half');toast('Hunt paused on screen – tap Hunt to go back')};top.insertBefore(b,$('h-close'))};
const _st=startHunt;startHunt=function(){if(huntLive()){
    if(city&&HUNT.city===city.code){openLiveHunt();return}
    if(!confirm(`You have a hunt running in ${HUNT.cityName||HUNT.city} (${HUNT.idx}/${HUNT.stops.length}).\nEnd it and start a new one here?`))return;
    addHuntToHist(HUNT);if(typeof db!=='undefined'&&db&&canWrite&&HUNT.got.length){const s=Object.assign({},HUNT,{id:HUNT.date+'-'+HUNT.city+'-'+HUNT.t0});db.doc('sessions/'+s.id).set(s).catch(()=>{})}}
  _st();huntBtn()};
// minimise / close → sheet back, Hunt button updates
{const hu=$('hunt');new MutationObserver(huntBtn).observe(hu,{attributes:true,attributeFilter:['hidden']})}
huntBtn();

// 8) hunt summary → private visit history
function addHuntToHist(s){if(!s||!s.got||!s.got.length)return;const H2=HIST?JSON.parse(JSON.stringify(HIST)):{v:1,source:'hunts',cities:{}};
  const c=H2.cities[s.city]||(H2.cities[s.city]={visits:[],unknown:[]});const d=s.date||new Date().toISOString().slice(0,10);
  let v=c.visits.find(x=>Math.abs(Date.parse(d)-Date.parse(x.to))<=14*864e5||Math.abs(Date.parse(d)-Date.parse(x.from))<=14*864e5);
  if(!v){v={from:d,to:d,ids:[]};c.visits.push(v)}if(d<v.from)v.from=d;if(d>v.to)v.to=d;
  s.got.forEach(id=>{if(!v.ids.includes(id))v.ids.push(id)});v.ids.sort();c.unknown=(c.unknown||[]).filter(id=>!s.got.includes(id));c.visits.sort((a,b)=>a.from.localeCompare(b.from));
  H2.updated=new Date().toISOString().slice(0,10);setHist(H2);histChanged(H2)}
window.addHuntToHist=addHuntToHist;
const _rhe=renderHuntEnd;renderHuntEnd=function(){const snap=HUNT?JSON.parse(JSON.stringify(HUNT)):null;_rhe();
  ['h-done','h-x'].forEach(id=>{const b=$(id);if(b)b.addEventListener('click',()=>{addHuntToHist(snap);setTimeout(huntBtn,50)},{once:true,capture:true})})};

// 9) manual dates for "date unknown" invaders (city card timeline)
function assignVisit(code,id,k){if(!HIST||!HIST.cities[code])return;const H2=JSON.parse(JSON.stringify(HIST)),c=H2.cities[code];
  c.unknown=(c.unknown||[]).filter(x=>x!==id);c.visits.forEach(v=>v.ids=v.ids.filter(x=>x!==id));if(k>=0&&c.visits[k]){c.visits[k].ids.push(id);c.visits[k].ids.sort()}else c.unknown.push(id);
  H2.updated=new Date().toISOString().slice(0,10);HIST=H2;try{localStorage.setItem('hp_hist',JSON.stringify(H2))}catch(e){};histChanged(H2)}
window.assignVisit=assignVisit;

// v48.2 · keep header/sheet measurements fresh (iOS home-screen app: safe area and keyboard change the layout after load)
{const refit=()=>{try{window.dispatchEvent(new Event('resize'))}catch(e){}};
 const later=(ms)=>setTimeout(refit,ms);[300,900,2000].forEach(later);
 addEventListener('pageshow',()=>later(100));document.addEventListener('visibilitychange',()=>{if(!document.hidden)later(150)});
 addEventListener('focusout',()=>setTimeout(()=>{const a=document.activeElement;if(!a||!a.matches('input,select,textarea')){try{window.scrollTo(0,0)}catch(e){}refit()}},150));
 if(window.visualViewport){let t=0;const vv=()=>{clearTimeout(t);t=setTimeout(refit,120)};visualViewport.addEventListener('resize',vv)}
 const hd=document.querySelector('header');if(hd&&'ResizeObserver' in window)new ResizeObserver(()=>{try{mfVars()}catch(e){}}).observe(hd)}

// start on Map
navMark('map');setTimeout(()=>{try{setSheet(MF.st||'peek')}catch(e){}},0);
addEventListener('resize',()=>{try{setSheet(MF.st)}catch(e){}});
})();
