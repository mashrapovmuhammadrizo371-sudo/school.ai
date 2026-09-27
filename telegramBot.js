const TelegramBot=require('node-telegram-bot-api');

function startTelegramBot({token,Application,SchoolContent,SchoolData}){
  const bot=new TelegramBot(token,{polling:true});
  const sessions=new Map();
  const menu={reply_markup:{keyboard:[[{'text':'📅 Jadval'},{'text':'📚 Fanlar'}],[{'text':'📢 E’lonlar'},{'text':'📖 Kitobxona'}],[{'text':'👤 Profil'},{'text':'❓ Yordam'}]],resize_keyboard:true}};
  async function student(chatId){return Application.findOne({telegramChatId:String(chatId),status:'approved'}).lean();}
  async function linkStudent(chatId,id){const s=await Application.findOne({studentId:String(id),status:'approved'}).lean();if(!s)return null;if(s.isBlocked)return {blocked:true};await Application.updateMany({telegramChatId:String(chatId)},{$set:{telegramChatId:''}});await Application.findByIdAndUpdate(s._id,{$set:{telegramChatId:String(chatId)}});return s;}

  bot.onText(/^\/start$/,async msg=>{sessions.set(msg.chat.id,{waitingId:true});await bot.sendMessage(msg.chat.id,'🎓 MySchool botiga xush kelibsiz!\n\n6 xonali Student ID raqamingizni yuboring.',menu);});
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