const express=require('express');
const crypto=require('crypto');
const cors=require('cors');
const mongoose=require('mongoose');
const jwt=require('jsonwebtoken');
const app=express(); app.use(cors()); app.use(express.json({limit:'2mb'}));
app.post('/telegram/webhook',(req,res)=>{
  const token=process.env.TELEGRAM_BOT_TOKEN;
  if(!token)return res.sendStatus(404);
  const secret=crypto.createHash('sha256').update(token).digest('hex');
  if(req.get('X-Telegram-Bot-Api-Secret-Token')!==secret)return res.sendStatus(403);
  try{require('./telegramBot').processTelegramUpdate(req.body);return res.sendStatus(200)}catch(e){console.error('[telegram] webhook update failed',e.message);return res.sendStatus(500)}
});
const PORT=process.env.PORT||10000;
const JWT_SECRET=process.env.JWT_SECRET||process.env.ADMIN_SECRET||'change-this-secret';
const ADMIN_USERNAME=process.env.ADMIN_USERNAME||'admin';
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||'change-this-password';
const adminTelegramSessions=new Map();

app.get('/api/admin/telegram/status',auth,async(req,res)=>{
  try{
    const tg=require('./telegramBot');
    const students=await Application.countDocuments({status:'approved',telegramChatId:{$ne:''}});
    const staff=await Staff.countDocuments({telegramChatId:{$ne:''},isBlocked:false});
    const status=tg.getTelegramStatus?tg.getTelegramStatus():{running:false};
    res.json({ok:true,configured:Boolean(process.env.TELEGRAM_BOT_TOKEN),running:Boolean(status.running),students,staff});
  }catch(e){res.status(500).json({error:'Telegram holatini olishda xatolik.'})}
});
app.post('/api/admin/telegram/broadcast',auth,async(req,res)=>{
  try{
    const message=String(req.body.message||'').trim();
    const audience=String(req.body.audience||'all');
    if(!message)return res.status(400).json({error:'Xabar matni bo‘sh bo‘lmasin.'});
    if(!['all','students','staff'].includes(audience))return res.status(400).json({error:'Noto‘g‘ri auditoriya.'});
    const tg=require('./telegramBot');
    if(!tg.broadcastTelegram)return res.status(503).json({error:'Telegram bot hali ishga tushmagan.'});
    const ids=new Set();
    if(audience==='all'||audience==='students'){(await Application.find({status:'approved',telegramChatId:{$ne:''}}).select('telegramChatId').lean()).forEach(x=>ids.add(String(x.telegramChatId)))}
    if(audience==='all'||audience==='staff'){(await Staff.find({telegramChatId:{$ne:''},isBlocked:{$ne:true}}).select('telegramChatId').lean()).forEach(x=>ids.add(String(x.telegramChatId)))}
    const result=await tg.broadcastTelegram([...ids],message);
    res.json({ok:true,total:ids.size,sent:result.sent,failed:result.failed});
  }catch(e){console.error('[telegram] broadcast failed',e);res.status(500).json({error:'Telegram xabarini yuborishda xatolik.'})}
});
const schema=new mongoose.Schema({firstName:{type:String,required:true,trim:true},lastName:{type:String,required:true,trim:true},className:{type:String,required:true,trim:true},schoolCode:{type:String,default:'',trim:true},photoData:{type:String,default:''},status:{type:String,enum:['pending','approved','rejected'],default:'pending'},rejectionReason:{type:String,default:''},studentId:{type:String,default:''},isBlocked:{type:Boolean,default:false},telegramChatId:{type:String,default:'',index:true},createdAt:{type:Date,default:Date.now},reviewedAt:{type:Date,default:null}});
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
  task:{type:String,default:'',trim:true},
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

const BookCompetition=mongoose.model('BookCompetition',new mongoose.Schema({
  studentId:{type:String,required:true,index:true},
  studentName:{type:String,default:''},
  className:{type:String,default:''},
  telegramChatId:{type:String,default:''},
  videoFileId:{type:String,default:''},
  videoCaption:{type:String,default:''},
  teacherComment:{type:String,default:''},
  totalScore:{type:Number,default:0,min:0},
  scored:{type:Boolean,default:false},
  createdAt:{type:Date,default:Date.now},
  updatedAt:{type:Date,default:Date.now}
}));
function auth(req,res,next){try{const h=req.headers.authorization||'';const t=h.split(' ')[1]||'';const p=jwt.verify(t,JWT_SECRET);if(p.role!=='big-admin')throw new Error();req.auth=p;next()}catch(e){res.status(401).json({error:'Admin authentication required'})}}
function staffAuth(req,res,next){try{const h=req.headers.authorization||'';const t=h.split(' ')[1]||'';const p=jwt.verify(t,JWT_SECRET);if(p.role!=='staff')throw new Error();req.staff=p;next()}catch(e){res.status(401).json({error:'Staff authentication required'})}}
function studentAuth(req,res,next){try{const h=req.headers.authorization||'';const t=h.split(' ')[1]||'';const p=jwt.verify(t,JWT_SECRET);if(p.role!=='student')throw new Error();req.student=p;next()}catch(e){res.status(401).json({error:'Student authentication required'})}}
async function newId(){let id;do{id=String(Math.floor(100000+Math.random()*900000))}while(await Application.exists({studentId:id}));return id}
app.get('/api/health',(q,r)=>r.json({ok:true,service:'myschool'}));
function verifyTelegramWebAppInitData(initData){
  const raw=String(initData||'');
  if(!raw||!process.env.TELEGRAM_BOT_TOKEN)return null;
  try{
    const params=new URLSearchParams(raw);
    const hash=params.get('hash');
    if(!hash)return null;
    params.delete('hash');
    const dataCheckString=[...params.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('\n');
    const secret=crypto.createHmac('sha256','WebAppData').update(process.env.TELEGRAM_BOT_TOKEN).digest();
    const expected=crypto.createHmac('sha256',secret).update(dataCheckString).digest('hex');
    if(!crypto.timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(hash,'hex')))return null;
    const authDate=Number(params.get('auth_date')||0);
    if(!authDate||Math.abs(Math.floor(Date.now()/1000)-authDate)>86400)return null;
    const user=JSON.parse(params.get('user')||'null');
    if(!user||!user.id)return null;
    return user;
  }catch(e){return null}
}

app.post('/api/telegram/webapp-auth',async(req,res)=>{
  try{
    const user=verifyTelegramWebAppInitData(req.body?.initData);
    if(!user)return res.status(401).json({error:'Telegram Mini App sessiyasi yaroqsiz.'});
    const chatId=String(user.id);
    const a=await Application.findOne({telegramChatId:chatId}).sort({createdAt:-1}).lean();
    if(!a)return res.json({ok:true,status:'not_registered',telegramUser:{id:user.id,firstName:user.first_name||'',lastName:user.last_name||'',username:user.username||''}});
    if(a.isBlocked)return res.json({ok:true,status:'blocked',telegramUser:{id:user.id,firstName:user.first_name||'',lastName:user.last_name||'',username:user.username||''}});
    if(a.status==='approved'){
      const token=jwt.sign({role:'student',studentId:a.studentId},JWT_SECRET,{expiresIn:'30d'});
      return res.json({ok:true,status:'approved',token,student:{studentId:a.studentId,firstName:a.firstName,lastName:a.lastName,className:a.className}});
    }
    if(a.status==='pending')return res.json({ok:true,status:'pending',applicationId:String(a._id),firstName:a.firstName,lastName:a.lastName,className:a.className});
    return res.json({ok:true,status:'rejected',rejectionReason:a.rejectionReason||'Ariza rad etilgan.'});
  }catch(e){console.error('[telegram] webapp auth failed',e);res.status(500).json({error:'Telegram Mini App ulanishida xatolik.'})}
});

app.post('/api/students/register',async(req,res)=>{try{const firstName=String(req.body.firstName||'').trim(),lastName=String(req.body.lastName||'').trim(),className=String(req.body.className||'').trim().toUpperCase(),schoolCode=String(req.body.schoolCode||'').trim(),photoData=String(req.body.photoData||'').trim();if(!firstName||!lastName||!className)return res.status(400).json({error:'Ism, familiya va sinf majburiy.'});if(!/^data:image\/jpeg;base64,/.test(photoData)||photoData.length>850000)return res.status(400).json({error:'Faqat hozir kamerada olingan rasm yuborilishi kerak.'});const tgUser=verifyTelegramWebAppInitData(req.body.telegramInitData);const telegramChatId=tgUser?String(tgUser.id):'';if(telegramChatId){const existing=await Application.findOne({telegramChatId}).sort({createdAt:-1});if(existing){if(existing.status==='approved'&&!existing.isBlocked){const token=jwt.sign({role:'student',studentId:existing.studentId},JWT_SECRET,{expiresIn:'30d'});return res.status(200).json({ok:true,applicationId:String(existing._id),status:existing.status,token,student:{studentId:existing.studentId,firstName:existing.firstName,lastName:existing.lastName,className:existing.className}})}if(existing.status==='pending'){
  // Har safar qayta yuborilganda ariza ma'lumotlari va yangi kamera rasmi yangilanadi.
  existing.firstName=firstName;
  existing.lastName=lastName;
  existing.className=className;
  existing.schoolCode=schoolCode;
  existing.photoData=photoData;
  await existing.save();
  return res.status(200).json({ok:true,applicationId:String(existing._id),status:existing.status});
}}}const a=await Application.create({firstName,lastName,className,schoolCode,photoData,telegramChatId});res.status(201).json({ok:true,applicationId:String(a._id),status:a.status})}catch(e){console.error(e);res.status(500).json({error:'Arizani yuborishda xatolik.'})}});
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
    const fullName=String(req.body.fullName||'').trim(),username=String(req.body.username||'').trim().toLowerCase(),password=String(req.body.password||''),role=String(req.body.role||''),subject=String(req.body.subject||'').trim(),task=String(req.body.task||'').trim();
    if(!fullName||!username||password.length<6||!['teacher','staff-admin','director','telegram-admin'].includes(role))return res.status(400).json({error:'Ism, login, kamida 6 belgili parol va rol majburiy.'});
    if(!subject&&!task)return res.status(400).json({error:'Fan yoki Vazifani tanlang.'});
    if(await Staff.exists({username}))return res.status(409).json({error:'Bu login band.'});
    const hp=hashPassword(password);const st=await Staff.create({fullName,username,passwordHash:hp.hash,passwordSalt:hp.salt,role,subject:role==='teacher'?subject:'',task});
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
    if(req.body.role!==undefined&&['teacher','staff-admin','director','telegram-admin'].includes(String(req.body.role)))st.role=String(req.body.role);
    if(req.body.subject!==undefined)st.subject=st.role==='teacher'?String(req.body.subject).trim():'';
    if(req.body.task!==undefined)st.task=String(req.body.task).trim();
    if(!st.subject&&!st.task)return res.status(400).json({error:'Fan yoki Vazifani tanlang.'});
    if(req.body.password!==undefined&&String(req.body.password).length>=6){const hp=hashPassword(String(req.body.password));st.passwordHash=hp.hash;st.passwordSalt=hp.salt}
    if(req.body.isBlocked!==undefined)st.isBlocked=Boolean(req.body.isBlocked);
    await st.save();res.json({ok:true});
  }catch(e){res.status(400).json({error:'Ishchi kabinetini yangilashda xatolik.'})}
});
app.delete('/api/admin/staff/:id',auth,async(req,res)=>{
  const st=await Staff.findByIdAndDelete(req.params.id);if(!st)return res.status(404).json({error:'Ishchi topilmadi.'});res.json({ok:true});
});

app.get('/api/admin/applications',auth,async(q,res)=>res.json({items:await Application.find({status:'pending'}).sort({createdAt:-1}).lean()}));
app.get('/api/admin/students/:id',auth,async(req,res)=>{try{const a=await Application.findOne({_id:req.params.id,status:'approved'}).select('firstName lastName className studentId isBlocked createdAt').lean();if(!a)return res.status(404).json({error:'O‘quvchi topilmadi.'});res.json({item:a})}catch(e){res.status(400).json({error:'Noto‘g‘ri o‘quvchi ID.'})}});
app.get('/api/admin/students',auth,async(req,res)=>{try{const search=String(req.query.search||'').trim().toLowerCase();const items=await Application.find({status:'approved'}).sort({createdAt:-1}).select('firstName lastName className studentId isBlocked createdAt').lean();const matched=search?items.filter(a=>[a.studentId,a.firstName,a.lastName,a.className].some(v=>String(v||'').toLowerCase().includes(search))):items;res.json({items:matched})}catch(e){res.status(500).json({error:'O‘quvchilarni yuklashda xatolik.'})}});
app.patch('/api/admin/students/:id',auth,async(req,res)=>{try{const a=await Application.findOne({_id:req.params.id,status:'approved'});if(!a)return res.status(404).json({error:'O‘quvchi topilmadi.'});if(req.body.firstName!==undefined)a.firstName=String(req.body.firstName).trim();if(req.body.lastName!==undefined)a.lastName=String(req.body.lastName).trim();if(req.body.className!==undefined)a.className=String(req.body.className).trim().toUpperCase();if(req.body.isBlocked!==undefined)a.isBlocked=Boolean(req.body.isBlocked);if(!a.firstName||!a.lastName||!a.className)return res.status(400).json({error:'Ism, familiya va sinf bo‘sh bo‘lmasin.'});await a.save();res.json({ok:true})}catch(e){res.status(400).json({error:'O‘quvchini yangilashda xatolik.'})}});
app.delete('/api/admin/students/:id',auth,async(req,res)=>{try{const a=await Application.findOneAndDelete({_id:req.params.id,status:'approved'});if(!a)return res.status(404).json({error:'O‘quvchi topilmadi.'});res.json({ok:true})}catch(e){res.status(500).json({error:'O‘quvchini o‘chirishda xatolik.'})}});
app.get('/api/competition/me',studentAuth,async(req,res)=>{try{
  const st=await Application.findOne({studentId:req.student.studentId,status:'approved'}).lean(); if(!st)return res.status(404).json({error:'O‘quvchi topilmadi.'});
  const rows=await SchoolData.find({kind:'book_competition','data.studentId':st.studentId}).sort({updatedAt:-1}).lean();
  const x=rows[0]?.data;
  const all=(await SchoolData.find({kind:'book_competition','data.scored':true}).lean()).map(r=>r.data).sort((a,b)=>Number(b.totalScore||0)-Number(a.totalScore||0));
  const rank=x&&x.scored?(all.findIndex(r=>String(r.studentId)===String(x.studentId))+1):null;
  res.json({ok:true,item:x?{studentId:x.studentId,studentName:x.studentName,className:x.className,teacherComment:x.teacherComment,totalScore:Number(x.totalScore||0),scored:Boolean(x.scored),createdAt:rows[0].createdAt,updatedAt:rows[0].updatedAt}:null,rank,totalParticipants:all.length});
}catch(e){res.status(500).json({error:'Tanlov ma’lumotlarini yuklashda xatolik.'})}});
app.get('/api/competition/ranking',studentAuth,async(req,res)=>{try{
  const rows=await SchoolData.find({kind:'book_competition','data.scored':true}).lean();
  const items=rows.map(r=>r.data).sort((a,b)=>Number(b.totalScore||0)-Number(a.totalScore||0));
  res.json({ok:true,items:items.map((x,i)=>({rank:i+1,studentId:x.studentId,studentName:x.studentName,className:x.className,totalScore:Number(x.totalScore||0)}))});
}catch(e){res.status(500).json({error:'Reytingni yuklashda xatolik.'})}});
app.get('/api/competition/teacher',staffAuth,async(req,res)=>{try{
  if(!['teacher','director','staff-admin'].includes(req.staff.staffRole))return res.status(403).json({error:'Ruxsat yo‘q.'});
  const items=await SchoolData.find({kind:'book_competition'}).sort({createdAt:-1}).lean();
  res.json({ok:true,items});
}catch(e){res.status(500).json({error:'Tanlov topshiriqlarini yuklashda xatolik.'})}});
app.patch('/api/competition/teacher/:id',staffAuth,async(req,res)=>{try{
  if(!['teacher','director','staff-admin'].includes(req.staff.staffRole))return res.status(403).json({error:'Ruxsat yo‘q.'});
  const score=Number(req.body.totalScore); if(!Number.isFinite(score)||score<0||score>100)return res.status(400).json({error:'Ball 0 dan 100 gacha bo‘lishi kerak.'});
  const item=await SchoolData.findOne({_id:req.params.id,kind:'book_competition'}); if(!item)return res.status(404).json({error:'Topshiriq topilmadi.'});
  item.data={...(item.data||{}),totalScore:score,teacherComment:String(req.body.teacherComment||'').trim().slice(0,2000),scored:true}; item.updatedAt=new Date(); await item.save();
  try{const tg=require('./telegramBot');if(tg.notifyCompetitionScored)await tg.notifyCompetitionScored(item.data.telegramChatId,item.data)}catch(_){}
  res.json({ok:true});
}catch(e){res.status(400).json({error:'Ballni saqlashda xatolik.'})}});
app.get('/api/competition/top',async(req,res)=>{try{
  const rows=await SchoolData.find({kind:'book_competition','data.scored':true}).lean();
  const items=rows.map(r=>r.data).sort((a,b)=>Number(b.totalScore||0)-Number(a.totalScore||0)).slice(0,3);
  res.json({ok:true,items:items.map((x,i)=>({rank:i+1,studentName:x.studentName,className:x.className,totalScore:Number(x.totalScore||0)}))});
}catch(e){res.status(500).json({error:'TOP-3 yuklashda xatolik.'})}});
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
app.post('/api/admin/applications/:id/approve',auth,async(req,res)=>{const a=await Application.findById(req.params.id);if(!a)return res.status(404).json({error:'Ariza topilmadi.'});if(a.status!=='pending')return res.status(400).json({error:'Ariza allaqachon ko‘rib chiqilgan.'});a.status='approved';a.studentId=await newId();a.reviewedAt=new Date();await a.save();if(a.telegramChatId){try{const {notifyStudentApproved}=require('./telegramBot');await notifyStudentApproved(a.telegramChatId,a)}catch(e){console.error('[telegram] approval notification error',e.message)}}res.json({ok:true,studentId:a.studentId})});
app.post('/api/admin/applications/:id/reject',auth,async(req,res)=>{const a=await Application.findById(req.params.id);if(!a)return res.status(404).json({error:'Ariza topilmadi.'});a.status='rejected';a.rejectionReason=String(req.body.reason||'Ma’lumotlar tasdiqlanmadi.').trim();a.reviewedAt=new Date();await a.save();res.json({ok:true})});
async function start(){
  try{
    if(process.env.MONGODB_URI){
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected');
    }else{
      console.warn('MONGODB_URI is not set');
    }

    // Telegram webhook runs only on the primary MySchool backend.
    // Multiple Render services using the same bot token cause Telegram 409 polling conflicts.
    const telegramEnabled=Boolean(process.env.TELEGRAM_BOT_TOKEN) &&
      (!process.env.RENDER_EXTERNAL_URL || process.env.RENDER_EXTERNAL_URL==='https://myschool-ai.onrender.com');

    if(telegramEnabled){
      try{
        require('./telegramBot').startTelegramBot({
          token:process.env.TELEGRAM_BOT_TOKEN,
          Application,SchoolContent,SchoolData,Staff,hashPassword,verifyPassword,
          webhookUrl:process.env.RENDER_EXTERNAL_URL==='https://myschool-ai.onrender.com'?'https://myschool-ai.onrender.com/telegram/webhook':null,
          webhookSecret:crypto.createHash('sha256').update(process.env.TELEGRAM_BOT_TOKEN).digest('hex'),
          createAdminTelegramSession:async()=>{
            const key=crypto.randomBytes(32).toString('hex');
            adminTelegramSessions.set(key,{expiresAt:Date.now()+5*60*1000});
            setTimeout(()=>adminTelegramSessions.delete(key),5*60*1000);
            return key;
          }
        });
      }catch(e){
        console.error('[telegram] failed to start',e);
      }
    }else if(process.env.TELEGRAM_BOT_TOKEN){
      console.log('[telegram] disabled on non-primary Render service');
    }

    app.listen(PORT,()=>console.log('MySchool API listening on '+PORT));
  }catch(e){
    console.error('[startup] failed',e);
    process.exit(1);
  }
}
start().catch(e=>{console.error(e);process.exit(1)})