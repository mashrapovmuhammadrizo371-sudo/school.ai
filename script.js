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
  const cap = document.getElementById("cap");
  const brand = document.getElementById("brand");
  const divider = document.getElementById("divider");
  const enterBtn = document.getElementById("enterBtn");

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

  // KIRISH tugmasi bosilganda
  enterBtn.addEventListener("click", () => {
    // Bosilgan holatni bildiruvchi kichik feedback
    enterBtn.disabled = true;

    // Kelajakda asosiy menyuga o'tish shu joyda amalga oshiriladi.
    // Hozircha faqat hodisa (event) chiqaramiz, shu orqali keyingi
    // bosqichda navigatsiya osongina ulanadi.
    document.dispatchEvent(new CustomEvent("myschool:kirish"));

    console.log("KIRISH bosildi — asosiy menyuga o'tish shu yerda ishlanadi.");
  });
});
