let activeBot=null;
let telegramStartedAt=null;
const TelegramBot=require('node-telegram-bot-api');

function startTelegramBot({token,Application,SchoolContent,SchoolData,Staff,verifyPassword,createAdminTelegramSession,webhookUrl,webhookSecret}){
  const bot=new TelegramBot(token,{polling:false,badRejection:true});
  activeBot=bot;
  telegramStartedAt=new Date().toISOString();
  const sessions=new Map();
  const staffSessions=new Map();
  const adminSessions=new Map();
  const adminMenu={reply_markup:{inline_keyboard:[[{text:'📢 Xabar yuborish',callback_data:'admin:broadcast'}],[{text:'📊 Bot holati',callback_data:'admin:status'},{text:'👥 Ulanishlar',callback_data:'admin:links'}],[{text:'🚪 Chiqish',callback_data:'admin:logout'}]]}};
  const competitionSessions=new Map();
  const pendingBallSessions=new Map();
  async function competitionStudent(chatId){return Application.findOne({telegramChatId:String(chatId),status:'approved',isBlocked:false}).lean();}
  const MINI_APP_URL='https://school-ai-fronted.onrender.com';
  const menu={reply_markup:{keyboard:[[{'text':'📱 MySchool Mini App',web_app:{url:MINI_APP_URL}}],[{'text':'📅 Jadval'},{'text':'📚 Fanlar'}],[{'text':'📢 E’lonlar'},{'text':'📖 Kitobxona'}],[{'text':'📚 Kitobxonlik tanlovi'},{'text':'👤 Profil'}],[{'text':'❓ Yordam'}]],resize_keyboard:true}};
  const staffMenu=task=>({reply_markup:{keyboard:[
    [{'text':'📱 MySchool Mini App'}],
    [{'text':'📅 Jadval'},{'text':'📚 Fanlar'}],
    [{'text':'📢 E’lonlar'},{'text':'📖 Kitobxona'}],
    ...(task==='Kitobxonlik tanlovini' ? [[{'text':'📚 Kitobxonlik tanlovi — tekshirish'}]] : []),
    [{'text':'👤 Profilim'},{'text':'🚪 Chiqish'}],
    [{'text':'❓ Yordam'}]
  ],resize_keyboard:true}});
  async function student(chatId){return Application.findOne({telegramChatId:String(chatId),status:'approved'}).lean();}
  async function telegramApplication(chatId){return Application.findOne({telegramChatId:String(chatId)}).sort({createdAt:-1}).lean();}
  async function linkStudent(chatId,id){const s=await Application.findOne({studentId:String(id),status:'approved'}).lean();if(!s)return null;if(s.isBlocked)return {blocked:true};await Application.updateMany({telegramChatId:String(chatId)},{$set:{telegramChatId:''}});await Application.findByIdAndUpdate(s._id,{$set:{telegramChatId:String(chatId)}});return s;}

  bot.onText(/^\/start$/,async msg=>{
    const existingStaff=await Staff.findOne({telegramChatId:String(msg.chat.id),isBlocked:false}).lean();
    if(existingStaff){
      staffSessions.delete(msg.chat.id);
      return bot.sendMessage(msg.chat.id,'👨‍💼 Xush kelibsiz, '+existingStaff.fullName+'!\n\nSizning ishchi kabinetingiz allaqachon ulangan. Qayta login/parol kiritish shart emas.',staffMenu(existingStaff.task));
    }
    const a=await telegramApplication(msg.chat.id);
    if(a?.status==='approved'){
      sessions.delete(msg.chat.id);
      return bot.sendMessage(msg.chat.id,'🎓 MySchool botiga xush kelibsiz, '+a.firstName+'!',menu);
    }
    if(a?.status==='pending'){
      sessions.delete(msg.chat.id);
      return bot.sendMessage(msg.chat.id,'⏳ Ro‘yxatdan o‘tish arizangiz katta administrator tomonidan tekshirilmoqda.\n\nMini App va botdagi akkauntingiz bir xil.',menu);
    }
    if(a?.status==='rejected'){
      sessions.delete(msg.chat.id);
      return bot.sendMessage(msg.chat.id,'❌ Arizangiz rad etilgan.\nSabab: '+(a.rejectionReason||'Ko‘rsatilmagan.')+'\n\nQayta ro‘yxatdan o‘tish uchun Mini Appdan foydalaning.',menu);
    }
    sessions.set(msg.chat.id,{waitingId:true});
    await bot.sendMessage(msg.chat.id,'🎓 MySchool botiga xush kelibsiz!\n\nO‘quvchi bo‘lsangiz 6 xonali Student ID yuboring yoki Mini App orqali ro‘yxatdan o‘ting.',menu);
  });
  bot.onText(/^\/staff$/,async msg=>{
    const existingStaff=await Staff.findOne({telegramChatId:String(msg.chat.id),isBlocked:false}).lean();
    if(existingStaff){
      staffSessions.delete(msg.chat.id);
      return bot.sendMessage(msg.chat.id,'👨‍💼 Ishchi kabineti allaqachon ulangan.\n\n👤 '+existingStaff.fullName+'\n🎖 Rol: '+roleName(existingStaff.role)+(existingStaff.task?'\n📌 Vazifa: '+existingStaff.task:'')+'\n\n/staffme — profil\n/stafflogout — chiqish',staffMenu(existingStaff.task));
    }
    staffSessions.set(msg.chat.id,{step:'username'});
    await bot.sendMessage(msg.chat.id,'👨‍💼 Ishchi kabineti\n\nLoginni yuboring:');
  });
  bot.onText(/^\/admin$/,async msg=>{if(!adminSessions.get(msg.chat.id)?.active)return bot.sendMessage(msg.chat.id,'Avval /staff orqali Katta Admin sifatida kiring.');return bot.sendMessage(msg.chat.id,'🛡 KATTA ADMIN PANELI',adminMenu);});
  bot.on('callback_query',async q=>{
    const chatId=q.message.chat.id;
    const data=String(q.data||'');
    if(data==='ball:confirm'){
      await bot.answerCallbackQuery(q.id);
      const p=pendingBallSessions.get(chatId);
      if(!p)return bot.sendMessage(chatId,'❌ Ball sessiyasi topilmadi. /ball ID BALL orqali qayta urinib ko‘ring.');
      const item=await SchoolData.findOne({_id:p.itemId,kind:'book_competition'});
      if(!item)return bot.sendMessage(chatId,'❌ Topshiriq topilmadi.');
      item.data={...(item.data||{}),totalScore:p.score,teacherComment:p.teacherComment,scored:true}; item.updatedAt=new Date(); await item.save();
      pendingBallSessions.delete(chatId);
      try{if(item.data.telegramChatId)await activeBot.sendMessage(String(item.data.telegramChatId),'📚 Tanlov natijasi!\n\n⭐ Ball: '+p.score+'/100\n💬 Ustoz: '+(p.teacherComment||'Izoh yo‘q.'));}catch(_){}
      return bot.sendMessage(chatId,'✅ Tasdiqlandi. '+p.score+' ball va izoh saqlandi.');
    }
    if(data==='ball:reject'){
      await bot.answerCallbackQuery(q.id);
      const p=pendingBallSessions.get(chatId); pendingBallSessions.delete(chatId);
      return bot.sendMessage(chatId,'❌ Ball bekor qilindi.\n\nQaytadan kiriting:\n/ball '+(p?.taskId||'XXXX')+' BALL [izoh]');
    }
    if(data==='competition:yes'){
      const s=competitionSessions.get(chatId);
      await bot.answerCallbackQuery(q.id);
      if(!s?.videoFileId)return bot.sendMessage(chatId,'❌ Video topilmadi. Iltimos, videoni qaytadan yuboring.',menu);
      competitionSessions.set(chatId,{...s,step:'surname'});
      return bot.sendMessage(chatId,'👤 Фамилиянгизни ёзинг:');
    }
    if(data==='competition:no'){
      await bot.answerCallbackQuery(q.id);
      competitionSessions.set(chatId,{waitingVideo:true});
      return bot.sendMessage(chatId,'🔄 Yaxshi, videoni boshidan qayta yuboring.');
    }
    if(data.startsWith('staff:schedule:')){
      const existingStaff=await Staff.findOne({telegramChatId:String(chatId),isBlocked:false}).lean();
      if(!existingStaff){await bot.answerCallbackQuery(q.id,{text:'Avval /staff orqali kiring.'});return;}
      const className=decodeURIComponent(data.slice('staff:schedule:'.length));
      await bot.answerCallbackQuery(q.id);
      return sendScheduleForClass(chatId,className,staffMenu(existingStaff.task));
    }
    if(!data.startsWith('admin:'))return;
    if(!adminSessions.get(chatId)?.active){return bot.answerCallbackQuery(q.id,{text:'Avval Katta Admin sifatida /staff orqali kiring.'});}
    if(data==='admin:broadcast'){adminSessions.set(chatId,{active:true,step:'broadcast'});await bot.answerCallbackQuery(q.id);return bot.sendMessage(chatId,'📢 Xabar yuborish rejimi.\n\nYubormoqchi bo‘lgan xabaringizni yozing.\n\nBekor qilish: /admin');}
    if(data==='admin:status'){const students=await Application.countDocuments({status:'approved',telegramChatId:{$ne:''}});const staff=await Staff.countDocuments({telegramChatId:{$ne:''},isBlocked:{$ne:true}});await bot.answerCallbackQuery(q.id);return bot.sendMessage(chatId,'📊 BOT HOLATI\n\n🟢 Bot: ishlayapti\n👨‍🎓 O‘quvchi ulanishlari: '+students+'\n👨‍💼 Ishchi ulanishlari: '+staff,adminMenu);}
    if(data==='admin:links'){const students=await Application.countDocuments({status:'approved',telegramChatId:{$ne:''}});const staff=await Staff.countDocuments({telegramChatId:{$ne:''},isBlocked:{$ne:true}});await bot.answerCallbackQuery(q.id);return bot.sendMessage(chatId,'👥 ULANISHLAR\n\nO‘quvchilar: '+students+'\nIshchilar: '+staff+'\n\nXabar yuborish uchun 📢 Xabar yuborish tugmasini bosing.',adminMenu);}
    if(data==='admin:logout'){adminSessions.delete(chatId);await bot.answerCallbackQuery(q.id);return bot.sendMessage(chatId,'🚪 Katta Admin panelidan chiqildi.');}
    await bot.answerCallbackQuery(q.id);
  });
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
    await bot.sendMessage(msg.chat.id,'✅ Ishchi kabineti ulandi!\n\n👨‍💼 '+st.fullName+'\n🎖 Rol: '+roleName(st.role)+(st.task?'\n📌 Vazifa: '+st.task:'')+'\n\n/staffme — profil\n/stafflogout — chiqish',staffMenu(st.task));
    return true;
  }
  bot.onText(/^\/id(?:\s+(\d{6}))?$/,async(msg,m)=>{if(m[1])return connect(msg,m[1]);sessions.set(msg.chat.id,{waitingId:true});await bot.sendMessage(msg.chat.id,'🆔 6 xonali Student ID raqamingizni yuboring.');});
  async function connect(msg,id){const s=await linkStudent(msg.chat.id,id);sessions.delete(msg.chat.id);if(!s)return bot.sendMessage(msg.chat.id,'❌ Student ID topilmadi yoki hali tasdiqlanmagan.',menu);if(s.blocked)return bot.sendMessage(msg.chat.id,'🚫 Hisobingiz bloklangan.',menu);return bot.sendMessage(msg.chat.id,'✅ Hisob ulandi!\n\n👤 '+s.firstName+' '+s.lastName+'\n🏫 Sinf: '+s.className+'\n🆔 ID: '+s.studentId,menu);}
  async function ensureCompetitionTaskId(item){
    const d=item.data||{};
    if(/^\d{4}$/.test(String(d.taskId||''))) return String(d.taskId);
    let taskId='';
    for(let i=0;i<30;i++){
      const candidate=String(Math.floor(1000+Math.random()*9000));
      if(!(await SchoolData.exists({kind:'book_competition','data.taskId':candidate}))){taskId=candidate;break;}
    }
    if(!taskId) throw new Error('Could not generate 4-digit task ID');
    item.data={...d,taskId}; item.updatedAt=new Date(); await item.save();
    return taskId;
  }
  async function notifyCompetitionStaff(item){
    const d=item.data||{};
    const taskId=await ensureCompetitionTaskId(item);
    const staff=await Staff.find({task:'Kitobxonlik tanlovini',isBlocked:false,telegramChatId:{$ne:''}})
      .sort({updatedAt:-1,createdAt:-1})
      .limit(1)
      .select('telegramChatId fullName')
      .lean();
    for(const st of staff){
      try{
        await activeBot.sendVideo(String(st.telegramChatId),String(d.videoFileId),{
          caption:'📚 YANGI KITOBXONLIK TANLOVI\n\n👤 Ism-familiya: '+String(d.studentName||'—')+'\n🏫 Sinf: '+String(d.className||'—')+'\n📖 Kitob: '+String(d.bookName||'—')+'\n🔢 Kitob raqami: '+String(d.bookNumber||'—')+'\n📄 Sahifa: '+String(d.pages||'—')+'\n🆔 ID: '+taskId+'\n\nBall berish: /ball '+taskId+' BALL [izoh]'
        });
      }catch(e){console.error('[telegram] competition staff notification failed',st.telegramChatId,e.message)}
    }
    return staff.length;
  }
  async function tanlovAdminHandler(msg){
    const st=await Staff.findOne({telegramChatId:String(msg.chat.id),isBlocked:false}).lean();
    if(!st||st.task!=='Kitobxonlik tanlovini')return bot.sendMessage(msg.chat.id,'❌ Sizga Kitobxonlik tanlovi vazifasi biriktirilmagan.');
    const rows=await SchoolData.find({kind:'book_competition'}).sort({createdAt:-1}).lean();
    if(!rows.length)return bot.sendMessage(msg.chat.id,'📚 Hozircha video topshirilmagan.');
    const studentIds=[...new Set(rows.map(x=>String(x.data?.studentId||'')).filter(Boolean))];
    const students=await Application.find({studentId:{$in:studentIds},status:'approved'}).select('studentId firstName lastName className').lean();
    const studentMap=new Map(students.map(s=>[String(s.studentId),s]));
    let out='📚 KITOBXONLIK TANLOVI — USTOZ\n\n';
    rows.slice(0,15).forEach((x,i)=>{
      const d=x.data||{};
      const s=studentMap.get(String(d.studentId));
      const name=s?((s.firstName||'')+' '+(s.lastName||'')).trim():(d.studentName||'Noma’lum o‘quvchi');
      const className=s?.className||d.className||'—';
      out+=(i+1)+'. '+name+' ('+className+')\nStudent ID: '+(d.studentId||'—')+'\nID: '+(d.taskId||'—')+'\nBall: '+(d.scored?d.totalScore+'/100':'Baholanmagan')+'\n\n';
    });
    out+='✏️ Ball berish:\n/ball ID BALL [izoh]';
    return bot.sendMessage(msg.chat.id,out.slice(0,4000));
  }
  bot.onText(/^\/tanlovadmin$/,tanlovAdminHandler);
  bot.onText(/^\/ball\s+(\d{4})\s+(\d{1,3})(?:\s+([\s\S]+))?$/i,async(msg,m)=>{
    const st=await Staff.findOne({telegramChatId:String(msg.chat.id),isBlocked:false}).lean();
    if(!st||!['teacher','director','staff-admin'].includes(st.role))return;
    const taskId=String(m[1]); const score=Number(m[2]);
    if(score<0||score>100)return bot.sendMessage(msg.chat.id,'❌ Ball 0–100 oralig‘ida bo‘lishi kerak.');
    const item=await SchoolData.findOne({kind:'book_competition','data.taskId':taskId});
    if(!item)return bot.sendMessage(msg.chat.id,'❌ ID topilmadi. 4 xonali topshiriq ID ni tekshiring.');
    const d=item.data||{};
    const p={itemId:String(item._id),taskId,score,teacherComment:String(m[3]||'').trim(),videoFileId:String(d.videoFileId||''),studentName:String(d.studentName||'—'),className:String(d.className||'—'),bookName:String(d.bookName||'—'),bookNumber:String(d.bookNumber||'—'),pages:String(d.pages||'—')};
    pendingBallSessions.set(msg.chat.id,p);
    const caption='📚 KITOBXONLIK TANLOVI — BALL\n\n👤 Ism-familiya: '+p.studentName+'\n🏫 Sinf: '+p.className+'\n📖 Kitob: '+p.bookName+'\n🔢 Kitob raqami: '+p.bookNumber+'\n📄 Sahifa: '+p.pages+'\n🆔 ID: '+p.taskId+'\n🔢 Ball: '+p.score+'\n📝 Izoh: '+(p.teacherComment||'—');
    const markup={reply_markup:{inline_keyboard:[[{text:'✅ Tasdiqlash',callback_data:'ball:confirm'},{text:'❌ Rad etish',callback_data:'ball:reject'}]]}};
    if(p.videoFileId)return bot.sendVideo(msg.chat.id,p.videoFileId,{caption,...markup});
    return bot.sendMessage(msg.chat.id,caption,markup);
  });
  bot.onText(/^\/tanlov$/,async msg=>{
    const st=await competitionStudent(msg.chat.id);
    if(!st)return bot.sendMessage(msg.chat.id,'Avval Student ID ni ulang: /id 123456',menu);
    competitionSessions.set(msg.chat.id,{waitingVideo:true});
    return bot.sendMessage(msg.chat.id,'📚 KITOBXONLIK TANLOVI\n\n🎥 Kitob o‘qiyotganingiz aks etgan videoni shu yerga yuboring.');
  });
  bot.onText(/^\/ballarim$/,async msg=>{
    const st=await competitionStudent(msg.chat.id); if(!st)return bot.sendMessage(msg.chat.id,'Avval Student ID ni ulang: /id 123456',menu);
    const BookCompetition=SchoolData;
    const rows=await BookCompetition.find({kind:'book_competition', 'data.studentId':st.studentId}).sort({updatedAt:-1}).lean();
    const x=rows[0]?.data;
    if(!x)return bot.sendMessage(msg.chat.id,'⭐ Hozircha tanlovga topshirgan videongiz yo‘q.',menu);
    const all=(await BookCompetition.find({kind:'book_competition','data.scored':true}).lean()).map(z=>z.data).sort((a,b)=>Number(b.totalScore||0)-Number(a.totalScore||0));
    const rank=all.findIndex(z=>String(z.studentId)===String(st.studentId))+1;
    return bot.sendMessage(msg.chat.id,'⭐ BALLARIM\n\nBall: '+(x.scored?x.totalScore:0)+'/100\n🏆 O‘rin: '+(x.scored?rank+'-o‘rin':'Hali belgilanmagan')+'\n💬 Ustoz izohi: '+(x.teacherComment||'Hali izoh yo‘q.'),menu);
  });
  bot.onText(/^\/reyting$/,async msg=>{
    const st=await competitionStudent(msg.chat.id); if(!st)return bot.sendMessage(msg.chat.id,'Avval Student ID ni ulang: /id 123456',menu);
    const rows=await SchoolData.find({kind:'book_competition','data.scored':true}).lean(); rows.sort((a,b)=>Number(b.data.totalScore||0)-Number(a.data.totalScore||0));
    const top=rows.slice(0,10).map((x,i)=>(i+1)+'. '+x.data.studentName+' — '+x.data.totalScore+' ball').join('\n');
    return bot.sendMessage(msg.chat.id,'🏆 MUSOBAQA BALLARI\n\n'+(top||'Hozircha natijalar yo‘q.'),menu);
  });
  bot.onText(/^\/jadval$/,sendSchedule);
  bot.onText(/^\/fanlar$/,sendSubjects);
  bot.onText(/^\/(elon|e'lon)$/,m=>sendContent(m,'announcements','📢 E’lonlar','Hozircha e’lon yo‘q.'));
  bot.onText(/^\/kitoblar$/,m=>sendContent(m,'library','📖 Kitobxona','Hozircha kitob yo‘q.'));
  bot.onText(/^\/profil$/,sendProfile);
  bot.onText(/^\/(help|yordam)$/,msg=>bot.sendMessage(msg.chat.id,'/start\n/id 123456\n/jadval\n/fanlar\n/elon\n/kitoblar\n/profil',menu));

  bot.on('message',async msg=>{
    if(msg.text?.startsWith('/'))return;
    const t=String(msg.text||'');
    if(t==='📚 Kitobxonlik tanlovi — tekshirish'){return tanlovAdminHandler(msg);}
    if(t==='👤 Profilim')return bot.emit('message',{...msg,text:'/staffme'});
    if(t==='🚪 Chiqish')return bot.emit('message',{...msg,text:'/stafflogout'});
    if(t==='📅 Jadval'){
      const st=await Staff.findOne({telegramChatId:String(msg.chat.id),isBlocked:false}).lean();
      if(st)return staffSchedulePicker(msg);
      return sendSchedule(msg);
    }
    if(t==='📚 Kitobxonlik tanlovi')return bot.sendMessage(msg.chat.id,'📚 Tanlov:\n/tanlov — video yuborish\n/ballarim — ball va o‘rin\n/reyting — reyting',menu);
    if(t==='📚 Fanlar'){
      const st=await Staff.findOne({telegramChatId:String(msg.chat.id),isBlocked:false}).lean();
      if(st)return sendSubjects(msg,staffMenu(st.task));
      return sendSubjects(msg);
    }
    if(t==='📢 E’lonlar'){
      const st=await Staff.findOne({telegramChatId:String(msg.chat.id),isBlocked:false}).lean();
      return sendContent(msg,'announcements','📢 E’lonlar','Hozircha e’lon yo‘q.',st?staffMenu(st.task):menu);
    }
    if(t==='📖 Kitobxona'){
      const st=await Staff.findOne({telegramChatId:String(msg.chat.id),isBlocked:false}).lean();
      return sendContent(msg,'library','📖 Kitobxona','Hozircha kitob yo‘q.',st?staffMenu(st.task):menu);
    }
    if(t==='👤 Profil')return sendProfile(msg);
    if(t==='📱 MySchool Mini App'){
      const st=await Staff.findOne({telegramChatId:String(msg.chat.id),isBlocked:false}).lean();
      if(st)return bot.sendMessage(msg.chat.id,'📱 MySchool Mini App',{reply_markup:{inline_keyboard:[[{text:'📱 Ochish',web_app:{url:MINI_APP_URL}}]]}});
    }
    const compSession=competitionSessions.get(msg.chat.id);
    if(msg.video&&compSession?.waitingVideo){
      competitionSessions.set(msg.chat.id,{waitingConfirm:true,videoFileId:String(msg.video.file_id)});
      return bot.sendMessage(msg.chat.id,'🎥 Shu video to‘g‘rimi?',{reply_markup:{inline_keyboard:[[{'text':'✅ Ha','callback_data':'competition:yes'},{'text':'❌ Yo‘q','callback_data':'competition:no'}]]}});
    }

    if(compSession?.step==='surname'){
      const surname=String(t).trim();
      if(!surname||/^\d+$/.test(surname))return bot.sendMessage(msg.chat.id,'❌ Фамилияни киритинг.');
      competitionSessions.set(msg.chat.id,{...compSession,step:'firstName',surname});
      return bot.sendMessage(msg.chat.id,'👤 Исмингизни ёзинг:');
    }

    if(compSession?.step==='firstName'){
      const firstName=String(t).trim();
      if(!firstName||/^\d+$/.test(firstName))return bot.sendMessage(msg.chat.id,'❌ Исмни киритинг.');
      competitionSessions.set(msg.chat.id,{...compSession,step:'class',firstName});
      return bot.sendMessage(msg.chat.id,'🏫 Синфингизни ёзинг:');
    }

    if(compSession?.step==='class'){
      const className=String(t).trim();
      if(!className)return bot.sendMessage(msg.chat.id,'❌ Синфни киритинг. Масалан: 1-V');
      competitionSessions.set(msg.chat.id,{...compSession,step:'bookNumber',className});
      return bot.sendMessage(msg.chat.id,'📚 Нечинчи китобни ўқидингиз?\n\nФақат рақам киритинг. Масалан: 1');
    }

    if(compSession?.step==='bookNumber'){
      if(!/^\d+$/.test(t.trim())||Number(t.trim())<1)return bot.sendMessage(msg.chat.id,'❌ Фақат китоб рақамини киритинг. Масалан: 1');
      competitionSessions.set(msg.chat.id,{...compSession,step:'bookName',bookNumber:Number(t.trim())});
      return bot.sendMessage(msg.chat.id,'📖 Китоб номини ёзинг:');
    }

    if(compSession?.step==='bookName'){
      const bookName=String(t).trim();
      if(!bookName)return bot.sendMessage(msg.chat.id,'❌ Китоб номини киритинг.');
      competitionSessions.set(msg.chat.id,{...compSession,step:'pages',bookName});
      return bot.sendMessage(msg.chat.id,'📄 Нечта саҳифа ўқидингиз?\n\nФақат рақам киритинг. Масалан: 15');
    }

    if(compSession?.step==='pages'){
      if(!/^\d+$/.test(t.trim())||Number(t.trim())<1)return bot.sendMessage(msg.chat.id,'❌ Фақат саҳифалар сонини рақамда киритинг. Масалан: 15');
      const st=await competitionStudent(msg.chat.id);
      if(!st)return bot.sendMessage(msg.chat.id,'❌ Ўқувчи аккаунти топилмади. /id 123456 орқали қайта уланинг.',menu);
      const pages=Number(t.trim());
      const data={
        studentId:st.studentId,
        studentName:((st.firstName||'')+' '+(st.lastName||'')).trim(),
        className:st.className,
        telegramChatId:String(msg.chat.id),
        videoFileId:compSession.videoFileId,
        videoCaption:'',
        bookNumber:compSession.bookNumber,
        bookName:compSession.bookName,
        pages,
        teacherComment:'',
        totalScore:0,
        scored:false,
        taskId:''
      };
      const saved=await SchoolData.create({kind:'book_competition',data,updatedAt:new Date()});
      await notifyCompetitionStaff(saved);
      competitionSessions.delete(msg.chat.id);
      return bot.sendMessage(msg.chat.id,'✅ Анкета қабул қилинди!\n\n📚 Китоб: '+data.bookName+'\n🔢 Китоб рақами: '+data.bookNumber+'\n📄 Саҳифалар: '+data.pages+'\n👤 '+data.studentName+'\n🏫 Синф: '+data.className+'\n\nУстоз текшириб, натижани белгилайди.',menu);
    }
    if(t==='❓ Yordam'){const st=await Staff.findOne({telegramChatId:String(msg.chat.id),isBlocked:false}).lean();if(st)return bot.sendMessage(msg.chat.id,'/staff\n/staffme\n/stafflogout'+(st.task==='Kitobxonlik tanlovini'?'\n/tanlovadmin':'') ,staffMenu(st.task));return bot.sendMessage(msg.chat.id,'/start\n/id 123456\n/jadval\n/fanlar\n/elon\n/kitoblar\n/profil',menu);}
    if(adminSessions.get(msg.chat.id)?.step==='broadcast'){if(t==='/admin')return bot.sendMessage(msg.chat.id,'🛡 KATTA ADMIN PANELI',adminMenu);adminSessions.delete(msg.chat.id);const ids=[];const students=await Application.find({status:'approved',telegramChatId:{$ne:''}}).select('telegramChatId').lean();const staff=await Staff.find({telegramChatId:{$ne:''},isBlocked:{$ne:true}}).select('telegramChatId').lean();for(const x of [...students,...staff])if(x.telegramChatId&&!ids.includes(String(x.telegramChatId)))ids.push(String(x.telegramChatId));const result=await broadcastTelegram(ids,t);return bot.sendMessage(msg.chat.id,'✅ Xabar yuborildi.\n\nYuborildi: '+result.sent+'\nYuborilmadi: '+result.failed,adminMenu);}
    if(sessions.get(msg.chat.id)?.waitingId && /^\d{6}$/.test(t)){staffSessions.delete(msg.chat.id);return connect(msg,t);}
    if(staffSessions.get(msg.chat.id)?.step==='username'){staffSessions.set(msg.chat.id,{step:'password',username:t});return bot.sendMessage(msg.chat.id,'🔐 Parolni yuboring:');}
    if(staffSessions.get(msg.chat.id)?.step==='password'){const x=staffSessions.get(msg.chat.id);const ok=await staffLogin(msg,x.username,t);if(!ok)return bot.sendMessage(msg.chat.id,'❌ Login yoki parol noto‘g‘ri. /staff orqali qayta urinib ko‘ring.');return;}
  });

  async function sendProfile(msg){const s=await student(msg.chat.id);if(!s)return bot.sendMessage(msg.chat.id,'Avval Student ID ni ulang: /id');return bot.sendMessage(msg.chat.id,'👤 Profil\n\nIsm: '+s.firstName+'\nFamiliya: '+s.lastName+'\nSinf: '+s.className+'\nStudent ID: '+s.studentId,menu);}
  async function sendScheduleForClass(chatId,className,replyMarkup){
    const normalize=v=>String(v||'').trim().toLowerCase().replace(/[-–—_\s]/g,'');
    const normalizeDay=v=>{
      const n=normalize(v);
      const aliases={dushanba:'Dushanba',seshanba:'Seshanba',chorshanba:'Chorshanba',payshanba:'Payshanba',juma:'Juma',shanba:'Shanba'};
      return aliases[n]||String(v||'').trim();
    };
    const items=await SchoolData.find({kind:'schedule'}).lean();
    const own=items.filter(x=>{
      const d=x.data||{};
      return [d.className,d.class,d.sinf,d.class_name].some(v=>normalize(v)===normalize(className));
    });
    if(!own.length)return bot.sendMessage(chatId,'📅 '+className+' uchun jadval hali kiritilmagan.',replyMarkup);
    const order=['Dushanba','Seshanba','Chorshanba','Payshanba','Juma','Shanba'];
    const byDay=new Map();
    for(const x of own){
      const d=x.data||{};
      const day=normalizeDay(d.day||d.kun);
      if(!order.includes(day))continue;
      const rows=Array.isArray(d.rows)?d.rows:Array.isArray(d.lessons)?d.lessons:[];
      if(!byDay.has(day))byDay.set(day,[]);
      byDay.get(day).push(...rows);
    }
    let out='📅 '+className+' sinfi jadvali\n\n';
    for(const day of order){
      const rows=(byDay.get(day)||[]).map((row,index)=>({row,index}))
        .filter(x=>String(x.row?.subject||x.row?.name||x.row?.fan||'').trim());
      rows.sort((a,b)=>{
        const ta=String(a.row?.time||a.row?.vaqt||'').trim();
        const tb=String(b.row?.time||b.row?.vaqt||'').trim();
        const ma=ta.match(/^(\\d{1,2}):(\\d{2})/);
        const mb=tb.match(/^(\\d{1,2}):(\\d{2})/);
        if(ma&&mb)return (Number(ma[1])*60+Number(ma[2]))-(Number(mb[1])*60+Number(mb[2]));
        return a.index-b.index;
      });
      if(!rows.length)continue;
      out+='📌 '+day+'\n';
      rows.forEach((x,i)=>{
        const row=x.row;
        const subject=String(row?.subject||row?.name||row?.fan||'').trim();
        const time=String(row?.time||row?.vaqt||'').trim();
        out+=(i+1)+'. '+subject+(time?' — '+time:'')+'\n';
      });
      out+='\n';
    }
    return bot.sendMessage(chatId,out.trim().slice(0,4000)||('📅 '+className+' uchun jadval hali kiritilmagan.'),replyMarkup);
  }

  async function staffSchedulePicker(msg){
    const st=await Staff.findOne({telegramChatId:String(msg.chat.id),isBlocked:false}).lean();
    if(!st)return bot.sendMessage(msg.chat.id,'Avval /staff orqali kiring.');
    const normalize=v=>String(v||'').trim().toLowerCase().replace(/[-–—_\s]/g,'');
    const items=await SchoolData.find({kind:'schedule'}).lean();
    const classes=[...new Set(items.flatMap(x=>{
      const d=x.data||{};
      return [d.className,d.class,d.sinf,d.class_name].filter(Boolean).map(v=>String(v).trim()).filter(Boolean);
    }))].sort((a,b)=>a.localeCompare(b,'uz',{numeric:true}));
    const fallback=[];
    for(let n=1;n<=11;n++) for(const l of ['A','B','G','V']) fallback.push(n+'-'+l);
    const list=classes.length?classes:fallback;
    const rows=[];
    for(let i=0;i<list.length;i+=4){
      rows.push(list.slice(i,i+4).map(c=>({text:c,callback_data:'staff:schedule:'+encodeURIComponent(c)})));
    }
    return bot.sendMessage(msg.chat.id,'📅 Jadval\n\nQaysi sinf jadvalini ko‘rmoqchisiz?',{
      reply_markup:{inline_keyboard:rows}
    });
  }

  async function sendSchedule(msg){
    const s=await student(msg.chat.id);
    if(!s)return bot.sendMessage(msg.chat.id,'Avval Student ID ni ulang: /id');
    return sendScheduleForClass(msg.chat.id,String(s.className||'').trim(),menu);
  }

 async function sendSubjects(msg,replyMarkup){
    const st=await Staff.findOne({telegramChatId:String(msg.chat.id),isBlocked:false}).lean();
    const studentUser=st?null:await student(msg.chat.id);
    if(!st&&!studentUser)return bot.sendMessage(msg.chat.id,'Avval Student ID ni ulang: /id');
    const items=await SchoolData.find({kind:'subjects'}).sort({updatedAt:-1}).lean();
    const names=[...new Set(items.flatMap(x=>{const d=x.data||{};return [d.name,d.subject,d.fan].filter(Boolean).map(v=>String(v).trim())}))];
    const markup=replyMarkup||(st?staffMenu(st.task):menu);
    return bot.sendMessage(msg.chat.id,names.length?'📚 Fanlar\n\n'+names.map((x,i)=>(i+1)+'. '+x).join('\n'):'📚 Hozircha fanlar kiritilmagan.',markup);
  } async function sendContent(msg,kind,title,empty,replyMarkup){
    const items=await SchoolContent.find({kind}).sort({createdAt:-1}).lean();
    const markup=replyMarkup||(await Staff.findOne({telegramChatId:String(msg.chat.id),isBlocked:false}).lean()?staffMenu((await Staff.findOne({telegramChatId:String(msg.chat.id),isBlocked:false}).lean()).task):menu);
    if(!items.length)return bot.sendMessage(msg.chat.id,empty,markup);
    let out=title+'\n\n';
    for(const x of items.slice(0,10)){out+='• '+x.title+'\n'+(x.body||'')+(x.url?'\n'+x.url:'')+'\n\n';}
    return bot.sendMessage(msg.chat.id,out.slice(0,4000),markup,{disable_web_page_preview:true});
  }
  bot.on('polling_error',err=>console.error('[telegram] polling error',err.message));
  if(webhookUrl){
    bot.setWebHook(webhookUrl,{secret_token:webhookSecret}).then(()=>console.log('[telegram] webhook configured')).catch(err=>console.error('[telegram] webhook setup failed',err.message));
  }else{
    bot.startPolling().then(()=>console.log('[telegram] bot polling started')).catch(err=>console.error('[telegram] bot polling failed to start',err.message));
  }
  return bot;
}
function getTelegramStatus(){return {running:Boolean(activeBot),startedAt:telegramStartedAt};}
async function notifyStudentApproved(chatId,student){
  if(!activeBot||!chatId)return false;
  try{
    await activeBot.sendMessage(String(chatId),
      '🎉 Tabriklaymiz, '+String(student.firstName||'o‘quvchi')+'!\n\nSiz MySchool tizimida ro‘yxatdan muvaffaqiyatli o‘tdingiz. ✅\n\n🆔 Sizning Student ID: '+String(student.studentId)+'\n🏫 Sinf: '+String(student.className||'')+'\n\nEndi Mini App va Telegram bot orqali akkauntingizdan foydalanishingiz mumkin.',
      {reply_markup:{keyboard:[[{'text':'📱 MySchool Mini App',web_app:{url:'https://school-ai-fronted.onrender.com'}}],[{'text':'📅 Jadval'},{'text':'📚 Fanlar'}],[{'text':'📢 E’lonlar'},{'text':'📖 Kitobxona'}],[{'text':'👤 Profil'},{'text':'❓ Yordam'}]],resize_keyboard:true}}
    );
    return true;
  }catch(e){
    console.error('[telegram] approval notification failed',chatId,e.message);
    return false;
  }
}
async function notifyCompetitionScored(chatId,item){
  if(!activeBot||!chatId)return false;
  try{await activeBot.sendMessage(String(chatId),'📚 Kitobxonlik tanlovi natijasi!\n\n⭐ Ball: '+item.totalScore+'/100\n💬 Ustoz izohi: '+(item.teacherComment||'Izoh yo‘q.')+'\n\n🏆 Reytingni Mini App yoki /reyting orqali ko‘rishingiz mumkin.');return true}catch(e){return false}
}
async function broadcastTelegram(chatIds,message){if(!activeBot)throw new Error('Telegram bot is not running');let sent=0,failed=0;for(const chatId of chatIds){try{await activeBot.sendMessage(String(chatId),message);sent++}catch(e){failed++;console.error('[telegram] send failed',chatId,e.message)}}return {sent,failed};}
function processTelegramUpdate(update){if(activeBot)activeBot.processUpdate(update);}
module.exports={startTelegramBot,getTelegramStatus,broadcastTelegram,notifyStudentApproved,processTelegramUpdate};