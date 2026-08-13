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

});
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
  ) {
    return;
  }

  const classes = Array.from({ length: 11 }, (_, i) => `${i + 1}-sinf`);

  // 1–11-sinflarni chiqarish
  classGridEl.innerHTML = classes
    .map(
      (className) => `
        <button
          class="class-btn"
          type="button"
          data-class="${className}"
        >
          ${className.toUpperCase()}
        </button>
      `
    )
    .join("");

  function renderClassSchedule(className) {
  const schedule = MySchoolData.schedule[className] || {};
  const days = Object.keys(schedule);

  selectedClassTitleEl.textContent = className.toUpperCase();

  dayTabsEl.innerHTML = days
    .map(
      (day, i) => `
        <button
          class="day-tab${i === 0 ? " is-active" : ""}"
          type="button"
          data-day="${day}"
        >
          ${day}
        </button>
      `
    )
    .join("");

  // Vaqtni avtomatik hisoblash
  function addMinutes(time, minutes) {
    const [hours, mins] = time.split(":").map(Number);
    const total = hours * 60 + mins + minutes;

    const h = Math.floor(total / 60);
    const m = total % 60;

    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function renderDay(day) {
    const lessons = schedule[day] || [];

    if (lessons.length === 0) {
      scheduleListEl.innerHTML =
        '<p class="empty-state">Bu kunda dars yo‘q.</p>';
      return;
    }

    const classNumber = parseInt(className, 10);
    const isJunior = classNumber <= 4;

    let currentTime = "08:30";
    let html = "";

    lessons.slice(0, 8).forEach((lesson, i) => {
      const lessonNumber = i + 1;

      // Dars
      const start = currentTime;
      const end = addMinutes(start, 45);

      html += `
        <div class="schedule-row">
          <span class="schedule-row__index">${lessonNumber}</span>
          <span class="schedule-row__time">${start}–${end}</span>
          <span class="schedule-row__subject">${lesson.subject}</span>
        </div>
      `;

      currentTime = end;

      // Abet
      const isAbet = isJunior
        ? lessonNumber === 3
        : lessonNumber === 4;

      if (isAbet) {
        const abetEnd = addMinutes(currentTime, 45);

        html += `
          <div class="schedule-row">
            <span class="schedule-row__index">🍽️</span>
            <span class="schedule-row__time">${currentTime}–${abetEnd}</span>
            <span class="schedule-row__subject">ABET</span>
          </div>
        `;

        currentTime = abetEnd;
      }

      // Po‘ldnik
      const isPoldnik = isJunior
        ? lessonNumber === 7
        : lessonNumber === 8;

      if (isPoldnik) {
        const poldnikEnd = addMinutes(currentTime, 45);

        html += `
          <div class="schedule-row">
            <span class="schedule-row__index">🍽️</span>
            <span class="schedule-row__time">${currentTime}–${poldnikEnd}</span>
            <span class="schedule-row__subject">PO‘LDNIK</span>
          </div>
        `;

        currentTime = poldnikEnd;
      }

      // Oddiy tanaffus — oxirgi darsdan keyin emas
      if (lessonNumber < 8) {
        currentTime = addMinutes(currentTime, 5);
      }
    });

    scheduleListEl.innerHTML = html;
  }

  dayTabsEl.querySelectorAll(".day-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      dayTabsEl
        .querySelectorAll(".day-tab")
        .forEach((t) => t.classList.remove("is-active"));

      tab.classList.add("is-active");

      renderDay(tab.dataset.day);
    });
  });

  if (days.length > 0) {
    renderDay(days[0]);
  } else {
    scheduleListEl.innerHTML =
      '<p class="empty-state">Bu sinf uchun jadval hali kiritilmagan.</p>';
  }
      }

  // Sinf tanlash
  classGridEl.querySelectorAll(".class-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const className = btn.dataset.class;

      classSelectorEl.hidden = true;
      scheduleSectionEl.hidden = false;

      renderClassSchedule(className);
    });
  });

  // Sinf tanlashga qaytish
  classBackBtn.addEventListener("click", () => {
    scheduleSectionEl.hidden = true;
    classSelectorEl.hidden = false;
  });
     }
initSchedule();
  /* ----------------------------------------------------------
     5) 📖 FANLAR
     ---------------------------------------------------------- */

  function initSubjects() {
    const el = document.getElementById("subjectList");
    if (!el) return;

    el.innerHTML = MySchoolData.subjects
      .map(
        (s) => `
          <div class="subject-card">
            <div class="subject-card__head">
              <span class="subject-card__icon">${s.icon}</span>
              <span class="subject-card__name">${s.name}</span>
            </div>
            <p class="subject-card__desc">${s.desc}</p>
          </div>
        `
      )
      .join("");
  }

  /* ----------------------------------------------------------
     6) 🎯 CAREER — maqsadni saqlash
     ---------------------------------------------------------- */

  function initCareer() {
    const input = document.getElementById("careerInput");
    const saveBtn = document.getElementById("careerSaveBtn");
    const result = document.getElementById("careerResult");
    const resultText = document.getElementById("careerGoalText");
    if (!input || !saveBtn || !result || !resultText) return;

    const STORAGE_KEY = "myschool_career_goal";

    function showGoal(text) {
      resultText.textContent = text;
      result.hidden = false;
    }

    // Sahifa ochilganda avval saqlangan maqsad bo'lsa ko'rsatamiz
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        input.value = saved;
        showGoal(saved);
      }
    } catch (err) {
      console.warn("MySchool: localStorage o'qib bo'lmadi.", err);
    }

    saveBtn.addEventListener("click", () => {
      const value = input.value.trim();
      if (!value) {
        input.focus();
        return;
      }

      showGoal(value);

      try {
        localStorage.setItem(STORAGE_KEY, value);
      } catch (err) {
        console.warn("MySchool: localStorage ga yozib bo'lmadi.", err);
      }
    });
  }

  /* ----------------------------------------------------------
     7) 📢 E'LON
     ---------------------------------------------------------- */

  function initAnnouncements() {
    const el = document.getElementById("announcementList");
    if (!el) return;

    el.innerHTML = MySchoolData.announcements
      .map(
        (a) => `
          <div class="announcement-card">
            <span class="announcement-card__date">${a.date}</span>
            <h3 class="announcement-card__title">${a.title}</h3>
            <p class="announcement-card__text">${a.text}</p>
          </div>
        `
      )
      .join("");
  }

  /* ----------------------------------------------------------
     8) 📚 KITOBXONA — ro'yxat + qidiruv
     ---------------------------------------------------------- */

  function initLibrary() {
    const searchInput = document.getElementById("bookSearch");
    const listEl = document.getElementById("bookList");
    if (!searchInput || !listEl) return;

    function renderBooks(query) {
      const q = query.trim().toLowerCase();
      const filtered = MySchoolData.books.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
      );

      if (filtered.length === 0) {
        listEl.innerHTML = `<p class="empty-state">Hech narsa topilmadi.</p>`;
        return;
      }

      listEl.innerHTML = filtered
        .map(
          (b) => `
            <div class="book-item">
              <span class="book-item__title">${b.title}</span>
              <span class="book-item__author">${b.author}</span>
            </div>
          `
        )
        .join("");
    }

    searchInput.addEventListener("input", () => {
      renderBooks(searchInput.value);
    });

    renderBooks("");
  }

  /* ----------------------------------------------------------
     9) 🤖 AI YORDAMCHI — chat interfeysi (placeholder javoblar)
     Kelajakda: bu yerdagi sendMessageToAI() funksiyasi ichiga
     Node.js backend'ga fetch() so'rovi qo'shiladi.
     ---------------------------------------------------------- */

  function initAIChat() {
    const messagesEl = document.getElementById("chatMessages");
    const form = document.getElementById("chatForm");
    const input = document.getElementById("chatInput");
    if (!messagesEl || !form || !input) return;

    let greeted = false;

    function addBubble(text, sender) {
      const bubble = document.createElement("div");
      bubble.className = `chat-bubble chat-bubble--${sender}`;
      bubble.textContent = text;
      messagesEl.appendChild(bubble);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    // TODO (kelajakda): haqiqiy AI API bilan almashtiriladi
    function getPlaceholderReply() {
      return "Hozircha men demo rejimidaman — haqiqiy AI hali ulanmagan. Tez orada Node.js backend orqali to'liq javob bera boshlayman! 🤖";
    }

    function sendMessageToAI(userText) {
      // Hozircha soxta javob, kelajakda fetch('/api/ai', {...}) shu yerga qo'shiladi
      setTimeout(() => {
        addBubble(getPlaceholderReply(), "bot");
      }, 500);
    }

    function greetOnce() {
      if (greeted) return;
      greeted = true;
      addBubble(
        "Salom! 👋 Men MySchool AI yordamchiman. Sizga qanday yordam bera olaman?",
        "bot"
      );
    }

    document.addEventListener("myschool:panel-opened", (e) => {
      if (e.detail === "ai") greetOnce();
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      addBubble(text, "user");
      input.value = "";
      sendMessageToAI(text);
    });
  }

  /* ----------------------------------------------------------
     Panel ochilganda tegishli event chiqarish (AI chatga kerak)
     ---------------------------------------------------------- */

  document.querySelectorAll("[data-panel]").forEach((btn) => {
    if (btn.classList.contains("panel")) return;
    btn.addEventListener("click", () => {
      document.dispatchEvent(
        new CustomEvent("myschool:panel-opened", { detail: btn.dataset.panel })
      );
    });
  });

  /* ---------- Barcha panellarni ishga tushirish ---------- */

  initSchedule();
  initSubjects();
  initCareer();
  initAnnouncements();
  initLibrary();
  initAIChat();
});
                          
