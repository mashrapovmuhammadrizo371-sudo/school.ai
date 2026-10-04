const schedule=[['Dushanba','08:00','Matematika','1-xona'],['Dushanba','08:50','Ona tili','2-xona'],['Seshanba','08:00','Ingliz tili','3-xona'],['Seshanba','08:50','Fizika','4-xona'],['Chorshanba','08:00','Informatika','5-xona'],['Chorshanba','08:50','Tarix','6-xona'],['Payshanba','08:00','Biologiya','7-xona'],['Payshanba','08:50','Geografiya','8-xona'],['Juma','08:00','Matematika','1-xona'],['Juma','08:50','Jismoniy tarbiya','Sport zal'],['Shanba','08:00','Adabiyot','2-xona']];
const subjectList=['Matematika','Ona tili','Adabiyot','Ingliz tili','Rus tili','Tarix','Geografiya','Biologiya','Fizika','Kimyo','Informatika','Jismoniy tarbiya'];
function login(){register()}
async function studentLogin(e){e.preventDefault();const msg=document.getElementById('loginMsg');msg.textContent='Tekshirilmoqda...';try{const r=await fetch(API+'/api/students/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId:studentIdInput.value})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Kirishda xatolik.');save('myschool_student',d.student);save('myschool_student_token',d.token);home()}catch(x){msg.className='error';msg.textContent=x.message}}

const schedule=[['Dushanba','08:00','Matematika','1-xona'],['Dushanba','08:50','Ona tili','2-xona'],['Seshanba','08:00','Ingliz tili','3-xona'],['Seshanba','08:50','Fizika','4-xona'],['Chorshanba','08:00','Informatika','5-xona'],['Chorshanba','08:50','Tarix','6-xona'],['Payshanba','08:00','Biologiya','7-xona'],['Payshanba','08:50','Geografiya','8-xona'],['Juma','08:00','Matematika','1-xona'],['Juma','08:50','Jismoniy tarbiya','Sport zal'],['Shanba','08:00','Adabiyot','2-xona']];
const subjectList=['Matematika','Ona tili','Adabiyot','Ingliz tili','Rus tili','Tarix','Geografiya','Biologiya','Fizika','Kimyo','Informatika','Jismoniy tarbiya'];
function home(){const s=get('myschool_student');if(!s)return welcome();app.innerHTML='<section class="screen"><div class="panel menu-card"><div class="menu-head"><div class="cap" style="opacity:1;animation:none;font-size:45px">🎓</div><h1>STEM SCHOOL</h1><div class="student">'+esc(s.firstName)+' '+esc(s.lastName)+' · <b>'+esc(s.className)+'</b><br>Student ID: <b>'+esc(s.studentId)+'</b></div></div><div id="homeMedia"></div><div class="grid"><button class="tile" onclick="showSchedule()"><span class="icon">📅</span><strong>JADVAL</strong></button><button class="tile" onclick="showSubjects()"><span class="icon">📖</span><strong>FANLAR</strong></button><button class="tile" onclick="showCompetition()"><span class="icon">📚</span><strong>KITOBXONLIK TANLOVI</strong></button><button class="tile" onclick="showAnnouncements()"><span class="icon">📢</span><strong>E’LON</strong></button><button class="tile" onclick="showLibrary()"><span class="icon">📚</span><strong>KITOBXONA</strong></button><button class="tile" onclick="showInfo()"><span class="icon">❓</span><strong>INFO</strong></button></div><button class="wide disabled" onclick="soon(event)"><span class="icon">🤖</span><strong>AI YORDAMCHI</strong></button></div></section>';loadHomeMedia()}
async function loadHomeMedia(){try{const items=await schoolData('media');const box=document.getElementById('homeMedia');if(box&&items.length){box.innerHTML='<div class="status" style="margin:10px 0">'+items.slice(0,3).map(x=>'<img src="'+esc(x.data.url)+'" alt="'+esc(x.data.title)+'" style="max-width:100%;border-radius:14px;margin:5px 0">').join('')+'</div>'}}catch(_){}}
async function showCompetition(){
  const studentToken=get('myschool_student_token');
  app.innerHTML='<section class="page-card"><button class="back" onclick="home()">← Orqaga</button><h1>📚 Kitobxonlik tanlovi</h1><p>Kitob o‘qish musobaqasi</p><div id="competitionBox" class="status">Yuklanmoqda...</div></section>';
  try{
    const h={Authorization:'Bearer '+studentToken};
    const [meR,rankR,topR]=await Promise.all([
      fetch(API+'/api/competition/me',{headers:h,cache:'no-store'}),
      fetch(API+'/api/competition/ranking',{headers:h,cache:'no-store'}),
      fetch(API+'/api/competition/top',{cache:'no-store'})
    ]);
    const me=await meR.json(), ranking=await rankR.json(), top=await topR.json();
    if(!meR.ok)throw new Error(me.error||'Ma’lumot yuklanmadi');
    const student=get('myschool_student')||{};
    const x=me.item;
    const topHtml=(top.items||[]).map((a,i)=>'<div class="app-item"><b>'+['🥇','🥈','🥉'][i]+' '+esc(a.studentName)+'</b><span> — '+esc(a.totalScore)+' ball</span><small> · '+esc(a.className||'')+'</small></div>').join('');
    const rankHtml=(ranking.items||[]).slice(0,20).map(a=>'<div class="app-item"><b>'+a.rank+'. '+esc(a.studentName)+'</b><span> — '+esc(a.totalScore)+' ball</span><small> · '+esc(a.className||'')+'</small></div>').join('');
    document.getElementById('competitionBox').innerHTML=
      '<div class="admin-card"><h2>🎥 Video yuborish</h2>'+
        '<p>Video, kitob nomi va sahifalar sonini shu yerning o‘zida yuboring.</p>'+
        '<form id="competitionSubmitForm">'+
          '<label>👤 Ism-familiya</label><input value="'+esc(((student.firstName||'')+' '+(student.lastName||'')).trim())+'" readonly>'+
          '<label>🏫 Sinf</label><input value="'+esc(student.className||'—')+'" readonly>'+
          '<label>📖 Kitob nomi</label><input id="competitionBookName" type="text" maxlength="200" placeholder="Kitob nomini yozing" required>'+
          '<label>📄 Sahifalar soni</label><input id="competitionPages" type="number" min="1" max="100000" inputmode="numeric" placeholder="Masalan: 30" required>'+
          '<label>🎥 Video</label><input id="competitionVideo" type="file" accept="video/*" required>'+
          '<div id="competitionVideoPreview" style="margin-top:10px"></div>'+
          '<button type="submit" class="primary-btn" id="competitionSubmitBtn">📤 Yuborish</button>'+
          '<div id="competitionSubmitStatus" class="status" style="margin-top:10px;display:none"></div>'+
        '</form>'+
      '</div>'+
      '<div class="admin-card"><h2>⭐ Ballarim</h2>'+
        (x?'<p>Ball: <b>'+(x.scored?x.totalScore:0)+'</b></p><p>O‘rin: <b>'+(me.rank?me.rank+'-o‘rin':'Hali belgilanmagan')+'</b></p>':'<p>Hozircha video topshirilmagan.</p>')+
      '</div>'+
      '<div class="admin-card"><h2>🥇 TOP-3</h2>'+(topHtml||'<p>Hali natija yo‘q.</p>')+'</div>'+
      '<div class="admin-card"><h2>🏆 Musobaqa ballari</h2>'+(rankHtml||'<p>Hali natija yo‘q.</p>')+'</div>';

    const videoInput=document.getElementById('competitionVideo');
    const preview=document.getElementById('competitionVideoPreview');
    videoInput?.addEventListener('change',()=>{
      const file=videoInput.files?.[0];
      if(!file){preview.innerHTML='';return;}
      if(!file.type.startsWith('video/')){videoInput.value='';preview.innerHTML='<div class="error">Faqat video fayl tanlang.</div>';return;}
      if(file.size>50*1024*1024){videoInput.value='';preview.innerHTML='<div class="error">Video hajmi 50 MB dan oshmasin.</div>';return;}
      const url=URL.createObjectURL(file);
      preview.innerHTML='<video controls playsinline style="width:100%;max-height:320px;border-radius:14px" src="'+url+'"></video><small>'+esc(file.name)+' · '+Math.round(file.size/1024/1024*10)/10+' MB</small>';
    });
    document.getElementById('competitionSubmitForm')?.addEventListener('submit',async(e)=>{
      e.preventDefault();
      const bookName=document.getElementById('competitionBookName').value.trim();
      const pages=Number(document.getElementById('competitionPages').value);
      const file=document.getElementById('competitionVideo').files?.[0];
      const status=document.getElementById('competitionSubmitStatus');
      const btn=document.getElementById('competitionSubmitBtn');
      if(!bookName)return status.style.display='block',status.textContent='❌ Kitob nomini kiriting.';
      if(!Number.isInteger(pages)||pages<1)return status.style.display='block',status.textContent='❌ Sahifalar sonini to‘g‘ri kiriting.';
      if(!file||!file.type.startsWith('video/'))return status.style.display='block',status.textContent='❌ Video tanlang.';
      if(file.size>50*1024*1024)return status.style.display='block',status.textContent='❌ Video hajmi 50 MB dan oshmasin.';
      const fd=new FormData();
      fd.append('bookName',bookName);
      fd.append('pages',String(pages));
      fd.append('video',file);
      btn.disabled=true;
      status.style.display='block';
      status.textContent='⏳ Video yuborilmoqda...';
      try{
        const r=await fetch(API+'/api/competition/submit',{method:'POST',headers:{Authorization:'Bearer '+studentToken},body:fd});
        const d=await r.json();
        if(!r.ok)throw new Error(d.error||'Yuborishda xatolik.');
        status.textContent='✅ Qabul qilindi! Ustoz tekshirishi uchun yuborildi. ID: '+d.item.taskId;
        document.getElementById('competitionSubmitForm').reset();
        preview.innerHTML='';
      }catch(err){status.textContent='❌ '+err.message;}
      finally{btn.disabled=false;}
    });
  }catch(e){document.getElementById('competitionBox').innerHTML='<div class="error">'+esc(e.message)+'</div>'}
}
async function showAnnouncements(){app.innerHTML='<div class="wrap"><section class="card"><button class="back" onclick="home()">← Orqaga</button><h1 class="title">📢 E’lonlar</h1><div class="status">Yuklanmoqda...</div></section></div>';try{const r=await fetch(API+'/api/public/content/announcements');const d=await r.json();app.innerHTML='<div class="wrap"><section class="card"><button class="back" onclick="home()">← Orqaga</button><h1 class="title">📢 E’lonlar</h1>'+(d.items?.length?d.items.map(x=>'<article class="status" style="margin:10px 0"><b>'+esc(x.title)+'</b><p>'+esc(x.body||'')+'</p>'+(x.url?'<a href="'+esc(x.url)+'" target="_blank">Havolani ochish</a>':'')+'</article>').join(''):'<div class="status">Hozircha e’lon yo‘q.</div>')+'</section></div>'}catch(e){alert(e.message)}}
async function showLibrary(){app.innerHTML='<div class="wrap"><section class="card"><button class="back" onclick="home()">← Orqaga</button><h1 class="title">📚 Kitobxona</h1><div class="status">Yuklanmoqda...</div></section></div>';try{const r=await fetch(API+'/api/public/content/library');const d=await r.json();app.innerHTML='<div class="wrap"><section class="card"><button class="back" onclick="home()">← Orqaga</button><h1 class="title">📚 Kitobxona</h1>'+(d.items?.length?d.items.map(x=>'<article class="status" style="margin:10px 0"><b>'+esc(x.title)+'</b><p>'+esc(x.body||'')+'</p>'+(x.url?'<a href="'+esc(x.url)+'" target="_blank">Kitobni ochish</a>':'')+'</article>').join(''):'<div class="status">Hozircha kitob yo‘q.</div>')+'</section></div>'}catch(e){alert(e.message)}}
async function showInfo(){app.innerHTML='<div class="wrap"><section class="card"><button class="back" onclick="home()">← Orqaga</button><h1 class="title">❓ INFO</h1><p class="muted">Maktab tizimi haqida ma’lumot va ijtimoiy tarmoqlar.</p><div id="socialInfo" class="status">Yuklanmoqda...</div></section></div>';try{const r=await fetch(API+'/api/public/content/social');const d=await r.json();document.getElementById('socialInfo').innerHTML=d.items?.length?d.items.map(x=>'<p><b>'+esc(x.title)+'</b><br>'+esc(x.body||'')+(x.url?'<br><a href="'+esc(x.url)+'" target="_blank">Ochish</a>':'')+'</p>').join(''):'Hozircha ma’lumot yo‘q.'}catch(e){document.getElementById('socialInfo').textContent=e.message}}
function soon(e){e.preventDefault();alert('Bu bo‘lim hozircha ishlamaydi. Keyingi bosqichda ulanadi.')}
async function showSchedule(){const s=get('myschool_student');const c=s?.className||'';app.innerHTML='<div class="wrap"><section class="card admin"><button class="back" onclick="home()">← Orqaga</button><h1 class="title">📅 Jadval</h1><p class="muted"><b>'+esc(c)+'</b> sinfi uchun haftalik jadval</p><div class="status">Yuklanmoqda...</div></section></div>';try{const items=await schoolData('schedule');const own=items.find(x=>x.data.className===c);const days={};if(own)days[own.data.day]=(own.data.rows||[]).map(x=>x.subject);if(!Object.keys(days).length){days.Dushanba=['Jadval hali admin tomonidan kiritilmagan.']}app.innerHTML='<div class="wrap"><section class="card admin"><button class="back" onclick="home()">← Orqaga</button><h1 class="title">📅 Jadval</h1><p class="muted"><b>'+esc(c)+'</b> sinfi uchun haftalik jadval</p><div id="days" style="display:flex;gap:8px;overflow-x:auto;padding:8px 0 14px;"></div><div id="list"></div></section></div>';const tabs=document.getElementById('days'),list=document.getElementById('list'),names=Object.keys(days);tabs.innerHTML=names.map((d,i)=>'<button class="day-tab '+(i?'':'is-active')+'" data-day="'+d+'">'+d+'</button>').join('');function render(d){tabs.querySelectorAll('.day-tab').forEach(x=>x.classList.remove('is-active'));tabs.querySelector('[data-day="'+d+'"]').classList.add('is-active');list.innerHTML='<div class="schedule-table"><div class="schedule-table__head"><span>Fan</span><span>Vaqt</span></div>'+days[d].map((sub,i)=>'<div class="schedule-row"><span class="schedule-row__subject">'+(i+1)+'. '+esc(sub)+'</span><span class="schedule-row__time">Admin belgilagan</span></div>').join('')+'</div>'}tabs.querySelectorAll('.day-tab').forEach(x=>x.onclick=()=>render(x.dataset.day));render(names[0])}catch(e){alert(e.message)}}
async function showSubjects(){const s=get('myschool_student');app.innerHTML='<div class="wrap"><section class="card admin"><button class="back" onclick="home()">← Orqaga</button><h1 class="title">📚 Fanlar</h1><p class="muted"><b>'+esc(s?.className||'')+'</b> sinfi uchun fanlar</p><div class="status">Yuklanmoqda...</div></section></div>';try{const items=await schoolData('subjects');const names=items.map(x=>x.data.name).filter(Boolean);app.innerHTML='<div class="wrap"><section class="card admin"><button class="back" onclick="home()">← Orqaga</button><h1 class="title">📚 Fanlar</h1><div class="row" style="gap:8px;flex-wrap:wrap">'+names.map(x=>'<button class="btn secondary" onclick="lessonTopic(\''+x.replace(/'/g,"\'")+'\')">'+esc(x)+'</button>').join('')+'</div><button class="btn" onclick="tests()">🧪 Testlar</button><button class="btn secondary" onclick="results()">📊 Natijalar</button></section></div>'}catch(e){alert(e.message)}}
async function lessons(){await showSubjects()}
async function lessonTopic(subject){try{const items=await schoolData('subjects');const x=items.find(a=>a.data.name===subject);const d=x?.data||{};app.innerHTML='<div class="wrap"><section class="card"><button class="back" onclick="showSubjects()">← Fanlarga qaytish</button><h1 class="title">📖 '+esc(subject)+'</h1><div class="status"><b>'+esc(d.topic||'Dars')+'</b></div><p class="muted">'+esc(d.description||'Bu fan bo‘yicha ma’lumot admin tomonidan kiritiladi.')+'</p></section></div>'}catch(e){alert(e.message)}}
function tests(){testSubjects('Barchasi')}
async function testSubjects(level){try{const items=await schoolData('tests');const subjects=[...new Set(items.map(x=>x.data.subject).filter(Boolean))];app.innerHTML='<div class="wrap"><section class="card admin"><button class="back" onclick="showSubjects()">← Fanlarga qaytish</button><h1 class="title">🧪 Testlar</h1><p class="muted">'+esc(level==='Barchasi'?'Barcha darajalar':level)+' darajadagi testlar</p>'+subjects.map(x=>'<button class="btn secondary" onclick="openTest(\''+x.replace(/'/g,"\'")+'\',\''+level+'\')">'+esc(x)+'</button>').join('')+'</section></div>'}catch(e){alert(e.message)}}
async function openTest(subject,level){try{const items=await schoolData('tests');const rows=items.filter(x=>x.data.subject===subject&&(level==='Barchasi'||x.data.level===level)).map(x=>x.data);if(!rows.length)return alert('Bu fan uchun test yo‘q.');app.innerHTML='<div class="wrap"><section class="card"><button class="back" onclick="testSubjects(\''+level+'\')">← Testlarga qaytish</button><h1 class="title">🧪 '+esc(subject)+'</h1><form id="quiz">'+rows.map((r,i)=>'<div class="status" style="margin:14px 0"><b>'+(i+1)+'. '+esc(r.question)+'</b>'+['A','B','C'].map(k=>'<label style="display:block;margin:10px 0"><input type="radio" name="q'+i+'" value="'+k+'" required> '+esc(r[k.toLowerCase()])+'</label>').join('')+'</div>').join('')+'<button class="btn">Testni yakunlash</button></form></section></div>';document.getElementById('quiz').onsubmit=async e=>{e.preventDefault();let score=0;rows.forEach((r,i)=>{if(new FormData(e.target).get('q'+i)===r.correct)score++});const st=get('myschool_student')||{};const result={subject,level:level==='Barchasi'?'Aralash':level,score,total:rows.length,date:new Date().toLocaleString('uz-UZ'),studentId:st.studentId};try{const response=await fetch(API+'/api/students/results',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(result)});if(!response.ok)throw new Error('Natija saqlanmadi')}catch(err){console.warn(err)}app.innerHTML='<div class="wrap"><section class="card center"><h1 class="title">Natija</h1><div class="status">🎉 '+score+' / '+rows.length+' ta to‘g‘ri javob</div><button class="btn" onclick="results()">Natijalarni ko‘rish</button></section></div>'}}catch(e){alert(e.message)}}
async function results(){const s=get('myschool_student')||{};app.innerHTML='<div class="wrap"><section class="card admin"><button class="back" onclick="showSubjects()">← Fanlarga qaytish</button><h1 class="title">📊 Natijalar</h1><div class="status">Yuklanmoqda...</div></section></div>';try{const rows=await schoolData('results');const own=rows.filter(x=>x.data.studentId===s.studentId);app.innerHTML='<div class="wrap"><section class="card admin"><button class="back" onclick="showSubjects()">← Fanlarga qaytish</button><h1 class="title">📊 Natijalar</h1>'+(own.length?own.map(x=>'<div class="status" style="margin:10px 0"><b>'+esc(x.data.subject)+'</b> · '+esc(x.data.level||'')+'<br>Natija: <strong>'+esc(x.data.score)+'/'+esc(x.data.total)+'</strong><br><small>'+esc(x.data.date||'')+'</small></div>').join(''):'<div class="status">Hozircha natija yo‘q.</div>')+'</section></div>'}catch(e){alert(e.message)}}