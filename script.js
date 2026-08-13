/* ==========================================================
   MySchool — KIRISH (welcome) screen + Asosiy MENU
   Animatsiya ketma-ketligi:
     1) 🎓 fade-in
     2) "STEM SCHOOL" fade-in (pastdan)
     3) chiziq chapdan o‘ngga chiziladi
     4) pauza -> KIRISH tugmasi fade-in + scale
     5) KIRISH bosilganda: intro yashiriladi, MENU ko'rsatiladi
   Eslatma: ekranlar almashinuvi FAQAT CSS klasslar orqali
   ("is-leaving" / "is-visible") boshqariladi — "hidden"
   atributiga yoki display:none/flex almashtirishga
   tayanilmaydi, shu sabab timing/specificity muammosi
   bo'lmaydi.
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("intro");
  const cap = document.getElementById("cap");
  const brand = document.getElementById("brand");
  const divider = document.getElementById("divider");
  const enterBtn = document.getElementById("enterBtn");
  const menu = document.getElementById("menu");

  // Himoya: kerakli elementlardan biri topilmasa, aniq xato chiqaramiz
  // va qolgan kodni ishga tushirmaymiz (jim xatolarning oldini olish uchun).
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

  /* ---------- 1-4. KIRISH ekrani animatsiyasi ---------- */

  const timeline = [
    { el: cap, delay: 300 },
    { el: brand, delay: 900 },
    { el: divider, delay: 1500 },
    { el: enterBtn, delay: 2400 }, // chiziqdan keyin biroz pauza
  ];

  if (prefersReducedMotion) {
    timeline.forEach(({ el }) => el.classList.add("is-visible"));
  } else {
    timeline.forEach(({ el, delay }) => {
      setTimeout(() => el.classList.add("is-visible"), delay);
    });
  }

  /* ---------- 5. KIRISH -> MENU o'tishi ---------- */

  enterBtn.addEventListener("click", () => {
    if (enterBtn.disabled) return; // qayta bosilishning oldini olish
    enterBtn.disabled = true;

    document.dispatchEvent(new CustomEvent("myschool:kirish"));

    // Welcome ekranni fade-out qilamiz
    intro.classList.add("is-leaving");

    // Menuni deyarli bir vaqtda fade-in qilamiz — ikkalasi ham
    // "position: fixed" bo'lgani uchun bir-birining ustiga
    // to'g'ri va uzluksiz o'tadi (hidden atributi kerak emas).
    requestAnimationFrame(() => {
      menu.classList.add("is-visible");
    });

    document.dispatchEvent(new CustomEvent("myschool:menu-opened"));
  });

  /* ---------- Menu tugmalari (hozircha faqat dizayn) ---------- */

  const menuButtons = document.querySelectorAll(".menu-btn, .ai-btn");
  menuButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const label = btn.querySelector(
        ".menu-btn__label, .ai-btn__label"
      )?.textContent;
      console.log(`"${label}" bosildi — bo'lim hali ulanmagan.`);
    });
  });
});
