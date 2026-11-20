import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import json,glob,os
import datetime
VER=open('VERSION').read().strip();VD=datetime.date.today().isoformat()
t=open('app_template.html').read().replace('__VER__',VER).replace('__VERDATE__',VD)
d=open('data.json').read().replace('</','<\\/')
# Claude-version build: embed detailed streets when present (src/streets/<CODE>.json)
D=json.load(open('data.json'));ns=0
for f in glob.glob('streets/*.json'):
    if f.endswith('_summary.json'):continue
    S=json.load(open(f));c=next((x for x in D['cities'] if x['code']==S.get('code')),None)
    if c:c['streets']={k:S.get(k,[]) for k in ('M','m','f','L')};ns+=1
os.makedirs('../out',exist_ok=True)
open('../out/hunt_planner.html','w').write(t.replace('__FLAVOR__','Claude').replace('__DATA__',json.dumps(D,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')))
print('artifact build: streets for',ns,'cities')
seed={}
for f in glob.glob('seed/*.json'):
    j=json.load(open(f)); seed[j['city']]=j['ids']
seed['SPACE']=['SPACE_02']
st=json.load(open('../site/data/status.json'));nw=json.load(open('../site/data/news.json'))
ad=open('adapter.js').read().replace('__SEED__',json.dumps(seed)).replace('__CHANGES__',json.dumps(st['changes'])).replace('__ITEMS__',json.dumps(nw['items']))
s=t.replace('__FLAVOR__','Netlify').replace("loadCity(sel.value);\ninitDb().then(initField);",ad+"\nloadCity(sel.value);\ninitDb().then(initField);")
s=s.replace("</style>",""".leaflet-container{background:#141c3e;font-family:var(--f-body)}
.rnum{background:#0a0d1c;color:#fff;border:1px solid #ff5aa8;font-family:var(--f-mono);font-weight:600;padding:0 4px;box-shadow:none}
.rnum:before{display:none}
.flag{font-size:22px;color:#ffd90f;text-shadow:0 0 3px #000}
.maptools{z-index:500}.legend,.hint{z-index:500}.card{z-index:503}
#c-ph,#h-photo,.mic{display:none!important}
.near{position:absolute;left:50%;transform:translateX(-50%);bottom:56px;z-index:502;display:flex;align-items:center;gap:8px;max-width:calc(100% - 20px);background:rgba(10,13,28,.92);border:2px solid var(--line);border-radius:10px;padding:6px 10px;font-size:14px;white-space:nowrap}
.near.hot{border-color:var(--green);box-shadow:0 0 0 3px rgba(69,240,138,.35)}.near .arrow{font-size:22px;transition:transform .15s}
#near-cmp.on{outline:2px solid var(--yellow)}
.leaflet-container.darkbase{background:#0b0d12}
.tiles-dark{filter:invert(1) hue-rotate(180deg) brightness(.85) contrast(.9)}
.chb{width:16px;height:16px;border-radius:50%;color:#0a0d1c;font:700 11px/16px var(--f-mono);text-align:center;box-shadow:0 0 0 2px #0a0d1c}
.mpin{width:30px;height:30px;border-radius:50% 50% 50% 4px;background:#0a0d1c;border:2px solid var(--c);color:var(--c);font:700 13px/26px var(--f-mono);text-align:center;position:relative;box-shadow:0 1px 4px #000a}
.mpin i{position:absolute;right:-9px;top:-9px;min-width:17px;height:17px;padding:0 3px;border-radius:9px;background:var(--c);color:#0a0d1c;font:700 10px/17px var(--f-mono);font-style:normal}
.mpin.cur{transform:scale(1.25);box-shadow:0 0 0 3px #fff,0 2px 8px #000}
.mrow{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid var(--line)}
.mrow .mtx{flex:1;min-width:0;display:flex;flex-direction:column}.mrow .mtx b{font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mrow .mtx span{font-size:11.5px;color:var(--muted)}
.mdot{width:10px;height:10px;border-radius:50%;flex:none}
#mh-btn.on{outline:2px solid #ffd90f}
.mpb{font:600 13px var(--f-body);padding:7px 11px;border-radius:6px;border:1px solid #0a0d1c;background:#fff;color:#0a0d1c!important;text-decoration:none;cursor:pointer}.mpb.y{background:#ffd90f}
.hotelbox>*,#mh-list,#mh-res{min-width:0}
</style>""",1)
head='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>D'oh! Hunt Planner</title>
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><meta name="theme-color" content="#0a0d1c">
<link rel="manifest" href="manifest.json"><link rel="apple-touch-icon" sizes="180x180" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAIAAACyr5FlAAADNElEQVR4Xu3dL4tVQQDG4bOiRVnsYjFaTIKfQXCtIjaLTbCIH0EsC9sstmWxuoKfQTBZjDa7iMkiWJ2Bebkzw1z2eap313PX5Tf/zrkeXD28uUHJJT8Wavxy4JeDnHKgHOSUA+UgpxwoBznlQDnIKQfKQe5y+5f8/vKr/cUs69rdw8ZrM6xgWCGnHCgHOeVAOcgpB8pBTjlQDnLKgXKQUw6Ug5xyoBzklAPlIKccKAc55UA5yAWPJqzjyeMr/1/M6dmfRa5w8ctrZ1jBsEJOOVAOcsqBcpDby6VscdVaXEBu28Al7vy/cTLDCoYVcsqBcpBTDpSDnHJQddD+f7yt82mCP0/e7t0/6fXnzxa5Zp8mSAeGFUxIySkHykFOOVAOckvvc0T7GQ/uPyq+/Y+f3uc/liavX3wovu7V8cOmr/9n/v6HfQ46MOfAnIOccqAc5JSDqiWWstGS9YIYt8S1lKUDwwompOSUA+UgpxwoB7nZH8EQbWlEZ+J3zl+2v/2vR2/aX7xtA7959U6Dk8IFjtv8KDKsYFghpxwoBznlQDnIzV7KRqLbuPfUuJvjd2dYwbBCTjlQDnLKgXKQUw6qRj2aEB3Nz39APj37jt5OJLotoSZ6Ox5NoAPDCiak5JQD5SCnHCgHuVH7HN/O7xUv5sb3p/lF7iTaA4iM2/yo+XHrXfGPbh99br9y+xx0YM6BOQc55UA5yCkHVbMfTSguxtL1bfGYe53nGIp3IKSPINRWrTMpB+Yc5JQD5SCnHCgHOeWgavaRfSTd/2iXnuOPO53vsp/hyJ7ZDCuYkJJTDpSDnHIwfSlbU7srfXfj1r2pLqvTomjJWuPuczowrGBCSk45UA5yyoFykBt1ZB8Zt/mxv7psaRTZ56ADcw7MOcgpB8pBTjlQDnKzP4KhqLamr+1/FF8fbZakuwi7f/PovSzCsIJhhZxyoBzklAPlILf0kX264NxH85e4juzpwJwDcw5yyoFykFMOlIPcEvsczGSfgw7MOTDnIKccKAc55UA5yCkHykFOOVAOcsqBcpBTDqqCI3suGuXAnIOccqAc5JQD5SCnHCgHOeVAOcgpB8pBTjmo+gvDYpiVhmyg7gAAAABJRU5ErkJggg=="><link rel="icon" type="image/png" sizes="32x32" href="/favicon.png"><meta name="apple-mobile-web-app-title" content="D'oh! Hunt">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<style>html{padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0}[hidden]{display:none!important}</style>
</head><body>'''
html=head+s.replace('__DATA__',d)+'</body></html>'
open('../site/index.html','w').write(html)
