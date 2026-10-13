import {json,makeCookie,validSession,limited,esc,tg} from '../lib/util.js';
export const onRequestGet=async({request,env})=>json({ok:await validSession(request,env)});
export async function onRequestPost({request,env}){
 if(limited(request))return json({ok:false,error:'बहुत अधिक प्रयास हुए, कुछ देर बाद फिर कोशिश करें।'},429);
 let b;try{b=await request.json()}catch{return json({ok:false,error:'गलत जानकारी।'},400)}
 const name=String(b.name||'').trim(),phone=String(b.phone||'').trim(),t=String(b.template||'').slice(0,40);
 if(name.length<2||name.length>80||!/^[6-9]\d{9}$/.test(phone))return json({ok:false,error:'कृपया सही नाम और मोबाइल नंबर लिखें।'},400);
 if(!env.SESSION_SECRET)return json({ok:false,error:'सर्वर सेटअप अधूरा है।'},500);
 try{const f=new FormData();f.append('chat_id',env.TELEGRAM_CHAT_ID);
  f.append('text',`🙏 नया उपयोगकर्ता\nनाम: ${esc(name)}\nमोबाइल: ${phone}\nडिज़ाइन: ${esc(t)}`);await tg(env,'sendMessage',f)}
 catch{return json({ok:false,error:'सूचना भेजने में समस्या हुई। कृपया बाद में प्रयास करें।'},502)}
 return json({ok:true},200,{'set-cookie':await makeCookie(env)})}
