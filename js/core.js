const API='https://myschool-ai.onrender.com';
const APP_BUILD='20261004-modular-1';
const app=document.getElementById('app');
const get=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const classLetters=['A','B','G','V'];
const classes=Array.from({length:11},(_,i)=>classLetters.map(l=>(i+1)+'-'+l)).flat();
let registrationPhoto='';
let registrationStream=null;
function getTelegramInitData(){try{return window.Telegram?.WebApp?.initData||''}catch(e){return ''}}
async function syncTelegramAccount(){
  const initData=getTelegramInitData();
  if(!initData)return {ok:false,telegram:false};
  try{
    const r=await fetch(API+'/api/telegram/webapp-auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({initData}),cache:'no-store'});
    const d=await r.json();
    if(!r.ok)throw new Error(d.error||'Telegram akkauntini tekshirib bo\'lmadi.');
    if(d.status==='approved'&&d.student){
      save('myschool_student',d.student);
      if(d.token)save('myschool_student_token',d.token);
      localStorage.removeItem('myschool_pending_application');
      return {ok:true,telegram:true,status:'approved'};
    }
    if(d.status==='pending'&&d.applicationId){
      localStorage.removeItem('myschool_student');
      localStorage.removeItem('myschool_student_token');
      save('myschool_pending_application',d.applicationId);
      return {ok:true,telegram:true,status:'pending'};
    }
    if(d.status==='not_registered'||d.status==='rejected'){
      localStorage.removeItem('myschool_student');
      localStorage.removeItem('myschool_student_token');
      localStorage.removeItem('myschool_pending_application');
      return {ok:true,telegram:true,status:d.status};
    }
    if(d.status==='blocked'){
      localStorage.removeItem('myschool_student');
      localStorage.removeItem('myschool_student_token');
      localStorage.removeItem('myschool_pending_application');
      app.innerHTML='<div class="wrap"><section class="card center"><h1 class="title">🚫 Hisob bloklangan</h1><p class="muted">Katta administrator bilan bog‘laning.</p></section></div>';
      return {ok:true,telegram:true,status:'blocked'};
    }
    throw new Error('Telegram akkaunt holati aniqlanmadi.');
  }catch(e){
    localStorage.removeItem('myschool_student');
    localStorage.removeItem('myschool_student_token');
    localStorage.removeItem('myschool_pending_application');
    app.innerHTML='<div class="wrap"><section class="card center"><h1 class="title">⚠️ Ulanishda xatolik</h1><p class="muted">Telegram akkauntingizni tekshirib bo‘lmadi. Internetni tekshirib, Mini Appni qayta oching.</p><button class="btn" onclick="location.reload()">Qayta urinish</button></section></div>';
    return {ok:false,telegram:true,error:e.message};
  }
}