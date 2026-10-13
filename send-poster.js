import {json,validSession,limited,esc,tg} from '../lib/util.js';
export async function onRequestPost({request,env}){
 if(!await validSession(request,env))return json({ok:false,error:'सत्र समाप्त हो गया है।'},401);
 if(limited(request,10))return json({ok:false,error:'बहुत अधिक अनुरोध।'},429);
 let fd;try{fd=await request.formData()}catch{return json({ok:false,error:'गलत डेटा।'},400)}
 const img=fd.get('image');
 if(!img||typeof img==='string'||img.size>8*1024*1024||!/^image\/(png|jpeg)$/.test(img.type))return json({ok:false,error:'इमेज गलत है या बहुत बड़ी है।'},400);
 try{const f=new FormData();f.append('chat_id',env.TELEGRAM_CHAT_ID);f.append('caption','🖼️ नया पोस्टर, डिज़ाइन: '+esc(String(fd.get('template')||'').slice(0,40)));f.append('photo',img,'poster.png');await tg(env,'sendPhoto',f)}
 catch{return json({ok:false,error:'Telegram पर भेजना विफल रहा।'},502)}
 return json({ok:true})}
