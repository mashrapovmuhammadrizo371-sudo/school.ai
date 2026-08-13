/* ==========================================================
   MySchool AI backend
   Node.js + Express

   MUHIM: bu — MySchool platformasining "AI YORDAMCHI" bo'limi
   uchun MUSTAQIL, ALOHIDA backend. Eski student.uz backendiga
   yoki MySchool frontend fayllariga (index.html/style.css/
   script.js) hech qanday aloqasi yo'q va ular o'zgartirilmagan.

   Vazifasi:
     - Frontenddan POST /api/ai orqali { message } qabul qiladi
     - AI API'ga (kalit .env'da, hech qachon frontendda emas)
       so'rov yuboradi
     - Javobni { reply: "..." } ko'rinishida JSON qilib qaytaradi
   ========================================================== */

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || "claude-3-5-haiku-20241022";
const AI_API_URL = "https://api.anthropic.com/v1/messages";

if (!AI_API_KEY) {
  console.warn(
    "OGOHLANTIRISH: AI_API_KEY .env faylida topilmadi. " +
      "/api/ai so'rovlari xato qaytaradi. .env.example faylini ko'ring."
  );
}

/* ---------- Sog'lik tekshiruvi (Render uchun ham foydali) ---------- */

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "MySchool AI backend" });
});

/* ---------- Asosiy endpoint: POST /api/ai ---------- */

app.post("/api/ai", async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "'message' maydoni majburiy va bo'sh bo'lmasligi kerak.",
      });
    }

    if (!AI_API_KEY) {
      return res.status(500).json({
        error:
          "Server tomonda AI_API_KEY sozlanmagan. .env faylini tekshiring.",
      });
    }

    const aiResponse = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": AI_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 512,
        system:
          "Siz MySchool platformasidagi STEM SCHOOL o'quvchilariga yordam beruvchi do'stona AI yordamchisiz. Javoblaringiz aniq, qisqa va o'zbek tilida bo'lsin.",
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API xatosi:", aiResponse.status, errText);
      return res.status(502).json({
        error: "AI xizmatidan javob olishda xatolik yuz berdi.",
      });
    }

    const data = await aiResponse.json();
    const reply =
      data?.content?.[0]?.text?.trim() || "Kechirasiz, javob topilmadi.";

    return res.json({ reply });
  } catch (err) {
    console.error("Server xatosi:", err);
    return res.status(500).json({ error: "Server xatosi yuz berdi." });
  }
});

/* ---------- Noma'lum route'lar uchun ---------- */

app.use((req, res) => {
  res.status(404).json({ error: "Bunday endpoint topilmadi." });
});

app.listen(PORT, () => {
  console.log(`MySchool AI backend ${PORT}-portda ishga tushdi`);
});
