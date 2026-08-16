const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ================================
// 🏠 TEST
// ================================

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "MySchool AI backend ishlayapti!",
  });
});

// ================================
// 🤖 MY SCHOOL AI API
// ================================

app.post("/api/ai", async (req, res) => {
  console.log("AI REQUEST KELDI:", req.body);

  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "message kerak",
      });
    }

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: message,
    });

    res.json({
      success: true,
      answer: response.output_text,
    });
  } catch (error) {
    console.error("AI error:", error);

    res.status(500).json({
      success: false,
      error: "AI bilan bog‘lanishda xatolik",
    });
  }
});

// ================================
// 📱 TELEGRAM BOT
// ================================

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function telegram(method, data = {}) {
  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  return response.json();
}

async function sendTelegramMessage(chatId, text) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text: text,
  });
}

let telegramOffset = 0;

async function checkTelegram() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log("⚠️ TELEGRAM_BOT_TOKEN topilmadi.");
    return;
  }

  try {
    const result = await telegram("getUpdates", {
      offset: telegramOffset,
      timeout: 20,
    });

    if (!result.ok) {
      console.error("Telegram error:", result);
      return;
    }

    for (const update of result.result) {
      telegramOffset = update.update_id + 1;

      if (!update.message) continue;

      const chatId = update.message.chat.id;
      const message = update.message.text;

      if (!message) continue;

      console.log("TELEGRAM:", message);

      // /start
      if (message === "/start") {
        await sendTelegramMessage(
          chatId,
          "🎓 Assalomu alaykum!\n\n" +
            "MySchool AI botiga xush kelibsiz! 🤖\n\n" +
            "Menga savolingizni yozing — AI yordam beradi."
        );

        continue;
      }

      // AI
      try {
        await sendTelegramMessage(chatId, "⏳ Javob tayyorlanmoqda...");

        const response = await client.responses.create({
          model: "gpt-5-mini",
          input: message,
        });

        const answer = response.output_text;

        await sendTelegramMessage(chatId, answer);
      } catch (error) {
        console.error("Telegram AI error:", error);

        await sendTelegramMessage(
          chatId,
          "❌ Hozircha AI bilan bog‘lanishda xatolik yuz berdi."
        );
      }
    }
  } catch (error) {
    console.error("Telegram polling error:", error);
  }
}

// ================================
// 🚀 SERVER
// ================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`MySchool AI backend ${PORT}-portda ishlayapti`);

  if (TELEGRAM_BOT_TOKEN) {
    console.log("🤖 Telegram bot ishga tushdi!");
    checkTelegram();

    setInterval(checkTelegram, 1000);
  } else {
    console.log("⚠️ TELEGRAM_BOT_TOKEN mavjud emas.");
  }
});
