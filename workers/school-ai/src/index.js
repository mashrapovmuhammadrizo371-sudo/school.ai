const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400"
};
const camelize = value => {
  if (Array.isArray(value)) return value.map(camelize);
  if (value && typeof value === "object") {
    const out = Object.fromEntries(Object.entries(value).map(([key,item]) => [key.replace(/_([a-z])/g, (_,letter) => letter.toUpperCase()), camelize(item)]));
    if (Object.prototype.hasOwnProperty.call(value,"id") && !Object.prototype.hasOwnProperty.call(value,"_id")) out._id = value.id;
    return out;
  }
  return value;
};
const json = (data, status=200) => new Response(JSON.stringify(camelize(data)), {
  status, headers: { "Content-Type":"application/json; charset=utf-8", ...CORS }
});
const fail = (message, status=400) => json({ok:false,error:message},status);
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const str = (v, max=5000) => String(v ?? "").trim().slice(0,max);
const b64u = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g,"").replace(/\+/g,"-").replace(/\//g,"_");
const unb64u = s => Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-s.length%4)%4)),c=>c.charCodeAt(0));
async function hmacKey(secret) { return crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign","verify"]); }
async function issueToken(payload, secret) {
  const head=b64u(new TextEncoder().encode(JSON.stringify({alg:"HS256",typ:"JWT"})));
  const body=b64u(new TextEncoder().encode(JSON.stringify({...payload,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+30*86400})));
  const input=head+"."+body, sig=await crypto.subtle.sign("HMAC",await hmacKey(secret),new TextEncoder().encode(input));
  return input+"."+b64u(sig);
}
async function readToken(request, env) {
  const raw=(request.headers.get("Authorization")||"").replace(/^Bearer\s+/i,"");
  if(!raw || !env.JWT_SECRET) return null;
  try {
    const [h,p,s]=raw.split("."), input=h+"."+p;
    if(!await crypto.subtle.verify("HMAC",await hmacKey(env.JWT_SECRET),unb64u(s),new TextEncoder().encode(input))) return null;
    const data=JSON.parse(new TextDecoder().decode(unb64u(p)));
    if(!data.exp || data.exp<Math.floor(Date.now()/1000)) return null;
    return data;
  } catch { return null; }
}
async function passwordHash(password) {
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:210000,hash:"SHA-256"},key,256);
  return {salt:b64u(salt),hash:b64u(bits)};
}
async function passwordVerify(password,salt,hash) {
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt:unb64u(salt),iterations:210000,hash:"SHA-256"},key,256);
  return b64u(bits)===hash;
}
const one=(db,sql,...v)=>db.prepare(sql).bind(...v).first();
const all=async(db,sql,...v)=>(await db.prepare(sql).bind(...v).all()).results||[];
const run=(db,sql,...v)=>db.prepare(sql).bind(...v).run();
const cols = {
  announcements:["title","text"], books:["title","author","description"], subjects:["name","teacher","description"],
  schedule:["class_name","day","lesson","subject","teacher","room"], reading:["title","book","pages","description"],
  tests:["title","subject","class_name","duration","questions_text"], results:["student_id","test_id","test_title","score","max_score","grade","note"],
  media:["title","type","url","description"]
};
const tables={announcements:"announcements",books:"library_books",subjects:"subjects",schedule:"schedule_entries",reading:"reading_tasks",tests:"tests",results:"results",media:"media_items"};
async function body(req){
  try {
    const value=await req.json();
    if(!value || typeof value!=="object" || Array.isArray(value)) return {};
    const normalized={...value};
    for(const [key,item] of Object.entries(value)) normalized[key.replace(/[A-Z]/g,letter=>"_"+letter.toLowerCase())]=item;
    return normalized;
  } catch { return {}; }
}
async function requireRole(req,env,role){
  const p=await readToken(req,env);
  if(!p || (role && p.role!==role)) throw new Response(JSON.stringify({ok:false,error:"Avtorizatsiya talab qilinadi."}),{status:401,headers:{"Content-Type":"application/json",...CORS}});
  return p;
}
function validClass(v){return /^(?:[1-9]|10|11)-[ABGV]$/.test(str(v,8).toUpperCase());}
async function seed(db){
  await run(db,"INSERT OR IGNORE INTO schools(id,name,code,slug,is_active) VALUES(?,?,?,?,1)","school-stem","STEM School","STEM","stem-school");
}

async function telegramApi(env, method, payload={}) {
  if(!env.TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN missing");
  const response=await fetch("https://api.telegram.org/bot"+env.TELEGRAM_BOT_TOKEN+"/"+method,{
    method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)
  });
  const data=await response.json();
  if(!data.ok) throw new Error("Telegram API "+method+" failed: "+(data.description||"unknown"));
  return data.result;
}
async function telegramSecret(env) {
  const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(env.TELEGRAM_BOT_TOKEN||""));
  return b64u(digest);
}
let telegramWebhookCheckedAt=0;
async function ensureTelegramWebhook(req,env) {
  if(!env.TELEGRAM_BOT_TOKEN || new URL(req.url).pathname==="/telegram/webhook" || Date.now()-telegramWebhookCheckedAt<300000) return;
  try {
    const webhookUrl=new URL(req.url).origin+"/telegram/webhook";
    const expected=await telegramSecret(env);
    const info=await telegramApi(env,"getWebhookInfo",{});
    if(info.url!==webhookUrl) await telegramApi(env,"setWebhook",{url:webhookUrl,secret_token:expected,allowed_updates:["message","callback_query"],drop_pending_updates:false});
    telegramWebhookCheckedAt=Date.now();
  } catch(e) { console.error("Telegram webhook ensure failed",e); }
}
const SCHOOL_APP_URL="https://school-ai-web.pages.dev";
const studentKeyboard=[
  [{text:"📱 SCHOOL.AI",web_app:{url:SCHOOL_APP_URL}}],
  [{text:"📅 Jadval"},{text:"📚 Fanlar"}],
  [{text:"📢 E’lonlar"},{text:"📖 Kitobxona"}],
  [{text:"📚 Kitobxonlik tanlovi"},{text:"👤 Profil"}],
  [{text:"❓ Yordam"}]
];
const staffKeyboard=[
  [{text:"📱 SCHOOL.AI",web_app:{url:SCHOOL_APP_URL}}],
  [{text:"📅 Jadval"},{text:"📚 Fanlar"}],
  [{text:"📢 E’lonlar"},{text:"📖 Kitobxona"}],
  [{text:"👤 Profilim"},{text:"🚪 Chiqish"}],
  [{text:"❓ Yordam"}]
];
const adminInline={inline_keyboard:[
  [{text:"📢 Xabar yuborish",callback_data:"admin:broadcast"}],
  [{text:"📊 Bot holati",callback_data:"admin:status"},{text:"👥 Ulanishlar",callback_data:"admin:links"}],
  [{text:"🚪 Chiqish",callback_data:"admin:logout"}]
]};
async function tgSession(db,chatId,state) {
  if(state===null) return run(db,"DELETE FROM telegram_sessions WHERE chat_id=?",String(chatId));
  return run(db,"INSERT INTO telegram_sessions(chat_id,state,updated_at) VALUES(?,?,?) ON CONFLICT(chat_id) DO UPDATE SET state=excluded.state,updated_at=excluded.updated_at",String(chatId),JSON.stringify(state),now());
}
async function tgGetSession(db,chatId) {
  const row=await one(db,"SELECT state FROM telegram_sessions WHERE chat_id=?",String(chatId));
  try{return row?JSON.parse(row.state):{};}catch{return {};}
}
async function tgLink(db,chatId) {
  return one(db,"SELECT * FROM telegram_links WHERE chat_id=?",String(chatId));
}
async function tgSend(env,chatId,text,keyboard) {
  const payload={chat_id:chatId,text:String(text||"").slice(0,4000)};
  if(keyboard) payload.reply_markup=keyboard;
  return telegramApi(env,"sendMessage",payload);
}
const tgReplyKeyboard=(keyboard)=>({keyboard,resize_keyboard:true});
const tgRoleName=(role)=>role==="teacher"?"O‘qituvchi":role==="director"?"Direktor":"Admin";
async function tgStudent(db,link) {
  return link?.link_type==="student"?one(db,"SELECT * FROM students WHERE student_id=? AND school_id=?",link.linked_id,link.school_id):null;
}
async function tgStaff(db,link) {
  return link?.link_type==="staff"?one(db,"SELECT * FROM staff WHERE id=? AND school_id=? AND is_blocked=0",link.linked_id,link.school_id):null;
}
async function tgConnectStudent(db,chatId,studentId) {
  const student=await one(db,"SELECT * FROM students WHERE student_id=?",String(studentId));
  if(!student) return {error:"❌ Student ID topilmadi yoki hali tasdiqlanmagan."};
  if(student.is_blocked) return {error:"🚫 Hisobingiz bloklangan."};
  await run(db,"DELETE FROM telegram_links WHERE chat_id=?",String(chatId));
  await run(db,"INSERT INTO telegram_links(id,chat_id,school_id,link_type,linked_id,created_at) VALUES(?,?,?,?,?,?)",uid(),String(chatId),student.school_id,"student",student.student_id,now());
  return {student};
}
async function tgSendSchedule(env,db,chatId,schoolId,className,keyboard) {
  const rows=await all(db,"SELECT day,lesson,subject,teacher,room FROM schedule_entries WHERE school_id=? AND class_name=? ORDER BY day,lesson",schoolId,className);
  if(!rows.length) return tgSend(env,chatId,"📅 "+className+" uchun dars jadvali hali kiritilmagan.",keyboard);
  const days=["Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba"];
  let out="📅 "+className+" sinfi jadvali\n\n";
  for(let d=1;d<=6;d++){
    const dayRows=rows.filter(x=>Number(x.day)===d);
    if(!dayRows.length) continue;
    out+="📌 "+days[d-1]+"\n";
    for(const r of dayRows) out+=String(r.lesson)+". "+r.subject+(r.teacher?" — "+r.teacher:"")+(r.room?" | "+r.room:"")+"\n";
    out+="\n";
  }
  return tgSend(env,chatId,out.trim(),keyboard);
}
async function tgContent(env,db,chatId,schoolId,kind,keyboard) {
  const table=kind==="books"?"library_books":"announcements";
  const rows=await all(db,"SELECT * FROM "+table+" WHERE school_id=? ORDER BY created_at DESC LIMIT 10",schoolId);
  const title=kind==="books"?"📖 KITOBXONA":"📢 E’LONLAR";
  if(!rows.length) return tgSend(env,chatId,kind==="books"?"Hozircha kitob kiritilmagan.":"Hozircha e’lon yo‘q.",keyboard);
  const out=rows.map((x,i)=>kind==="books"?(i+1)+". "+x.title+(x.author?" — "+x.author:"")+(x.description?"\n"+x.description:""):(i+1)+". "+x.title+"\n"+x.text).join("\n\n");
  return tgSend(env,chatId,title+"\n\n"+out,keyboard);
}
async function tgSubjects(env,db,chatId,schoolId,keyboard) {
  const rows=await all(db,"SELECT name,teacher FROM subjects WHERE school_id=? ORDER BY name",schoolId);
  return tgSend(env,chatId,rows.length?"📚 FANLAR\n\n"+rows.map((x,i)=>(i+1)+". "+x.name+(x.teacher?" — "+x.teacher:"")).join("\n"):"Hozircha fanlar kiritilmagan.",keyboard);
}
async function tgCompetitionNotifyStaff(env,db,schoolId,item) {
  const staff=await all(db,"SELECT l.chat_id FROM telegram_links l JOIN staff s ON s.id=l.linked_id WHERE l.school_id=? AND l.link_type='staff' AND s.is_blocked=0",schoolId);
  for(const row of staff){
    try{await telegramApi(env,"sendVideo",{chat_id:row.chat_id,video:item.video_file_id,caption:"📚 YANGI KITOBXONLIK TANLOVI\n\n👤 "+item.student_name+"\n🏫 "+item.class_name+"\n📖 "+item.book_name+"\n🔢 Kitob № "+item.book_number+"\n📄 Sahifa: "+item.pages+"\n🆔 Topshiriq: "+item.id+"\n\nBall berish: /ball "+item.id+" BALL izoh"});}catch(e){console.error("Telegram competition notification failed",e);}
  }
}
async function telegramUpdate(req,env) {
  const secret=await telegramSecret(env);
  if(!env.TELEGRAM_BOT_TOKEN || req.headers.get("X-Telegram-Bot-Api-Secret-Token")!==secret) return new Response("Forbidden",{status:403});
  let update; try { update=await req.json(); } catch { return new Response("Bad Request",{status:400}); }
  const db=env.DB;
  if(!db) return new Response("Database unavailable",{status:503});
  try {
    const callback=update.callback_query;
    if(callback){
      const chatId=callback.message?.chat?.id, data=String(callback.data||"");
      if(!chatId) return new Response("OK");
      const link=await tgLink(db,chatId), staff=await tgStaff(db,link), session=await tgGetSession(db,chatId);
      await telegramApi(env,"answerCallbackQuery",{callback_query_id:callback.id});
      if(data==="competition:yes"){
        if(session.step!=="competition_confirm"||!session.videoFileId) return tgSend(env,chatId,"❌ Video topilmadi. /tanlov orqali qayta boshlang.",tgReplyKeyboard(studentKeyboard)).then(()=>new Response("OK"));
        await tgSession(db,chatId,{step:"competition_surname",videoFileId:session.videoFileId});
        await tgSend(env,chatId,"👤 Familiyangizni yozing:");
      } else if(data==="competition:no"){
        await tgSession(db,chatId,{step:"competition_video"});
        await tgSend(env,chatId,"🔄 Yaxshi, videoni boshidan qayta yuboring.");
      } else if(data.startsWith("staff:schedule:")){
        if(!staff) await tgSend(env,chatId,"Avval /staff orqali kiring.");
        else await tgSendSchedule(env,db,chatId,staff.school_id,decodeURIComponent(data.slice(15)),tgReplyKeyboard(staffKeyboard));
      } else if(data==="admin:broadcast"&&session.role==="big-admin"){
        await tgSession(db,chatId,{role:"big-admin",step:"broadcast"});
        await tgSend(env,chatId,"📢 Xabar yuborish rejimi.\n\nYubormoqchi bo‘lgan xabaringizni yozing.\nBekor qilish: /admin");
      } else if(data==="admin:status"&&session.role==="big-admin"){
        const students=await one(db,"SELECT COUNT(*) n FROM telegram_links WHERE link_type='student'");
        const staffs=await one(db,"SELECT COUNT(*) n FROM telegram_links WHERE link_type='staff'");
        await tgSend(env,chatId,"📊 BOT HOLATI\n\n🟢 Bot: ishlayapti\n👨‍🎓 O‘quvchi ulanishlari: "+students.n+"\n👨‍💼 Ishchi ulanishlari: "+staffs.n,{inline_keyboard:adminInline.inline_keyboard});
      } else if(data==="admin:links"&&session.role==="big-admin"){
        const students=await one(db,"SELECT COUNT(*) n FROM telegram_links WHERE link_type='student'");
        const staffs=await one(db,"SELECT COUNT(*) n FROM telegram_links WHERE link_type='staff'");
        await tgSend(env,chatId,"👥 ULANISHLAR\n\nO‘quvchilar: "+students.n+"\nIshchilar: "+staffs.n,{inline_keyboard:adminInline.inline_keyboard});
      } else if(data==="admin:logout"&&session.role==="big-admin"){
        await tgSession(db,chatId,null); await tgSend(env,chatId,"🚪 Katta Admin panelidan chiqildi.",tgReplyKeyboard(studentKeyboard));
      }
      return new Response("OK");
    }
    const msg=update.message;
    if(!msg?.chat?.id) return new Response("OK");
    const chatId=msg.chat.id, textValue=str(msg.text,4000), link=await tgLink(db,chatId);
    let session=await tgGetSession(db,chatId), student=await tgStudent(db,link), staff=await tgStaff(db,link);
    const studentMenu=tgReplyKeyboard(studentKeyboard), staffMenu=tgReplyKeyboard(staffKeyboard);
    if(msg.video && session.step==="competition_video"){
      await tgSession(db,chatId,{step:"competition_confirm",videoFileId:String(msg.video.file_id)});
      await telegramApi(env,"sendMessage",{chat_id:chatId,text:"🎥 Shu video to‘g‘rimi?",reply_markup:{inline_keyboard:[[{text:"✅ Ha",callback_data:"competition:yes"},{text:"❌ Yo‘q",callback_data:"competition:no"}]]}});
      return new Response("OK");
    }
    if(/^\/start(?:@\w+)?(?:\s|$)/i.test(textValue)){
      await tgSession(db,chatId,null);
      if(staff) await tgSend(env,chatId,"👨‍💼 Xush kelibsiz, "+staff.full_name+"!\nIshchi kabinetingiz ulangan.",staffMenu);
      else if(student) await tgSend(env,chatId,"🎓 SCHOOL.AI botiga xush kelibsiz, "+student.first_name+"!",studentMenu);
      else {await tgSession(db,chatId,{step:"waiting_student_id"});await tgSend(env,chatId,"🎓 SCHOOL.AI botiga xush kelibsiz!\n\nO‘quvchi bo‘lsangiz, 6 xonali Student ID yuboring. Xodimlar /staff orqali kiradi.",studentMenu);}
      return new Response("OK");
    }
    if(/^\/help(?:@\w+)?$/i.test(textValue)||textValue==="❓ Yordam"||textValue==="🆘 Yordam"){
      const help=staff?"/staffme\n/stafflogout\n/jadval\n/fanlar\n/elon\n/kitoblar\n/tanlovadmin":"/start\n/id 123456\n/jadval\n/fanlar\n/elon\n/kitoblar\n/profil\n/tanlov\n/ballarim\n/reyting";
      await tgSend(env,chatId,"🆘 YORDAM\n\n"+help,staff?staffMenu:studentMenu);return new Response("OK");
    }
    if(/^\/staff(?:@\w+)?$/i.test(textValue)){
      await tgSession(db,chatId,{step:"staff_username"});
      await tgSend(env,chatId,"👨‍💼 Ishchi kabineti\n\nLoginni yuboring:");return new Response("OK");
    }
    if(/^\/stafflogout(?:@\w+)?$/i.test(textValue)){
      if(link?.link_type==="staff") await run(db,"DELETE FROM telegram_links WHERE chat_id=?",String(chatId));
      await tgSession(db,chatId,null);await tgSend(env,chatId,"✅ Telegram ishchi kabinetidan chiqildi.",studentMenu);return new Response("OK");
    }
    if(/^\/staffme(?:@\w+)?$/i.test(textValue)){
      if(!staff) await tgSend(env,chatId,"Avval /staff orqali kiring.");
      else await tgSend(env,chatId,"👨‍💼 "+staff.full_name+"\n\nRol: "+tgRoleName(staff.role)+"\nLogin: "+staff.username,staffMenu);
      return new Response("OK");
    }
    if(/^\/admin(?:@\w+)?$/i.test(textValue)){
      if(session.role!=="big-admin") await tgSend(env,chatId,"Avval /staff orqali Katta Admin sifatida kiring.");
      else await tgSend(env,chatId,"🛡 KATTA ADMIN PANELI",adminInline);
      return new Response("OK");
    }
    let m=textValue.match(/^\/id(?:@\w+)?(?:\s+(\d{6}))?$/i);
    if(m){
      if(m[1]){
        const result=await tgConnectStudent(db,chatId,m[1]);
        await tgSession(db,chatId,null);
        if(result.error) await tgSend(env,chatId,result.error,studentMenu);
        else await tgSend(env,chatId,"✅ Hisob ulandi!\n\n👤 "+result.student.first_name+" "+result.student.last_name+"\n🏫 Sinf: "+result.student.class_name+"\n🆔 ID: "+result.student.student_id,studentMenu);
      } else {await tgSession(db,chatId,{step:"waiting_student_id"});await tgSend(env,chatId,"🆔 6 xonali Student ID raqamingizni yuboring:");}
      return new Response("OK");
    }
    if(/^\/jadval(?:@\w+)?$/i.test(textValue)||textValue==="📅 Jadval"){
      if(staff){
        const classes=await all(db,"SELECT DISTINCT class_name FROM schedule_entries WHERE school_id=? ORDER BY class_name",staff.school_id);
        const list=classes.map(x=>x.class_name);
        if(!list.length){for(let n=1;n<=11;n++)for(const l of ["A","B","G","V"])list.push(n+"-"+l);}
        const rows=[];for(let i=0;i<list.length;i+=4)rows.push(list.slice(i,i+4).map(c=>({text:c,callback_data:"staff:schedule:"+encodeURIComponent(c)})));
        await telegramApi(env,"sendMessage",{chat_id:chatId,text:"📅 Qaysi sinf jadvalini ko‘rmoqchisiz?",reply_markup:{inline_keyboard:rows}});
      } else if(student) await tgSendSchedule(env,db,chatId,student.school_id,student.class_name,studentMenu);
      else await tgSend(env,chatId,"Avval Student ID ni ulang: /id 123456");
      return new Response("OK");
    }
    if(/^\/fanlar(?:@\w+)?$/i.test(textValue)||textValue==="📚 Fanlar"){
      if(student||staff) await tgSubjects(env,db,chatId,(student||staff).school_id,student?studentMenu:staffMenu);
      else await tgSend(env,chatId,"Avval Student ID ni ulang: /id 123456");
      return new Response("OK");
    }
    if(/^\/(?:elon|e'lon|kitoblar)(?:@\w+)?$/i.test(textValue)||["📢 E’lonlar","📖 Kitobxona","📢 Yangiliklar"].includes(textValue)){
      const schoolId=(student||staff)?.school_id;
      if(!schoolId) await tgSend(env,chatId,"Avval Student ID ni ulang: /id 123456");
      else await tgContent(env,db,chatId,schoolId,(textValue==="/kitoblar"||textValue==="📖 Kitobxona")?"books":"announcements",student?studentMenu:staffMenu);
      return new Response("OK");
    }
    if(/^\/profil(?:@\w+)?$/i.test(textValue)||textValue==="👤 Profil"||textValue==="👤 Profilim"){
      if(student) await tgSend(env,chatId,"👤 PROFIL\n\nIsm: "+student.first_name+"\nFamiliya: "+student.last_name+"\nSinf: "+student.class_name+"\nStudent ID: "+student.student_id,studentMenu);
      else if(staff) await tgSend(env,chatId,"👨‍💼 "+staff.full_name+"\nRol: "+tgRoleName(staff.role)+"\nLogin: "+staff.username,staffMenu);
      else await tgSend(env,chatId,"Avval Student ID ni ulang: /id 123456");
      return new Response("OK");
    }
    if(/^\/tanlov(?:@\w+)?$/i.test(textValue)||textValue==="📚 Kitobxonlik tanlovi"){
      if(!student){await tgSend(env,chatId,"Avval Student ID ni ulang: /id 123456",studentMenu);}
      else {await tgSession(db,chatId,{step:"competition_video"});await tgSend(env,chatId,"📚 KITOBXONLIK TANLOVI\n\n🎥 Kitob o‘qiyotganingiz aks etgan videoni shu yerga yuboring.");}
      return new Response("OK");
    }
    if(/^\/tanlovadmin(?:@\w+)?$/i.test(textValue)||textValue==="📚 Kitobxonlik tanlovi — tekshirish"){
      if(!staff) await tgSend(env,chatId,"Avval /staff orqali kiring.");
      else {
        const rows=await all(db,"SELECT * FROM book_competition WHERE school_id=? ORDER BY created_at DESC LIMIT 15",staff.school_id);
        if(!rows.length) await tgSend(env,chatId,"📚 Hozircha video topshirilmagan.");
        else await tgSend(env,chatId,"📚 KITOBXONLIK TANLOVI — USTOZ\n\n"+rows.map((x,i)=>(i+1)+". "+x.student_name+" ("+x.class_name+")\nStudent ID: "+x.student_id+"\nTopshiriq ID: "+x.id+"\nBall: "+(x.scored?x.total_score+"/100":"Baholanmagan")).join("\n\n")+"\n\nBall berish: /ball TOPSHIRIQ_ID BALL izoh");
      }
      return new Response("OK");
    }
    m=textValue.match(/^\/ball(?:@\w+)?\s+([a-f0-9-]{20,40})\s+(\d{1,3})(?:\s+([\s\S]+))?$/i);
    if(m){
      if(!staff||!["teacher","director","admin"].includes(staff.role)) await tgSend(env,chatId,"❌ Bu amal uchun ruxsat yo‘q.");
      else {
        const score=Number(m[2]), item=await one(db,"SELECT * FROM book_competition WHERE id=? AND school_id=?",m[1],staff.school_id);
        if(score>100||!item) await tgSend(env,chatId,"❌ Ball 0–100 oralig‘ida bo‘lishi va topshiriq ID to‘g‘ri bo‘lishi kerak.");
        else {
          await run(db,"UPDATE book_competition SET total_score=?,teacher_comment=?,scored=1,updated_at=? WHERE id=?",score,str(m[3],500),now(),item.id);
          try{await tgSend(env,item.telegram_chat_id,"📚 Tanlov natijasi!\n\n⭐ Ball: "+score+"/100\n💬 Ustoz: "+(str(m[3],500)||"Izoh yo‘q."),studentMenu);}catch(e){console.error("competition score notification failed",e);}
          await tgSend(env,chatId,"✅ Ball va izoh saqlandi.");
        }
      }
      return new Response("OK");
    }
    if(/^\/ballarim(?:@\w+)?$/i.test(textValue)){
      if(!student) await tgSend(env,chatId,"Avval Student ID ni ulang: /id 123456",studentMenu);
      else {
        const x=await one(db,"SELECT * FROM book_competition WHERE school_id=? AND student_id=? ORDER BY created_at DESC LIMIT 1",student.school_id,student.student_id);
        if(!x) await tgSend(env,chatId,"⭐ Hozircha tanlovga topshirgan videongiz yo‘q.",studentMenu);
        else {
          const rank=await one(db,"SELECT COUNT(*) n FROM book_competition WHERE school_id=? AND scored=1 AND total_score>?",student.school_id,x.total_score);
          await tgSend(env,chatId,"⭐ BALLARIM\n\nBall: "+(x.scored?x.total_score:0)+"/100\n🏆 O‘rin: "+(x.scored?(rank.n+1)+"-o‘rin":"Hali belgilanmagan")+"\n💬 Ustoz izohi: "+(x.teacher_comment||"Hali izoh yo‘q."),studentMenu);
        }
      }
      return new Response("OK");
    }
    if(/^\/reyting(?:@\w+)?$/i.test(textValue)){
      if(!student) await tgSend(env,chatId,"Avval Student ID ni ulang: /id 123456",studentMenu);
      else {
        const rows=await all(db,"SELECT student_name,total_score FROM book_competition WHERE school_id=? AND scored=1 ORDER BY total_score DESC LIMIT 10",student.school_id);
        await tgSend(env,chatId,"🏆 MUSOBAQA BALLARI\n\n"+(rows.length?rows.map((x,i)=>(i+1)+". "+x.student_name+" — "+x.total_score+" ball").join("\n"):"Hozircha natijalar yo‘q."),studentMenu);
      }
      return new Response("OK");
    }
    if(session.step==="staff_username"&&textValue){
      await tgSession(db,chatId,{step:"staff_password",username:textValue.toLowerCase()});
      await tgSend(env,chatId,"🔐 Parolni yuboring:");return new Response("OK");
    }
    if(session.step==="staff_password"&&textValue){
      const username=session.username, password=textValue;
      if(env.ADMIN_USERNAME&&env.ADMIN_PASSWORD&&username===String(env.ADMIN_USERNAME).toLowerCase()&&password===env.ADMIN_PASSWORD){
        await tgSession(db,chatId,{role:"big-admin"});
        await tgSend(env,chatId,"✅ Katta Admin tasdiqlandi!\n\n/admin — Katta Admin paneli");
        return new Response("OK");
      }
      const user=await one(db,"SELECT * FROM staff WHERE username=? COLLATE NOCASE",username);
      let ok=false;
      if(user&&!user.is_blocked&&String(user.password_hash||"").startsWith("pbkdf2$")){
        const parts=user.password_hash.split("$");if(parts.length===3)ok=await passwordVerify(password,parts[1],parts[2]);
      }
      if(!ok){await tgSession(db,chatId,{step:"staff_username"});await tgSend(env,chatId,"❌ Login yoki parol noto‘g‘ri. /staff orqali qayta urinib ko‘ring.\nLoginni yuboring:");}
      else {
        await run(db,"DELETE FROM telegram_links WHERE chat_id=?",String(chatId));
        await run(db,"INSERT INTO telegram_links(id,chat_id,school_id,link_type,linked_id,created_at) VALUES(?,?,?,?,?,?)",uid(),String(chatId),user.school_id,"staff",user.id,now());
        await tgSession(db,chatId,null);
        await tgSend(env,chatId,"✅ Ishchi kabineti ulandi!\n\n👨‍💼 "+user.full_name+"\n🎖 Rol: "+tgRoleName(user.role)+"\n\n/staffme — profil\n/stafflogout — chiqish",staffMenu);
      }
      return new Response("OK");
    }
    if(session.step==="waiting_student_id"&&/^\d{6}$/.test(textValue)){
      const result=await tgConnectStudent(db,chatId,textValue);
      await tgSession(db,chatId,null);
      if(result.error) await tgSend(env,chatId,result.error,studentMenu);
      else await tgSend(env,chatId,"✅ Hisob ulandi!\n\n👤 "+result.student.first_name+" "+result.student.last_name+"\n🏫 Sinf: "+result.student.class_name+"\n🆔 ID: "+result.student.student_id,studentMenu);
      return new Response("OK");
    }
    if(session.step==="competition_surname"&&textValue){
      await tgSession(db,chatId,{...session,step:"competition_firstname",surname:textValue});await tgSend(env,chatId,"👤 Ismingizni yozing:");return new Response("OK");
    }
    if(session.step==="competition_firstname"&&textValue){
      await tgSession(db,chatId,{...session,step:"competition_class",firstName:textValue});await tgSend(env,chatId,"🏫 Sinfingizni yozing:");return new Response("OK");
    }
    if(session.step==="competition_class"&&textValue){
      await tgSession(db,chatId,{...session,step:"competition_booknumber",className:textValue});await tgSend(env,chatId,"📚 Nechanchi kitobni o‘qidingiz? Faqat raqam kiriting:");return new Response("OK");
    }
    if(session.step==="competition_booknumber"&&textValue){
      if(!/^\d+$/.test(textValue)||Number(textValue)<1){await tgSend(env,chatId,"❌ Kitob raqamini raqamda kiriting.");return new Response("OK");}
      await tgSession(db,chatId,{...session,step:"competition_bookname",bookNumber:Number(textValue)});await tgSend(env,chatId,"📖 Kitob nomini yozing:");return new Response("OK");
    }
    if(session.step==="competition_bookname"&&textValue){
      await tgSession(db,chatId,{...session,step:"competition_pages",bookName:textValue});await tgSend(env,chatId,"📄 Nechta sahifa o‘qidingiz? Faqat raqam kiriting:");return new Response("OK");
    }
    if(session.step==="competition_pages"&&textValue){
      if(!/^\d+$/.test(textValue)||Number(textValue)<1){await tgSend(env,chatId,"❌ Sahifalar sonini raqamda kiriting.");return new Response("OK");}
      const linked=await tgStudent(db,await tgLink(db,chatId));
      if(!linked){await tgSession(db,chatId,null);await tgSend(env,chatId,"❌ O‘quvchi akkaunti topilmadi. /id 123456 orqali qayta ulaning.",studentMenu);return new Response("OK");}
      const item={id:uid(),school_id:linked.school_id,student_id:linked.student_id,student_name:session.firstName+" "+session.surname,class_name:session.className,telegram_chat_id:String(chatId),video_file_id:session.videoFileId,book_number:Number(session.bookNumber),book_name:session.bookName,pages:Number(textValue),total_score:0,teacher_comment:"",scored:0,created_at:now(),updated_at:now()};
      await run(db,"INSERT INTO book_competition(id,school_id,student_id,student_name,class_name,telegram_chat_id,video_file_id,book_number,book_name,pages,total_score,teacher_comment,scored,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",item.id,item.school_id,item.student_id,item.student_name,item.class_name,item.telegram_chat_id,item.video_file_id,item.book_number,item.book_name,item.pages,0,"",0,item.created_at,item.updated_at);
      await tgCompetitionNotifyStaff(env,db,item.school_id,item);
      await tgSession(db,chatId,null);
      await tgSend(env,chatId,"✅ Анкета қабул қилинди!\n\n📚 Китоб: "+item.book_name+"\n🔢 Китоб рақами: "+item.book_number+"\n📄 Саҳифалар: "+item.pages+"\n👤 "+item.student_name+"\n🏫 Синф: "+item.class_name+"\n\nUstoz tekshirib, natijani belgilaydi.",studentMenu);
      return new Response("OK");
    }
    if(session.step==="broadcast"&&session.role==="big-admin"&&textValue){
      if(textValue==="/admin"){await tgSession(db,chatId,{role:"big-admin"});await tgSend(env,chatId,"🛡 KATTA ADMIN PANELI",adminInline);return new Response("OK");}
      const recipients=await all(db,"SELECT DISTINCT chat_id FROM telegram_links");
      let sent=0,failed=0;
      for(const row of recipients){try{await tgSend(env,row.chat_id,textValue);sent++;}catch{failed++;}}
      await tgSession(db,chatId,{role:"big-admin"});
      await tgSend(env,chatId,"✅ Xabar yuborish yakunlandi.\n\nYuborildi: "+sent+"\nYuborilmadi: "+failed,adminInline);
      return new Response("OK");
    }
    if(textValue==="📚 O‘quvchi"){await tgSend(env,chatId,"📚 O‘quvchi bo‘limi\n\nStudent ID orqali akkauntingizni ulang: /id 123456",studentMenu);return new Response("OK");}
    if(textValue==="👩‍🏫 O‘qituvchi"){await tgSend(env,chatId,"👩‍🏫 O‘qituvchi kabinetiga kirish: /staff",studentMenu);return new Response("OK");}
    if(textValue==="🆘 Yordam"||textValue==="📢 Yangiliklar"){await tgSend(env,chatId,"SCHOOL.AI platformasidagi e’lonlarni ko‘rish uchun avval akkauntingizni ulang: /id 123456",studentMenu);return new Response("OK");}
    if(textValue){await tgSend(env,chatId,"Xabaringiz qabul qilindi. 😊\n\nMenyudagi tugmalardan foydalaning yoki /help buyrug‘ini yuboring.",staff?staffMenu:studentMenu);}
    return new Response("OK");
  } catch(e) {
    console.error("Telegram update failed",e);
    return new Response("OK");
  }
}

async function handle(req,env){
  const db=env.DB, url=new URL(req.url), path=url.pathname, method=req.method;
  if(method==="OPTIONS") return new Response(null,{status:204,headers:CORS});
  await ensureTelegramWebhook(req,env);
  if(path==="/telegram/webhook" && method==="POST") return telegramUpdate(req,env);

  if(!db) return fail("Database binding DB sozlanmagan.",503);
  if(path==="/"||path==="/health"||path==="/api/health"){
    try { await seed(db); const r=await one(db,"SELECT 1 AS ok"); return json({ok:r?.ok===1,service:"SCHOOL.AI API",database:"connected",stage:"cloudflare-d1-api"}); }
    catch(e){return fail("Database bilan ulanishda xatolik.",503);}
  }
  if(!env.JWT_SECRET) return fail("JWT_SECRET Cloudflare Secret sifatida sozlanishi kerak.",503);
  try {
    if(method==="POST"&&path==="/api/students/register"){
      const b=await body(req), first=str(b.firstName,80), last=str(b.lastName,80), cls=str(b.className,8).toUpperCase(), code=str(b.schoolCode||"STEM",20).toUpperCase();
      if(first.length<2||last.length<2||!validClass(cls)) return fail("Maʼlumotlarni to‘g‘ri kiriting.");
      const school=await one(db,"SELECT id FROM schools WHERE code=? COLLATE NOCASE AND is_active=1",code);
      if(!school)return fail("Maktab kodi topilmadi.",404);
      const id=uid(); await run(db,"INSERT INTO applications(id,school_id,first_name,last_name,class_name,photo_data,status,created_at) VALUES(?,?,?,?,?,?,?,?)",id,school.id,first,last,cls,str(b.photoData,1500000),"pending",now());
      return json({ok:true,applicationId:id,status:"pending"},201);
    }
    let m=path.match(/^\/api\/students\/application\/([^/]+)$/);
    if(method==="GET"&&m){
      const a=await one(db,"SELECT status,first_name AS firstName,last_name AS lastName,class_name AS className,student_id AS studentId,rejection_reason AS rejectionReason FROM applications WHERE id=?",m[1]);
      return a?json({ok:true,...a}):fail("Ariza topilmadi.",404);
    }
    if(method==="POST"&&path==="/api/students/login"){
      const b=await body(req), id=str(b.studentId,6);
      if(!/^\\d{6}$/.test(id))return fail("Student ID 6 xonali bo‘lishi kerak.");
      const s=await one(db,"SELECT * FROM students WHERE student_id=?",id);
      if(!s)return fail("Student ID topilmadi.",404);
      if(s.is_blocked)return fail("Profil bloklangan.",403);
      const token=await issueToken({role:"student",studentId:s.student_id,schoolId:s.school_id},env.JWT_SECRET);
      return json({ok:true,token,student:{studentId:s.student_id,firstName:s.first_name,lastName:s.last_name,className:s.class_name,photoData:s.photo_data}});
    }
    if(method==="POST"&&path==="/api/admin/login"){
      if(!env.ADMIN_USERNAME||!env.ADMIN_PASSWORD)return fail("ADMIN_USERNAME va ADMIN_PASSWORD Secretlari sozlanishi kerak.",503);
      const b=await body(req);
      if(str(b.username,100)!==env.ADMIN_USERNAME||str(b.password,300)!==env.ADMIN_PASSWORD)return fail("Login yoki parol noto‘g‘ri.",401);
      return json({ok:true,token:await issueToken({role:"big-admin"},env.JWT_SECRET),admin:{username:env.ADMIN_USERNAME}});
    }
    if(method==="POST"&&path==="/api/staff/login"){
      const b=await body(req), username=str(b.username,100).toLowerCase();
      const s=await one(db,"SELECT * FROM staff WHERE username=? COLLATE NOCASE",username);
      if(!s||s.is_blocked||!s.password_hash.startsWith("pbkdf2$"))return fail("Login yoki parol noto‘g‘ri.",401);
      const [salt,hash]=s.password_hash.split("$").slice(1);
      if(!await passwordVerify(str(b.password,300),salt,hash))return fail("Login yoki parol noto‘g‘ri.",401);
      return json({ok:true,token:await issueToken({role:"staff",staffId:s.id,schoolId:s.school_id,staffRole:s.role},env.JWT_SECRET),staff:{fullName:s.full_name,role:s.role,subject:s.subject}});
    }
    if(path.startsWith("/api/admin/")){
      const p=await requireRole(req,env,"big-admin");
      if(method==="GET"&&path==="/api/admin/dashboard"){
        const [pending,students,staff,schools]=await Promise.all([
          one(db,"SELECT COUNT(*) n FROM applications WHERE status='pending'"),one(db,"SELECT COUNT(*) n FROM students"),
          one(db,"SELECT COUNT(*) n FROM staff"),one(db,"SELECT COUNT(*) n FROM schools WHERE is_active=1")]);
        return json({ok:true,pending:pending.n,students:students.n,staff:staff.n,schools:schools.n});
      }
      if(method==="GET"&&path==="/api/admin/applications")return json({ok:true,items:await all(db,"SELECT a.*,s.name AS school_name,s.code AS school_code FROM applications a JOIN schools s ON s.id=a.school_id WHERE a.status='pending' ORDER BY a.created_at DESC")});
      if(method==="GET"&&path==="/api/admin/students")return json({ok:true,items:await all(db,"SELECT st.*,s.name AS school_name,s.code AS school_code FROM students st JOIN schools s ON s.id=st.school_id ORDER BY st.created_at DESC")});
      m=path.match(/^\/api\/admin\/applications\/([^/]+)\/(approve|reject)$/);
      if(method==="POST"&&m){
        const a=await one(db,"SELECT * FROM applications WHERE id=? AND status='pending'",m[1]); if(!a)return fail("Ariza topilmadi.",404);
        if(m[2]==="approve"){
          let sid; do{sid=String(crypto.getRandomValues(new Uint32Array(1))[0]%900000+100000)}while(await one(db,"SELECT id FROM students WHERE student_id=?",sid));
          const studentPk=uid(), time=now();
          await db.batch([
            db.prepare("INSERT INTO students(id,school_id,student_id,first_name,last_name,class_name,photo_data,is_blocked,created_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(studentPk,a.school_id,sid,a.first_name,a.last_name,a.class_name,a.photo_data,0,time),
            db.prepare("UPDATE applications SET status='approved',student_id=?,reviewed_at=? WHERE id=?").bind(sid,time,a.id),
            db.prepare("UPDATE telegram_links SET link_type='student',linked_id=? WHERE link_type='application' AND linked_id=?").bind(sid,a.id)
          ]);
          const linked=await one(db,"SELECT chat_id FROM telegram_links WHERE link_type='student' AND linked_id=?",sid);
          if(linked&&env.TELEGRAM_BOT_TOKEN){try{await tgSend(env,linked.chat_id,"🎉 Tabriklaymiz, "+a.first_name+"!\n\nSiz SCHOOL.AI tizimida ro‘yxatdan muvaffaqiyatli o‘tdingiz. ✅\n\n🆔 Student ID: "+sid+"\n🏫 Sinf: "+a.class_name,tgReplyKeyboard(studentKeyboard));}catch(e){console.error("Student approval notification failed",e);}}
          return json({ok:true,student:{studentId:sid,firstName:a.first_name,lastName:a.last_name,className:a.class_name}});
        }
        const b=await body(req), reason=str(b.reason||"Ariza rad etildi.",500);
        await run(db,"UPDATE applications SET status='rejected',rejection_reason=?,reviewed_at=? WHERE id=?",reason,now(),a.id);
        const linked=await one(db,"SELECT chat_id FROM telegram_links WHERE link_type='application' AND linked_id=?",a.id);
        if(linked&&env.TELEGRAM_BOT_TOKEN){try{await tgSend(env,linked.chat_id,"❌ Arizangiz rad etildi.\nSabab: "+reason+"\n\nQayta ro‘yxatdan o‘tish uchun maktab administratoriga murojaat qiling.");}catch(e){console.error("Student rejection notification failed",e);}}
        return json({ok:true});
      }
      m=path.match(/^\/api\/admin\/applications\/([^/]+)$/);
      if(method==="DELETE"&&m){await run(db,"DELETE FROM applications WHERE id=?",m[1]);return json({ok:true});}
      m=path.match(/^\/api\/admin\/students\/([^/]+)\/block$/);
      if(method==="PATCH"&&m){const b=await body(req);const r=await run(db,"UPDATE students SET is_blocked=? WHERE id=?",b.blocked?1:0,m[1]);return json({ok:true,blocked:!!b.blocked});}
      m=path.match(/^\/api\/admin\/students\/([^/]+)$/);
      if(method==="DELETE"&&m){await run(db,"DELETE FROM students WHERE id=?",m[1]);return json({ok:true});}
      if(method==="GET"&&path==="/api/admin/schools")return json({ok:true,items:await all(db,"SELECT * FROM schools ORDER BY created_at DESC")});
      if(method==="POST"&&path==="/api/admin/schools"){
        const b=await body(req), name=str(b.name,160), code=str(b.code,30).toUpperCase(), slug=str(b.slug,100).toLowerCase();
        if(!name||!code||!slug)return fail("Maktab nomi, kodi va slug kerak.");
        try{const id=uid();await run(db,"INSERT INTO schools(id,name,code,slug,is_active,created_at) VALUES(?,?,?,?,1,?)",id,name,code,slug,now());return json({ok:true,item:{id,name,code,slug,is_active:1}},201)}catch{return fail("Maktab kodi yoki slug band.",409);}
      }
      m=path.match(/^\/api\/admin\/schools\/([^/]+)$/);
      if(method==="DELETE"&&m){await run(db,"UPDATE schools SET is_active=0 WHERE id=?",m[1]);return json({ok:true});}
      if(method==="GET"&&path==="/api/admin/staff")return json({ok:true,items:await all(db,"SELECT id,school_id,full_name,username,role,subject,is_blocked,created_at FROM staff ORDER BY created_at DESC")});
      if(method==="POST"&&path==="/api/admin/staff"){
        const b=await body(req), fullName=str(b.fullName,160), username=str(b.username,80), password=str(b.password,300), role=str(b.role||"teacher",20), subject=str(b.subject,100);
        if(!fullName||username.length<3||password.length<8||!["teacher","admin","director"].includes(role))return fail("Ism, username, kamida 8 belgili parol va to‘g‘ri rol kiriting.");
        const school=await one(db,"SELECT id FROM schools WHERE is_active=1 ORDER BY created_at LIMIT 1");if(!school)return fail("Faol maktab yo‘q.",400);
        const hp=await passwordHash(password);
        try{const id=uid();await run(db,"INSERT INTO staff(id,school_id,full_name,username,password_hash,password_salt,role,subject,is_blocked,created_at) VALUES(?,?,?,?,?,?,?,?,0,?)",id,school.id,fullName,username,"pbkdf2$"+hp.salt+"$"+hp.hash,hp.salt,role,subject,now());return json({ok:true,id},201)}catch{return fail("Ishchi yaratilmadi. Username band bo‘lishi mumkin.",409);}
      }
      m=path.match(/^\/api\/admin\/staff\/([^/]+)$/);
      if(method==="DELETE"&&m){await run(db,"DELETE FROM staff WHERE id=?",m[1]);return json({ok:true});}
      for(const [key,table] of Object.entries(tables)){
        const base="/api/admin/"+key;
        if(path===base&&method==="GET")return json({ok:true,items:await all(db,"SELECT t.*,s.name AS school_name,s.code AS school_code FROM "+table+" t LEFT JOIN schools s ON s.id=t.school_id ORDER BY t.created_at DESC")});
        if(path===base&&method==="POST"){
          const b=await body(req), school=await one(db,"SELECT id FROM schools WHERE is_active=1 ORDER BY created_at LIMIT 1");if(!school)return fail("Faol maktab yo‘q.");
          const fields=cols[key], id=uid(), values=fields.map(k=>b[k]??(k==="duration"?45:k==="pages"||k==="day"||k==="lesson"||k==="score"||k==="max_score"?0:""));
          if(!str(b[fields[0]],250))return fail("Majburiy maydon to‘ldirilmagan.");
          await run(db,"INSERT INTO "+table+"(id,school_id,"+fields.join(",")+",created_at) VALUES("+Array(fields.length+3).fill("?").join(",")+")",id,school.id,...values,now());
          return json({ok:true,item:{id,school_id:school.id,...Object.fromEntries(fields.map((k,i)=>[k,values[i]]))}},201);
        }
        m=path.match(new RegExp("^/api/admin/"+key+"/([^/]+)$"));
        if(m&&method==="DELETE"){await run(db,"DELETE FROM "+table+" WHERE id=?",m[1]);return json({ok:true});}
      }
      const school=await one(db,"SELECT id FROM schools WHERE is_active=1 ORDER BY created_at LIMIT 1");
      if(method==="GET"&&path==="/api/admin/telegram"){const item=school?await one(db,"SELECT * FROM telegram_config WHERE school_id=?",school.id):null;return json({ok:true,item:item||{}});}
      if(method==="PUT"&&path==="/api/admin/telegram"){if(!school)return fail("Faol maktab yo‘q.");const b=await body(req);const old=await one(db,"SELECT id FROM telegram_config WHERE school_id=?",school.id);const vals=[str(b.botUsername,100),str(b.miniAppUrl,500),str(b.channelUsername,100),str(b.webhookUrl,500),now()];if(old)await run(db,"UPDATE telegram_config SET bot_username=?,mini_app_url=?,channel_username=?,webhook_url=?,updated_at=? WHERE school_id=?",...vals,school.id);else await run(db,"INSERT INTO telegram_config(id,school_id,bot_username,mini_app_url,channel_username,webhook_url,updated_at) VALUES(?,?,?,?,?,?,?)",uid(),school.id,...vals);return json({ok:true});}
      if(method==="GET"&&path==="/api/admin/security"){const item=school?await one(db,"SELECT * FROM security_contacts WHERE school_id=?",school.id):null;return json({ok:true,item:item||{phone:"",telegram:""}});}
      if(method==="PUT"&&path==="/api/admin/security"){if(!school)return fail("Faol maktab yo‘q.");const b=await body(req),old=await one(db,"SELECT id FROM security_contacts WHERE school_id=?",school.id),vals=[str(b.phone,80),str(b.telegram,120),now()];if(old)await run(db,"UPDATE security_contacts SET phone=?,telegram=?,updated_at=? WHERE school_id=?",...vals,school.id);else await run(db,"INSERT INTO security_contacts(id,school_id,phone,telegram,updated_at) VALUES(?,?,?,?,?)",uid(),school.id,...vals);return json({ok:true});}
      if(method==="GET"&&path==="/api/admin/support"){const item=school?await one(db,"SELECT * FROM support_info WHERE school_id=?",school.id):null;return json({ok:true,item:item||{text:"Savollar bo‘lsa, maktab administratoriga murojaat qiling."}});}
      if(method==="PUT"&&path==="/api/admin/support"){if(!school)return fail("Faol maktab yo‘q.");const b=await body(req),old=await one(db,"SELECT id FROM support_info WHERE school_id=?",school.id);if(old)await run(db,"UPDATE support_info SET text=?,updated_at=? WHERE school_id=?",str(b.text,5000),now(),school.id);else await run(db,"INSERT INTO support_info(id,school_id,text,updated_at) VALUES(?,?,?,?)",uid(),school.id,str(b.text,5000),now());return json({ok:true});}
    }
    if(path.startsWith("/api/student/")){
      const p=await requireRole(req,env,"student");
      const s=await one(db,"SELECT * FROM students WHERE student_id=?",p.studentId);if(!s||s.is_blocked)return fail("Profil topilmadi yoki bloklangan.",403);
      if(method==="GET"&&path==="/api/student/me"){const school=await one(db,"SELECT name,code FROM schools WHERE id=?",s.school_id);return json({ok:true,student:{...s,schoolId:school}});}
      const content={
        "/api/student/announcements":["announcements","school_id=?","created_at DESC"],
        "/api/student/books":["library_books","school_id=?","created_at DESC"],
        "/api/student/subjects":["subjects","school_id=?","name ASC"],
        "/api/student/reading":["reading_tasks","school_id=?","created_at DESC"]
      };
      if(method==="GET"&&content[path]){const [table,where,sort]=content[path];return json({ok:true,items:await all(db,"SELECT * FROM "+table+" WHERE "+where+" ORDER BY "+sort,s.school_id)});}
      if(method==="GET"&&path==="/api/student/schedule")return json({ok:true,items:await all(db,"SELECT * FROM schedule_entries WHERE school_id=? AND class_name=? ORDER BY day,lesson",s.school_id,s.class_name)});
      if(method==="GET"&&path==="/api/student/security"){const item=await one(db,"SELECT phone,telegram FROM security_contacts WHERE school_id=?",s.school_id);return json({ok:true,item:item||{phone:"",telegram:""}});}
      if(method==="GET"&&path==="/api/student/support"){const item=await one(db,"SELECT text FROM support_info WHERE school_id=?",s.school_id);return json({ok:true,item:item||{text:"Savollar bo‘lsa, maktab administratoriga murojaat qiling."}});}
    }
    if(path==="/api/staff/me"&&method==="GET"){
      const p=await requireRole(req,env,"staff"),s=await one(db,"SELECT id,school_id,full_name,username,role,subject,is_blocked,created_at FROM staff WHERE id=?",p.staffId);
      const school=s?await one(db,"SELECT name,code FROM schools WHERE id=?",s.school_id):null;
      return s&&!s.is_blocked?json({ok:true,staff:{...s,schoolId:school}}):fail("Ishchi topilmadi yoki bloklangan.",404);
    }
    return fail("API route topilmadi.",404);
  } catch(e) {
    if(e instanceof Response)return e;
    console.error("SCHOOL.AI API error",e);
    return fail("Serverda kutilmagan xatolik yuz berdi.",500);
  }
}
export default { async fetch(request,env){ return handle(request,env); } };
