function adminLogin(){app.innerHTML='<div class="wrap"><section class="card"><button class="back" onclick="welcome()">← Orqaga</button><h1 class="title">Katta administrator</h1><div class="field"><label>Login</label><input id="au"></div><div class="field"><label>Parol</label><input id="ap" type="password"></div><button class="btn" onclick="doAdminLogin()">Kirish</button><div id="adminMsg"></div></section></div>'}
async function doAdminLogin(){const msg=document.getElementById('adminMsg');try{const r=await fetch(API+'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:au.value,password:ap.value})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Xatolik');save('myschool_admin_token',d.token);adminPanel()}catch(e){msg.className='error';msg.textContent=e.message}}
function closeAdminMenu(){document.body.classList.remove('admin-menu-open')}
async function adminPanel(forceRefresh=false){window.clearTimeout(window._adminRefreshTimer);closeAdminMenu();const token=get('myschool_admin_token');if(!token)return adminLogin();app.innerHTML='<div class="admin-shell"><aside class="admin-sidebar"><div class="admin-logo"><span>🎓</span><div><b>STEM SCHOOL</b><small>BIG ADMIN</small></div></div><nav class="admin-nav"><button class="admin-nav-item active" onclick="adminPanel()"><span>▦</span>Dashboard</button><button class="admin-nav-item" onclick="studentManagement()"><span>👨‍🎓</span>O‘quvchilar</button><button class="admin-nav-item" onclick="adminStaff()"><span>👨‍💼</span>Ishchilar / Kabinetlar</button><button class="admin-nav-item" onclick="adminContent(\'announcements\')"><span>📢</span>E’lonlar</button><button class="admin-nav-item" onclick="adminContent(\'library\')"><span>📚</span>Kitobxona</button><button class="admin-nav-item" onclick="adminContent(\'social\')"><span>🌐</span>Ijtimoiy tarmoqlar</button><button class="admin-nav-item" onclick="adminSchedule()"><span>📅</span>Jadval</button><button class="admin-nav-item" onclick="adminSubjects()"><span>📖</span>Fanlar va darslar</button><button class="admin-nav-item" onclick="adminTests()"><span>🧪</span>Testlar</button><button class="admin-nav-item" onclick="adminResults()"><span>📊</span>Natijalar</button><button class="admin-nav-item" onclick="adminMedia()"><span>🖼️</span>Bannerlar / Rasmlar</button><button class="admin-nav-item" onclick="adminTelegramBot()"><span>🤖</span>Telegram Bot</button><button class="admin-nav-item" onclick="adminSupport()"><span>💬</span>Support</button></nav><button class="admin-logout" onclick="localStorage.removeItem(\'myschool_admin_token\');welcome()">↪ Chiqish</button></aside><div class="admin-main"><header class="admin-topbar"><button class="admin-menu" onclick="document.body.classList.toggle(\'admin-menu-open\')">☰</button><div><div class="admin-page-title">Dashboard</div><div class="admin-page-subtitle">Maktab boshqaruv paneli</div></div><div class="admin-profile"><div class="admin-avatar">A</div><div><b>Katta administrator</b><small>Administrator</small></div></div></header><main class="admin-content"><section class="admin-welcome"><div><span class="admin-eyebrow">STEM SCHOOL</span><h1>Assalomu alaykum 👋</h1><p>Maktab tizimini boshqarish uchun kerakli bo‘limni tanlang.</p></div><button class="admin-refresh" onclick="adminPanel(true)">↻ Yangilash</button></section><section class="admin-stats"><div class="admin-stat"><span>👨‍🎓</span><div><small>O‘quvchilar</small><strong id="statStudents">—</strong></div></div><div class="admin-stat"><span>🔔</span><div><small>Kutilayotgan arizalar</small><strong id="statPending">—</strong></div></div><div class="admin-stat"><span>📢</span><div><small>E’lonlar</small><strong id="statAnnouncements">—</strong></div></div><div class="admin-stat"><span>📚</span><div><small>Kitoblar</small><strong id="statLibrary">—</strong></div></div></section><section class="admin-card"><div class="admin-card-head"><div><h2>Yangi o‘quvchi arizalari</h2><p>Tasdiqlash yoki rad etish</p></div><span class="admin-live">● LIVE</span></div><div id="adminList">Yuklanmoqda...</div></section></main></div></div>';try{const r=await fetch(API+'/api/admin/applications?ts='+Date.now(),{headers:{Authorization:'Bearer '+token,'Cache-Control':'no-cache'},cache:'no-store'});if(r.status===401)throw new Error('Sessiya tugagan.');const d=await r.json(),list=document.getElementById('adminList');document.getElementById('statPending').textContent=d.items.length;if(!d.items.length){list.innerHTML='<div class="admin-empty">Hozircha yangi ariza yo‘q.</div>'}else list.innerHTML=d.items.map(a=>'<article class="admin-application"><div class="admin-app-icon">👤</div><div class="admin-app-info"><h3>'+esc(a.firstName)+' '+esc(a.lastName)+'</h3><p>Sinf: <b>'+esc(a.className)+'</b> · Maktab kodi: '+esc(a.schoolCode||'kiritilmagan')+'</p>'+(a.photoData?'<img src="'+a.photoData+'" alt="O‘quvchi rasmi" style="width:110px;height:110px;object-fit:cover;border-radius:16px;margin-top:10px;border:1px solid rgba(0,0,0,.1)">':'<div class="muted">Rasm yo‘q</div>')+'</div><div class="admin-app-actions"><button class="admin-approve" onclick="approve(\''+a._id+'\')">Tasdiqlash</button><button class="admin-reject" onclick="rejectApp(\''+a._id+'\')">Rad etish</button></div></article>').join('');const sr=await fetch(API+'/api/admin/students?search=&ts='+Date.now(),{headers:{Authorization:'Bearer '+token,'Cache-Control':'no-cache'},cache:'no-store'});if(sr.ok){const sd=await sr.json();document.getElementById('statStudents').textContent=sd.items.length}const ar=await fetch(API+'/api/admin/content?kind=announcements&ts='+Date.now(),{headers:{Authorization:'Bearer '+token,'Cache-Control':'no-cache'},cache:'no-store'});if(ar.ok){const ad=await ar.json();document.getElementById('statAnnouncements').textContent=ad.items.length}const lr=await fetch(API+'/api/admin/content?kind=library&ts='+Date.now(),{headers:{Authorization:'Bearer '+token,'Cache-Control':'no-cache'},cache:'no-store'});if(lr.ok){const ld=await lr.json();document.getElementById('statLibrary').textContent=ld.items.length}}catch(e){const el=document.getElementById('adminList');if(el)el.innerHTML='<div class="admin-error">Arizalar yuklanmadi: '+esc(e.message)+'<br><button class="btn secondary" onclick="adminPanel(true)">↻ Qayta urinish</button></div>'}finally{window._adminRefreshTimer=window.setTimeout(()=>{if(document.getElementById('adminList'))adminPanel(true)},5000)}}
async function bootAdminFromTelegram(){
  const key=new URLSearchParams(location.search).get('telegram_key');
  if(!key)return false;
  try{
    const r=await fetch(API+'/api/admin/telegram-session/'+encodeURIComponent(key));
    const d=await r.json();
    if(!r.ok)throw new Error(d.error||'Telegram sessiyasi yaroqsiz.');
    save('myschool_admin_token',d.token);
    history.replaceState({},document.title,'/admin');
    adminPanel();
    return true;
  }catch(e){
    history.replaceState({},document.title,'/admin');
    adminLogin();
    const box=document.getElementById('adminMsg');if(box){box.className='error';box.textContent=e.message;}
    return true;
  }
}
if(location.pathname==='/admin'||location.pathname==='/admin/'){
  bootAdminFromTelegram().then(done=>{if(!done)adminLogin()});
}else if(location.pathname==='/staff'||location.pathname==='/staff/'){
  staffLoginPage();
}else{
  (async()=>{
    const synced=await syncTelegramAccount();
    if(synced.telegram){
      if(synced.status==='approved')home();
      else if(synced.status==='pending')pending();
      else if(synced.status==='not_registered'||synced.status==='rejected')welcome();
    }else{
      // Oddiy sayt ochilganda ham welcome ekrani ko‘rsatiladi.
      // Telegram Mini App bo‘lsa, syncTelegramAccount() yuqoridagi holatlarni boshqaradi.
      welcome();
    }
  })();
}