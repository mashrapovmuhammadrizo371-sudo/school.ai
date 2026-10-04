/* MySchool Registration — clean rebuild 2026-10-04 */
(function(){
  const API='https://myschool-ai.onrender.com';
  const app=document.getElementById('app');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const get=k=>localStorage.getItem(k)||'';
  const save=(k,v)=>localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));
  const classes=['A','B','G','V'].flatMap(l=>Array.from({length:11},(_,i)=>`${i+1}-${l}`);

  function telegramInitData(){return window.Telegram?.WebApp?.initData||''}

  window.welcome=function(){
    app.innerHTML='<section class="screen"><div class="panel center"><div class="cap">🎓</div><div class="brand">STEM SCHOOL</div><div class="divider"></div><div class="welcome-sub">Maktab tizimi</div><button class="primary" onclick="studentLoginPage()">KIRISH</button><button class="btn secondary" style="margin-top:10px" onclick="registerV2()">RO‘YXATDAN O‘TISH</button><button class="btn secondary" style="margin-top:10px" onclick="adminLogin()">KATTA ADMIN</button></div></section>';
  };

  window.register=window.registerV2=function(){
    app.innerHTML='<div class="wrap"><section class="card"><button class="back" onclick="welcome()">← Orqaga</button><h1 class="title">Ro‘yxatdan o‘tish</h1><p class="muted">Ariza Katta Admin tekshiruviga yuboriladi.</p><form id="registrationClean"><div class="field"><label>Ism</label><input id="regFirst" required maxlength="60"></div><div class="field"><label>Familiya</label><input id="regLast" required maxlength="60"></div><div class="field"><label>Sinf</label><select id="regClass" required><option value="">Sinfni tanlang</option>'+classes.map(x=>'<option>'+x+'</option>').join('')+'</select></div><div class="field"><label>Maktab kodi</label><input id="regSchool" maxlength="40" placeholder="Ixtiyoriy"></div><div class="field"><label>📸 Rasm (JPEG)</label><input id="regPhoto" type="file" accept="image/jpeg" capture="user" required><small>JPEG, 650 KB gacha</small></div><div id="regMessage" class="status"></div><button class="btn" id="regButton">Ariza yuborish</button></form></section></div>';
    document.getElementById('registrationClean').onsubmit=submitRegistrationClean;
  };

  async function submitRegistrationClean(e){
    e.preventDefault();
    const button=document.getElementById('regButton'), message=document.getElementById('regMessage'), file=document.getElementById('regPhoto').files?.[0];
    if(!file){message.className='error';message.textContent='Rasm majburiy.';return}
    if(file.type!=='image/jpeg'){message.className='error';message.textContent='Faqat JPEG rasm qabul qilinadi.';return}
    if(file.size>650000){message.className='error';message.textContent='Rasm 650 KB dan kichik bo‘lishi kerak.';return}
    button.disabled=true;message.className='status';message.textContent='Yuborilmoqda...';
    try{
      const photo=await readPhoto(file);
      const payload={firstName:document.getElementById('regFirst').value.trim(),lastName:document.getElementById('regLast').value.trim(),className:document.getElementById('regClass').value,schoolCode:document.getElementById('regSchool').value.trim(),photoData:photo,telegramInitData:telegramInitData()};
      const response=await fetch(API+'/api/students/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),cache:'no-store'});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error||`Server xatosi: ${response.status}`);
      if(!data.applicationId)throw new Error('Server ariza ID qaytarmadi.');
      save('myschool_pending_application',data.applicationId);
      showPendingClean(data.applicationId);
    }catch(error){
      message.className='error';message.textContent=error.message||'Ariza yuborilmadi.';
    }finally{button.disabled=false}
  }

  function readPhoto(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Rasmni o‘qib bo‘lmadi.'));reader.readAsDataURL(file)})}

  function showPendingClean(id){
    app.innerHTML='<div class="wrap"><section class="card center"><div class="logo">⏳</div><h1 class="title">Ariza qabul qilindi</h1><p class="muted">Katta Admin arizani tekshiradi.</p><div id="pendingClean" class="status">Tekshirilmoqda...</div><button class="btn secondary" onclick="checkPendingClean()">↻ Tekshirish</button><button class="back" onclick="welcome()">← Bosh sahifa</button></section></div>';
    window.__pendingClean=id;clearInterval(window.__pendingCleanTimer);checkPendingClean();window.__pendingCleanTimer=setInterval(checkPendingClean,10000);
  }

  window.checkPendingClean=async function(){
    const id=window.__pendingClean||get('myschool_pending_application'), box=document.getElementById('pendingClean');if(!id||!box)return;
    try{const r=await fetch(API+'/api/students/status/'+encodeURIComponent(id)+'?t='+Date.now(),{cache:'no-store'}),d=await r.json();if(!r.ok)throw new Error(d.error||'Holatni olishda xatolik.');if(d.status==='approved'){clearInterval(window.__pendingCleanTimer);box.innerHTML='<div class="success">Tasdiqlandi!<br>Student ID: <b>'+esc(d.studentId)+'</b></div>';save('myschool_student',JSON.stringify({studentId:d.studentId,firstName:d.firstName,lastName:d.lastName,className:d.className}));localStorage.removeItem('myschool_pending_application')}else if(d.status==='rejected'){clearInterval(window.__pendingCleanTimer);box.innerHTML='<div class="error">Ariza rad etildi.<br>'+esc(d.rejectionReason||'Sabab ko‘rsatilmagan.')+'</div>'}else box.textContent='Ariza hali tekshirilmoqda...'}catch(e){box.textContent=e.message}
  };

  window.studentLoginPage=function(){
    app.innerHTML='<div class="wrap"><section class="card"><button class="back" onclick="welcome()">← Orqaga</button><h1 class="title">Kirish</h1><p class="muted">6 xonali Student ID kiriting.</p><form id="cleanLogin"><div class="field"><label>Student ID</label><input id="cleanStudentId" inputmode="numeric" maxlength="6" required></div><button class="btn">Kirish</button><div id="cleanLoginMsg"></div></form></section></div>';
    document.getElementById('cleanLogin').onsubmit=async e=>{e.preventDefault();const id=document.getElementById('cleanStudentId').value.trim(),m=document.getElementById('cleanLoginMsg');if(!/^\d{6}$/.test(id)){m.className='error';m.textContent='Student ID 6 xonali bo‘lishi kerak.';return}try{const r=await fetch(API+'/api/students/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId:id})}),d=await r.json();if(!r.ok)throw new Error(d.error||'Kirishda xatolik.');save('myschool_student',JSON.stringify(d.student));save('myschool_student_token',d.token);if(window.home)home()}catch(e){m.className='error';m.textContent=e.message}};
  };

  const token=()=>get('myschool_admin_token');
  const adminFetch=(path,opt={})=>{opt.headers={...(opt.headers||{}),Authorization:'Bearer '+token(),'Cache-Control':'no-cache'};opt.cache='no-store';return fetch(API+path+(path.includes('?')?'&':'?')+'t='+Date.now(),opt)};

  window.adminPanel=async function(){
    if(!token())return adminLogin();
    app.innerHTML='<div class="admin-shell"><aside class="admin-sidebar"><div class="admin-logo"><span>🎓</span><div><b>STEM SCHOOL</b><small>BIG ADMIN</small></div></div><nav class="admin-nav"><button class="admin-nav-item active" onclick="adminPanel()">▦ Dashboard</button><button class="admin-nav-item" onclick="adminApplicationsV2()">📋 Arizalar</button><button class="admin-nav-item" onclick="studentManagementV2()">👨‍🎓 O‘quvchilar</button><button class="admin-nav-item" onclick="adminStaff()">👨‍💼 Ishchilar / Kabinetlar</button><button class="admin-nav-item" onclick="adminContent('announcements')">📢 E’lonlar</button><button class="admin-nav-item" onclick="adminContent('library')">📚 Kitobxona</button><button class="admin-nav-item" onclick="adminSchedule()">📅 Jadval</button><button class="admin-nav-item" onclick="adminSubjects()">📖 Fanlar va darslar</button><button class="admin-nav-item" onclick="adminTests()">🧪 Testlar</button><button class="admin-nav-item" onclick="adminResults()">📊 Natijalar</button><button class="admin-nav-item" onclick="adminMedia()">🖼️ Bannerlar / Rasmlar</button><button class="admin-nav-item" onclick="adminTelegramBot()">🤖 Telegram Bot</button><button class="admin-nav-item" onclick="adminSupport()">💬 Support</button></nav><button class="admin-logout" onclick="localStorage.removeItem('myschool_admin_token');welcome()">↪ Chiqish</button></aside><main class="admin-main"><header class="admin-topbar"><div><div class="admin-page-title">Dashboard</div><div class="admin-page-subtitle">Registratsiya boshqaruvi</div></div></header><section class="admin-content"><section class="admin-stats"><div class="admin-stat"><span>📋 Arizalar</span><strong id="cleanPending">—</strong></div><div class="admin-stat"><span>👨‍🎓 O‘quvchilar</span><strong id="cleanStudents">—</strong></div></section><section class="admin-card"><div class="admin-card-head"><h2>So‘nggi arizalar</h2><button class="btn secondary" onclick="adminPanel()">↻</button></div><div id="cleanApps" class="status">Yuklanmoqda...</div></section></section></main></div></div>';
    try{const [a,s]=await Promise.all([adminFetch('/api/admin/applications'),adminFetch('/api/admin/students')]);const ad=await a.json(),sd=await s.json();if(!a.ok)throw new Error(ad.error||'Arizalar yuklanmadi.');if(!s.ok)throw new Error(sd.error||'O‘quvchilar yuklanmadi.');document.getElementById('cleanPending').textContent=ad.items.length;document.getElementById('cleanStudents').textContent=sd.items.length;document.getElementById('cleanApps').innerHTML=ad.items.length?ad.items.map(applicationCard).join(''):'Hozircha ariza yo‘q.'}catch(e){document.getElementById('cleanApps').innerHTML='<div class="admin-error">'+esc(e.message)+'</div>'}
  };

  function applicationCard(a){return '<article class="app-item"><h3>'+esc(a.firstName)+' '+esc(a.lastName)+'</h3><p>Sinf: <b>'+esc(a.className)+'</b><br>Ariza ID: '+esc(a._id)+'</p><div class="row"><button class="btn" onclick="approveClean(\''+a._id+'\')">✅ Tasdiqlash</button><button class="btn danger" onclick="rejectClean(\''+a._id+'\')">❌ Rad etish</button></div></article>'}

  window.adminApplicationsV2=async function(){
    if(!token())return adminLogin();
    app.innerHTML='<div class="wrap"><section class="card"><button class="back" onclick="adminPanel()">← Dashboard</button><h1 class="title">📋 Arizalar</h1><div id="cleanAppsList" class="status">Yuklanmoqda...</div></section></div>';
    try{const r=await adminFetch('/api/admin/applications'),d=await r.json();if(!r.ok)throw new Error(d.error||'Arizalar yuklanmadi.');document.getElementById('cleanAppsList').innerHTML=d.items.length?d.items.map(applicationCard).join(''):'Hozircha ariza yo‘q.'}catch(e){document.getElementById('cleanAppsList').textContent=e.message}
  };
  window.studentManagementV2=async function(search=''){if(!token())return adminLogin();app.innerHTML='<div class="wrap"><section class="card"><button class="back" onclick="adminPanel()">← Dashboard</button><h1 class="title">👨‍🎓 O‘quvchilar</h1><div id="cleanStudentsList" class="status">Yuklanmoqda...</div></section></div>';try{const r=await adminFetch('/api/admin/students?search='+encodeURIComponent(search)),d=await r.json();if(!r.ok)throw new Error(d.error||'O‘quvchilar yuklanmadi.');document.getElementById('cleanStudentsList').innerHTML=d.items.length?d.items.map(a=>'<article class="app-item"><h3>'+esc(a.firstName)+' '+esc(a.lastName)+'</h3><p>Student ID: <b>'+esc(a.studentId)+'</b><br>Sinf: <b>'+esc(a.className)+'</b></p></article>').join(''):'O‘quvchi topilmadi.'}catch(e){document.getElementById('cleanStudentsList').textContent=e.message}};
  window.approveClean=async function(id){const r=await adminFetch('/api/admin/applications/'+encodeURIComponent(id)+'/approve',{method:'POST'}),d=await r.json();if(!r.ok)return alert(d.error||'Tasdiqlashda xatolik.');alert('Tasdiqlandi. Student ID: '+d.studentId);adminPanel()};
  window.rejectClean=async function(id){const reason=prompt('Rad etish sababi:');if(reason===null)return;const r=await adminFetch('/api/admin/applications/'+encodeURIComponent(id)+'/reject',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason})}),d=await r.json();if(!r.ok)return alert(d.error||'Rad etishda xatolik.');adminPanel()};

  window.APP_BUILD='20261004-registration-clean';
  if(location.pathname==='/admin'||location.pathname==='/admin/')adminPanel();
  else if(!get('myschool_student')&&!get('myschool_pending_application'))welcome();
})();