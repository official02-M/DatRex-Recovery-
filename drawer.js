// ============================================
// DatRex — Dynamic shell injector + transfer wizard
// ============================================

(function() {
  
  const NAV = [
    { href: 'dashboard.html', icon: 'fa-house', label: 'Home' },
    { href: 'transfer-internal.html', icon: 'fa-arrow-right-arrow-left', label: 'Internal Transfer' },
    { href: 'transfer-bank.html', icon: 'fa-building-columns', label: 'Bank Transfer' },
    { href: 'transactions.html', icon: 'fa-clock-rotate-left', label: 'History' },
    { href: 'notifications.html', icon: 'fa-bell', label: 'Alerts' },
    { href: 'profile.html', icon: 'fa-user', label: 'Profile' }
  ];
  
  function currentPage() {
    return (location.pathname.split('/').pop() || 'dashboard.html').toLowerCase();
  }
  
  function initials(name) {
    return (name || 'U').trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
  }
  
  function buildShell(profile) {
    const page = currentPage();
    const isAdmin = profile.email === STB_ADMIN_EMAIL;
    
    // ---- Sidebar ----
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.id = 'sbSidebar';
    sidebar.innerHTML = `
      <div class="sb-brand">
        <i class="fa-solid fa-shield-halved"></i>
        <div>${STB_BRAND_SHORT}<small>${STB_BRAND}</small></div>
      </div>
      <nav class="sb-nav">
        ${NAV.map(n => `
          <a class="sb-link ${page === n.href ? 'active' : ''}" href="${n.href}">
            <i class="fa-solid ${n.icon}"></i><span>${n.label}</span>
          </a>`).join('')}
        ${isAdmin ? `
          <a class="sb-link ${page === 'admin.html' ? 'active' : ''}" href="admin.html">
            <i class="fa-solid fa-user-shield"></i><span>Admin</span>
          </a>` : ''}
      </nav>
      <div class="sb-foot">
        <a class="sb-link" href="#" id="sbLogout">
          <i class="fa-solid fa-right-from-bracket"></i><span>Sign out</span>
        </a>
      </div>
    `;
    
    // ---- Topbar ----
    const topbar = document.createElement('header');
    topbar.className = 'topbar';
    topbar.innerHTML = `
      <div class="tb-left">
        <button class="tb-menu" id="tbMenu"><i class="fa-solid fa-bars"></i></button>
        <div class="tb-title">
          ${NAV.find(n => n.href === page)?.label || 'Dashboard'}
          <small>${STB_BRAND}</small>
        </div>
      </div>
      <div class="tb-right">
        <button class="tb-icon" id="tbBell">
          <i class="fa-regular fa-bell"></i>
          <span class="dot hidden" id="tbNotifDot"></span>
        </button>
        <div class="tb-avatar">${initials(profile.fullName)}</div>
      </div>
    `;
    
    // ---- Bottom dock ----
    const dock = document.createElement('nav');
    dock.className = 'bottom-dock';
    dock.innerHTML = `
      <a class="dock-link ${page === 'dashboard.html' ? 'active' : ''}" href="dashboard.html">
        <i class="fa-solid fa-house"></i><span>Home</span>
      </a>
      <a class="dock-link ${page === 'transfer-internal.html' || page === 'transfer-bank.html' ? 'active' : ''}" href="transfer-internal.html">
        <i class="fa-solid fa-wallet"></i><span>Transfer</span>
      </a>
      <button class="dock-link dock-fab" id="dockTransfer">
        <i class="fa-solid fa-arrow-right-arrow-left"></i>
      </button>
      <a class="dock-link ${page === 'notifications.html' ? 'active' : ''}" href="notifications.html">
        <i class="fa-solid fa-bell"></i><span>Alerts</span>
      </a>
      <a class="dock-link ${page === 'profile.html' ? 'active' : ''}" href="profile.html">
        <i class="fa-solid fa-user"></i><span>Profile</span>
      </a>
    `;
    
    document.body.prepend(sidebar, topbar, dock);
    
    // ---- Wire up ----
    document.getElementById('sbLogout').addEventListener('click', async (e) => {
      e.preventDefault();
      await auth.signOut();
      location.href = 'login.html';
    });
    document.getElementById('tbMenu').addEventListener('click', () => {
      sidebar.classList.add('open');
    });
    document.getElementById('tbBell').addEventListener('click', () => {
      location.href = 'notifications.html';
    });
    document.getElementById('dockTransfer').addEventListener('click', () => {
      location.href = 'transfer-internal.html';
    });
    
    // close sidebar on outside click
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        !e.target.closest('#tbMenu')) {
        sidebar.classList.remove('open');
      }
    });
    
    // unread notification dot
    db.collection(STB_C.notifications)
      .where('uid', '==', profile.id)
      .where('read', '==', false)
      .onSnapshot(snap => {
        const dot = document.getElementById('tbNotifDot');
        if (dot) dot.classList.toggle('hidden', snap.empty);
      });
  }
  
  // ============================================
  // BOOT
  // ============================================
  async function boot() {
    const { profile } = await stbRequireAuth();
    buildShell(profile);
    
    window.stbProfile = profile;
    document.dispatchEvent(new CustomEvent('stb:ready', { detail: profile }));
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();