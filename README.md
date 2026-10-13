# बाबा जी पोस्टर वेबसाइट — Cloudflare Pages

## कहाँ क्या बदलें
- `assets/config.js`: बाबा जी का नाम/फोटो URL, नमूना चित्र URL, वेबसाइट URL
- `assets/baba-ji.jpg`: बाबा जी की फोटो रखें (या config में URL दें)
- `data/templates.json`: डिज़ाइन URL। `frame` = फोटो-गोले की जगह (x,y,r चौड़ाई का अनुपात)
- `data/images.json`: आज/पुराने चित्र (id, title, date `YYYY-MM-DD`, image)

## Telegram बोट
1. Telegram में @BotFather से `/newbot` करके token लें।
2. बोट को मैसेज भेजें, फिर `https://api.telegram.org/bot<TOKEN>/getUpdates` से अपना chat id लें।

## Cloudflare Pages deploy
1. प्रोजेक्ट GitHub पर डालें (कोई token कोड में न रखें)।
2. Cloudflare → Workers & Pages → Create → Pages → Connect to Git। Build command खाली, output directory `/`।
3. Settings → Variables and Secrets (Secret के रूप में): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `SESSION_SECRET` (कोई लंबा random टेक्स्ट)।
4. दोबारा deploy करें।

## नोट
- Template/नमूना इमेज की hosting पर CORS खुला (`Access-Control-Allow-Origin: *`) होना चाहिए, वरना डाउनलोड नहीं बनेगा। सबसे आसान: इमेज इसी प्रोजेक्ट के `assets/` में रखें।
- सत्र 5 दिन की HttpOnly कुकी है; सर्वर पर कुछ संग्रहीत नहीं होता।
- Rate limit सरल (हर Worker instance में) है; सख्त सुरक्षा के लिए Cloudflare Rate Limiting rule जोड़ें।
