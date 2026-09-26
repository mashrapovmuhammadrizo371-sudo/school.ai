const express=require('express');
const cors=require('cors');
const mongoose=require('mongoose');
const jwt=require('jsonwebtoken');
const app=express(); app.use(cors()); app.use(express.json({limit:'1mb'}));
const PORT=process.env.PORT||10000;
const JWT_SECRET=process.env.JWT_SECRET||process.env.ADMIN_SECRET||'change-this-secret';
const ADMIN_USERNAME=process.env.ADMIN_USERNAME||'admin';
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||'change-this-password';
const schema=new mongoose.Schema({firstName:{type:String,required:true,trim:true},lastName:{type:String,required:true,trim:true},className:{type:String,required:true,trim:true},schoolCode:{type:String,default:'',trim:true},status:{type:String,enum:['pending','approved','rejected'],default:'pending'},rejectionReason:{type:String,default:''},studentId:{type:String,default:''},createdAt:{type:Date,default:Date.now},reviewedAt:{type:Date,default:null}});
const Application=mongoose.model('Application',schema);
function auth(req,res,next){try{const h=req.headers.authorization||'';const t=h.split(' ')[1]||'';const p=jwt.verify(t,JWT_SECRET);if(p.role!=='big-admin')throw new Error();next()}catch(e){res.status(401).json({error:'Admin authentication required'})}}
async function newId(){let id;do{id=String(Math.floor(100000+Math.random()*900000))}while(await Application.exists({studentId:id}));return id}
app.get('/api/health',(q,r)=>r.json({ok:true,service:'myschool'}));
app.post('/api/students/register',async(req,res)=>{try{const firstName=String(req.body.firstName||'').trim(),lastName=String(req.body.lastName||'').trim(),className=String(req.body.className||'').trim().toUpperCase(),schoolCode=String(req.body.schoolCode||'').trim();if(!firstName||!lastName||!className)return res.status(400).json({error:'Ism, familiya va sinf majburiy.'});const a=await Application.create({firstName,lastName,className,schoolCode});res.status(201).json({ok:true,applicationId:String(a._id),status:a.status})}catch(e){console.error(e);res.status(500).json({error:'Arizani yuborishda xatolik.'})}});
app.get('/api/students/status/:id',async(req,res)=>{try{const a=await Application.findById(req.params.id).lean();if(!a)return res.status(404).json({error:'Ariza topilmadi.'});res.json({status:a.status,studentId:a.studentId||'',rejectionReason:a.rejectionReason||'',firstName:a.firstName,lastName:a.lastName,className:a.className})}catch(e){res.status(400).json({error:'Noto‘g‘ri ariza ID.'})}});
app.post('/api/admin/login',(req,res)=>{if(String(req.body.username||'')!==ADMIN_USERNAME||String(req.body.password||'')!==ADMIN_PASSWORD)return res.status(401).json({error:'Login yoki parol noto‘g‘ri.'});res.json({ok:true,token:jwt.sign({role:'big-admin',username:ADMIN_USERNAME},JWT_SECRET,{expiresIn:'12h'})})});
app.get('/api/admin/applications',auth,async(q,res)=>res.json({items:await Application.find({status:'pending'}).sort({createdAt:-1}).lean()}));
app.post('/api/admin/applications/:id/approve',auth,async(req,res)=>{const a=await Application.findById(req.params.id);if(!a)return res.status(404).json({error:'Ariza topilmadi.'});if(a.status!=='pending')return res.status(400).json({error:'Ariza allaqachon ko‘rib chiqilgan.'});a.status='approved';a.studentId=await newId();a.reviewedAt=new Date();await a.save();res.json({ok:true,studentId:a.studentId})});
app.post('/api/admin/applications/:id/reject',auth,async(req,res)=>{const a=await Application.findById(req.params.id);if(!a)return res.status(404).json({error:'Ariza topilmadi.'});a.status='rejected';a.rejectionReason=String(req.body.reason||'Ma’lumotlar tasdiqlanmadi.').trim();a.reviewedAt=new Date();await a.save();res.json({ok:true})});
async function start(){if(process.env.MONGODB_URI){await mongoose.connect(process.env.MONGODB_URI);console.log('MongoDB connected')}else console.warn('MONGODB_URI is not set');app.listen(PORT,()=>console.log('MySchool API listening on '+PORT))}
start().catch(e=>{console.error(e);process.exit(1)})