const TelegramBot=require('node-telegram-bot-api');

function startTelegramBot({token,Application,SchoolContent,SchoolData,Staff,verifyPassword,createAdminTelegramSession}){
  const bot=new TelegramBot(token,{polling:true});
  const sessions=new Map();
  const staffSessions=new Map();
  const menu={reply_markup:{keyboard:[[{'text':'📅 Jadval'},{'text':'📚 Fanlar'}],[{'text':'📢 E’lonlar'},{'text':'📖 Kitobxona'}],[{'text':'👤 Profil'},{'text':'❓ Yordam'}]],resize_keyboard:true}};
  async function student(chatId){return Application.findOne({telegramChatId:String(chatId),status:'approved'}).lean();}
  async function linkStudent(chatId,id){const s=await Application.findOne({studentId:String(id),status:'approved'}).lean();if(!s)return null;if(s.isBlocked)return {blocked:true};await Application.updateMany({telegramChatId:String(chatId)},{$set:{telegramChatId:''}});await Application.findByIdAndUpdate(s._id,{$set:{telegramChatId:String(chatId)}});return s;}

  bot.onText(/^\/start$/,async msg=>{sessions.set(msg.chat.id,{waitingId:true});await bot.sendMessage(msg.chat.id,'🎓 MySchool botiga xush kelibsiz!\n\nO‘quvchi bo‘lsangiz 6 xonali Student ID yuboring.\nIshchi bo‘lsangiz /staff buyrug‘idan foydalaning.',menu);});
  bot.onText(/^\/staff$/,async msg=>{staffSessions.set(msg.chat.id,{step:'username'});await bot.sendMessage(msg.chat.id,'👨‍💼 Ishchi kabineti\n\nLoginni yuboring:');});
  bot.onText(/^\/stafflogout$/,async msg=>{staffSessions.delete(msg.chat.id);await Staff.updateMany({telegramChatId:String(msg.chat.id)},{$set:{telegramChatId:''}});await bot.sendMessage(msg.chat.id,'✅ Telegram ishchi kabinetidan chiqildi.',menu);});
  bot.onText(/^\/staffme$/,async msg=>{const st=await Staff.findOne({telegramChatId:String(msg.chat.id),isBlocked:false}).select('-passwordHash -passwordSalt').lean();if(!st)return bot.sendMessage(msg.chat.id,'Avval /staff orqali kiring.');await bot.sendMessage(msg.chat.id,'👨‍💼 '+st.fullName+'\n\nRol: '+roleName(st.role)+'\nLogin: '+st.username);});
  function roleName(r){return r==='teacher'?'O‘qituvchi':r==='director'?'Direktor':'Admin';}
  async function staffLogin(msg,username,password){
    const adminUser=String(process.env.ADMIN_USERNAME||'admin').trim();
    const adminPass=String(process.env.ADMIN_PASSWORD||'change-this-password');
    if(String(username).trim()===adminUser&&String(password)===adminPass&&createAdminTelegramSession){
      const key=await createAdminTelegramSession();
      staffSessions.delete(msg.chat.id);
      const url='https://school-ai-fronted.onrender.com/admin?telegram_key='+encodeURIComponent(key);
      await bot.sendMessage(msg.chat.id,'✅ Katta Admin tasdiqlandi!\n\nQuyidagi tugma orqali Katta Admin panelini oching:',{reply_markup:{inline_keyboard:[[{'text':'🛡 Katta Admin paneli','url':url}]]}});
      return true;
    }
    const st=await Staff.findOne({username:String(username).trim().toLowerCase()});
    if(!st||st.isBlocked||!verifyPassword(password,st.passwordSalt,st.passwordHash))return false;
    await Staff.updateMany({telegramChatId:String(msg.chat.id)},{$set:{telegramChatId:''}});
    st.telegramChatId=String(msg.chat.id);await st.save();
    staffSessions.delete(msg.chat.id);
    await bot.sendMessage(msg.chat.id,'✅ Ishchi kabineti ulandi!\n\n👨‍💼 '+st.fullName+'\n🎖 Rol: '+roleName(st.role)+'\n\n/staffme — profil\n/stafflogout — chiqish',menu);
    return true;
  }
  bot.onText(/^\/id(?:\s+(\d{6}))?$/,async(msg,m)=>{if(m[1])return connect(msg,m[1]);sessions.set(msg.chat.id,{waitingId:true});await bot.sendMessage(msg.chat.id,'🆔 6 xonali Student ID raqamingizni yuboring.');});
  async function connect(msg,id){const s=await linkStudent(msg.chat.id,id);sessions.delete(msg.chat.id);if(!s)return bot.sendMessage(msg.chat.id,'❌ Student ID topilmadi yoki hali tasdiqlanmagan.',menu);if(s.blocked)return bot.sendMessage(msg.chat.id,'🚫 Hisobingiz bloklangan.',menu);return bot.sendMessage(msg.chat.id,'✅ Hisob ulandi!\n\n👤 '+s.firstName+' '+s.lastName+'\n🏫 Sinf: '+s.className+'\n🆔 ID: '+s.studentId,menu);}
  bot.onText(/^\/jadval$/,sendSchedule);
  bot.onText(/^\/fanlar$/,sendSubjects);
  bot.onText(/^\/(elon|e'lon)$/,m=>sendContent(m,'announcements','📢 E’lonlar','Hozircha e’lon yo‘q.'));
  bot.onText(/^\/kitoblar$/,m=>sendContent(m,'library','📖 Kitobxona','Hozircha kitob yo‘q.'));
  bot.onText(/^\/profil$/,sendProfile);
  bot.onText(/^\/(help|yordam)$/,msg=>bot.sendMessage(msg.chat.id,'/start\n/id 123456\n/jadval\n/fanlar\n/elon\n/kitoblar\n/profil',menu));

  bot.on('message',async msg=>{
    if(msg.text?.startsWith('/'))return;
    const t=String(msg.text||'');
    if(t==='📅 Jadval')return sendSchedule(msg);
    if(t==='📚 Fanlar')return sendSubjects(msg);
    if(t==='📢 E’lonlar')return sendContent(msg,'announcements','📢 E’lonlar','Hozircha e’lon yo‘q.');
    if(t==='📖 Kitobxona')return sendContent(msg,'library','📖 Kitobxona','Hozircha kitob yo‘q.');
    if(t==='👤 Profil')return sendProfile(msg);
    if(t==='❓ Yordam')return bot.sendMessage(msg.chat.id,'/start\n/id 123456\n/jadval\n/fanlar\n/elon\n/kitoblar\n/profil',menu);
    if(staffSessions.get(msg.chat.id)?.step==='username'){staffSessions.set(msg.chat.id,{step:'password',username:t});return bot.sendMessage(msg.chat.id,'🔐 Parolni yuboring:');}
    if(staffSessions.get(msg.chat.id)?.step==='password'){const x=staffSessions.get(msg.chat.id);const ok=await staffLogin(msg,x.username,t);if(!ok)return bot.sendMessage(msg.chat.id,'❌ Login yoki parol noto‘g‘ri. /staff orqali qayta urinib ko‘ring.');return;}
    if(sessions.get(msg.chat.id)?.waitingId && /^\d{6}$/.test(t))return connect(msg,t);
  });

  async function sendProfile(msg){const s=await student(msg.chat.id);if(!s)return bot.sendMessage(msg.chat.id,'Avval Student ID ni ulang: /id');return bot.sendMessage(msg.chat.id,'👤 Profil\n\nIsm: '+s.firstName+'\nFamiliya: '+s.lastName+'\nSinf: '+s.className+'\nStudent ID: '+s.studentId,menu);}
  async function sendSchedule(msg){const s=await student(msg.chat.id);if(!s)return bot.sendMessage(msg.chat.id,'Avval Student ID ni ulang: /id');const items=await SchoolData.find({kind:'schedule'}).sort({updatedAt:-1}).lean();const own=items.filter(x=>x.data?.className===s.className);if(!own.length)return bot.sendMessage(msg.chat.id,'📅 '+s.className+' uchun jadval hali kiritilmagan.');let out='📅 '+s.className+' sinfi jadvali\n\n';for(const x of own){const d=x.data||{};out+='📌 '+(d.day||'Kun')+'\n';(d.rows||[]).forEach((row,i)=>{out+=(i+1)+'. '+(row.subject||'Fan')+'\n';});out+='\n';}return bot.sendMessage(msg.chat.id,out.slice(0,4000),menu);}
  async function sendSubjects(msg){const s=await student(msg.chat.id);if(!s)return bot.sendMessage(msg.chat.id,'Avval Student ID ni ulang: /id');const items=await SchoolData.find({kind:'subjects'}).sort({updatedAt:-1}).lean();const names=[...new Set(items.map(x=>x.data?.name).filter(Boolean))];return bot.sendMessage(msg.chat.id,names.length?'📚 Fanlar\n\n'+names.map((x,i)=>(i+1)+'. '+x).join('\n'):'📚 Hozircha fanlar kiritilmagan.',menu);}
  async function sendContent(msg,kind,title,empty){const items=await SchoolContent.find({kind}).sort({createdAt:-1}).lean();if(!items.length)return bot.sendMessage(msg.chat.id,empty,menu);let out=title+'\n\n';for(const x of items.slice(0,10)){out+='• '+x.title+'\n'+(x.body||'')+(x.url?'\n'+x.url:'')+'\n\n';}return bot.sendMessage(msg.chat.id,out.slice(0,4000),menu,{disable_web_page_preview:true});}
  bot.on('polling_error',err=>console.error('[telegram] polling error',err.message));
  console.log('[telegram] bot polling started');
  return bot;
}
module.exports={startTelegramBot};