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
    const origin=new URL(req.url).origin, webhookUrl=origin+"/telegram/webhook";
    const expected=await telegramSecret(env);
    const info=await telegramApi(env,"getWebhookInfo",{});
    if(info.url!==webhookUrl) await telegramApi(env,"setWebhook",{url:webhookUrl,secret_token:expected,allowed_updates:["message"],drop_pending_updates:false});
    telegramWebhookCheckedAt=Date.now();
  } catch(e) { console.error("Telegram webhook ensure failed",e); }
}
async function telegramUpdate(req,env) {
  const secret=await telegramSecret(env);
  if(!env.TELEGRAM_BOT_TOKEN || req.headers.get("X-Telegram-Bot-Api-Secret-Token")!==secret) return new Response("Forbidden",{status:403});
  let update; try { update=await req.json(); } catch { return new Response("Bad Request",{status:400}); }
  const message=update.message;
  if(!message || !message.chat || !message.chat.id) return new Response("OK");
  const chatId=message.chat.id, textValue=str(message.text,2000);
  let reply, keyboard;
  if(/^\/start(?:@\w+)?(?:\s|$)/i.test(textValue)) {
    reply="Assalomu alaykum! SCHOOL.AI botiga xush kelibsiz. 🏫\n\nMen maktab yangiliklari va foydali ma’lumotlarni topishda yordam beraman. Quyidagi bo‘limlardan birini tanlang.";
    keyboard=[[{text:"📚 O‘quvchi"},{text:"👩‍🏫 O‘qituvchi"}],[{text:"📢 Yangiliklar"},{text:"🆘 Yordam"}]];
  } else if(textValue==="📚 O‘quvchi") {
    reply="📚 O‘quvchi bo‘limi\n\nO‘quvchi kabinetiga kirish uchun SCHOOL.AI saytida Student ID orqali tizimga kiring. Dars jadvali, fanlar va e’lonlar shaxsiy kabinetingizda ko‘rinadi.";
  } else if(textValue==="👩‍🏫 O‘qituvchi") {
    reply="👩‍🏫 O‘qituvchi bo‘limi\n\nO‘qituvchi kabinetiga kirish uchun maktab administratori bergan login va paroldan foydalaning.";
  } else if(textValue==="📢 Yangiliklar") {
    reply="📢 Maktab yangiliklari va e’lonlari SCHOOL.AI platformasida joylanadi. Rasmiy kanal manzili maktab administratori tomonidan belgilanadi.";
  } else if(textValue==="🆘 Yordam" || /^\/help/i.test(textValue)) {
    reply="🆘 Yordam\n\nMenyu orqali kerakli bo‘limni tanlang. Hisob yoki kirish bilan bog‘liq muammo bo‘lsa, maktab administratoriga murojaat qiling.";
  } else {
    reply="Xabaringiz qabul qilindi. 😊\n\nBo‘limlardan foydalanish uchun menyudagi tugmalardan birini tanlang yoki /help buyrug‘ini yuboring.";
    keyboard=[[{text:"📚 O‘quvchi"},{text:"👩‍🏫 O‘qituvchi"}],[{text:"📢 Yangiliklar"},{text:"🆘 Yordam"}]];
  }
  const payload={chat_id:chatId,text:reply};
  if(keyboard) payload.reply_markup={keyboard,resize_keyboard:true};
  await telegramApi(env,"sendMessage",payload);
  return new Response("OK");
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
            db.prepare("UPDATE applications SET status='approved',student_id=?,reviewed_at=? WHERE id=?").bind(sid,time,a.id)
          ]);
          return json({ok:true,student:{studentId:sid,firstName:a.first_name,lastName:a.last_name,className:a.class_name}});
        }
        const b=await body(req); await run(db,"UPDATE applications SET status='rejected',rejection_reason=?,reviewed_at=? WHERE id=?",str(b.reason||"Ariza rad etildi.",500),now(),a.id);
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
