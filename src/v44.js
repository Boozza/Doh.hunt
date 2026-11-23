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
function navGo(k,sub){const same=k===CUR;
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
// score pill → Me
{const p=$('mf-pill');if(p)p.onclick=()=>navGo('me','t-score')}
// news badge mirror
{const src=$('nbadge'),dst=$('nav-nb');const mir=()=>{dst.textContent=src.textContent;dst.hidden=src.hidden||!+src.textContent||CUR==='news'};new MutationObserver(mir).observe(src,{attributes:true,childList:true,characterData:true,subtree:true});mir()}
// keyboard open → hide nav
if(window.visualViewport)visualViewport.addEventListener('resize',()=>H.classList.toggle('kb',visualViewport.height<innerHeight*0.72));

// ---------- thumbnails (invader-spotter close-ups)
function refUrl(id){const u=spotUrl(id);return /grosplan/.test(u)?u:''}
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
function renderCities(){const W=worldStats();const all=DATA.cities.concat([SPACE]);
  const tot=DATA.cities.reduce((s,c)=>s+c.inv.length,0);const fl=all.reduce((s,c)=>s+flashedOf(c.code).size,0);const pct=tot?fl/tot:0;
  const mine=W.filter(w=>w.mine),done=mine.filter(w=>w.alive&&w.left===0);const pts=W.reduce((s,w)=>s+(w.mine?cityScore(w):0),0)+(flashedOf('SPACE').has('SPACE_02')?100:0);
  const alive=W.reduce((s,w)=>s+w.got,0);
  let L=W.slice();if(CF==='mine')L=L.filter(w=>w.mine);else if(CF==='done')L=L.filter(w=>w.mine&&w.alive&&w.left===0);else if(CF==='fav')L=L.filter(w=>FAV.has(w.c.code));else if(CF==='new')L=L.filter(w=>!w.mine);
  if(CQ){const q=CQ.toLowerCase();L=L.filter(w=>w.c.code.toLowerCase().includes(q)||String(w.c.name||'').toLowerCase().includes(q))}
  L.sort((a,b)=>(FAV.has(b.c.code)-FAV.has(a.c.code))||(b.mine-a.mine)||(b.fl-a.fl)||(b.pl-a.pl));
  const card=w=>{const c=w.c,h=HIST&&HIST.cities[c.code],bg=ownPhoto(c.code),hu=hue(c.code);
    const style=bg?`--cbg:url('${bg}')`:`--cbg:linear-gradient(135deg,hsl(${hu} 55% 32%),hsl(${(hu+60)%360} 60% 18%))`;
    const pill=!w.alive?'<span class="cc-pill">none active</span>':w.mine&&w.left===0?'<span class="cc-pill done">✓ complete</span>':`<span class="cc-pill">${w.left} left to flash · ${w.pl.toLocaleString()} pts</span>`;
    const vs=h?(h.visits||[]):[];const un=h?(h.unknown||[]):[];
    const hist=vs.length?`<details class="cc-hist"><summary>🕓 ${vs.length} visit${vs.length>1?'s':''} · ${vs.map(v=>MON[+v.from.slice(5,7)-1]+' '+v.from.slice(0,4)).join(' → ')}</summary><ol>${vs.slice().reverse().map(v=>`<li><div class="vh"><b>${fmtRange(v.from,v.to)}</b><span>${v.ids.length} · ${ptsOf(v.ids).toLocaleString()} pts</span></div>${strip(v.ids,5)}</li>`).join('')}${un.length?`<li><div class="vh"><b>Date unknown</b><span>${un.length} · ${ptsOf(un).toLocaleString()} pts</span></div>${strip(un,5)}</li>`:''}</ol></details>`:'';
    return `<div class="ccard" data-c="${c.code}" style="${style}" role="button" tabindex="0" aria-label="Open ${escapeHtml(cityName(c.code))} on the map">
      <div class="cc-top"><span class="cc-code">${c.code}</span><button class="cc-star${FAV.has(c.code)?' on':''}" data-fav="${c.code}" aria-label="Favourite" aria-pressed="${FAV.has(c.code)}">${FAV.has(c.code)?'★':'☆'}</button></div>
      <div class="cc-name">${escapeHtml(cityName(c.code))} ${c.name&&c.name!==c.code?`<small>(${c.code})</small>`:''}</div>${pill}
      <div class="cc-stats"><span>📷 <b>${w.fl}</b> flashed</span><span>🎯 <b>${w.alive}</b> active</span>${w.mine?`<span>⭐ <b>${cityScore(w).toLocaleString()}</b> pts</span>`:''}</div>
      <div class="cc-bar"><i style="width:${Math.round(w.pct*100)}%"></i></div>${hist}</div>`};
  const chips=[['all','All'],['mine',`Visited (${mine.length})`],['done',`Complete (${done.length})`],['fav','★ Favourites'],['new','Not started']];
  pg.innerHTML=`<div class="cp-inner">
    <div class="cp-tot" id="cp-tot"><div class="r1"><b>TOTAL FLASHED</b><span><span class="big">${fl.toLocaleString()}</span> / ${tot.toLocaleString()} (${Math.round(pct*100)}%)</span></div>
      <div class="cp-bar"><i style="width:${Math.max(1,pct*100).toFixed(1)}%"></i></div>
      <div class="r1"><span class="note">${mine.length} cities · ${pts.toLocaleString()} pts</span><span class="note">${CMORE?'less ▴':'more ▾'}</span></div>
      ${CMORE?`<div class="cp-more"><span>Still up among my flashes: <b>${alive}</b> · gone since: <b>${fl-alive-(flashedOf('SPACE').size)}</b></span><span>Cities complete: <b>${done.length}</b> · active left in my cities: <b>${mine.reduce((s,w)=>s+w.left,0)}</b> (${mine.reduce((s,w)=>s+w.pl,0).toLocaleString()} pts)</span>${HIST?`<span>Visits on record: <b>${allVisits().length}</b> since ${allVisits().slice(-1)[0]?allVisits().slice(-1)[0].from.slice(0,4):'–'}</span>`:''}</div>`:''}</div>
    <div class="cp-row"><input id="cp-q" type="search" placeholder="Search for a city" value="${escapeHtml(CQ)}" aria-label="Search for a city"><button class="btn" id="cp-world" title="World map">🌍 Map</button></div>
    <div class="cp-chips" id="cp-chips">${chips.map(([k,l])=>`<button data-f="${k}" class="${k===CF?'on':''}">${l}</button>`).join('')}</div>
    ${L.map(card).join('')||'<p class="note">No city here.</p>'}</div>`;
  $('cp-tot').onclick=()=>{CMORE=!CMORE;renderCities()};
  const qi=$('cp-q');qi.oninput=()=>{CQ=qi.value;const p=qi.selectionStart;renderCities();const n=$('cp-q');n.focus();try{n.setSelectionRange(p,p)}catch(e){}};
  $('cp-world').onclick=()=>{navGo('map');setTimeout(()=>{try{openWorld()}catch(e){}},60)};
  $('cp-chips').onclick=e=>{const b=e.target.closest('button');if(!b)return;CF=b.dataset.f;try{localStorage.setItem('hp_cf',CF)}catch(x){};renderCities()};
  pg.querySelectorAll('[data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();const k=b.dataset.fav;FAV.has(k)?FAV.delete(k):FAV.add(k);try{localStorage.setItem('hp_fav',JSON.stringify([...FAV]))}catch(x){};renderCities()});
  pg.querySelectorAll('.cc-hist').forEach(d=>d.addEventListener('click',e=>e.stopPropagation()));
  pg.querySelectorAll('.ccard').forEach(el=>{const go=()=>{navGo('map');goCity(el.dataset.c)};el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter')go()}})}
window.renderCities=renderCities;
// start on Map
navMark('map');setTimeout(()=>{try{setSheet(MF.st||'peek')}catch(e){}},0);
addEventListener('resize',()=>{try{setSheet(MF.st)}catch(e){}});
})();
