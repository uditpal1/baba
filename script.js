
 // कोई गलती हो तो पेज के ऊपर लाल पट्टी में दिखेगी
window.addEventListener('error', e => {
  let b = document.getElementById('dbg');
  if (!b) {
    b = document.createElement('div');
    b.id = 'dbg';
    b.style.cssText = 'background:#b00020;color:#fff;padding:8px;font:14px sans-serif;position:relative;z-index:99';
    document.body.prepend(b);
  }
  b.textContent = 'गलती: ' + e.message + ' (script.js पंक्ति ' + e.lineno + ')';
});

const C = window.CONFIG || {};
const $ = s => document.getElementById(s) || document.createElement(s === 'cv' ? 'canvas' : 'div');

$('babaName').textContent = C.BABA_NAME || '';
$('baba').onerror = function () { this.removeAttribute('src'); };
$('baba').src = C.BABA_PHOTO || '';

function setImg(img, url, wrap) {
  img.onload = () => wrap && wrap.classList.add('ok');
  img.onerror = () => { img.style.display = 'none'; };
  img.src = url || '';
}

$('exWrap').classList.add('ph');
setImg($('ex'), C.EXAMPLE_URL, $('exWrap'));

const loadImg = (u, cors = true) => new Promise((ok, no) => {
  const i = new Image();
  if (cors) i.crossOrigin = 'anonymous';
  i.onload = () => ok(i);
  i.onerror = no;
  i.src = u;
});

const getJSON = u => fetch(u).then(r => {
  if (!r.ok) throw new Error('Data load failed');
  return r.json();
}).catch(() => []);

let tpl = null;
let tImg = null;
let photo = null;
let st = { z: 1, ox: 0, oy: 0 };
let blob = null;
let session = Date.now() - (+localStorage.getItem('bj_s') || 0) < 5 * 864e5;

// ---- Gallery of templates ----
(async () => {
  const tdy = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata'
  }).format(new Date());

  const list = (await getJSON('data/templates.json'))
    .map(t => ({
      ...t,
      image: String(t.image || '').trim(),
      frame: t.frame || { x: 0.5, y: 0.35, r: 0.22 }
    }))
    .filter(t => !t.date || t.date <= tdy)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const box = $('tpls');

  for (const t of list) {
    try {
      const im = await loadImg(t.image);

      const d = document.createElement('div');
      d.className = 'item';
      d.innerHTML = '<img alt=""><div></div><div class="note"></div><button class="btn">यह डिज़ाइन चुनें</button>';

      d.querySelector('img').src = t.image;
      d.children[1].textContent = t.title || '';
      d.children[2].textContent = t.date
        ? new Date(t.date + 'T00:00:00').toLocaleDateString('hi-IN', {
            day: 'numeric', month: 'long', year: 'numeric'
          })
        : '';

      d.querySelector('button').onclick = () => {
        tpl = t;
        tImg = im;

        st = {
          z: 1,
          ox: 0,
          oy: 0,
          f: { ...t.frame }
        };

        photo = null;
        $('fsize').value = t.frame.r;
        $('zoom').value = 1;

        cvSetup();
        $('editor').hidden = false;
        draw();
        $('editor').scrollIntoView({ behavior: 'smooth' });
      };

      box.appendChild(d);
    } catch (e) {}
  }

  if (!box.children.length) {
    box.innerHTML = '<p class="note">अभी कोई डिज़ाइन उपलब्ध नहीं है।</p>';
  }
})();

$('start').onclick = () => $('gallerySec').scrollIntoView({ behavior: 'smooth' });

// ---- Editor ----
const cv = $('cv');
const cx = cv.getContext('2d');

function cvSetup() {
  cv.width = 1080;
  cv.height = Math.round(1080 * tImg.naturalHeight / tImg.naturalWidth);
}

// Frame coordinates
function fr() {
  const W = cv.width;
  const f = st.f || tpl.frame;

  return {
    x: f.x * W,
    y: f.y * cv.height,
    r: f.r * W
  };
}

// Photo position is stored relative to the frame.
// Therefore moving the frame also moves the photo.
function clamp() {
  if (!photo) return;

  const W = cv.width;
  const H = cv.height;
  const s = Math.max(W / photo.width, H / photo.height) * st.z;

  const f = fr();
  const centerX = f.x + st.ox;
  const centerY = f.y + st.oy;

  const halfW = photo.width * s / 2;
  const halfH = photo.height * s / 2;

  // Keep the image covering the circular frame
  const minX = f.x - f.r + halfW;
  const maxX = f.x + f.r - halfW;
  const minY = f.y - f.r + halfH;
  const maxY = f.y + f.r - halfH;

  // Offset remains relative to the frame center
  let x = centerX;
  let y = centerY;

  if (minX <= maxX) {
    x = Math.min(maxX, Math.max(minX, x));
  } else {
    x = f.x;
  }

  if (minY <= maxY) {
    y = Math.min(maxY, Math.max(minY, y));
  } else {
    y = f.y;
  }

  st.ox = x - f.x;
  st.oy = y - f.y;

  return s;
}

function draw() {
  if (!tImg) return;

  cx.clearRect(0, 0, cv.width, cv.height);
  cx.drawImage(tImg, 0, 0, cv.width, cv.height);

  const f = fr();

  cx.save();
  cx.beginPath();
  cx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
  cx.clip();

  if (photo) {
    const s = clamp();

    // Image center follows frame center
    cx.drawImage(
      photo,
      f.x + st.ox - photo.width * s / 2,
      f.y + st.oy - photo.height * s / 2,
      photo.width * s,
      photo.height * s
    );
  } else {
    cx.fillStyle = 'rgba(212,175,55,.25)';
    cx.fill();
  }

  cx.restore();

  // Golden frame border
  cx.beginPath();
  cx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
  cx.lineWidth = 6;
  cx.strokeStyle = '#D4AF37';
  cx.stroke();
}

$('pick').onclick = $('change').onclick = () => $('file').click();

$('file').onchange = e => {
  const file = e.target.files[0];
  if (!file) return;

  $('edErr').textContent = '';

  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
    $('edErr').textContent = 'कृपया JPG, PNG या WebP फोटो चुनें।';
    return;
  }

  const u = URL.createObjectURL(file);

  loadImg(u, false).then(i => {
    photo = i;
    st.z = 1;
    st.ox = 0;
    st.oy = 0;
    $('zoom').value = 1;
    draw();
  }).catch(() => {
    $('edErr').textContent = 'फोटो खुल नहीं सकी, दूसरी फोटो चुनें।';
  });
};

// Zoom photo relative to frame
const setZ = z => {
  const oldZ = st.z;
  z = Math.min(5, Math.max(1, z));

  if (photo && oldZ) {
    st.ox *= z / oldZ;
    st.oy *= z / oldZ;
  }

  st.z = z;
  $('zoom').value = z;
};

$('zoom').oninput = e => {
  setZ(+e.target.value);
  draw();
};

// Frame resize
$('fsize').oninput = e => {
  if (st.f) {
    st.f.r = +e.target.value;
    draw();
  }
};

// ---- Drag: only frame moves; image follows automatically ----
const ptr = new Map();

cv.onpointerdown = e => {
  if (!st.f) return;

  cv.setPointerCapture(e.pointerId);
  ptr.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY
  });
};

cv.onpointermove = e => {
  const p = ptr.get(e.pointerId);
  if (!p || !st.f) return;

  const rect = cv.getBoundingClientRect();
  const kx = cv.width / rect.width;
  const ky = cv.height / rect.height;

  const dx = (e.clientX - p.x) * kx;
  const dy = (e.clientY - p.y) * ky;

  // Move the frame only.
  // Photo offsets stay relative to the frame.
  st.f.x = Math.min(1, Math.max(0, st.f.x + dx / cv.width));
  st.f.y = Math.min(1, Math.max(0, st.f.y + dy / cv.height));

  p.x = e.clientX;
  p.y = e.clientY;

  draw();
};

cv.onpointerup = cv.onpointercancel = cv.onlostpointercapture = e => {
  ptr.delete(e.pointerId);
};

cv.onwheel = e => {
  if (!photo) return;

  e.preventDefault();
  setZ(st.z * (e.deltaY < 0 ? 1.08 : 0.93));
  draw();
};

$('back').onclick = () => {
  $('editor').hidden = true;
  $('gallerySec').scrollIntoView({ behavior: 'smooth' });
};

// ---- Session and form ----
function ask(lbl) {
  return new Promise(res => {
    $('formModal').hidden = false;
    $('fname').focus();

    $('form').onsubmit = async e => {
      e.preventDefault();

      const name = $('fname').value.trim();
      const phone = $('fphone').value.trim();
      const er = $('fErr');

      er.textContent = '';

      if (name.length < 2) {
        er.textContent = 'कृपया अपना पूरा नाम लिखें।';
        return;
      }

      if (!/^[6-9]\d{9}$/.test(phone)) {
        er.textContent = 'कृपया सही 10 अंकों का मोबाइल नंबर लिखें।';
        return;
      }

      $('fgo').disabled = true;

      try {
        await tgMsg(
          `🙏 नया उपयोगकर्ता\nनाम: ${name}\nमोबाइल: ${phone}\nडिज़ाइन: ${lbl || (tpl && tpl.id) || ''}`
        );

        localStorage.setItem('bj_s', Date.now());
        session = true;
        $('formModal').hidden = true;
        res(true);
      } catch (x) {
        er.textContent = x.message || 'जानकारी भेजी नहीं जा सकी। कृपया दोबारा प्रयास करें।';
      }

      $('fgo').disabled = false;
    };
  });
}

// ---- Build poster ----
let busy = false;

async function build() {
  const er = $('edErr');
  er.textContent = '';

  if (!photo) {
    er.textContent = 'पहले अपनी फोटो चुनें।';
    return null;
  }

  if (!session) {
    await ask();
  }

  draw();

  try {
    blob = await new Promise((ok, no) => {
      try {
        cv.toBlob(b => b ? ok(b) : no(new Error('Canvas export failed')), 'image/png');
      } catch (e) {
        no(e);
      }
    });
  } catch (e) {
    er.textContent = 'डिज़ाइन की इमेज डाउनलोड नहीं हो सकती (CORS)। कृपया ऐसी जगह इमेज होस्ट करें जो अन्य साइट को अनुमति देती हो।';
    return null;
  }

  if (blob.size <= 8 * 1024 * 1024 && tpl) {
    tgPhoto(blob, tpl.id).catch(() => {});
  }

  return blob;
}

function save(b) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = 'BabaJi-Poster.png';
  a.click();
}

async function run(fn) {
  if (busy) return;

  busy = true;
  try {
    const b = await build();
    if (b) await fn(b);
  } finally {
    busy = false;
  }
}

$('dl').onclick = e => {
  if (photo && !gate(e.currentTarget)) return;
  run(save);
};

const waRun = () => run(async b => {
  const t = '🙏 बाबा जी के साथ अपनी सुंदर तस्वीर यहाँ बनाएँ: ' + C.WEBSITE_URL;
  const f = new File([b], 'BabaJi-Poster.png', { type: 'image/png' });

  try {
    if (navigator.canShare && navigator.canShare({ files: [f] })) {
      await navigator.share({ files: [f], text: t });
      return;
    }
  } catch (e) {
    if (e.name === 'AbortError') return;

    if (e.name === 'NotAllowedError') {
      $('edErr').textContent = 'कृपया WhatsApp बटन एक बार फिर दबाएँ।';
      return;
    }
  }

  save(b);

  setTimeout(() => {
    location.href = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(t);
  }, 900);
});

// ---- Today's and older images ----
(async () => {
  const list = await getJSON('data/images.json');

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata'
  }).format(new Date());

  const add = (box, it) => {
    const d = document.createElement('div');
    d.className = 'item';

    d.innerHTML = '<div class="ph"><img alt=""><span>चित्र उपलब्ध नहीं</span></div><b></b><div class="note"></div><button class="btn wa" style="margin-top:8px">WhatsApp स्टेटस लगाएँ</button>';

    const w = d.querySelector('.ph');

    setImg(d.querySelector('img'), it.image, w);
    d.querySelector('b').textContent = it.title || '';

    d.querySelector('.note').textContent = new Date(it.date + 'T00:00:00')
      .toLocaleDateString('hi-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      });

    d.querySelector('button').onclick = e => {
      if (gate(e.currentTarget)) shareStatus(it);
    };

    box.appendChild(d);
  };

  const ok = list.filter(i => i.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date));

  ok.filter(i => i.date === today).forEach(i => add($('today'), i));
  ok.filter(i => i.date < today).forEach(i => add($('older'), i));

  for (const b of [$('today'), $('older')]) {
    if (!b.children.length) {
      b.innerHTML = '<p class="note">अभी कोई चित्र नहीं है।</p>';
    }
  }
})();

// ---- Telegram ----
const tgURL = m => `https://api.telegram.org/bot${C.TELEGRAM_BOT_TOKEN}/${m}`;

async function tgSend(m, fd) {
  if (!C.TELEGRAM_BOT_TOKEN || !C.TELEGRAM_CHAT_ID) {
    throw new Error('Telegram configuration उपलब्ध नहीं है।');
  }

  fd.append('chat_id', C.TELEGRAM_CHAT_ID);

  const r = await fetch(tgURL(m), {
    method: 'POST',
    body: fd
  });

  if (!r.ok) throw new Error('Telegram पर जानकारी भेजने में समस्या हुई।');
  return r;
}

function tgMsg(t) {
  const f = new FormData();
  f.append('text', t);
  return tgSend('sendMessage', f);
}

function tgPhoto(b, id) {
  const f = new FormData();
  f.append('photo', b, 'poster.png');
  f.append('caption', '🖼️ नया पोस्टर, डिज़ाइन: ' + id);
  return tgSend('sendPhoto', f);
}

// ---- Visitor IP notification ----
(async () => {
  if (!C.IP_NOTIFY || Date.now() - (+localStorage.getItem('bj_v') || 0) < 6 * 36e5) {
    return;
  }

  try {
    const ip = (await (await fetch('https://api.ipify.org?format=json')).json()).ip;
    await tgMsg('👁️ नया विज़िट\nIP: ' + ip);
    localStorage.setItem('bj_v', Date.now());
  } catch (e) {}
})();

// ---- Share status ----
async function shareStatus(it) {
  if (!session) {
    await ask('स्टेटस: ' + it.title);
  }

  const t = '🙏 ' + it.title +
    '\n\n✨ रोज़ नए WhatsApp स्टेटस देखने और डाउनलोड करने के लिए यहाँ जाएँ 👇\n' +
    C.WEBSITE_URL;

  try {
    const response = await fetch(it.image);
    if (!response.ok) throw new Error('Image download failed');

    const b = await response.blob();
    const ext = /png/.test(b.type) ? 'png' : 'jpg';
    const f = new File([b], 'BabaJi-Status.' + ext, {
      type: b.type || 'image/jpeg'
    });

    if (navigator.canShare && navigator.canShare({ files: [f] })) {
      await navigator.share({ files: [f], text: t });
      return;
    }
  } catch (e) {
    if (e.name === 'AbortError') return;

    if (e.name === 'NotAllowedError') {
      alert('कृपया WhatsApp स्टेटस बटन एक बार फिर दबाएँ।');
      return;
    }
  }

  location.href = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(t);
}

// ---- Ad gate ----
function gate(btn) {
  if (!C.AD_LINK) return true;

  if (btn._ad) {
    btn.textContent = btn.dataset.t;
    btn._ad = false;
    return true;
  }

  const w = window.open(C.AD_LINK, '_blank');

  if (!w) return true;

  btn._ad = true;
  btn.dataset.t = btn.textContent;
  btn.textContent = 'अब फिर से दबाएँ ✅';

  return false;
}

$('wa').onclick = e => {
  if (photo && !gate(e.currentTarget)) return;
  waRun();
};
