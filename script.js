// कोई गलती हो तो पेज के ऊपर लाल पट्टी में दिखेगी (जाँच के बाद इस ब्लॉक को हटा सकते हैं)
window.addEventListener('error',e=>{let b=document.getElementById('dbg');if(!b){b=document.createElement('div');b.id='dbg';b.style.cssText='background:#b00020;color:#fff;padding:8px;font:14px sans-serif;position:relative;z-index:99';document.body.prepend(b)}b.textContent='गलती: '+e.message+' (script.js पंक्ति '+e.lineno+')'});
const C=window.CONFIG||{},$=s=>document.getElementById(s)||document.createElement(s==='cv'?'canvas':'div');
$('babaName').textContent=C.BABA_NAME;
function setImg(img,url,wrap){img.onload=()=>wrap&&wrap.classList.add('ok');img.onerror=()=>{img.style.display='none'};img.src=url}
$('baba').onerror=function(){this.removeAttribute('src')};$('baba').src=C.BABA_PHOTO;
$('exWrap').classList.add('ph');setImg($('ex'),C.EXAMPLE_URL,$('exWrap'));
const loadImg=(u,cors=true)=>new Promise((ok,no)=>{const i=new Image();if(cors)i.crossOrigin='anonymous';i.onload=()=>ok(i);i.onerror=no;i.src=u});
const getJSON=u=>fetch(u).then(r=>r.json()).catch(()=>[]);
let tpl=null,tImg=null,photo=null,st={z:1,ox:0,oy:0},blob=null,session=false;
// ---- gallery of templates (only available ones are shown) ----
(async()=>{const tdy=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date());
 const list=(await getJSON('data/templates.json')).map(t=>({...t,image:String(t.image||'').trim(),frame:t.frame||{x:0.5,y:0.35,r:0.22}})).filter(t=>!t.date||t.date<=tdy).sort((a,b)=>(b.date||'').localeCompare(a.date||'')),box=$('tpls');
 for(const t of list){try{const im=await loadImg(t.image);
  const d=document.createElement('div');d.className='item';
  d.innerHTML='<img alt=""><div></div><div class="note"></div><button class="btn">यह डिज़ाइन चुनें</button>';
  d.querySelector('img').src=t.image;d.children[1].textContent=t.title;d.children[2].textContent=t.date?new Date(t.date+'T00:00:00').toLocaleDateString('hi-IN',{day:'numeric',month:'long',year:'numeric'}):'';
  d.querySelector('button').onclick=()=>{tpl=t;tImg=im;st={f:{...t.frame}};photo=null;$('fsize').value=t.frame.r;cvSetup();$('editor').hidden=false;draw();$('editor').scrollIntoView({behavior:'smooth'})};
  box.appendChild(d)}catch(e){}}
 if(!box.children.length)box.innerHTML='<p class="note">अभी कोई डिज़ाइन उपलब्ध नहीं है।</p>'})();
$('start').onclick=()=>$('gallerySec').scrollIntoView({behavior:'smooth'});
// ---- editor: टेम्पलेट पर गोल फ्रेम (फोटो पहले पॉपअप में गोल क्रॉप होती है) ----
const cv=$('cv'),cx=cv.getContext('2d');
function cvSetup(){cv.width=1080;cv.height=Math.round(1080*tImg.naturalHeight/tImg.naturalWidth)}
function fr(){const W=cv.width,f=st.f||tpl.frame;return{x:f.x*W,y:f.y*cv.height,r:f.r*W}}
function draw(){if(!tImg)return;cx.clearRect(0,0,cv.width,cv.height);cx.drawImage(tImg,0,0,cv.width,cv.height);
 const f=fr();cx.save();cx.beginPath();cx.arc(f.x,f.y,f.r,0,7);cx.clip();
 if(photo)cx.drawImage(photo,f.x-f.r,f.y-f.r,2*f.r,2*f.r);else{cx.fillStyle='rgba(212,175,55,.25)';cx.fill()}
 cx.restore();cx.beginPath();cx.arc(f.x,f.y,f.r,0,7);cx.lineWidth=6;cx.strokeStyle='#D4AF37';cx.stroke()}
$('pick').onclick=$('change').onclick=()=>$('file').click();
$('file').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;$('edErr').textContent='';
 if(!/^image\/(jpeg|png|webp)$/.test(f.type)){$('edErr').textContent='कृपया JPG, PNG या WebP फोटो चुनें।';return}
 loadImg(URL.createObjectURL(f),false).then(openCrop).catch(()=>$('edErr').textContent='फोटो खुल नहीं सकी, दूसरी फोटो चुनें।')};
$('fsize').oninput=e=>{if(st.f){st.f.r=+e.target.value;draw()}};
// फ्रेम को टेम्पलेट पर कहीं भी खींचें (फोटो फ्रेम के साथ ही चलती है)
let fd=null;const c01=v=>Math.min(1,Math.max(0,v));
cv.onpointerdown=e=>{fd={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId)};
cv.onpointermove=e=>{if(!fd||!st.f)return;const k=cv.width/cv.getBoundingClientRect().width;
 st.f.x=c01(st.f.x+(e.clientX-fd.x)*k/cv.width);st.f.y=c01(st.f.y+(e.clientY-fd.y)*k/cv.height);fd={x:e.clientX,y:e.clientY};draw()};
cv.onpointerup=cv.onpointercancel=()=>{fd=null};
$('back').onclick=()=>{$('editor').hidden=true;$('gallerySec').scrollIntoView({behavior:'smooth'})};
// ---- फोटो अपलोड के बाद गोल क्रॉप पॉपअप ----
const cc=$('cc'),cg=cc.getContext('2d'),CS=600,CR=270;let ci=null,cs={z:1,ox:0,oy:0};cc.width=cc.height=CS;
const cScale=()=>Math.max(2*CR/ci.width,2*CR/ci.height)*cs.z;
function cClamp(){const s=cScale(),mx=Math.max(0,(ci.width*s-2*CR)/2),my=Math.max(0,(ci.height*s-2*CR)/2);cs.ox=Math.min(mx,Math.max(-mx,cs.ox));cs.oy=Math.min(my,Math.max(-my,cs.oy))}
function cDraw(){cClamp();const s=cScale(),c=CS/2;cg.fillStyle='#fff';cg.fillRect(0,0,CS,CS);
 cg.drawImage(ci,c+cs.ox-ci.width*s/2,c+cs.oy-ci.height*s/2,ci.width*s,ci.height*s);
 cg.fillStyle='rgba(0,0,0,.55)';cg.beginPath();cg.rect(0,0,CS,CS);cg.arc(c,c,CR,0,Math.PI*2);cg.fill('evenodd');
 cg.beginPath();cg.arc(c,c,CR,0,Math.PI*2);cg.lineWidth=5;cg.strokeStyle='#D4AF37';cg.stroke()}
function setCZ(z){z=Math.min(5,Math.max(1,z));const k=z/cs.z;cs.ox*=k;cs.oy*=k;cs.z=z;$('czoom').value=z}
function openCrop(img){ci=img;cs={z:1,ox:0,oy:0};$('czoom').value=1;$('cropModal').hidden=false;cDraw()}
const cp=new Map();let cpd=0;const cdist=()=>{const [a,b]=[...cp.values()];return Math.hypot(a.x-b.x,a.y-b.y)};
cc.onpointerdown=e=>{cp.set(e.pointerId,{x:e.clientX,y:e.clientY});cc.setPointerCapture(e.pointerId);if(cp.size==2)cpd=cdist()};
cc.onpointermove=e=>{const p=cp.get(e.pointerId);if(!p||!ci)return;const k=CS/cc.getBoundingClientRect().width;
 if(cp.size==1){cs.ox+=(e.clientX-p.x)*k;cs.oy+=(e.clientY-p.y)*k}
 p.x=e.clientX;p.y=e.clientY;
 if(cp.size==2){const d=cdist();if(cpd)setCZ(cs.z*d/cpd);cpd=d}
 cDraw()};
cc.onpointerup=cc.onpointercancel=e=>{cp.delete(e.pointerId);cpd=0};
cc.onwheel=e=>{e.preventDefault();setCZ(cs.z*(e.deltaY<0?1.08:.93));cDraw()};
$('czoom').oninput=e=>{setCZ(+e.target.value);cDraw()};
$('ccancel').onclick=()=>{$('cropModal').hidden=true};
$('cok').onclick=()=>{cClamp();const S=800,o=document.createElement('canvas');o.width=o.height=S;const g=o.getContext('2d'),k=S/(2*CR),s=cScale()*k;
 g.beginPath();g.arc(S/2,S/2,S/2,0,Math.PI*2);g.clip();
 g.drawImage(ci,S/2+cs.ox*k-ci.width*s/2,S/2+cs.oy*k-ci.height*s/2,ci.width*s,ci.height*s);
 photo=o;$('cropModal').hidden=true;draw()};
// ---- session + form ----
session=Date.now()-(+localStorage.getItem('bj_s')||0)<5*864e5; // 5 दिन
function ask(lbl){return new Promise(res=>{$('formModal').hidden=false;$('fname').focus();$('form').onsubmit=async e=>{e.preventDefault();
 const name=$('fname').value.trim(),phone=$('fphone').value.trim(),er=$('fErr');er.textContent='';
 if(name.length<2){er.textContent='कृपया अपना पूरा नाम लिखें।';return}
 if(!/^[6-9]\d{9}$/.test(phone)){er.textContent='कृपया सही 10 अंकों का मोबाइल नंबर लिखें।';return}
 $('fgo').disabled=true;
 try{await tgMsg(`🙏 नया उपयोगकर्ता\nनाम: ${name}\nमोबाइल: ${phone}\nडिज़ाइन: ${lbl||tpl.id}`);
  localStorage.setItem('bj_s',Date.now());session=true;$('formModal').hidden=true;res(true)}
 catch(x){er.textContent=x.message||'जानकारी भेजी नहीं जा सकी। कृपया दोबारा प्रयास करें।'}
 $('fgo').disabled=false}})}
// ---- poster बनाना: WhatsApp / डाउनलोड (दोनों पर पहले जानकारी माँगी जाती है) ----
let busy=false;
async function build(){const er=$('edErr');er.textContent='';
 if(!photo){er.textContent='पहले अपनी फोटो चुनें।';return null}
 if(!session)await ask();
 draw();
 try{blob=await new Promise((ok,no)=>{try{cv.toBlob(b=>b?ok(b):no(),'image/png')}catch(e){no(e)}})}
 catch(e){er.textContent='डिज़ाइन की इमेज सुरक्षित रूप से डाउनलोड नहीं हो सकती (CORS)। कृपया ऐसी जगह इमेज होस्ट करें जो अन्य साइट को अनुमति देती हो।';return null}
 if(blob.size<=8*1024*1024)tgPhoto(blob,tpl.id).catch(()=>{});
 return blob}
function save(b){const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='BabaJi-Poster.png';a.click()}
async function run(fn){if(busy)return;busy=true;try{const b=await build();if(b)fn(b)}finally{busy=false}}
$('dl').onclick=e=>{if(photo&&!gate(e.currentTarget))return;run(save)};
const waRun=()=>run(async b=>{const t='🙏 बाबा जी के साथ अपनी सुंदर तस्वीर यहाँ बनाएँ: '+C.WEBSITE_URL;
 const f=new File([b],'BabaJi-Poster.png',{type:'image/png'});
 try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text:t});return}}
 catch(e){if(e.name==='AbortError')return;if(e.name==='NotAllowedError'){$('edErr').textContent='कृपया WhatsApp बटन एक बार फिर दबाएँ।';return}}
 save(b);setTimeout(()=>{location.href='https://api.whatsapp.com/send?text='+encodeURIComponent(t)},900)});
// ---- today / older images ----
(async()=>{const list=await getJSON('data/images.json');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date());
 const add=(box,it)=>{const d=document.createElement('div');d.className='item';d.innerHTML='<div class="ph"><img alt=""><span>चित्र उपलब्ध नहीं</span></div><b></b><div class="note"></div><button class="btn wa" style="margin-top:8px">WhatsApp स्टेटस लगाएँ</button>';
  const w=d.querySelector('.ph');setImg(d.querySelector('img'),it.image,w);d.querySelector('b').textContent=it.title;
  d.querySelector('.note').textContent=new Date(it.date+'T00:00:00').toLocaleDateString('hi-IN',{day:'numeric',month:'long',year:'numeric'});d.querySelector('button').onclick=e=>{if(gate(e.currentTarget))shareStatus(it)};box.appendChild(d)};
 const ok=list.filter(i=>i.date<=today).sort((a,b)=>b.date.localeCompare(a.date));
 ok.filter(i=>i.date===today).forEach(i=>add($('today'),i));ok.filter(i=>i.date<today).forEach(i=>add($('older'),i));
 for(const b of [$('today'),$('older')])if(!b.children.length)b.innerHTML='<p class="note">अभी कोई चित्र नहीं है।</p>'})();

// ---- Telegram (सीधे frontend से) ----
const tgURL=m=>`https://api.telegram.org/bot${C.TELEGRAM_BOT_TOKEN}/${m}`;
async function tgSend(m,fd){if(!C.TELEGRAM_BOT_TOKEN||!C.TELEGRAM_CHAT_ID)throw new Error('config');
 fd.append('chat_id',C.TELEGRAM_CHAT_ID);const r=await fetch(tgURL(m),{method:'POST',body:fd});if(!r.ok)throw new Error('tg')}
function tgMsg(t){const f=new FormData();f.append('text',t);return tgSend('sendMessage',f)}
function tgPhoto(b,id){const f=new FormData();f.append('photo',b,'poster.png');f.append('caption','🖼️ नया पोस्टर, डिज़ाइन: '+id);return tgSend('sendPhoto',f)}
// ---- विज़िटर IP सूचना (6 घंटे में एक बार) ----
(async()=>{if(!C.IP_NOTIFY||Date.now()-(+localStorage.getItem('bj_v')||0)<6*36e5)return;
 try{const ip=(await (await fetch('https://api.ipify.org?format=json')).json()).ip;
  await tgMsg('👁️ नया विज़िट\nIP: '+ip);localStorage.setItem('bj_v',Date.now())}catch(e){}})();

// ---- चित्र को WhatsApp स्टेटस के लिए शेयर करना ----
// ✏️ यह संदेश यहाँ बदल सकते हैं (लिंक config की WEBSITE_URL से आता है)
async function shareStatus(it){
 if(!session)await ask('स्टेटस: '+it.title);
 const t='🙏 '+it.title+'\n\n✨ रोज़ नए WhatsApp स्टेटस देखने और डाउनलोड करने के लिए यहाँ जाएँ 👇\n'+C.WEBSITE_URL;
 try{const b=await (await fetch(it.image)).blob();
  const f=new File([b],'BabaJi-Status.'+(/png/.test(b.type)?'png':'jpg'),{type:b.type||'image/jpeg'});
  if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text:t});return}}
 catch(e){if(e.name==='AbortError')return;if(e.name==='NotAllowedError'){alert('कृपया WhatsApp स्टेटस बटन एक बार फिर दबाएँ।');return}}
 location.href='https://api.whatsapp.com/send?text='+encodeURIComponent(t)}

$('wa').onclick=e=>{if(photo&&!gate(e.currentTarget))return;waRun()};
// ---- Monetag Direct Link: पहला क्लिक = विज्ञापन खुलेगा, दूसरा क्लिक = असली काम ----
// लिंक assets/config.js में AD_LINK से आता है; खाली हो तो विज्ञापन बंद रहेगा।
function gate(btn){
 if(!C.AD_LINK)return true;
 if(btn._ad){btn.textContent=btn.dataset.t;btn._ad=false;return true}
 const w=window.open(C.AD_LINK,'_blank');
 if(!w)return true; // popup रुक गया तो उपयोगकर्ता को न रोकें
 btn._ad=true;btn.dataset.t=btn.textContent;btn.textContent='अब फिर से दबाएँ ✅';return false}
