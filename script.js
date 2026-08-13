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
    Dushanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Fizika" },
      { time: "10:10–10:50", subject: "Ingliz tili" },
      { time: "11:00–11:40", subject: "Informatika" },
      { time: "12:30–13:10", subject: "Kimyo" },
      { time: "13:20–14:00", subject: "Ona tili va adabiyot" },
      { time: "14:10–14:50", subject: "Jismoniy tarbiya" },
      { time: "15:00–15:40", subject: "Robototexnika" },
    ],
    Seshanba: [
      { time: "08:30–09:10", subject: "Fizika" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Biologiya" },
      { time: "11:00–11:40", subject: "Ingliz tili" },
      { time: "12:30–13:10", subject: "Informatika" },
      { time: "13:20–14:00", subject: "Tarix" },
      { time: "14:10–14:50", subject: "Chizmachilik" },
      { time: "15:00–15:40", subject: "Loyihachilik" },
    ],
    Chorshanba: [
      { time: "08:30–09:10", subject: "Kimyo" },
      { time: "09:20–10:00", subject: "Matematika" },
      { time: "10:10–10:50", subject: "Informatika" },
      { time: "11:00–11:40", subject: "Ingliz tili" },
      { time: "12:30–13:10", subject: "Fizika" },
      { time: "13:20–14:00", subject: "Geografiya" },
      { time: "14:10–14:50", subject: "Robototexnika" },
      { time: "15:00–15:40", subject: "Jismoniy tarbiya" },
    ],
    Payshanba: [
      { time: "08:30–09:10", subject: "Matematika" },
      { time: "09:20–10:00", subject: "Biologiya" },
      { time: "10:10–10:50", subject: "Kimyo" },
      { time: "11:00–11:40", subject: "Informatika" },
      { time: "12:30–13:10", subject: "Ona tili va adabiyot" },
      { time: "13:20–14:00", subject: "Ingliz tili" },
      { time: "14:10–14:50", subject: "San'at" },
      { time: "15:00–15:40", subject: "Chizmachilik" },
    ],
    Juma: [
      { time: "08:30–09:10", subject: "Informatika" },
      { time: "09:20–10:00", subject: "Fizika" },
      { time: "10:10–10:50", subject: "Matematika" },
      { time: "11:00–11:40", subject: "Robototexnika" },
      { time: "12:30–13:10", subject: "Ingliz tili" },
      { time: "13:20–14:00", subject: "Tarix" },
      { time: "14:10–14:50", subject: "Loyiha himoyasi" },
      { time: "15:00–15:40", subject: "Jismoniy tarbiya" },
    ],
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

    function renderDay(day) {
      const lessons = schedule[day] || [];

      if (lessons.length === 0) {
        scheduleListEl.innerHTML =
          '<p class="empty-state">Bu kunda dars yo‘q.</p>';
        return;
      }

      scheduleListEl.innerHTML = lessons
        .map(
          (lesson, i) => `
            <div class="schedule-row">
              <span class="schedule-row__index">${i + 1}</span>
              <span class="schedule-row__time">${lesson.time}</span>
              <span class="schedule-row__subject">${lesson.subject}</span>
            </div>
          `
        )
        .join("");
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
      listEl.innerHTML =
        `<p class="empty-state">Hech narsa topilmadi.</p>`;
      return;
    }

    listEl.innerHTML = filtered
      .map(
        (b, index) => `
          <button
            class="book-item"
            type="button"
            data-book-index="${MySchoolData.books.indexOf(b)}"
          >
            <span class="book-item__title">📖 ${b.title}</span>
            <span class="book-item__author">${b.author}</span>
          </button>
        `
      )
      .join("");

    // Kitob ustiga bosilganda
    listEl.querySelectorAll(".book-item").forEach((bookEl) => {
      bookEl.addEventListener("click", () => {
        const index = Number(bookEl.dataset.bookIndex);
        const book = MySchoolData.books[index];

        openBookModal(book);
      });
    });
  }

  // Kitob oynasi
  function openBookModal(book) {
    const oldModal = document.getElementById("bookModal");
    if (oldModal) oldModal.remove();

    const modal = document.createElement("div");
    modal.id = "bookModal";
    modal.className = "book-modal";

    modal.innerHTML = `
      <div class="book-modal__box">

        <button
          class="book-modal__close"
          type="button"
          aria-label="Yopish"
        >
          ×
        </button>

        <div class="book-modal__icon">📖</div>

        <h2>${book.title}</h2>

        <p class="book-modal__author">
          ✍️ ${book.author}
        </p>

        <p class="book-modal__description">
          Ushbu kitob haqida batafsil ma'lumot va
          elektron o'qish imkoniyati tez orada qo'shiladi.
        </p>

        <button
          class="book-modal__read"
          type="button"
        >
          📚 O‘qishni boshlash
        </button>

      </div>
    `;

    document.body.appendChild(modal);

    // Yopish
    modal
      .querySelector(".book-modal__close")
      .addEventListener("click", () => {
        modal.remove();
      });

    // O'qishni boshlash
    modal
      .querySelector(".book-modal__read")
      .addEventListener("click", () => {
        alert("📚 Bu kitob tez orada qo‘shiladi!");
      });

    // Tashqarisini bosganda yopish
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // Qidiruv
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
async function sendMessageToAI(userText) {
  try {
    const response = await fetch(
      "https://school-ai-bpp0.onrender.com/api/ai",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userText
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Server xatosi");
    }

    addBubble(data.answer, "bot");
  } catch (error) {
    console.error("AI error:", error);
    addBubble(
      "Uzr, AI bilan bog‘lanishda xatolik yuz berdi.",
      "bot"
    );
  }
}

  /* ----------------------------------------------------------
     Panel ochilganda tegishli event chiqarish (AI chatga kerak)
     ---------------------------------------------------------- */

  document.querySelectorAll("[data-panel]").forEach((btn) => {
    if (btn.classList.contains("panel")) return;
    btn.addEventListener("click", () => {
      document.dispatchEvent(
        new 
