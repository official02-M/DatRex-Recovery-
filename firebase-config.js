// ============================================
// DatRex Recovery Agency — shared Firebase config
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyAMucqvSoBlUo5jn5Pu4ClQIGRlInu55mQ",
  authDomain: "project-app-259f2.firebaseapp.com",
  projectId: "project-app-259f2",
  storageBucket: "project-app-259f2.firebasestorage.app",
  messagingSenderId: "389607996830",
  appId: "1:389607996830:web:a9e456c60e4608f1a9ea8f"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db   = firebase.firestore();

const STB_ADMIN_EMAIL  = 'enjoygfd42@gmail.com';
const STB_BRAND        = 'DatRex Recovery Agency';
const STB_BRAND_SHORT  = 'DatRex';

const STB_C = {
  users:         'users',
  accounts:      'accounts',
  transactions:  'transactions',
  codes:         'transferCodes',
  notifications: 'notifications'
};

function stbMoney(n) {
  return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function stbDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function stbGenAccountNumber() {
  let s = '';
  for (let i = 0; i < 10; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function stbGenReference() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const r = Math.floor(1000 + Math.random() * 9000);
  return `DRX-${y}${m}${day}-${r}`;
}

async function stbHashPin(pin) {
  const buf = new TextEncoder().encode('datarex$' + pin + '$v1');
  const h   = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function stbNotify(uid, title, body, type = 'info') {
  return db.collection(STB_C.notifications).add({
    uid, title, body, type, read: false, createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

function stbonAuth(cb) { return auth.onAuthStateChanged(cb); }

async function stbGetUser(uid) {
  const snap = await db.collection(STB_C.users).doc(uid).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

function stbToast(msg, type) {
  let el = document.getElementById('stb-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'stb-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'stb-toast show' + (type ? ' ' + type : '');
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.className = 'stb-toast'; }, 2800);
}

function stbConfetti() {
  const c = document.createElement('canvas');
  c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99999';
  c.width = innerWidth; c.height = innerHeight;
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  const colors = ['#16a34a','#22c55e','#15803d','#fbbf24','#60a5fa','#f472b6'];
  const parts = [];
  for (let i = 0; i < 140; i++) {
    parts.push({
      x: innerWidth/2, y: innerHeight/2 - 40,
      vx: (Math.random() - 0.5) * 16, vy: Math.random() * -16 - 4,
      size: 4 + Math.random() * 8, color: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 0.4, life: 1
    });
  }
  let t0 = performance.now();
  function draw(now) {
    const dt = Math.min((now - t0) / 16.67, 3);
    t0 = now;
    ctx.clearRect(0, 0, c.width, c.height);
    let alive = false;
    for (const p of parts) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.6 * dt; p.rot += p.vr * dt; p.life -= 0.006 * dt;
      if (p.life > 0) alive = true;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.55); ctx.restore();
    }
    if (alive) requestAnimationFrame(draw); else c.remove();
  }
  requestAnimationFrame(draw);
}

function stbRequireAuth() {
  return new Promise((resolve) => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      unsub();
      if (!user) { location.href = 'login.html'; return; }
      const u = await stbGetUser(user.uid);
      if (!u) { await auth.signOut(); location.href = 'login.html'; return; }
      if (u.status === 'pending') { location.href = 'pending.html'; return; }
      if (u.status === 'blocked') {
        await auth.signOut(); location.href = 'login.html?blocked=1'; return;
      }
      resolve({ user, profile: u });
    });
  });
}