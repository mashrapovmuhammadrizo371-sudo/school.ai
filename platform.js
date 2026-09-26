
(() => {
  const API = "https://myschool-ai-sjwz.onrender.com";
  const $ = (s,r=document) => r.querySelector(s);
  const esc = s => String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let student = JSON.parse(localStorage.getItem("myschool_student")||"null");
  let adminToken = localStorage.getItem("myschool_admin_token")||"";

  function inject() {
    document.body.insertAdjacentHTML("beforeend", `
      <div class="platform-auth" id="platformAuth">
        <div class="platform-card">
          <h2 id="authTitle">🎓 MySchool</h2>
          <p class="platform-muted" id="authText">Tizimdan foydalanish uchun ro'yxatdan o'ting yoki tasdiqlangan o'quvchi ID orqali kiring.</p>
          <div id="authBody"></div>
          <div class="platform-links">
            <button class="platform-link" id="studentRegLink">Ro'yxatdan o'tish</button>
            <button class="platform-link" id="studentLoginLink">Menda ID bor</button>
            <button class="platform-link" id="adminLink">👑 Kattta Admin</button>
          </div>
        </div>
      </div>
      <div class="platform-admin" id="platformAdmin">
        <aside class="admin-side">
          <b style="font-size:20px">👑 KATTA ADMIN</b>
          <div class="admin-nav" id="adminNav">
            <button data-a="dashboard">📊 Dashboard</button><button data-a="students">👨‍🎓 O'quvchilar</button><button data-a="official">📋 Rasmiy ro'yxat</button><button data-a="teachers">👨‍🏫 O'qituvchilar</button><button data-a="classes">🏫 Sinflar</button><button data-a="subjects">📚 Fanlar</button><button data-a="lessons">📖 Darslar</button><button data-a="tests">🧪 Testlar</button><button data-a="results">📊 Natijalar</button><button data-a="schedule">📅 Jadval</button><button data-a="announcements">📢 E'lonlar</button><button data-a="library">📚 Kutubxona</button><button data-a="settings">⚙️ Sozlamalar</button>
          </div>
        </aside>
        <main class="admin-main"><div class="admin-top"><h2 id="adminTitle">Dashboard</h2><button class="platform-secondary" id="adminLogout">Chiqish</button></div><div id="adminContent"></div></main>
      </div>
      <div class="subject-detail" id="subjectDetail"><div class="subject-box" id="subjectBox"></div></div>
    `);
  }

  function openAuth(mode="register") {
    $("#platformAuth").classList.add("is-open");
    renderAuth(mode);
  }
  function closeAuth(){ $("#platformAuth").classList.remove("is-open"); }
  function renderAuth(mode) {
    const title=$("#authTitle"), body=$("#authBody");
    if(mode==="register"){
      title.textContent="📝 O'quvchi ro'yxatdan o'tishi";
      body.innerHTML=`<form class="platform-form" id="registerForm">
        <input name="firstName" placeholder="Ism" required><input name="lastName" placeholder="Familiya" required>
        <select name="className" required><option value="">Sinfni tanlang</option>${Array.from({length:11},(_,i)=>`<option>${i+1}-sinf</option>`).join("")}</select>
        <select name="section" required><option value="">Sinf harfi</option><option>A</option><option>B</option><option>C</option></select>
        <input name="phone" placeholder="+998 XX XXX XX XX">
        <button class="platform-primary" type="submit">Arizani yuborish</button>
      </form><div class="platform-status" id="authStatus">Tasdiqlangandan keyin sizga tasodifiy Student ID beriladi.</div>`;
      $("#registerForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const data=Object.fromEntries(f.entries());try{const r=await fetch(API+"/api/students/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const j=await r.json();if(!r.ok)throw Error(j.error);$("#authStatus").innerHTML="⏳ <b>Tekshirilmoqda</b><br>Arizangiz Kattta Admin'ga yuborildi.";e.currentTarget.reset()}catch(err){$("#authStatus").textContent="❌ "+err.message}};
    } else if(mode==="login"){
      title.textContent="🔐 O'quvchi kirishi";
      body.innerHTML=`<form class="platform-form" id="studentLoginForm"><input name="studentId" placeholder="Student ID — ST-123456" required><input name="lastName" placeholder="Familiya" required><button class="platform-primary">Kirish</button></form><div class="platform-status" id="authStatus"></div>`;
      $("#studentLoginForm").onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget).entries());try{const r=await fetch(API+"/api/students/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const j=await r.json();if(!r.ok)throw Error(j.error);student=j.student;localStorage.setItem("myschool_student",JSON.stringify(student));closeAuth();activateMenu()}catch(err){$("#authStatus").textContent="❌ "+err.message}};
    } else {
      title.textContent="👑 Kattta Admin";
      body.innerHTML=`<form class="platform-form" id="adminLoginForm"><input name="username" placeholder="Admin login" required><input name="password" type="password" placeholder="Parol" required><button class="platform-primary">Admin panelga kirish</button></form><div class="platform-status" id="authStatus">Admin login/paroli faqat Render Environment Variables orqali beriladi.</div>`;
      $("#adminLoginForm").onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.currentTarget).entries());try{const r=await fetch(API+"/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const j=await r.json();if(!r.ok)throw Error(j.error);adminToken=j.token;localStorage.setItem("myschool_admin_token",adminToken);closeAuth();openAdmin("dashboard")}catch(err){$("#authStatus").textContent="❌ "+err.message}};
    }
  }

  function activateMenu(){
    const menu=$("#menu"), intro=$("#intro");
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("is-active"));
    menu?.classList.add("is-active");
    const headerTitle=$(".menu__title",menu); if(headerTitle) headerTitle.textContent=student?`MYSCHOOL • ${student.firstName}`:"MYSCHOOL";
  }

  function protectEntry(){
    const enter=$("#enterBtn"); if(!enter)return;
    enter.addEventListener("click",()=>{setTimeout(()=>{if(!student) openAuth("register");},0)});
  }

  async function openAdmin(section){
    $("#platformAdmin").classList.add("is-open");
    document.querySelectorAll("#adminNav button").forEach(b=>b.classList.toggle("active",b.dataset.a===section));
    const names={dashboard:"Dashboard",students:"O'quvchilar",official:"Rasmiy o'quvchilar",teachers:"O'qituvchilar",classes:"Sinflar",subjects:"Fanlar",lessons:"Darslar",tests:"Testlar",results:"Natijalar",schedule:"Jadval",announcements:"E'lonlar",library:"Kutubxona",settings:"Sozlamalar"};
    $("#adminTitle").textContent=names[section]||section;
    try{
      if(section==="dashboard"){const j=await api("/api/admin/dashboard");$("#adminContent").innerHTML=`<div class="admin-grid">${Object.entries(j.counts).map(([k,v])=>`<div class="admin-stat"><span>${esc(k)}</span><b>${v}</b></div>`).join("")}</div><div class="admin-panel" style="margin-top:16px">👑 Kattta Admin barcha o'quvchilar, o'qituvchilar, sinflar, fanlar, darslar, testlar, natijalar, jadvallar, e'lonlar va kutubxonani boshqaradi.</div>`;return}
      if(section==="students"){return renderStudents()}
      if(section==="official"){return renderOfficial()}
      if(section==="teachers"){const j=await api("/api/admin/teachers");$("#adminContent").innerHTML=`<div class="admin-panel"><form id="teacherForm" class="platform-form"><input name="name" placeholder="O'qituvchi F.I.Sh" required><input name="subject" placeholder="Fan"><input name="className" placeholder="Sinf"><button class="platform-primary">O'qituvchi qo'shish</button></form></div><table class="admin-table"><tr><th>Ism</th><th>Fan</th><th>Sinf</th></tr>${j.teachers.map(t=>`<tr><td>${esc(t.name)}</td><td>${esc(t.subject)}</td><td>${esc(t.className)}</td></tr>`).join("")}</table>`;$("#teacherForm").onsubmit=async e=>{e.preventDefault();await api("/api/admin/teachers",{method:"POST",body:Object.fromEntries(new FormData(e.currentTarget).entries())});openAdmin("teachers")};return}
      const map={classes:"classes",subjects:"subjects",lessons:"lessons",tests:"tests",results:"results",schedule:"schedules",announcements:"announcements",library:"books"};
      if(map[section]){const j=await api("/api/admin/content/"+map[section]);renderGeneric(section,map[section],j.items);return}
      if(section==="settings"){$("#adminContent").innerHTML='<div class="admin-panel"><h3>Tizim sozlamalari</h3><p class="platform-muted">Admin login, parol va ADMIN_SECRET Render Environment Variables orqali boshqariladi.</p></div>';return}
    }catch(e){$("#adminContent").innerHTML=`<div class="admin-panel">❌ ${esc(e.message)}</div>`}
  }

  async function renderStudents(){
    const j=await api("/api/admin/students");const pending=j.students.filter(s=>s.status==="pending");
    $("#adminContent").innerHTML=`<div class="admin-panel"><h3>Tekshirilayotgan arizalar (${pending.length})</h3><table class="admin-table"><tr><th>F.I.Sh</th><th>Sinf</th><th>Holat</th><th>Amal</th></tr>${pending.map(s=>`<tr><td>${esc(s.firstName+" "+s.lastName)}</td><td>${esc(s.className+" "+s.section)}</td><td>⏳ Tekshirilmoqda</td><td><button class="platform-primary" data-ok="${s.id}">Tasdiqlash</button> <button class="platform-danger" data-no="${s.id}">Rad etish</button></td></tr>`).join("")}</table></div><div class="admin-panel"><h3>Barcha o'quvchilar</h3><table class="admin-table"><tr><th>ID</th><th>F.I.Sh</th><th>Sinf</th><th>Status</th></tr>${j.students.map(s=>`<tr><td>${esc(s.studentId||"—")}</td><td>${esc(s.firstName+" "+s.lastName)}</td><td>${esc(s.className+" "+s.section)}</td><td>${esc(s.status)}</td></tr>`).join("")}</table></div>`;
    document.querySelectorAll("[data-ok]").forEach(b=>b.onclick=async()=>{await api("/api/admin/students/"+b.dataset.ok+"/approve",{method:"POST"});renderStudents()});
    document.querySelectorAll("[data-no]").forEach(b=>b.onclick=async()=>{await api("/api/admin/students/"+b.dataset.no+"/reject",{method:"POST",body:{reason:"Admin tomonidan rad etildi."}});renderStudents()});
  }

  async function renderOfficial(){
    const j=await api("/api/admin/official-students");
    $("#adminContent").innerHTML=`<div class="admin-panel"><h3>Rasmiy o'quvchi qo'shish</h3><form id="officialForm" class="platform-form"><input name="firstName" placeholder="Ism" required><input name="lastName" placeholder="Familiya" required><input name="className" placeholder="Masalan: 8-sinf" required><select name="section"><option>A</option><option>B</option><option>C</option></select><button class="platform-primary">Qo'shish</button></form></div><table class="admin-table"><tr><th>F.I.Sh</th><th>Sinf</th></tr>${j.students.map(s=>`<tr><td>${esc(s.firstName+" "+s.lastName)}</td><td>${esc(s.className+" "+s.section)}</td></tr>`).join("")}</table>`;
    $("#officialForm").onsubmit=async e=>{e.preventDefault();await api("/api/admin/official-students",{method:"POST",body:Object.fromEntries(new FormData(e.currentTarget).entries())});renderOfficial()};
  }

  function renderGeneric(section,key,items){
    const count=Array.isArray(items)?items.length:Object.keys(items||{}).length;
    $("#adminContent").innerHTML=`<div class="admin-panel"><h3>${esc(section)}</h3><p class="platform-muted">Hozirgi yozuvlar: <b>${count}</b>. Bu bo'lim Kattta Admin uchun boshqaruv maydoni sifatida ulangan.</p><p class="platform-muted">Ma'lumotlarni keyingi tahrirlash uchun JSON editor backend API orqali saqlanadi.</p></div><pre style="white-space:pre-wrap;line-height:1.5;background:#0c121d;padding:16px;border-radius:14px;overflow:auto">${esc(JSON.stringify(items,null,2))}</pre>`;
  }

  async function api(path,opt={}){
    const headers={"Content-Type":"application/json",...(opt.headers||{})};
    if(adminToken) headers.Authorization="Bearer "+adminToken;
    const r=await fetch(API+path,{...opt,headers,body:opt.body && typeof opt.body!=="string"?JSON.stringify(opt.body):opt.body});
    const j=await r.json().catch(()=>({}));
    if(!r.ok) throw Error(j.error||"Server xatosi");
    return j;
  }

  function openSubject(subject){
    const box=$("#subjectBox");$("#subjectDetail").classList.add("is-open");
    const grade=student?.className||"8-sinf";
    const topics=lessonTopics(subject.name,grade);
    box.innerHTML=`<button class="platform-secondary" id="closeSubject">← Yopish</button><h2 style="margin:18px 0 5px">${subject.icon} ${esc(subject.name)}</h2><p class="platform-muted">Sinf: ${esc(grade)} ${esc(student?.section||"")}</p><div class="subject-tabs"><button class="subject-tab active" data-tab="lessons">📖 Darslar</button><button class="subject-tab" data-tab="tests">🧪 Testlar</button><button class="subject-tab" data-tab="results">📊 Natijalar</button></div><div id="subjectContent"></div>`;
    $("#closeSubject").onclick=()=>$("#subjectDetail").classList.remove("is-open");
    const render=tab=>{document.querySelectorAll(".subject-tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));const c=$("#subjectContent");
      if(tab==="lessons"){c.innerHTML=topics.map((t,i)=>`<div class="lesson-topic" data-topic="${i}">📘 ${esc(t.title)}</div>`).join("");c.querySelectorAll("[data-topic]").forEach(b=>b.onclick=()=>{const t=topics[+b.dataset.topic];b.insertAdjacentHTML("afterend",`<div class="lesson-content"><b>📚 Batafsil tushuntirish</b><p>${esc(t.explanation)}</p><b>📐 Formulalar</b><p>${esc(t.formula)}</p><b>💡 Misollar</b><p>${esc(t.example)}</p><b>⚠️ Ko'p uchraydigan xatolar</b><p>${esc(t.mistakes)}</p></div>`)})}
      if(tab==="tests"){c.innerHTML=`<div class="admin-panel"><b>${esc(subject.name)} — ${esc(grade)}</b><p class="platform-muted">Har urinishda yangi savollar to'plami yaratiladi. Savollar sinf darajasiga mos bo'ladi.</p><button class="platform-primary" id="startTest">🧪 Testni boshlash</button></div>`;$("#startTest").onclick=()=>runTest(subject,grade)}
      if(tab==="results"){const key="myschool_results_"+subject.id;const arr=JSON.parse(localStorage.getItem(key)||"[]");const best=arr.length?Math.max(...arr.map(x=>x.score)):0;c.innerHTML=`<div class="admin-grid"><div class="admin-stat">Oxirgi natija<b>${arr.length?arr[arr.length-1].score+"/20":"—"}</b></div><div class="admin-stat">🏆 Rekord<b>${best}/20</b></div><div class="admin-stat">Jami urinish<b>${arr.length}</b></div></div><div class="admin-panel" style="margin-top:14px"><b>📈 O'sish tarixi</b>${arr.map(x=>`<div class="result-row"><span>${x.date}</span><strong>${x.score}/20</strong></div>`).join("")||'<p class="platform-muted">Hali natija yo'q.</p>'}</div>`}
    };
    document.querySelectorAll(".subject-tab").forEach(b=>b.onclick=()=>render(b.dataset.tab));render("lessons");
  }

  function lessonTopics(name,grade){
    const n=parseInt(grade)||8;
    const base={Matematika:["Chiziqli tenglamalar","Kvadrat tenglamalar","Funksiyalar","Tenglamalar sistemasi","Geometrik shakllar"],"Ingliz tili":["Grammar asoslari","Reading","Vocabulary","Speaking","Writing"],"Biologiya":["Hujayra","To'qimalar","Organlar","Organizm tizimlari","Ekologiya"],"Geografiya":["Tabiiy geografiya","Iqlim","Aholi","Tabiiy resurslar","O'zbekiston geografiyasi"]};
    return (base[name]||["Asosiy tushunchalar","Yangi mavzu","Amaliy misollar","Takrorlash","Nazorat"]).map(title=>({title,explanation:`${n}-sinf darajasida ${title} mavzusining asosiy tushunchalari, qoidalari va amaliy qo'llanilishi bosqichma-bosqich tushuntiriladi.`,formula:name==="Matematika"?"Asosiy formula va belgilashlar mavzuga qarab ko'rsatiladi.":"Mavzuga mos qoida, atama va jadval.",example:"Oddiy namunaviy misol va yechim bosqichlari.",mistakes:"Shartni noto'g'ri o'qish, birliklarni aralashtirish yoki formulani noto'g'ri qo'llashdan saqlaning."}));
  }

  function runTest(subject,grade){
    const qs=["Asosiy tushunchani aniqlang.","To'g'ri javobni tanlang.","Misolni yeching.","Qaysi fikr to'g'ri?","Amaliy vaziyatda qaysi yechim mos?"];
    const selected=[...qs].sort(()=>Math.random()-.5).slice(0,5);
    const correct=selected.map((_,i)=>Math.floor(Math.random()*4));
    const answers=selected.map((q,i)=>prompt(`${subject.name} • ${grade}\n\n${i+1}. ${q}\n\nA) Javob 1\nB) Javob 2\nC) Javob 3\nD) Javob 4\n\nJavob harfini kiriting:`));
    let score=0;answers.forEach((a,i)=>{if(a&&a.trim().toUpperCase()==="ABCD"[correct[i]])score+=4});
    const key="myschool_results_"+subject.id;const arr=JSON.parse(localStorage.getItem(key)||"[]");arr.push({score,date:new Date().toLocaleDateString("uz-UZ")});localStorage.setItem(key,JSON.stringify(arr));
    alert(`Natija: ${score}/20\nNatija tarixga saqlandi.`);openSubject(subject);
  }

  function bind(){
    inject();
    $("#studentRegLink").onclick=()=>renderAuth("register");
    $("#studentLoginLink").onclick=()=>renderAuth("login");
    $("#adminLink").onclick=()=>renderAuth("admin");
    $("#adminLogout").onclick=()=>{adminToken="";localStorage.removeItem("myschool_admin_token");$("#platformAdmin").classList.remove("is-open")};
    document.querySelectorAll("#adminNav button").forEach(b=>b.onclick=()=>openAdmin(b.dataset.a));
    protectEntry();
    document.querySelectorAll(".subject-card").forEach(card=>{
      card.style.cursor="pointer";
      card.addEventListener("click",()=>{const name=$(".subject-card__name",card)?.textContent.trim();const icon=$(".subject-card__icon",card)?.textContent.trim();openSubject({name,icon,id:name.toLowerCase().replace(/\\s+/g,"-")})});
    });
    if(student) activateMenu();
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",bind); else bind();
})();
