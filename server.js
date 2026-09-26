const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "school-data.json");
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";

const DEFAULT_DATA = {
  officialStudents: [],
  students: [],
  teachers: [],
  classes: Array.from({length:11}, (_,i) => ({name: `${i+1}-sinf`, sections:["A","B","C"]})),
  subjects: [
    {id:"math",name:"Matematika",icon:"📐"},
    {id:"english",name:"Ingliz tili",icon:"🇬🇧"},
    {id:"physics",name:"Fizika",icon:"⚡"},
    {id:"chemistry",name:"Kimyo",icon:"🧪"},
    {id:"biology",name:"Biologiya",icon:"🧬"},
    {id:"geography",name:"Geografiya",icon:"🌍"},
    {id:"history",name:"Tarix",icon:"🏛️"},
    {id:"informatics",name:"Informatika",icon:"💻"},
    {id:"mother-language",name:"Ona tili va adabiyot",icon:"📚"},
    {id:"tarbiya",name:"Tarbiya",icon:"🤝"},
    {id:"technology",name:"Texnologiya",icon:"🛠️"},
    {id:"pe",name:"Jismoniy tarbiya",icon:"🏃"}
  ],
  lessons: [],
  tests: [],
  results: [],
  schedules: {},
  announcements: [],
  books: []
};

function loadData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
      return structuredClone(DEFAULT_DATA);
    }
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    return {...structuredClone(DEFAULT_DATA), ...data};
  } catch (e) {
    console.error("Data load error:", e);
    return structuredClone(DEFAULT_DATA);
  }
}
let db = loadData();

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function id(prefix="id") {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
}

function studentId() {
  let value;
  do value = `ST-${Math.floor(100000 + Math.random()*900000)}`;
  while (db.students.some(s => s.studentId === value));
  return value;
}

function adminToken() {
  const payload = Buffer.from(JSON.stringify({role:"BIG_ADMIN", exp:Date.now()+8*60*60*1000})).toString("base64url");
  const sig = crypto.createHmac("sha256", ADMIN_SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function requireAdmin(req,res,next) {
  if (!ADMIN_SECRET) return res.status(503).json({error:"ADMIN_SECRET Render Environment Variables'da sozlanmagan."});
  const raw = String(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
  const [payload,sig] = raw.split(".");
  if (!payload || !sig) return res.status(401).json({error:"Admin avtorizatsiyasi kerak."});
  const expected = crypto.createHmac("sha256", ADMIN_SECRET).update(payload).digest("base64url");
  if (sig !== expected) return res.status(401).json({error:"Admin sessiyasi yaroqsiz."});
  try {
    const data = JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));
    if (data.role !== "BIG_ADMIN" || data.exp < Date.now()) throw new Error();
    next();
  } catch { return res.status(401).json({error:"Admin sessiyasi tugagan."}); }
}

app.get("/", (req,res)=>res.json({status:"ok",message:"MySchool platform backend ishlayapti."}));

app.get("/api/public-data", (req,res)=>{
  res.json({
    classes:db.classes,
    subjects:db.subjects,
    schedules:db.schedules,
    announcements:db.announcements,
    books:db.books
  });
});

app.post("/api/students/register", (req,res)=>{
  const firstName=String(req.body.firstName||"").trim();
  const lastName=String(req.body.lastName||"").trim();
  const className=String(req.body.className||"").trim();
  const section=String(req.body.section||"").trim().toUpperCase();
  const phone=String(req.body.phone||"").trim();
  if (!firstName || !lastName || !className || !section) return res.status(400).json({error:"Ism, familiya va sinf majburiy."});
  const duplicate=db.students.find(s=>s.firstName.toLowerCase()===firstName.toLowerCase() && s.lastName.toLowerCase()===lastName.toLowerCase() && s.className===className && s.section===section && s.status!=="rejected");
  if (duplicate) return res.status(409).json({error:"Bu ma'lumot bilan ariza allaqachon mavjud.", student:duplicate});
  const application={id:id("app"),firstName,lastName,className,section,phone,status:"pending",createdAt:new Date().toISOString()};
  db.students.push(application);
  saveData();
  res.status(201).json({success:true,student:application,message:"Arizangiz qabul qilindi. Tekshirilmoqda."});
});

app.post("/api/students/login", (req,res)=>{
  const studentIdValue=String(req.body.studentId||"").trim().toUpperCase();
  const lastName=String(req.body.lastName||"").trim().toLowerCase();
  const student=db.students.find(s=>s.studentId===studentIdValue);
  if (!student) return res.status(404).json({error:"ID topilmadi."});
  if (student.status!=="approved") return res.status(403).json({error:student.status==="pending"?"Arizangiz hali tekshirilmoqda.":"Ariza tasdiqlanmagan."});
  if (lastName && student.lastName.toLowerCase()!==lastName) return res.status(401).json({error:"Familiya mos kelmadi."});
  res.json({success:true,student});
});

app.post("/api/admin/login",(req,res)=>{
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_SECRET) return res.status(503).json({error:"ADMIN_USERNAME, ADMIN_PASSWORD va ADMIN_SECRET Render Environment Variables'da sozlanishi kerak."});
  if (String(req.body.username||"")!==ADMIN_USERNAME || String(req.body.password||"")!==ADMIN_PASSWORD) return res.status(401).json({error:"Login yoki parol noto'g'ri."});
  res.json({success:true,token:adminToken()});
});

app.get("/api/admin/dashboard",requireAdmin,(req,res)=>{
  res.json({
    counts:{
      pending:db.students.filter(s=>s.status==="pending").length,
      approved:db.students.filter(s=>s.status==="approved").length,
      rejected:db.students.filter(s=>s.status==="rejected").length,
      teachers:db.teachers.length,
      classes:db.classes.length,
      subjects:db.subjects.length,
      lessons:db.lessons.length,
      tests:db.tests.length,
      results:db.results.length
    }
  });
});

app.get("/api/admin/students",requireAdmin,(req,res)=>res.json({students:db.students}));
app.get("/api/admin/official-students",requireAdmin,(req,res)=>res.json({students:db.officialStudents}));

app.post("/api/admin/official-students",requireAdmin,(req,res)=>{
  const firstName=String(req.body.firstName||"").trim();
  const lastName=String(req.body.lastName||"").trim();
  const className=String(req.body.className||"").trim();
  const section=String(req.body.section||"").trim().toUpperCase();
  if(!firstName||!lastName||!className||!section) return res.status(400).json({error:"Barcha maydonlarni to'ldiring."});
  const item={id:id("official"),firstName,lastName,className,section};
  db.officialStudents.push(item); saveData(); res.status(201).json({success:true,student:item});
});

app.post("/api/admin/students/:id/approve",requireAdmin,(req,res)=>{
  const student=db.students.find(s=>s.id===req.params.id);
  if(!student) return res.status(404).json({error:"Ariza topilmadi."});
  const official=db.officialStudents.find(o=>o.firstName.toLowerCase()===student.firstName.toLowerCase() && o.lastName.toLowerCase()===student.lastName.toLowerCase() && o.className===student.className && o.section===student.section);
  if(!official) return res.status(400).json({error:"O'quvchi rasmiy ro'yxatda topilmadi. Avval Rasmiy o'quvchilar ro'yxatiga qo'shing yoki ma'lumotlarni tekshiring."});
  student.status="approved"; student.studentId=studentId(); student.approvedAt=new Date().toISOString();
  saveData(); res.json({success:true,student});
});

app.post("/api/admin/students/:id/reject",requireAdmin,(req,res)=>{
  const student=db.students.find(s=>s.id===req.params.id);
  if(!student) return res.status(404).json({error:"Ariza topilmadi."});
  student.status="rejected"; student.rejectionReason=String(req.body.reason||"Ma'lumotlar tasdiqlanmadi.");
  saveData(); res.json({success:true,student});
});

app.patch("/api/admin/students/:id",requireAdmin,(req,res)=>{
  const student=db.students.find(s=>s.id===req.params.id);
  if(!student) return res.status(404).json({error:"O'quvchi topilmadi."});
  for(const key of ["firstName","lastName","className","section","phone","status"]) if(req.body[key]!==undefined) student[key]=String(req.body[key]).trim();
  saveData(); res.json({success:true,student});
});

app.delete("/api/admin/students/:id",requireAdmin,(req,res)=>{
  const before=db.students.length; db.students=db.students.filter(s=>s.id!==req.params.id);
  if(db.students.length===before) return res.status(404).json({error:"O'quvchi topilmadi."});
  saveData(); res.json({success:true});
});

app.get("/api/admin/teachers",requireAdmin,(req,res)=>res.json({teachers:db.teachers}));
app.post("/api/admin/teachers",requireAdmin,(req,res)=>{
  const teacher={id:id("teacher"),name:String(req.body.name||"").trim(),subject:String(req.body.subject||"").trim(),className:String(req.body.className||"").trim()};
  if(!teacher.name) return res.status(400).json({error:"O'qituvchi ismi kerak."});
  db.teachers.push(teacher); saveData(); res.status(201).json({success:true,teacher});
});

app.get("/api/admin/content/:type",requireAdmin,(req,res)=>{
  const allowed=["classes","subjects","lessons","tests","results","schedules","announcements","books"];
  if(!allowed.includes(req.params.type)) return res.status(400).json({error:"Noma'lum bo'lim."});
  res.json({items:db[req.params.type]});
});

app.put("/api/admin/content/:type",requireAdmin,(req,res)=>{
  const allowed=["classes","subjects","lessons","tests","results","schedules","announcements","books"];
  if(!allowed.includes(req.params.type)) return res.status(400).json({error:"Noma'lum bo'lim."});
  db[req.params.type]=req.body.items;
  saveData(); res.json({success:true,items:db[req.params.type]});
});

const client = process.env.OPENAI_API_KEY ? new OpenAI({apiKey:process.env.OPENAI_API_KEY}) : null;
app.post("/api/ai",async(req,res)=>{
  try {
    if(!client) return res.status(503).json({success:false,error:"OPENAI_API_KEY sozlanmagan."});
    const message=String(req.body.message||"").trim();
    if(!message) return res.status(400).json({error:"message kerak"});
    const response=await client.responses.create({model:"gpt-5-mini",input:message});
    res.json({success:true,answer:response.output_text});
  } catch(error) { console.error("AI error:",error); res.status(500).json({success:false,error:"AI bilan bog'lanishda xatolik"}); }
});

const TELEGRAM_BOT_TOKEN=process.env.TELEGRAM_BOT_TOKEN;
async function telegram(method,data={}) {
  if(!TELEGRAM_BOT_TOKEN) return null;
  const response=await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
  return response.json();
}
let telegramOffset=0;
async function checkTelegram(){
  if(!TELEGRAM_BOT_TOKEN) return;
  try {
    const result=await telegram("getUpdates",{offset:telegramOffset,timeout:20});
    if(!result?.ok) return;
    for(const update of result.result||[]){
      telegramOffset=update.update_id+1;
      if(!update.message?.text) continue;
      if(update.message.text==="/start") await telegram("sendMessage",{chat_id:update.message.chat.id,text:"🎓 MySchool\n\nSayt orqali ro'yxatdan o'ting va maktab tizimidan foydalaning."});
    }
  } catch(e){ console.error("Telegram polling error:",e.message); }
}

app.listen(PORT,()=>{ console.log(`MySchool backend ${PORT}-portda ishlayapti`); if(TELEGRAM_BOT_TOKEN){checkTelegram();setInterval(checkTelegram,1000);}});
