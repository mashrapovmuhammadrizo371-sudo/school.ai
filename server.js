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

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "MySchool AI backend ishlayapti!",
  });
});

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`MySchool AI backend ${PORT}-portda ishlayapti`);
});
