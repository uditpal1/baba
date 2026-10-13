const enc=new TextEncoder(),MAXAGE=5*24*3600;
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function sign(secret,msg){const k=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return hex(await crypto.subtle.sign('HMAC',k,enc.encode(msg)))}
export const json=(o,s=200,h={})=>new Response(JSON.stringify(o),{status:s,headers:{'content-type':'application/json','cache-control':'no-store',...h}});
export async function makeCookie(env){const ts=Math.floor(Date.now()/1000);const v=ts+'.'+await sign(env.SESSION_SECRET,String(ts));
 return `bj_session=${v}; Max-Age=${MAXAGE}; Path=/; HttpOnly; Secure; SameSite=Strict`}
export async function validSession(req,env){if(!env.SESSION_SECRET)return false;
 const m=(req.headers.get('cookie')||'').match(/bj_session=(\d+)\.([a-f0-9]+)/);if(!m)return false;
 if(Date.now()/1000-(+m[1])>MAXAGE)return false;return m[2]===await sign(env.SESSION_SECRET,m[1])}
const hits=new Map(); // best-effort rate limit (per Worker isolate)
export function limited(req,max=5,win=60000){const ip=req.headers.get('CF-Connecting-IP')||'x',n=Date.now(),a=(hits.get(ip)||[]).filter(t=>n-t<win);a.push(n);hits.set(ip,a);return a.length>max}
export const esc=s=>String(s).replace(/[<>&]/g,'');
export async function tg(env,method,body){if(!env.TELEGRAM_BOT_TOKEN||!env.TELEGRAM_CHAT_ID)throw new Error('config');
 const r=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`,{method:'POST',body});if(!r.ok)throw new Error('tg')}
