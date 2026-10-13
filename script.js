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
  d.querySelector('button').onclick=()=>{tpl=t;tImg=im;st={z:1,ox:0,oy:0};photo=null;$('zoom').value=1;cvSetup();$('editor').hidden=false;$('result').hidden=true;draw();$('editor').scrollIntoView({behavior:'smooth'})};
  box.appendChild(d)}catch(e){}}
 if(!box.children.length)box.innerHTML='<p class="note">अभी कोई डिज़ाइन उपलब्ध नहीं है।</p>'})();
$('start').onclick=()=>$('gallerySec').scrollIntoView({behavior:'smooth'});
// ---- editor ----
const cv=$('cv'),cx=cv.getContext('2d');
function cvSetup(){cv.width=1080;cv.height=Math.round(1080*tImg.naturalHeight/tImg.naturalWidth)}
function fr(){const W=cv.width;return{x:tpl.frame.x*W,y:tpl.frame.y*cv.height,r:tpl.frame.r*W}}
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
 const u=URL.createObjectURL(f);loadImg(u,false).then(i=>{photo=i;st={z:1,ox:0,oy:0};$('zoom').value=1;draw()}).catch(()=>$('edErr').textContent='फोटो खुल नहीं सकी, दूसरी फोटो चुनें।')};
$('zoom').oninput=e=>{st.z=+e.target.value;draw()};
let drag=null;cv.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};cv.setPointerCapture(e.pointerId)};
cv.onpointermove=e=>{if(!drag||!photo)return;const k=cv.width/cv.getBoundingClientRect().width;st.ox+=(e.clientX-drag.x)*k;st.oy+=(e.clientY-drag.y)*k;drag={x:e.clientX,y:e.clientY};draw()};
cv.onpointerup=()=>drag=null;
$('back').onclick=()=>{$('editor').hidden=true;$('gallerySec').scrollIntoView({behavior:'smooth'})};
// ---- session + form ----
session=Date.now()-(+localStorage.getItem('bj_s')||0)<5*864e5; // 5 दिन
function ask(){return new Promise(res=>{$('formModal').hidden=false;$('fname').focus();$('form').onsubmit=async e=>{e.preventDefault();
 const name=$('fname').value.trim(),phone=$('fphone').value.trim(),er=$('fErr');er.textContent='';
 if(name.length<2){er.textContent='कृपया अपना पूरा नाम लिखें।';return}
 if(!/^[6-9]\d{9}$/.test(phone)){er.textContent='कृपया सही 10 अंकों का मोबाइल नंबर लिखें।';return}
 $('fgo').disabled=true;
 try{await tgMsg(`🙏 नया उपयोगकर्ता\nनाम: ${name}\nमोबाइल: ${phone}\nडिज़ाइन: ${tpl.id}`);
  localStorage.setItem('bj_s',Date.now());session=true;$('formModal').hidden=true;res(true)}
 catch(x){er.textContent=x.message||'जानकारी भेजी नहीं जा सकी। कृपया दोबारा प्रयास करें।'}
 $('fgo').disabled=false}})}
// ---- make poster ----
$('make').onclick=async()=>{const er=$('edErr');er.textContent='';
 if(!photo){er.textContent='पहले अपनी फोटो चुनें।';return}
 if(!session)await ask();
 draw();
 try{blob=await new Promise((ok,no)=>{try{cv.toBlob(b=>b?ok(b):no(),'image/png')}catch(e){no(e)}})}
 catch(e){er.textContent='डिज़ाइन की इमेज सुरक्षित रूप से डाउनलोड नहीं हो सकती (CORS)। कृपया ऐसी जगह इमेज होस्ट करें जो अन्य साइट को अनुमति देती हो।';return}
 $('out').src=URL.createObjectURL(blob);$('result').hidden=false;$('result').scrollIntoView({behavior:'smooth'});
 $('resMsg').textContent='';
 if(blob.size>8*1024*1024){return}
  tgPhoto(blob,tpl.id).catch(()=>{})};
$('dl').onclick=()=>{if(!blob)return;const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='BabaJi-Poster.png';a.click()};
$('wa').onclick=async()=>{if(!blob)return;const text='🙏 बाबा जी के साथ अपनी सुंदर तस्वीर यहाँ बनाएँ: '+C.WEBSITE_URL;
 const file=new File([blob],'BabaJi-Poster.png',{type:'image/png'});
 try{if(navigator.canShare&&navigator.canShare({files:[file],text})){await navigator.share({files:[file],text});return}}catch(e){if(e.name==='AbortError')return}
 $('dl').click();$('resMsg').textContent='तस्वीर डाउनलोड हो गई है। WhatsApp खुलने पर उसे जोड़ें।';
 window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank')};
$('again').onclick=()=>{$('result').hidden=true;$('editor').hidden=true;$('gallerySec').scrollIntoView({behavior:'smooth'})};
// ---- today / older images ----
(async()=>{const list=await getJSON('data/images.json');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata'}).format(new Date());
 const add=(box,it)=>{const d=document.createElement('div');d.className='item';d.innerHTML='<div class="ph"><img alt=""><span>चित्र उपलब्ध नहीं</span></div><b></b><div class="note"></div>';
  const w=d.querySelector('.ph');setImg(d.querySelector('img'),it.image,w);d.querySelector('b').textContent=it.title;
  d.querySelector('.note').textContent=new Date(it.date+'T00:00:00').toLocaleDateString('hi-IN',{day:'numeric',month:'long',year:'numeric'});box.appendChild(d)};
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
