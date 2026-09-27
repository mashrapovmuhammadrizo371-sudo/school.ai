const express=require('express');
const crypto=require('crypto');
const cors=require('cors');
const mongoose=require('mongoose');
const jwt=require('jsonwebtoken');
const app=express(); app.use(cors()); app.use(express.json({limit:'1mb'}));
const PORT=process.env.PORT||10000;
const JWT_SECRET=process.env.JWT_SECRET||process.env.ADMIN_SECRET||'change-this-secret';
const ADMIN_USERNAME=process.env.ADMIN_USERNAME||'admin';
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||'change-this-password';
const adminTelegramSessions=new Map();
const schema=new mongoose.Schema({firstName:{type:String,required:true,trim:true},lastName:{type:String,required:true,trim:true},className:{type:String,required:true,trim:true},schoolCode:{type:String,default:'',trim:true},status:{type:String,enum:['pending','approved','rejected'],default:'pending'},rejectionReason:{type:String,default:''},studentId:{type:String,default:''},isBlocked:{type:Boolean,default:false},telegramChatId:{type:String,default:'',index:true},createdAt:{type:Date,default:Date.now},reviewedAt:{type:Date,default:null}});
const Application=mongoose.model('Application',schema);
const contentSchema=new mongoose.Schema({kind:{type:String,enum:['announcements','library','social'],required:true},title:{type:String,required:true,trim:true,maxlength:140},body:{type:String,default:'',maxlength:4000},url:{type:String,default:''},createdAt:{type:Date,default:Date.now}});
const SchoolContent=mongoose.model('SchoolContent',contentSchema);
const Staff=mongoose.model('Staff',new mongoose.Schema({
  fullName:{type:String,required:true,trim:true},
  username:{type:String,required:true,unique:true,trim:true,index:true},
  passwordHash:{type:String,required:true},
  passwordSalt:{type:String,required:true},
  role:{type:String,enum:['teacher','staff-admin','director'],required:true},
  subject:{type:String,default:'',trim:true},
  telegramChatId:{type:String,default:'',index:true},
  isBlocked:{type:Boolean,default:false},
  createdAt:{type:Date,default:Date.now}
}));
function hashPassword(password,salt=crypto.randomBytes(16).toString('hex')){
  return {salt,hash:crypto.scryptSync(String(password),salt,64).toString('hex')};
}
function verifyPassword(password,salt,hash){
  return crypto.timingSafeEqual(Buffer.from(hashPassword(password,salt).hash,'hex'),Buffer.from(hash,'hex'));
}
const SchoolData=mongoose.model('SchoolData',new mongoose.Schema({
 kind:{type:String,required:true,index:true},
 data:{type:mongoose.Schema.Types.Mixed,default:{}},
 createdAt:{type:Date,default:Date.now},
 updatedAt:{type:Date,default:Date.now}
}));

function auth(req,res,next){try{const h=req.headers.authorization||'';const t=h.split(' ')[1]||'';const p=jwt.verify(t,JWT_SECRET);if(p.role!=='big-admin')throw new Error();req.auth=p;next()}catch(e){res.status(401).json({error:'Admin authentication required'})}}
function staffAuth(req,res,next){try{const h=req.headers.authorization||'';const t=h.split(' ')[1]||'';const p=jwt.verify(t,JWT_SECRET);if(p.role!=='staff')throw new Error();req.staff=p;next()}catch(e){res.status(401).json({error:'Staff authentication required'})}}
async function newId(){let id;do{id=String(Math.floor(100000+Math.random()*900000))}while(await Application.exists({studentId:id}));return id}
app.get('/api/health',(q,r)=>r.json({ok:true,service:'myschool'}));
app.post('/api/students/register',async(req,res)=>{try{const firstName=String(req.body.firstName||'').trim(),lastName=String(req.body.lastName||'').trim(),className=String(req.body.className||'').trim().toUpperCase(),schoolCode=String(req.body.schoolCode||'').trim();if(!firstName||!lastName||!className)return res.status(400).json({error:'Ism, familiya va sinf majburiy.'});const a=await Application.create({firstName,lastName,className,schoolCode});res.status(201).json({ok:true,applicationId:String(a._id),status:a.status})}catch(e){console.error(e);res.status(500).json({error:'Arizani yuborishda xatolik.'})}});
app.get('/api/students/status/:id',async(req,res)=>{try{const a=await Application.findById(req.params.id).lean();if(!a)return res.status(404).json({error:'Ariza topilmadi.'});res.json({status:a.status,studentId:a.studentId||'',rejectionReason:a.rejectionReason||'',firstName:a.firstName,lastName:a.lastName,className:a.className})}catch(e){res.status(400).json({error:'Noto‘g‘ri ariza ID.'})}});
app.post('/api/students/login',async(req,res)=>{try{const studentId=String(req.body.studentId||'').trim();if(!/^\d{6}$/.test(studentId))return res.status(400).json({error:'Student ID 6 xonali raqam bo‘lishi kerak.'});const a=await Application.findOne({studentId,status:'approved'}).lean();if(!a)return res.status(401).json({error:'Student ID topilmadi yoki hali tasdiqlanmagan.'});if(a.isBlocked)return res.status(403).json({error:'Hisobingiz administrator tomonidan bloklangan.'});const token=jwt.sign({role:'student',studentId:a.studentId},JWT_SECRET,{expiresIn:'30d'});res.json({ok:true,token,student:{studentId:a.studentId,firstName:a.firstName,lastName:a.lastName,className:a.className}})}catch(e){console.error(e);res.status(500).json({error:'Kirishda xatolik.'})}});
app.post('/api/admin/login',(req,res)=>{if(String(req.body.username||'')!==ADMIN_USERNAME||String(req.body.password||'')!==ADMIN_PASSWORD)return res.status(401).json({error:'Login yoki parol noto‘g‘ri.'});res.json({ok:true,token:jwt.sign({role:'big-admin',username:ADMIN_USERNAME},JWT_SECRET,{expiresIn:'12h'})})});
app.post('/api/admin/telegram-session',async(req,res)=>{try{const username=String(req.body.username||'').trim(),password=String(req.body.password||'');if(username!==ADMIN_USERNAME||password!==ADMIN_PASSWORD)return res.status(401).json({error:'Login yoki parol noto‘g‘ri.'});const key=crypto.randomBytes(32).toString('hex');adminTelegramSessions.set(key,{expiresAt:Date.now()+5*60*1000});setTimeout(()=>adminTelegramSessions.delete(key),5*60*1000);res.json({ok:true,key})}catch(e){res.status(500).json({error:'Telegram sessiyasini yaratishda xatolik.'})}});
app.get('/api/admin/telegram-session/:key',(req,res)=>{const key=String(req.params.key||'');const x=adminTelegramSessions.get(key);if(!x||x.expiresAt<Date.now()){adminTelegramSessions.delete(key);return res.status(401).json({error:'Telegram sessiyasi yaroqsiz yoki muddati tugagan.'})}adminTelegramSessions.delete(key);res.json({ok:true,token:jwt.sign({role:'big-admin',username:ADMIN_USERNAME},JWT_SECRET,{expiresIn:'12h'})})});

// Staff accounts: created and controlled only by Big Admin.
app.post('/api/staff/login',async(req,res)=>{
  try{
    const username=String(req.body.username||'').trim(),password=String(req.body.password||'');
    const st=await Staff.findOne({username});
    if(!st||st.isBlocked||!verifyPassword(password,st.passwordSalt,st.passwordHash))return res.status(401).json({error:'Login yoki parol noto‘g‘ri.'});
    const token=jwt.sign({role:'staff',staffId:String(st._id),staffRole:st.role,username:st.username},JWT_SECRET,{expiresIn:'12h'});
    res.json({ok:true,token,staff:{id:String(st._id),fullName:st.fullName,username:st.username,role:st.role}});
  }catch(e){res.status(500).json({error:'Kirishda xatolik.'})}
});
app.get('/api/staff/me',staffAuth,async(req,res)=>{
  const st=await Staff.findById(req.staff.staffId).select('-passwordHash -passwordSalt').lean();
  if(!st||st.isBlocked)return res.status(403).json({error:'Kabinet bloklangan.'});
  res.json({staff:st});
});
app.post('/api/admin/staff',auth,async(req,res)=>{
  try{
    const fullName=String(req.body.fullName||'').trim(),username=String(req.body.username||'').trim().toLowerCase(),password=String(req.body.password||''),role=String(req.body.role||''),subject=String(req.body.subject||'').trim();
    if(!fullName||!username||password.length<6||!['teacher','staff-admin','director'].includes(role))return res.status(400).json({error:'Ism, login, kamida 6 belgili parol va rol majburiy.'});
    if(role==='teacher'&&!subject)return res.status(400).json({error:'O‘qituvchi uchun fan tanlanishi shart.'});
    if(await Staff.exists({username}))return res.status(409).json({error:'Bu login band.'});
    const hp=hashPassword(password);const st=await Staff.create({fullName,username,passwordHash:hp.hash,passwordSalt:hp.salt,role,subject:role==='teacher'?subject:''});
    res.status(201).json({ok:true,item:{id:String(st._id),fullName,username,role}});
  }catch(e){res.status(400).json({error:'Ishchi kabinetini yaratishda xatolik.'})}
});
app.get('/api/admin/staff',auth,async(req,res)=>{
  const items=await Staff.find().select('-passwordHash -passwordSalt').sort({createdAt:-1}).lean();
  res.json({items});
});
app.patch('/api/admin/staff/:id',auth,async(req,res)=>{
  try{
    const st=await Staff.findById(req.params.id);if(!st)return res.status(404).json({error:'Ishchi topilmadi.'});
    if(req.body.fullName!==undefined)st.fullName=String(req.body.fullName).trim();
    if(req.body.role!==undefined&&['teacher','staff-admin','director'].includes(String(req.body.role)))st.role=String(req.body.role);
    if(req.body.subject!==undefined)st.subject=st.role==='teacher'?String(req.body.subject).trim():'';
    if(st.role==='teacher'&&!st.subject)return res.status(400).json({error:'O‘qituvchi uchun fan tanlanishi shart.'});
    if(req.body.password!==undefined&&String(req.body.password).length>=6){const hp=hashPassword(String(req.body.password));st.passwordHash=hp.hash;st.passwordSalt=hp.salt}
    if(req.body.isBlocked!==undefined)st.isBlocked=Boolean(req.body.isBlocked);
    await st.save();res.json({ok:true});
  }catch(e){res.status(400).json({error:'Ishchi kabinetini yangilashda xatolik.'})}
});
app.delete('/api/admin/staff/:id',auth,async(req,res)=>{
  const st=await Staff.findByIdAndDelete(req.params.id);if(!st)return res.status(404).json({error:'Ishchi topilmadi.'});res.json({ok:true});
});

app.get('/api/admin/applications',auth,async(q,res)=>res.json({items:await Application.find({status:'pending'}).sort({createdAt:-1}).lean()}));
app.get('/api/admin/students',auth,async(req,res)=>{try{const search=String(req.query.search||'').trim().toLowerCase();const items=await Application.find({status:'approved'}).sort({createdAt:-1}).select('firstName lastName className studentId isBlocked createdAt').lean();const matched=search?items.filter(a=>[a.studentId,a.firstName,a.lastName,a.className].some(v=>String(v||'').toLowerCase().includes(search))):items;res.json({items:matched})}catch(e){res.status(500).json({error:'O‘quvchilarni yuklashda xatolik.'})}});
app.patch('/api/admin/students/:id',auth,async(req,res)=>{try{const a=await Application.findOne({_id:req.params.id,status:'approved'});if(!a)return res.status(404).json({error:'O‘quvchi topilmadi.'});if(req.body.firstName!==undefined)a.firstName=String(req.body.firstName).trim();if(req.body.lastName!==undefined)a.lastName=String(req.body.lastName).trim();if(req.body.className!==undefined)a.className=String(req.body.className).trim().toUpperCase();if(req.body.isBlocked!==undefined)a.isBlocked=Boolean(req.body.isBlocked);if(!a.firstName||!a.lastName||!a.className)return res.status(400).json({error:'Ism, familiya va sinf bo‘sh bo‘lmasin.'});await a.save();res.json({ok:true})}catch(e){res.status(400).json({error:'O‘quvchini yangilashda xatolik.'})}});
app.delete('/api/admin/students/:id',auth,async(req,res)=>{try{const a=await Application.findOneAndDelete({_id:req.params.id,status:'approved'});if(!a)return res.status(404).json({error:'O‘quvchi topilmadi.'});res.json({ok:true})}catch(e){res.status(500).json({error:'O‘quvchini o‘chirishda xatolik.'})}});
app.get('/api/public/content/:kind',async(req,res)=>{try{const kind=String(req.params.kind||'');if(!['announcements','library','social'].includes(kind))return res.status(400).json({error:'Noto‘g‘ri bo‘lim.'});res.json({items:await SchoolContent.find({kind}).sort({createdAt:-1}).lean()})}catch(e){res.status(500).json({error:'Ma’lumotlarni yuklashda xatolik.'})}});
app.get('/api/admin/content',auth,async(req,res)=>{try{const kind=String(req.query.kind||'');if(!['announcements','library','social'].includes(kind))return res.status(400).json({error:'Noto‘g‘ri bo‘lim.'});res.json({items:await SchoolContent.find({kind}).sort({createdAt:-1}).lean()})}catch(e){res.status(500).json({error:'Ma’lumotlarni yuklashda xatolik.'})}});
app.post('/api/admin/content',auth,async(req,res)=>{try{const kind=String(req.body.kind||''),title=String(req.body.title||'').trim(),body=String(req.body.body||'').trim(),url=String(req.body.url||'').trim();if(!['announcements','library','social'].includes(kind)||!title)return res.status(400).json({error:'Bo‘lim va nom majburiy.'});if(url&&!/^https?:\/\//i.test(url))return res.status(400).json({error:'Havola http:// yoki https:// bilan boshlansin.'});const item=await SchoolContent.create({kind,title,body,url});res.status(201).json({ok:true,item})}catch(e){res.status(400).json({error:'Ma’lumotni saqlashda xatolik.'})}});
app.delete('/api/admin/content/:id',auth,async(req,res)=>{try{const item=await SchoolContent.findByIdAndDelete(req.params.id);if(!item)return res.status(404).json({error:'Yozuv topilmadi.'});res.json({ok:true})}catch(e){res.status(400).json({error:'Yozuvni o‘chirishda xatolik.'})}});
app.get('/api/data/:kind',async(req,res)=>{try{const kind=String(req.params.kind||'');const items=await SchoolData.find({kind}).sort({createdAt:-1}).lean();res.json({items})}catch(e){res.status(500).json({error:'Ma\'lumotlarni yuklashda xatolik.'})}});
app.get('/api/admin/data/:kind',auth,async(req,res)=>{try{const kind=String(req.params.kind||'');const items=await SchoolData.find({kind}).sort({updatedAt:-1}).lean();res.json({items})}catch(e){res.status(500).json({error:'Ma\'lumotlarni yuklashda xatolik.'})}});
app.post('/api/admin/data/:kind',auth,async(req,res)=>{try{const kind=String(req.params.kind||'');const data=req.body||{};const item=await SchoolData.create({kind,data,updatedAt:new Date()});res.status(201).json({ok:true,item})}catch(e){console.error(e);res.status(400).json({error:'Ma\'lumotni saqlashda xatolik.'})}});
app.put('/api/admin/data/:id',auth,async(req,res)=>{try{const item=await SchoolData.findByIdAndUpdate(req.params.id,{data:req.body||{},updatedAt:new Date()},{new:true});if(!item)return res.status(404).json({error:'Yozuv topilmadi.'});res.json({ok:true,item})}catch(e){res.status(400).json({error:'Ma\'lumotni yangilashda xatolik.'})}});
app.delete('/api/admin/data/:id',auth,async(req,res)=>{try{const item=await SchoolData.findByIdAndDelete(req.params.id);if(!item)return res.status(404).json({error:'Yozuv topilmadi.'});res.json({ok:true})}catch(e){res.status(400).json({error:'Yozuvni o\'chirishda xatolik.'})}});
app.post('/api/students/results',async(req,res)=>{try{const data=req.body||{};if(!data.studentId||!data.subject)return res.status(400).json({error:'Natija ma\'lumotlari to\'liq emas.'});const item=await SchoolData.create({kind:'results',data,updatedAt:new Date()});res.status(201).json({ok:true,item})}catch(e){res.status(400).json({error:'Natijani saqlashda xatolik.'})}});
app.post('/api/admin/applications/:id/approve',auth,async(req,res)=>{const a=await Application.findById(req.params.id);if(!a)return res.status(404).json({error:'Ariza topilmadi.'});if(a.status!=='pending')return res.status(400).json({error:'Ariza allaqachon ko‘rib chiqilgan.'});a.status='approved';a.studentId=await newId();a.reviewedAt=new Date();await a.save();res.json({ok:true,studentId:a.studentId})});
app.post('/api/admin/applications/:id/reject',auth,async(req,res)=>{const a=await Application.findById(req.params.id);if(!a)return res.status(404).json({error:'Ariza topilmadi.'});a.status='rejected';a.rejectionReason=String(req.body.reason||'Ma’lumotlar tasdiqlanmadi.').trim();a.reviewedAt=new Date();await a.save();res.json({ok:true})});
async function start(){if(process.env.TELEGRAM_BOT_TOKEN){try{require('./telegramBot').startTelegramBot({token:process.env.TELEGRAM_BOT_TOKEN,Application,SchoolContent,SchoolData,Staff,hashPassword,verifyPassword})}catch(e){console.error('[telegram] failed to start',e)}}if(process.env.MONGODB_URI){await mongoose.connect(process.env.MONGODB_URI);console.log('MongoDB connected')}else console.warn('MONGODB_URI is not set');app.listen(PORT,()=>console.log('MySchool API listening on '+PORT))}
start().catch(e=>{console.error(e);process.exit(1)})