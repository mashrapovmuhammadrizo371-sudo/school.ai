async function staffLoginPage(){
 const token=get('myschool_staff_token');
 if(token)return staffCabinet();
 app.innerHTML='<div class="wrap"><section class="card"><button class="back" onclick="welcome()">← Orqaga</button><h1 class="title">👨‍💼 Ishchi kabineti</h1><p class="muted">O‘qituvchi, Admin yoki Direktor</p><div class="field"><label>Login</label><input id="staffUser"></div><div class="field"><label>Parol</label><input id="staffPass" type="password"></div><button class="btn" onclick="doStaffLogin()">Kirish</button><div id="staffMsg"></div></section></div>';
}
async function doStaffLogin(){
 const msg=document.getElementById('staffMsg');msg.textContent='Tekshirilmoqda...';
 try{const r=await fetch(API+'/api/staff/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:staffUser.value,password:staffPass.value})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Xatolik');save('myschool_staff_token',d.token);save('myschool_staff',d.staff);staffCabinet()}catch(e){msg.className='error';msg.textContent=e.message}
}
async function staffCabinet(){
 const t=get('myschool_staff_token');if(!t)return staffLoginPage();
 const r=await fetch(API+'/api/staff/me',{headers:{Authorization:'Bearer '+t}});const d=await r.json();if(!r.ok){localStorage.removeItem('myschool_staff_token');localStorage.removeItem('myschool_staff');return staffLoginPage()}
 const role=d.staff.role,roleName=role==='teacher'?'O‘qituvchi':role==='director'?'Direktor':'Admin';
 app.innerHTML=`<div class="admin-shell"><aside class="admin-sidebar"><div class="admin-logo"><span>🎓</span><div><b>STEM SCHOOL</b><small>${roleName.toUpperCase()}</small></div></div><nav class="admin-nav"><button class="admin-nav-item active"><span>▦</span>Kabinet</button><button class="admin-nav-item" onclick="staffDataView('schedule')"><span>📅</span>Jadval</button><button class="admin-nav-item" onclick="staffDataView('subjects')"><span>📚</span>Fanlar</button><button class="admin-nav-item" onclick="staffDataView('announcements')"><span>📢</span>E’lonlar</button><button class="admin-nav-item" onclick="staffCompetitionView()"><span>📚</span>Kitobxonlik</button></nav><button class="admin-logout" onclick="localStorage.removeItem('myschool_staff_token');localStorage.removeItem('myschool_staff');welcome()">↪ Chiqish</button></aside><div class="admin-main"><header class="admin-topbar"><button class="admin-menu" onclick="toggleAdminMenu()">☰</button><div><div class="admin-page-title">${roleName} kabineti</div><div class="admin-page-subtitle">Ishchi paneli</div></div><div class="admin-profile"><div class="admin-avatar">S</div><div><b>${esc(d.staff.fullName)}</b><small>${roleName}</small></div></div></header><main class="admin-content"><section class="admin-welcome"><div><span class="admin-eyebrow">STAFF CABINET</span><h1>Assalomu alaykum 👋</h1><p>Login: <b>${esc(d.staff.username)}</b></p><p>Telegram ulanishi: ${d.staff.telegramChatId?'✅ Ulangan':'ℹ️ Telegramda /staff orqali ulang'}</p></div></section><section class="admin-card"><h2>Huquqlar</h2><p class="muted">${role==='teacher'?'O‘qituvchi: jadval va fanlarga kirish.':role==='director'?'Direktor: jadval, fanlar va e’lonlar.':'Admin: ishchi kabinetining umumiy bo‘limlari.'}</p></section></main></div></div>`;
}
async function staffCompetitionView(){
 const t=get('myschool_staff_token'); app.innerHTML='<div class="admin-shell"><div class="admin-main"><header class="admin-topbar"><button class="admin-menu" onclick="staffCabinet()">←</button><div><div class="admin-page-title">📚 Kitobxonlik tanlovi</div><div class="admin-page-subtitle">Sahifalar asosida avtomatik ball</div></div></header><main class="admin-content"><section id="staffCompetitionList" class="admin-card">Yuklanmoqda...</section></main></div></div>';
 try{
  const r=await fetch(API+'/api/competition/teacher',{headers:{Authorization:'Bearer '+t},cache:'no-store'});
  const d=await r.json();if(!r.ok)throw new Error(d.error||'Yuklanmadi');
  const list=document.getElementById('staffCompetitionList');
  list.innerHTML=d.items.length?d.items.map(x=>{
   const q=x.data||{};
   const status=q.scored?'⭐ Tasdiqlangan':(q.rejected?'❌ Rad etilgan':'⏳ Kutilmoqda');
   const buttons=!q.scored?'<div id="scoreActions_'+x._id+'" class="row" style="display:flex;gap:8px;flex-wrap:wrap">'+
    '<button class="btn" type="button" onclick="confirmCompetitionScore(\''+x._id+'\')">✅ Tasdiqlash</button>'+
    '<button class="btn danger" type="button" onclick="rejectCompetitionScore(\''+x._id+'\')">❌ Rad etish</button>'+
    '</div>':'';
   return '<article class="app-item">'+
    '<h3>'+esc(q.studentName||'O‘quvchi')+' <small>('+esc(q.className||'')+')</small></h3>'+
    '<p>Holat: <b>'+status+'</b></p>'+
    '<p>📖 Kitob: <b>'+esc(q.bookName||'—')+'</b></p>'+
    '<p>📄 Sahifa: <b>'+esc(q.pages||'0')+'</b> → ⭐ Ball: <b>'+esc(q.pages||'0')+'</b></p>'+
    '<p>🆔 ID: <b>'+esc(q.taskId||'—')+'</b></p>'+
    (q.videoFileId?'<p>🎥 Video Telegram orqali yuborilgan</p>':'')+
    buttons+
    '</article>';
  }).join(''):'Hozircha video yo‘q.';
 }catch(e){document.getElementById('staffCompetitionList').innerHTML='<div class="error">'+esc(e.message)+'</div>'}
}
async function confirmCompetitionScore(id){
 const t=get('myschool_staff_token');
 try{
  const r=await fetch(API+'/api/competition/teacher/'+id,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({action:'approve'})});
  const d=await r.json();if(!r.ok)throw new Error(d.error||'Saqlanmadi');
  alert('✅ Tasdiqlandi. '+d.pages+' sahifa '+d.pages+' ball sifatida qo‘shildi. Jami: '+d.totalScore+' ball.');
  staffCompetitionView();
 }catch(e){alert(e.message)}
}
async function rejectCompetitionScore(id){
 const t=get('myschool_staff_token');
 try{
  const r=await fetch(API+'/api/competition/teacher/'+id,{method:'PATCH',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({action:'reject'})});
  const d=await r.json();if(!r.ok)throw new Error(d.error||'Rad etilmadi');
  alert('❌ Topshiriq rad etildi.');
  staffCompetitionView();
 }catch(e){alert(e.message)}
}
async function staffDataView(kind){
 const t=get('myschool_staff_token');const r=await fetch(API+'/api/data/'+encodeURIComponent(kind));const d=await r.json();if(!r.ok)return alert(d.error||'Yuklanmadi');
 const title=kind==='schedule'?'📅 Jadval':kind==='subjects'?'📚 Fanlar':'📢 E’lonlar';
 app.innerHTML='<div class="wrap"><section class="card admin"><button class="back" onclick="staffCabinet()">← Kabinet</button><h1 class="title">'+title+'</h1>'+((d.items||[]).length?(d.items||[]).slice(0,30).map(x=>'<article class="status" style="margin:10px 0"><b>'+esc(x.data?.name||x.data?.title||x.data?.className||x.title||'Ma’lumot')+'</b><p>'+esc(x.data?.description||x.data?.day||x.body||'')+'</p></article>').join(''):'<div class="status">Hozircha ma’lumot yo‘q.</div>')+'</section></div>';
}