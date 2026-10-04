/* MySchool Registration V2 — isolated rebuild of registration/admin student flow.
   Loaded after script.js so unrelated modules remain untouched. */
(function(){
  const API2 = window.API || 'https://myschool-ai.onrender.com';
  const A = window.app || document.getElementById('app');
  const esc2 = window.esc || (s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
  const get2 = window.get || (k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(_){return null}});
  const save2 = window.save || ((k,v)=>localStorage.setItem(k,JSON.stringify(v)));
  const classes2 = ['A','B','G','V'].flatMap(l=>Array.from({length:11},(_,i)=>(i+1)+'-'+l));

  function tgInit(){try{return window.Telegram?.WebApp?.initData||''}catch(_){return ''}}

  window.welcome = function(){
    A.innerHTML='<section class="screen"><div class="panel center"><div class="cap">🎓</div><div class="brand">STEM SCHOOL</div><div class="divider"></div><div class="welcome-sub">Maktab tizimi</div><button class="primary" onclick="studentLoginPage()">KIRISH</button><button class="btn secondary" style="margin-top:10px" onclick="registerV2()">RO‘YXATDAN O‘TISH</button><button class="btn secondary" style="margin-top:10px" onclick="adminLogin()">KATTA ADMIN</button></div></section>';
  };

  window.register = window.registerV2 = function(){
    A.innerHTML='<div class="wrap"><section class="card"><button class="back" onclick="welcome()">← Orqaga</button><h1 class="title">Ro‘yxatdan o‘tish</h1><p class="muted">Ma’lumotlarni to‘ldiring. Ariza Katta Admin tekshiruviga yuboriladi.</p><form id="regV2">'+
      '<div class="field"><label>Ism</label><input id="rFirst" required maxlength="60" autocomplete="given-name"></div>'+
      '<div class="field"><label>Familiya</label><input id="rLast" required maxlength="60" autocomplete="family-name"></div>'+
      '<div class="field"><label>Sinf</label><select id="rClass" required><option value="">Sinfni tanlang</option>'+classes2.map(x=>'<option value="'+x+'">'+x+'</option>').join('')+'</select></div>'+
      '<div class="field"><label>Maktab kodi</label><input id="rSchool" maxlength="40" placeholder="Agar berilgan bo‘lsa"></div>'+
      '<div class="field"><label>📸 O‘quvchi rasmi</label><input id="rPhoto" type="file" accept="image/jpeg" capture="user" required><div id="rPhotoMsg" class="status">JPEG rasm tanlang yoki kamerada oling.</div></div>'+
      '<button class="btn" id="rSubmit">Ariza yuborish</button><div id="rMsg"></div></form></section></div>';
    document.getElementById('regV2').onsubmit=submitV2;
  };

  async function submitV2(e){
    e.preventDefault();
    const msg=document.getElementById('rMsg'), btn=document.getElementById('rSubmit'), file=document.getElementById('rPhoto').files?.[0];
    if(!file){msg.className='error';msg.textContent='Rasm majburiy.';return}
    if(file.type!=='image/jpeg'){msg.className='error';msg.textContent='Faqat JPEG rasm qabul qilinadi.';return}
    if(file.size>650000){msg.className='error';msg.textContent='Rasm hajmi 650 KB dan oshmasin.';return}
    btn.disabled=true;msg.className='status';msg.textContent='Ariza yuborilmoqda...';
    try{
      const photo=await fileToData(file);
      const r=await fetch(API2+'/api/students/register',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({
        firstName:document.getElementById('rFirst').value.trim(),
        lastName:document.getElementById('rLast').value.trim(),
        className:document.getElementById('rClass').value,
        schoolCode:document.getElementById('rSchool').value.trim(),
        photoData:photo,telegramInitData:tgInit()
      })});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.error||'Ariza yuborilmadi.');
      save2('myschool_pending_application',d.applicationId);
      showPendingV2(d.applicationId);
    }catch(err){msg.className='error';msg.textContent=err.message}
    finally{btn.disabled=false}
  }
  function fileToData(file){return new Promise((resolve,reject)=>{const rd=new FileReader();rd.onload=()=>resolve(rd.result);rd.onerror=()=>reject(new Error('Rasmni o‘qib bo‘lmadi.'));rd.readAsDataURL(file)})}

  window.showPendingV2=function(id){
    A.innerHTML='<div class="wrap"><section class="card center"><div class="logo">⏳</div><h1 class="title">Ariza qabul qilindi</h1><p class="muted">Katta administrator arizani tekshiradi.</p><div id="pendingV2" class="status">Holat tekshirilmoqda...</div><button class="btn secondary" onclick="checkPendingV2()">↻ Tekshirish</button><button class="back" onclick="welcome()">← Bosh sahifa</button></section></div>';
    window.__pendingV2=id; checkPendingV2(); clearInterval(window.__pendingTimer); window.__pendingTimer=setInterval(checkPendingV2,10000);
  };
  window.checkPendingV2=async function(){
    const id=window.__pendingV2||get2('myschool_pending_application'); if(!id)return;
    try{
      const r=await fetch(API2+'/api/students/status/'+encodeURIComponent(id)+'?ts='+Date.now(),{cache:'no-store'}),d=await r.json();
      const box=document.getElementById('pendingV2');if(!box)return;
      if(!r.ok)throw new Error(d.error||'Holatni olishda xatolik.');
      if(d.status==='approved'){clearInterval(window.__pendingTimer);save2('myschool_student',{studentId:d.studentId,firstName:d.firstName,lastName:d.lastName,className:d.className});localStorage.removeItem('myschool_pending_application');box.innerHTML='<div class="success"><b>Ariza tasdiqlandi!</b><br>Student ID: <strong>'+esc2(d.studentId)+'</strong></div>';setTimeout(()=>window.home&&home(),1200)}
      else if(d.status==='rejected'){clearInterval(window.__pendingTimer);box.innerHTML='<div class="error"><b>Ariza rad etildi.</b><br>'+esc2(d.rejectionReason||'Sabab ko‘rsatilmagan.')+'</div>'}
      else box.textContent='Ariza hali tekshirilmoqda...';
    }catch(err){const box=document.getElementById('pendingV2');if(box)box.textContent=err.message}
  };

  window.studentLoginPage=function(){
    A.innerHTML='<div class="wrap"><section class="card"><button class="back" onclick="welcome()">← Orqaga</button><h1 class="title">Kirish</h1><p class="muted">Tasdiqlangan 6 xonali Student ID ni kiriting.</p><form id="loginV2"><div class="field"><label>Student ID</label><input id="studentIdV2" inputmode="numeric" maxlength="6" pattern="\\d{6}" required placeholder="123456"></div><button class="btn">Kirish</button><div id="loginV2Msg"></div></form></section></div>';
    document.getElementById('loginV2').onsubmit=async e=>{
      e.preventDefault();const id=document.getElementById('studentIdV2').value.trim(),msg=document.getElementById('loginV2Msg');
      if(!/^\d{6}$/.test(id)){msg.className='error';msg.textContent='Student ID aynan 6 xonali raqam bo‘lishi kerak.';return}
      msg.textContent='Tekshirilmoqda...';
      try{const r=await fetch(API2+'/api/students/login',{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',body:JSON.stringify({studentId:id})}),d=await r.json();if(!r.ok)throw new Error(d.error||'Kirishda xatolik.');save2('myschool_student',d.student);save2('myschool_student_token',d.token);home()}catch(err){msg.className='error';msg.textContent=err.message}
    };
  };

  function adminToken(){return get2('myschool_admin_token')}
  function adminFetch(path,opts={}){opts.headers={...(opts.headers||{}),Authorization:'Bearer '+adminToken(),'Cache-Control':'no-cache'};opts.cache='no-store';return fetch(API2+path+(path.includes('?')?'&':'?')+'ts='+Date.now(),opts)}

  window.adminPanel=async function(){
    const t=adminToken();if(!t)return adminLogin();
    A.innerHTML='<div class="admin-shell"><aside class="admin-sidebar"><div class="admin-logo"><span>🎓</span><div><b>STEM SCHOOL</b><small>BIG ADMIN</small></div></div><nav class="admin-nav">'+
      '<button class="admin-nav-item active" onclick="adminPanel()">▦ Dashboard</button><button class="admin-nav-item" onclick="adminApplicationsV2()">📋 Arizalar</button><button class="admin-nav-item" onclick="studentManagementV2()">👨‍🎓 O‘quvchilar</button><button class="admin-nav-item" onclick="adminStaff()">👨‍💼 Ishchilar / Kabinetlar</button><button class="admin-nav-item" onclick="adminContent(\'announcements\')">📢 E’lonlar</button><button class="admin-nav-item" onclick="adminContent(\'library\')">📚 Kitobxona</button><button class="admin-nav-item" onclick="adminSchedule()">📅 Jadval</button><button class="admin-nav-item" onclick="adminSubjects()">📖 Fanlar va darslar</button><button class="admin-nav-item" onclick="adminTests()">🧪 Testlar</button><button class="admin-nav-item" onclick="adminResults()">📊 Natijalar</button><button class="admin-nav-item" onclick="adminMedia()">🖼️ Bannerlar / Rasmlar</button><button class="admin-nav-item" onclick="adminTelegramBot()">🤖 Telegram Bot</button><button class="admin-nav-item" onclick="adminSupport()">💬 Support</button></nav><button class="admin-logout" onclick="adminLogout()">↪ Chiqish</button></aside>'+
      '<div class="admin-main"><header class="admin-topbar"><button class="admin-menu" onclick="toggleAdminMenu()">☰</button><div><div class="admin-page-title">Dashboard</div><div class="admin-page-subtitle">Maktab boshqaruv paneli</div></div><div class="admin-profile"><div class="admin-avatar">A</div><div><b>Katta administrator</b><small>Administrator</small></div></div></header><main class="admin-content"><section class="admin-welcome"><div><span class="admin-eyebrow">BIG ADMIN</span><h1>Dashboard</h1><p>Registratsiya va o‘quvchi boshqaruvi.</p></div></section><section class="admin-stats"><div class="admin-stat"><span>Kutilayotgan arizalar</span><strong id="v2Pending">—</strong></div><div class="admin-stat"><span>Tasdiqlangan o‘quvchilar</span><strong id="v2Students">—</strong></div></section><section class="admin-card"><div class="admin-card-head"><div><h2>📋 So‘nggi arizalar</h2><p>Registratsiyadan kelgan arizalar.</p></div><button class="btn secondary" onclick="adminApplicationsV2()">Barchasini ko‘rish</button></div><div id="v2DashApps" class="status">Yuklanmoqda...</div></section></main></div></div>';
    try{
      const [ar,sr]=await Promise.all([adminFetch('/api/admin/applications'),adminFetch('/api/admin/students')]);
      const ad=await ar.json(),sd=await sr.json();
      if(!ar.ok)throw new Error(ad.error||'Arizalarni yuklashda xatolik.');
      if(!sr.ok)throw new Error(sd.error||'O‘quvchilarni yuklashda xatolik.');
      document.getElementById('v2Pending').textContent=ad.items.length;document.getElementById('v2Students').textContent=sd.items.length;
      document.getElementById('v2DashApps').innerHTML=ad.items.length?ad.items.slice(0,5).map(appCard).join(''):'Hozircha yangi ariza yo‘q.';
    }catch(e){document.getElementById('v2DashApps').innerHTML='<div class="admin-error">'+esc2(e.message)+'</div>'}
  };

  function appCard(a){
    return '<article class="app-item"><h3>'+esc2(a.firstName)+' '+esc2(a.lastName)+'</h3><p>🎓 Sinf: <b>'+esc2(a.className)+'</b><br>🆔 Ariza: <b>'+esc2(a._id)+'</b><br>📅 '+new Date(a.createdAt).toLocaleString('uz-UZ')+'</p><div class="row"><button class="btn" onclick="approveV2(\''+a._id+'\')">✅ Tasdiqlash</button><button class="btn danger" onclick="rejectV2(\''+a._id+'\')">❌ Rad etish</button></div></article>';
  }

  window.adminApplicationsV2=async function(){
    const t=adminToken();if(!t)return adminLogin();
    A.innerHTML='<div class="admin-shell"><aside class="admin-sidebar"><div class="admin-logo"><span>🎓</span><div><b>STEM SCHOOL</b><small>BIG ADMIN</small></div></div><nav class="admin-nav"><button class="admin-nav-item active">📋 Arizalar</button><button class="admin-nav-item" onclick="adminPanel()">▦ Dashboard</button><button class="admin-nav-item" onclick="studentManagementV2()">👨‍🎓 O‘quvchilar</button></nav><button class="admin-logout" onclick="adminLogout()">↪ Chiqish</button></aside><div class="admin-main"><header class="admin-topbar"><button class="admin-menu" onclick="toggleAdminMenu()">☰</button><div><div class="admin-page-title">Arizalar</div><div class="admin-page-subtitle">Student registratsiya arizalari</div></div></header><main class="admin-content"><section class="admin-card"><div class="admin-card-head"><div><h2>📋 Kutilayotgan arizalar</h2><p>Faqat pending arizalar ko‘rsatiladi.</p></div><button class="btn secondary" onclick="adminApplicationsV2()">↻ Yangilash</button></div><div id="v2AppsList" class="status">Yuklanmoqda...</div></section></main></div></div>';
    try{const r=await adminFetch('/api/admin/applications'),d=await r.json();if(!r.ok)throw new Error(d.error||'Arizalarni yuklashda xatolik.');document.getElementById('v2AppsList').innerHTML=d.items.length?d.items.map(appCard).join(''):'Hozircha yangi ariza yo‘q.'}catch(e){document.getElementById('v2AppsList').innerHTML='<div class="admin-error">'+esc2(e.message)+'</div>'}
  };

  window.studentManagementV2=async function(search=''){
    const t=adminToken();if(!t)return adminLogin();
    A.innerHTML='<div class="admin-shell"><aside class="admin-sidebar"><div class="admin-logo"><span>🎓</span><div><b>STEM SCHOOL</b><small>BIG ADMIN</small></div></div><nav class="admin-nav"><button class="admin-nav-item active">👨‍🎓 O‘quvchilar</button><button class="admin-nav-item" onclick="adminPanel()">▦ Dashboard</button><button class="admin-nav-item" onclick="adminApplicationsV2()">📋 Arizalar</button></nav><button class="admin-logout" onclick="adminLogout()">↪ Chiqish</button></aside><div class="admin-main"><header class="admin-topbar"><button class="admin-menu" onclick="toggleAdminMenu()">☰</button><div><div class="admin-page-title">O‘quvchilar</div><div class="admin-page-subtitle">Faqat tasdiqlangan o‘quvchilar</div></div></header><main class="admin-content"><section class="admin-card"><form id="v2Search" style="display:flex;gap:8px"><input id="v2Q" placeholder="ID, ism, familiya yoki sinf" value="'+esc2(search)+'"><button class="btn">Qidirish</button></form><div id="v2StudentsList" class="status">Yuklanmoqda...</div></section></main></div></div>';
    document.getElementById('v2Search').onsubmit=e=>{e.preventDefault();studentManagementV2(document.getElementById('v2Q').value.trim())};
    try{const r=await adminFetch('/api/admin/students?search='+encodeURIComponent(search)),d=await r.json();if(!r.ok)throw new Error(d.error||'O‘quvchilarni yuklashda xatolik.');const list=document.getElementById('v2StudentsList');list.innerHTML=d.items.length?d.items.map(studentCardV2).join(''):'O‘quvchi topilmadi.'}catch(e){document.getElementById('v2StudentsList').innerHTML='<div class="admin-error">'+esc2(e.message)+'</div>'}
  };
  function studentCardV2(a){return '<article class="app-item"><h3>'+esc2(a.firstName)+' '+esc2(a.lastName)+'</h3><p>🆔 Student ID: <b>'+esc2(a.studentId)+'</b><br>🎓 Sinf: <b>'+esc2(a.className)+'</b><br>Holat: '+(a.isBlocked?'🔒 Bloklangan':'🟢 Faol')+'</p><div class="row"><button class="btn secondary" onclick="editStudentV2(\''+a._id+'\')">✏️ Tahrirlash</button><button class="btn '+(a.isBlocked?'':'danger')+'" onclick="blockStudentV2(\''+a._id+'\','+(!a.isBlocked)+')">'+(a.isBlocked?'🔓 Blokdan chiqarish':'🔒 Bloklash')+'</button><button class="btn danger" onclick="deleteStudentV2(\''+a._id+'\')">🗑 O‘chirish</button></div></article>'}
  window.editStudentV2=async function(id){const r=await adminFetch('/api/admin/students/'+encodeURIComponent(id)),d=await r.json();if(!r.ok)throw new Error(d.error||'O‘quvchi topilmadi.');const a=d.item;const first=prompt('Ism:',a.firstName);if(first===null)return;const last=prompt('Familiya:',a.lastName);if(last===null)return;const cls=prompt('Sinf:',a.className);if(cls===null)return;const p=await adminFetch('/api/admin/students/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({firstName:first,lastName:last,className:cls})});const x=await p.json();if(!p.ok)throw new Error(x.error||'Saqlanmadi.');studentManagementV2()}
  window.blockStudentV2=async function(id,isBlocked){const r=await adminFetch('/api/admin/students/'+encodeURIComponent(id),{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({isBlocked})}),d=await r.json();if(!r.ok)throw new Error(d.error||'Xatolik.');studentManagementV2()}
  window.deleteStudentV2=async function(id){if(!confirm('O‘quvchini va unga tegishli ma’lumotlarni o‘chirasizmi?'))return;const r=await adminFetch('/api/admin/students/'+encodeURIComponent(id),{method:'DELETE'}),d=await r.json();if(!r.ok)throw new Error(d.error||'O‘chirishda xatolik.');studentManagementV2()}

  window.approveV2=async function(id){if(!confirm('Arizani tasdiqlaysizmi?'))return;const r=await adminFetch('/api/admin/applications/'+encodeURIComponent(id)+'/approve',{method:'POST'}),d=await r.json();if(!r.ok)throw new Error(d.error||'Tasdiqlashda xatolik.');alert('Tasdiqlandi. Student ID: '+d.studentId);adminApplicationsV2()}
  window.rejectV2=async function(id){const reason=prompt('Rad etish sababi:');if(reason===null)return;const r=await adminFetch('/api/admin/applications/'+encodeURIComponent(id)+'/reject',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason})}),d=await r.json();if(!r.ok)throw new Error(d.error||'Rad etishda xatolik.');adminApplicationsV2()}

  window.APP_BUILD='20261004-registration-v2';
  if(location.pathname==='/admin'||location.pathname==='/admin/'){window.adminPanel()}
  else if(!tgInit() && !get2('myschool_student') && !get2('myschool_pending_application')){window.welcome()}
})();