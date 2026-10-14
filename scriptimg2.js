const C=window.CONFIG,$=s=>document.getElementById(s);
$('babaName').textContent=C.BABA_NAME;
function setImg(img,url,wrap){img.onload=()=>wrap&&wrap.classList.add('ok');img.onerror=()=>{img.style.display='none'};img.src=url}
$('baba').onerror=function(){this.removeAttribute('src')};$('baba').src=C.BABA_PHOTO;
$('exWrap').classList.add('ph');setImg($('ex'),C.EXAMPLE_URL,$('exWrap'));
const loadImg=(u,cors=true)=>new Promise((ok,no)=>{const i=new Image();if(cors)i.crossOrigin='anonymous';i.onload=()=>ok(i);i.onerror=no;i.src=u});
const getJSON=u=>fetch(u).then(r=>r.json()).catch(()=>[]);
let tpl=null,tImg=null,photo=null,st={z:1,ox:0,oy:0},blob=null,session=false;
// ---- gallery of templates (only available ones are shown) ----
(async()=>{const tdy=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date());
 const list=(await getJSON('data/templates.json')).filter(t=>!t.date||t.date<=tdy).sort((a,b)=>(b.date||'').localeCompare(a.date||'')),box=$('tpls');
 for(const t of list){try{const im=await loadImg(t.image);
  const d=document.createElement('div');d.className='item';
  d.innerHTML='<img alt=""><div></div><div class="note"></div><button class="btn">यह डिज़ाइन चुनें</button>';
  d.querySelector('img').src=t.image;d.children[1].textContent=t.title;d.children[2].textContent=t.date?new Date(t.date+'T00:00:00').toLocaleDateString('hi-IN',{day:'numeric',month:'long',year:'numeric'}):'';
  d.querySelector('button').onclick=()=>{tpl=t;tImg=im;st={z:1,ox:0,oy:0,f:{...t.frame}};photo=null;$('fsize').value=t.frame.r;setMode('photo');$('zoom').value=1;cvSetup();$('editor').hidden=false;draw();$('editor').scrollIntoView({behavior:'smooth'})};
  box.appendChild(d)}catch(e){}}
 if(!box.children.length)box.innerHTML='<p class="note">अभी कोई डिज़ाइन उपलब्ध नहीं है।</p>'})();
$('start').onclick=()=>$('gallerySec').scrollIntoView({behavior:'smooth'});
// ---- editor ----
const cv=$('cv'),cx=cv.getContext('2d');
function cvSetup(){cv.width=1080;cv.height=Math.round(1080*tImg.naturalHeight/tImg.naturalWidth)}
function fr(){const W=cv.width,f=st.f||tpl.frame;return{x:f.x*W,y:f.y*cv.height,r:f.r*W}}
function clamp(){if(!photo)return;const f=fr(),s=Math.max(2*f.r/photo.width,2*f.r/photo.height)*st.z;
 const mx=Math.max(0,(photo.width*s-2*f.r)/2),my=Math.max(0,(photo.height*s-2*f.r)/2);
 st.ox=Math.min(mx,Math.max(-mx,st.ox));st.oy=Math.min(my,Math.max(-my,st.oy));return s}
function draw(){if(!tImg)return;cx.clearRect(0,0,cv.width,cv.height);cx.drawImage(tImg,0,0,cv.width,cv.height);
 const f=fr();cx.save();cx.beginPath();cx.arc(f.x,f.y,f.r,0,7);cx.clip();
 if(photo){const s=clamp();cx.drawImage(photo,f.x+st.ox-photo.width*s/2,f.y+st.oy-photo.height*s/2,photo.width*s,photo.height*s)}
 else{cx.fillStyle='rgba(212,175,55,.25)';cx.fill()}
 cx.restore();cx.beginPath();cx.arc(f.x,f.y,f.r,0,7);cx.lineWidth=6;cx.strokeStyle='#D4AF37';cx.stroke()}
$('pick').onclick=$('change').onclick=()=>$('file').click();
$('file').onchange=e=>{const f=e.target.files[0];if(!f)return;$('edErr').textContent='';
 if(!/^image\/(jpeg|png|webp)$/.test(f.type)){$('edErr').textContent='कृपया JPG, PNG या WebP फोटो चुनें।';return}
 const u=URL.createObjectURL(f);loadImg(u,false).then(i=>{photo=i;st.z=1;st.ox=0;st.oy=0;$('zoom').value=1;draw()}).catch(()=>$('edErr').textContent='फोटो खुल नहीं सकी, दूसरी फोटो चुनें।')};
$('zoom').oninput=e=>{st.z=+e.target.value;draw()};
let mode='photo';
function setMode(m){mode=m;$('mFrame').classList.toggle('ghost',m!=='frame');$('mPhoto').classList.toggle('ghost',m!=='photo');$('hint').textContent=m==='frame'?'फ्रेम को उँगली से खिसकाकर सही जगह लाएँ।':'एक उँगली से फोटो खिसकाएँ, दो उँगलियों से पिंच करके ज़ूम करें।'}
$('mFrame').onclick=()=>setMode('frame');$('mPhoto').onclick=()=>setMode('photo');
$('fsize').oninput=e=>{if(st.f){st.f.r=+e.target.value;draw()}};
const ptr=new Map();let pd=0;
const dist=()=>{const [a,b]=[...ptr.values()];return Math.hypot(a.x-b.x,a.y-b.y)};
const setZ=z=>{st.z=Math.min(5,Math.max(1,z));$('zoom').value=st.z};
cv.onpointerdown=e=>{ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});cv.setPointerCapture(e.pointerId);if(ptr.size==2)pd=dist()};
cv.onpointermove=e=>{const p=ptr.get(e.pointerId);if(!p)return;const k=cv.width/cv.getBoundingClientRect().width,dx=(e.clientX-p.x)*k,dy=(e.clientY-p.y)*k;
 if(mode==='frame'){if(ptr.size==1&&st.f){const f=st.f;f.x=Math.min(1,Math.max(0,f.x+dx/cv.width));f.y=Math.min(1,Math.max(0,f.y+dy/cv.height))}}
 else if(photo&&ptr.size==1){st.ox+=dx;st.oy+=dy}
 p.x=e.clientX;p.y=e.clientY;
 if(mode!=='frame'&&photo&&ptr.size==2){const d=dist();if(pd)setZ(st.z*d/pd);pd=d}
 draw()};
cv.onpointerup=cv.onpointercancel=e=>{ptr.delete(e.pointerId);pd=0};
cv.onwheel=e=>{if(!photo)return;e.preventDefault();setZ(st.z*(e.deltaY<0?1.08:.93));draw()};
$('back').onclick=()=>{$('editor').hidden=true;$('gallerySec').scrollIntoView({behavior:'smooth'})};
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
$('dl').onclick=()=>run(save);
$('wa').onclick=()=>run(async b=>{const t='🙏 बाबा जी के साथ अपनी सुंदर तस्वीर यहाँ बनाएँ: '+C.WEBSITE_URL;
 const f=new File([b],'BabaJi-Poster.png',{type:'image/png'});
 try{if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],text:t});return}}
 catch(e){if(e.name==='AbortError')return;if(e.name==='NotAllowedError'){$('edErr').textContent='कृपया WhatsApp बटन एक बार फिर दबाएँ।';return}}
 save(b);setTimeout(()=>{location.href='https://api.whatsapp.com/send?text='+encodeURIComponent(t)},900)});
// ---- today / older images ----
(async()=>{const list=await getJSON('data/images.json');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date());
 const add=(box,it)=>{const d=document.createElement('div');d.className='item';d.innerHTML='<div class="ph"><img alt=""><span>चित्र उपलब्ध नहीं</span></div><b></b><div class="note"></div><button class="btn wa" style="margin-top:8px">WhatsApp स्टेटस लगाएँ</button>';
  const w=d.querySelector('.ph');setImg(d.querySelector('img'),it.image,w);d.querySelector('b').textContent=it.title;
  d.querySelector('.note').textContent=new Date(it.date+'T00:00:00').toLocaleDateString('hi-IN',{day:'numeric',month:'long',year:'numeric'});d.querySelector('button').onclick=()=>shareStatus(it);box.appendChild(d)};
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
