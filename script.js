/* ==========================================================
   MySchool — STEM SCHOOL platformasi
   Tarkib:
     1) KIRISH ekrani animatsiyasi (o'zgarishsiz)
     2) Umumiy ekran navigatsiyasi (.screen / .is-active)
     3) Statik ma'lumotlar (MySchoolData) — kelajakda
        backend/DB dan olinadigan joy shu yerda aniq belgilangan
     4) Har bir panelni render qiluvchi funksiyalar
     5) CAREER, KITOBXONA qidiruv va AI chat interaktivligi
   ========================================================== */

/* ----------------------------------------------------------
   1) MA'LUMOTLAR (hozircha statik)
   TODO (kelajakda): bu obyektlar backend API / database dan
   fetch('/api/...') orqali olinadi. Render funksiyalari shu
   sabab alohida yozilgan — data manbai almashsa ham render
   funksiyalarini o'zgartirish shart bo'lmaydi.
   ---------------------------------------------------------- */

const MySchoolData = {
  schedule: {
  "1-sinf": {
    Dushanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Ona tili" },
      { time: "10:10–10:50", subject: "Ingliz tili" }
    ],
    Seshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "O'qish" },
      { time: "10:10–10:50", subject: "Informatika" }
    ],
    Chorshanba: [
      { time: "08:30–09:10", subject: "Ona tili" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Tabiatshunoslik" }
    ],
    Payshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Ingliz tili" },
      { time: "10:10–10:50", subject: "Tasviriy san'at" }
    ],
    Juma: [
      { time: "08:30–09:10", subject: "O'qish" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Jismoniy tarbiya" }
    ]
  },

  "2-sinf": {
    Dushanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Ona tili" },
      { time: "10:10–10:50", subject: "Ingliz tili" }
    ],
    Seshanba: [
      { time: "08:30–09:10", subject: "O'qish" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Informatika" }
    ],
    Chorshanba: [
      { time: "08:30–09:10", subject: "Ona tili" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Tabiatshunoslik" }
    ],
    Payshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Ingliz tili" },
      { time: "10:10–10:50", subject: "Musiqa" }
    ],
    Juma: [
      { time: "08:30–09:10", subject: "O'qish" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Jismoniy tarbiya" }
    ]
  },

  "3-sinf": {
    Dushanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Ona tili" },
      { time: "10:10–10:50", subject: "Ingliz tili" }
    ],
    Seshanba: [
      { time: "08:30–09:10", subject: "Tabiatshunoslik" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Informatika" }
    ],
    Chorshanba: [
      { time: "08:30–09:10", subject: "Ona tili" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "O'qish" }
    ],
    Payshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Ingliz tili" },
      { time: "10:10–10:50", subject: "Tasviriy san'at" }
    ],
    Juma: [
      { time: "08:30–09:10", subject: "O'qish" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Jismoniy tarbiya" }
    ]
  },

  "4-sinf": {
    Dushanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Ona tili" },
      { time: "10:10–10:50", subject: "Ingliz tili" }
    ],
    Seshanba: [
      { time: "08:30–09:10", subject: "Tarix" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Informatika" }
    ],
    Chorshanba: [
      { time: "08:30–09:10", subject: "Ona tili" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Tabiatshunoslik" }
    ],
    Payshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Ingliz tili" },
      { time: "10:10–10:50", subject: "Musiqa" }
    ],
    Juma: [
      { time: "08:30–09:10", subject: "O'qish" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Jismoniy tarbiya" }
    ]
  },

  "5-sinf": {
    Dushanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Ona tili va adabiyot" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Informatika" }
    ],
    Seshanba: [
      { time: "08:30–09:10", subject: "Fizika" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Biologiya" },
      { time: "11:00–11:40", subject: "Tarix" }
    ],
    Chorshanba: [
      { time: "08:30–09:10", subject: "Kimyo" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Informatika" },
      { time: "11:00–11:40", subject: "Geografiya" }
    ],
    Payshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Biologiya" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Jismoniy tarbiya" }
    ],
    Juma: [
      { time: "08:30–09:10", subject: "Informatika" },
      { time: "09:20–10:00", subject: "Fizika" },
      { time: "10:10–10:50", subject: "Matematika" },
      { time: "11:00–11:40", subject: "Tarix" }
    ]
  },

  "6-sinf": {
    Dushanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Fizika" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Informatika" }
    ],
    Seshanba: [
      { time: "08:30–09:10", subject: "Biologiya" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Tarix" },
      { time: "11:00–11:40", subject: "Ingliz tili" }
    ],
    Chorshanba: [
      { time: "08:30–09:10", subject: "Kimyo" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Informatika" },
      { time: "11:00–11:40", subject: "Geografiya" }
    ],
    Payshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Biologiya" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Jismoniy tarbiya" }
    ],
    Juma: [
      { time: "08:30–09:10", subject: "Informatika" },
      { time: "09:20–10:00", subject: "Fizika" },
      { time: "10:10–10:50", subject: "Matematika" },
      { time: "11:00–11:40", subject: "Tarix" }
    ]
  },

  "7-sinf": {
    Dushanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Fizika" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Informatika" }
    ],
    Seshanba: [
      { time: "08:30–09:10", subject: "Fizika" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Biologiya" },
      { time: "11:00–11:40", subject: "Tarix" }
    ],
    Chorshanba: [
      { time: "08:30–09:10", subject: "Kimyo" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Informatika" },
      { time: "11:00–11:40", subject: "Geografiya" }
    ],
    Payshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Biologiya" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Jismoniy tarbiya" }
    ],
    Juma: [
      { time: "08:30–09:10", subject: "Informatika" },
      { time: "09:20–10:00", subject: "Fizika" },
      { time: "10:10–10:50", subject: "Matematika" },
      { time: "11:00–11:40", subject: "Robototexnika" }
    ]
  },

  "8-sinf": {
    Dushanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Fizika" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Informatika" }
    ],
    Seshanba: [
      { time: "08:30–09:10", subject: "Fizika" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Biologiya" },
      { time: "11:00–11:40", subject: "Tarix" }
    ],
    Chorshanba: [
      { time: "08:30–09:10", subject: "Kimyo" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Informatika" },
      { time: "11:00–11:40", subject: "Geografiya" }
    ],
    Payshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Biologiya" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Jismoniy tarbiya" }
    ],
    Juma: [
      { time: "08:30–09:10", subject: "Informatika" },
      { time: "09:20–10:00", subject: "Fizika" },
      { time: "10:10–10:50", subject: "Matematika" },
      { time: "11:00–11:40", subject: "Robototexnika" }
    ]
  },

  "9-sinf": {
    Dushanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Fizika" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Informatika" }
    ],
    Seshanba: [
      { time: "08:30–09:10", subject: "Fizika" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Biologiya" },
      { time: "11:00–11:40", subject: "Tarix" }
    ],
    Chorshanba: [
      { time: "08:30–09:10", subject: "Kimyo" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Informatika" },
      { time: "11:00–11:40", subject: "Geografiya" }
    ],
    Payshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Biologiya" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Jismoniy tarbiya" }
    ],
    Juma: [
      { time: "08:30–09:10", subject: "Informatika" },
      { time: "09:20–10:00", subject: "Fizika" },
      { time: "10:10–10:50", subject: "Matematika" },
      { time: "11:00–11:40", subject: "Robototexnika" }
    ]
  },

  "10-sinf": {
    Dushanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Fizika" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Informatika" }
    ],
    Seshanba: [
      { time: "08:30–09:10", subject: "Fizika" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Biologiya" },
      { time: "11:00–11:40", subject: "Tarix" }
    ],
    Chorshanba: [
      { time: "08:30–09:10", subject: "Kimyo" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Informatika" },
      { time: "11:00–11:40", subject: "Geografiya" }
    ],
    Payshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Biologiya" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Jismoniy tarbiya" }
    ],
    Juma: [
      { time: "08:30–09:10", subject: "Informatika" },
      { time: "09:20–10:00", subject: "Fizika" },
      { time: "10:10–10:50", subject: "Matematika" },
      { time: "11:00–11:40", subject: "Robototexnika" }
    ]
  },

  "11-sinf": {
    Dushanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Fizika" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Informatika" }
    ],
    Seshanba: [
      { time: "08:30–09:10", subject: "Fizika" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Biologiya" },
      { time: "11:00–11:40", subject: "Tarix" }
    ],
    Chorshanba: [
      { time: "08:30–09:10", subject: "Kimyo" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Informatika" },
      { time: "11:00–11:40", subject: "Geografiya" }
    ],
    Payshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Biologiya" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Jismoniy tarbiya" }
    ],
    Juma: [
      { time: "08:30–09:10", subject: "Informatika" },
      { time: "09:20–10:00", subject: "Fizika" },
      { time: "10:10–10:50", subject: "Matematika" },
      { time: "11:00–11:40", subject: "Robototexnika" }
    ]
  }
},

  subjects: [
    { icon: "📐", name: "Matematika", desc: "Algebra, geometriya va mantiqiy fikrlashni rivojlantirish." },
    { icon: "⚛️", name: "Fizika", desc: "Mexanika, elektr, optika va tabiat qonunlari." },
    { icon: "🧪", name: "Kimyo", desc: "Moddalar tuzilishi va kimyoviy reaksiyalar asoslari." },
    { icon: "🧬", name: "Biologiya", desc: "Tirik organizmlar, genetika va ekologik tizimlar." },
    { icon: "💻", name: "Informatika", desc: "Dasturlash, algoritmlar va raqamli texnologiyalar." },
    { icon: "🤖", name: "Robototexnika", desc: "Robot konstruksiyalash va avtomatlashtirilgan tizimlar." },
    { icon: "🌍", name: "Geografiya", desc: "Dunyo xaritasi, iqlim va tabiiy resurslar." },
    { icon: "📜", name: "Tarix", desc: "Jahon va milliy tarix voqealari." },
    { icon: "🗣️", name: "Ingliz tili", desc: "Xalqaro muloqot va ilmiy matnlarni tushunish." },
    { icon: "✍️", name: "Ona tili va adabiyot", desc: "Nutq madaniyati va badiiy adabiyot asoslari." },
  ],

  announcements: [
    {
      date: "10.08.2026",
      title: "Yangi o'quv yili boshlanishi",
      text: "2026–2027 o'quv yili 1-sentyabr kuni soat 9:00 da boshlanadi. Barcha o'quvchilar bayram marosimiga taklif etiladi.",
    },
    {
      date: "05.08.2026",
      title: "Robototexnika to'garagi",
      text: "Yangi robototexnika to'garagiga ro'yxatdan o'tish boshlandi. Batafsil ma'lumot uchun sinf rahbaringizga murojaat qiling.",
    },
    {
      date: "28.07.2026",
      title: "Yozgi STEM lager",
      text: "Yozgi ilmiy lager dasturi muvaffaqiyatli yakunlandi. Ishtirokchilarga sertifikatlar topshirildi.",
    },
    {
      date: "15.07.2026",
      title: "Kutubxona yangilanishi",
      text: "Maktab kutubxonasiga 50 dan ortiq yangi kitob qo'shildi. Ro'yxat bilan KITOBXONA bo'limida tanishishingiz mumkin.",
    },
  ],

  books: [
    { title: "Qisqacha vaqt tarixi", author: "Stephen Hawking" },
    { title: "Sapiens: Insoniyatning qisqacha tarixi", author: "Yuval Noah Harari" },
    { title: "Alisa mo'jizalar mamlakatida", author: "Lewis Carroll" },
    { title: "Kichik shahzoda", author: "Antoine de Saint-Exupéry" },
    { title: "O'tkan kunlar", author: "Abdulla Qodiriy" },
    { title: "Mehrobdan chayon", author: "Abdulla Qodiriy" },
    { title: "Algoritmlar asoslari", author: "Thomas H. Cormen" },
    { title: "Kosmos", author: "Carl Sagan" },
    { title: "Fizika darslari", author: "Richard Feynman" },
    { title: "Robototexnikaga kirish", author: "John J. Craig" },
  ],
};

/* ----------------------------------------------------------
   DOMContentLoaded — barcha logika shu ichida ishga tushadi
   ---------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- Asosiy elementlar ---------- */

  const intro = document.getElementById("intro");
  const cap = document.getElementById("cap");
  const brand = document.getElementById("brand");
  const divider = document.getElementById("divider");
  const enterBtn = document.getElementById("enterBtn");
  const menu = document.getElementById("menu");

  const required = { intro, cap, brand, divider, enterBtn, menu };
  const missing = Object.entries(required)
    .filter(([, el]) => !el)
    .map(([name]) => name);

  if (missing.length > 0) {
    console.error(
      `MySchool: quyidagi elementlar HTML da topilmadi: ${missing.join(", ")}`
    );
    return;
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ----------------------------------------------------------
     2) KIRISH ekrani animatsiyasi — o'zgarishsiz
     ---------------------------------------------------------- */

  const timeline = [
    { el: cap, delay: 300 },
    { el: brand, delay: 900 },
    { el: divider, delay: 1500 },
    { el: enterBtn, delay: 2400 },
  ];

  if (prefersReducedMotion) {
    timeline.forEach(({ el }) => el.classList.add("is-visible"));
  } else {
    timeline.forEach(({ el, delay }) => {
      setTimeout(() => el.classList.add("is-visible"), delay);
    });
  }

  /* ----------------------------------------------------------
     3) Umumiy ekran navigatsiyasi
     Barcha ekranlar (.screen) — intro, menu, har bir panel —
     shu yagona funksiya orqali almashtiriladi.
     ---------------------------------------------------------- */

  const allScreens = document.querySelectorAll(".screen");
  const panels = {};
  document.querySelectorAll(".panel[data-panel]").forEach((panel) => {
    panels[panel.dataset.panel] = panel;
  });

  function activateScreen(targetEl) {
    if (!targetEl) return;
    allScreens.forEach((s) => s.classList.remove("is-active"));
    targetEl.classList.add("is-active");
  }

  // KIRISH tugmasi -> MENU ochiladi
  enterBtn.addEventListener("click", () => {
    if (enterBtn.disabled) return;
    enterBtn.disabled = true;
    document.dispatchEvent(new CustomEvent("myschool:kirish"));
    activateScreen(menu);
  });

  // Menudagi har bir tugma -> tegishli panelni ochadi
  document.querySelectorAll("[data-panel]").forEach((btn) => {
    if (btn.classList.contains("panel")) return; // panelning o'zi emas, tugma
    btn.addEventListener("click", () => {
      const key = btn.dataset.panel;
      activateScreen(panels[key]);
    });
  });

  // Har bir paneldagi "← ORQAGA" -> MENUga qaytaradi
  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => activateScreen(menu));
  });

  /* ----------------------------------------------------------
     4) 📅 JADVAL — kun tablari + dars ro'yxati
     ---------------------------------------------------------- */

function initSchedule() {
  const classGridEl = document.getElementById("classGrid");
  const classSelectorEl = document.getElementById("classSelector");
  const scheduleSectionEl = document.getElementById("scheduleSection");
  const classBackBtn = document.getElementById("classBackBtn");
  const selectedClassTitleEl = document.getElementById("selectedClassTitle");
  const dayTabsEl = document.getElementById("dayTabs");
  const scheduleListEl = document.getElementById("scheduleList");

  if (
    !classGridEl ||
    !classSelectorEl ||
    !scheduleSectionEl ||
    !classBackBtn ||
    !selectedClassTitleEl ||
    !dayTabsEl ||
    !scheduleListEl
  )
