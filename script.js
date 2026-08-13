/* ==========================================================
   MySchool — KIRISH (welcome) screen
   Animatsiya ketma-ketligi:
     1) 🎓 fade-in
     2) "STEM SCHOOL" fade-in (pastdan)
     3) chiziq chapdan o‘ngga chiziladi
     4) pauza -> KIRISH tugmasi fade-in + scale
     5) KIRISH bosilganda asosiy menyuga o‘tishga tayyor (hozircha placeholder)
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const intro = document.getElementById("intro");
  const cap = document.getElementById("cap");
  const brand = document.getElementById("brand");
  const divider = document.getElementById("divider");
  const enterBtn = document.getElementById("enterBtn");
  const menu = document.getElementById("menu");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Har bir bosqich qancha kutib, keyin ko'rinadigan bo'lishini belgilaydi (ms)
  const timeline = [
    { el: cap, delay: 300 },
    { el: brand, delay: 900 },
    { el: divider, delay: 1500 },
    { el: enterBtn, delay: 2400 }, // chiziqdan keyin biroz pauza
  ];

  if (prefersReducedMotion) {
    // Harakatni kamaytirish yoqilgan bo'lsa — hammasini darhol ko'rsatamiz
    timeline.forEach(({ el }) => el.classList.add("is-visible"));
  } else {
    timeline.forEach(({ el, delay }) => {
      setTimeout(() => el.classList.add("is-visible"), delay);
    });
  }

  // KIRISH tugmasi bosilganda: welcome ekran yopiladi, asosiy menu ochiladi
  enterBtn.addEventListener("click", () => {
    enterBtn.disabled = true;

    document.dispatchEvent(new CustomEvent("myschool:kirish"));

    const fadeOutDuration = prefersReducedMotion ? 0 : 600;

    // 1) Welcome ekranni fade-out qilamiz
    intro.classList.add("is-leaving");

    // 2) Fade-out tugagach, welcome ekranni butunlay yashiramiz
    //    va asosiy menuni ko'rsatamiz (fade-in bilan)
    setTimeout(() => {
      intro.hidden = true;

      menu.hidden = false;
      // hidden atributi olib tashlangandan keyin reflow bo'lishi uchun
      // bir frame kutamiz, shunda CSS transition ishlaydi
      requestAnimationFrame(() => {
        menu.classList.add("is-visible");
      });

      document.dispatchEvent(new CustomEvent("myschool:menu-opened"));
    }, fadeOutDuration);
  });

  // Hozircha menu tugmalari faqat dizayn — funksiyalar keyinroq ulanadi
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
