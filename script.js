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
      { time: "09:20–10:00", subject: "Ona tili va adabiyot" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Informatika" },
      { time: "12:30–13:10", subject: "Tabiiy fan" },
      { time: "13:20–14:00", subject: "Tarix" },
      { time: "14:10–14:50", subject: "Jismoniy tarbiya" },
      { time: "15:00–15:40", subject: "San'at" }
    ],
    Seshanba: [
      { time: "08:30–09:10", subject: "Ona tili va adabiyot" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Informatika" },
      { time: "11:00–11:40", subject: "Ingliz tili" },
      { time: "12:30–13:10", subject: "Tabiiy fan" },
      { time: "13:20–14:00", subject: "San'at" },
      { time: "14:10–14:50", subject: "Tarix" },
      { time: "15:00–15:40", subject: "Jismoniy tarbiya" }
    ],
    Chorshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Ingliz tili" },
      { time: "10:10–10:50", subject: "Ona tili va adabiyot" },
      { time: "11:00–11:40", subject: "Tabiiy fan" },
      { time: "12:30–13:10", subject: "Informatika" },
      { time: "13:20–14:00", subject: "San'at" },
      { time: "14:10–14:50", subject: "Jismoniy tarbiya" },
      { time: "15:00–15:40", subject: "Tarix" }
    ],
    Payshanba: [
      { time: "08:30–09:10", subject: "Ingliz tili" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Ona tili va adabiyot" },
      { time: "11:00–11:40", subject: "Informatika" },
      { time: "12:30–13:10", subject: "Tabiiy fan" },
      { time: "13:20–14:00", subject: "Tarix" },
      { time: "14:10–14:50", subject: "San'at" },
      { time: "15:00–15:40", subject: "Jismoniy tarbiya" }
    ],
    Juma: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Ona tili va adabiyot" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Tabiiy fan" },
      { time: "12:30–13:10", subject: "Informatika" },
      { time: "13:20–14:00", subject: "Tarix" },
      { time: "14:10–14:50", subject: "Jismoniy tarbiya" },
      { time: "15:00–15:40", subject: "San'at" }
    ]
  },

  "2-sinf": {
    Dushanba: [
      { time: "08:30–09:10", subject: "Ona tili va adabiyot" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Informatika" },
      { time: "11:00–11:40", subject: "Ingliz tili" },
      { time: "12:30–13:10", subject: "Tabiiy fan" },
      { time: "13:20–14:00", subject: "Jismoniy tarbiya" },
      { time: "14:10–14:50", subject: "Tarix" },
      { time: "15:00–15:40", subject: "San'at" }
    ],
    Seshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Ingliz tili" },
      { time: "10:10–10:50", subject: "Ona tili va adabiyot" },
      { time: "11:00–11:40", subject: "Tabiiy fan" },
      { time: "12:30–13:10", subject: "Informatika" },
      { time: "13:20–14:00", subject: "San'at" },
      { time: "14:10–14:50", subject: "Jismoniy tarbiya" },
      { time: "15:00–15:40", subject: "Tarix" }
    ],
    Chorshanba: [
      { time: "08:30–09:10", subject: "Ingliz tili" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Informatika" },
      { time: "11:00–11:40", subject: "Ona tili va adabiyot" },
      { time: "12:30–13:10", subject: "Tarix" },
      { time: "13:20–14:00", subject: "Tabiiy fan" },
      { time: "14:10–14:50", subject: "San'at" },
      { time: "15:00–15:40", subject: "Jismoniy tarbiya" }
    ],
    Payshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Ona tili va adabiyot" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Informatika" },
      { time: "12:30–13:10", subject: "Tabiiy fan" },
      { time: "13:20–14:00", subject: "Tarix" },
      { time: "14:10–14:50", subject: "Jismoniy tarbiya" },
      { time: "15:00–15:40", subject: "San'at" }
    ],
    Juma: [
      { time: "08:30–09:10", subject: "Informatika" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Ona tili va adabiyot" },
      { time: "11:00–11:40", subject: "Ingliz tili" },
      { time: "12:30–13:10", subject: "Tabiiy fan" },
      { time: "13:20–14:00", subject: "Tarix" },
      { time: "14:10–14:50", subject: "San'at" },
      { time: "15:00–15:40", subject: "Jismoniy tarbiya" }
    ]
  },

  "3-sinf": {
    Dushanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Ingliz tili" },
      { time: "10:10–10:50", subject: "Ona tili va adabiyot" },
      { time: "11:00–11:40", subject: "Informatika" },
      { time: "12:30–13:10", subject: "Tabiiy fan" },
      { time: "13:20–14:00", subject: "Tarix" },
      { time: "14:10–14:50", subject: "Jismoniy tarbiya" },
      { time: "15:00–15:40", subject: "San'at" }
    ],
    Seshanba: [
      { time: "08:30–09:10", subject: "Ingliz tili" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Informatika" },
      { time: "11:00–11:40", subject: "Ona tili va adabiyot" },
      { time: "12:30–13:10", subject: "Tarix" },
      { time: "13:20–14:00", subject: "Tabiiy fan" },
      { time: "14:10–14:50", subject: "San'at" },
      { time: "15:00–15:40", subject: "Jismoniy tarbiya" }
    ],
    Chorshanba: [
      { time: "08:30–09:10", subject: "Ona tili va adabiyot" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Tabiiy fan" },
      { time: "12:30–13:10", subject: "Informatika" },
      { time: "13:20–14:00", subject: "Tarix" },
      { time: "14:10–14:50", subject: "Jismoniy tarbiya" },
      { time: "15:00–15:40", subject: "San'at" }
    ],
    Payshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Informatika" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Ona tili va adabiyot" },
      { time: "12:30–13:10", subject: "Tabiiy fan" },
      { time: "13:20–14:00", subject: "Tarix" },
      { time: "14:10–14:50", subject: "San'at" },
      { time: "15:00–15:40", subject: "Jismoniy tarbiya" }
    ],
    Juma: [
      { time: "08:30–09:10", subject: "Informatika" },
      { time: "09:20–10:00", subject: "Ona tili va adabiyot" },
      { time: "10:10–10:50", subject: "Matematika" },
      { time: "11:00–11:40", subject: "Ingliz tili" },
      { time: "12:30–13:10", subject: "Tabiiy fan" },
      { time: "13:20–14:00", subject: "Tarix" },
      { time: "14:10–14:50", subject: "Jismoniy tarbiya" },
      { time: "15:00–15:40", subject: "San'at" }
    ]
  },

  "4-sinf": {
    Dushanba: [
      { time: "08:30–09:10", subject: "Ingliz tili" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Ona tili va adabiyot" },
      { time: "11:00–11:40", subject: "Informatika" },
      { time: "12:30–13:10", subject: "Tabiiy fan" },
      { time: "13:20–14:00", subject: "Tarix" },
      { time: "14:10–14:50", subject: "San'at" },
      { time: "15:00–15:40", subject: "Jismoniy tarbiya" }
    ],
    Seshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Ona tili va adabiyot" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Tabiiy fan" },
      { time: "12:30–13:10", subject: "Informatika" },
      { time: "13:20–14:00", subject: "Tarix" },
      { time: "14:10–14:50", subject: "Jismoniy tarbiya" },
      { time: "15:00–15:40", subject: "San'at" }
    ],
    Chorshanba: [
      { time: "08:30–09:10", subject: "Ona tili va adabiyot" },
      { time: "09:20–10:00", subject: "Ingliz tili" },
      { time: "10:10–10:50", subject: "Matematika" },
      { time: "11:00–11:40", subject: "Informatika" },
      { time: "12:30–13:10", subject: "Tabiiy fan" },
      { time: "13:20–14:00", subject: "Tarix" },
      { time: "14:10–14:50", subject: "San'at" },
      { time: "15:00–15:40", subject: "Jismoniy tarbiya" }
    ],
    Payshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Ingliz tili" },
      { time: "10:10–10:50", subject: "Ona tili va adabiyot" },
      { time: "11:00–11:40", subject: "Informatika" },
      { time: "12:30–13:10", subject: "Tabiiy fan" },
      { time: "13:20–14:00", subject: "Tarix" },
      { time: "14:10–14:50", subject: "Jismoniy tarbiya" },
      { time: "15:00–15:40", subject: "San'at" }
    ],
    Juma: [
      { time: "08:30–09:10", subject: "Informatika" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Ona tili va adabiyot" },
      { time: "12:30–13:10", subject: "Tabiiy fan" },
      { time: "13:20–14:00", subject: "Tarix" },
      { time: "14:10–14:50", subject: "San'at" },
      { time: "15:00–15:40", subject: "Jismoniy tarbiya" }
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
  const selectedClassTitleEl =
    document.getElementById("selectedClassTitle");
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

  // 1–11-sinflar
  const classes = Array.from(
    { length: 11 },
    (_, i) => `${i + 1}-sinf`
  );

  // Sinf tugmalarini chiqarish
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

  // Vaqtni HH:MM ko‘rinishiga o'tkazish
  function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return (
      String(hours).padStart(2, "0") +
      ":" +
      String(mins).padStart(2, "0")
    );
  }

  // Sinfga qarab dars vaqtlarini hisoblash
  function getLessonTimes(classNumber) {
    const times = [];
    let current = 8 * 60 + 30;

    for (let lesson = 1; lesson <= 8; lesson++) {
      const start = current;
      const end = current + 45;

      times.push({
        start,
        end
      });

      current = end;

      // 1–4-sinf
      if (classNumber <= 4) {
        if (lesson === 3 || lesson === 7) {
          current += 45;
        } else if (lesson < 8) {
          current += 5;
        }
      }

      // 5–11-sinf
      else {
        if (lesson === 4 || lesson === 8) {
          current += 45;
        } else if (lesson < 8) {
          current += 5;
        }
      }
    }

    return times;
  }

  // Tanlangan sinf jadvali
  function renderClassSchedule(className) {
    const classNumber = Number.parseInt(className, 10);

    const schedule =
      MySchoolData.schedule[className] || {};

    const days = Object.keys(schedule);

    selectedClassTitleEl.textContent =
      className.toUpperCase();

    dayTabsEl.innerHTML = days
      .map(
        (day, index) => `
          <button
            class="day-tab${index === 0 ? " is-active" : ""}"
            type="button"
            data-day="${day}"
          >
            ${day}
          </button>
        `
      )
      .join("");

    function renderDay(day) {
      const lessons = schedule[day] || [];
      const times = getLessonTimes(classNumber);

      if (!lessons.length) {
        scheduleListEl.innerHTML = `
          <p class="empty-state">
            Bu kunda dars yo‘q.
          </p>
        `;
        return;
      }

      let html = `
        <div class="schedule-table">

          <div class="schedule-table__head">
            <span>Fan</span>
            <span style="text-align:right;">Vaqt</span>
          </div>
      `;

      lessons.slice(0, 8).forEach((lesson, index) => {
        const time = times[index];

        html += `
          <div class="schedule-row">

            <span class="schedule-row__subject">
              ${lesson.subject}
            </span>

            <span class="schedule-row__time">
              ${formatTime(time.start)}–${formatTime(time.end)}
            </span>

          </div>
        `;

        // ABET
        if (
          (classNumber <= 4 && index === 2) ||
          (classNumber >= 5 && index === 3)
        ) {
          html += `
            <div class="schedule-break">

              <span class="schedule-break__name">
                🍽️ ABET
              </span>

              <span class="schedule-break__time">
                ${formatTime(time.end)}–${formatTime(time.e
