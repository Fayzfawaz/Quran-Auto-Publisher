
const express = require("express");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const { loadQuran, formatTweet } = require("./quran");

const app = express();
const PORT = 3000;

const PROGRESS_FILE = path.join(
  __dirname,
  "data",
  "threads-progress.json"
);

const HISTORY_FILE = path.join(
  __dirname,
  "data",
  "history.json"
);

let botProcess = null;
let botStartedAt = null;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// قراءة التقدم
function getProgress() {
  if (!fs.existsSync(PROGRESS_FILE)) {
    return { nextIndex: 0 };
  }

  return JSON.parse(
    fs.readFileSync(PROGRESS_FILE, "utf8")
  );
}

// قراءة سجل الآيات
function getHistory() {
  if (!fs.existsSync(HISTORY_FILE)) {
    return [];
  }

  return JSON.parse(
    fs.readFileSync(HISTORY_FILE, "utf8")
  );
}

// حالة البوت والآية القادمة
app.get("/api/status", (req, res) => {
  try {
    const verses = loadQuran();
    const progress = getProgress();

    const nextIndex = progress.nextIndex % verses.length;
    const lastIndex =
      (nextIndex - 1 + verses.length) % verses.length;

    const nextVerse = verses[nextIndex];

    const lastVerse = progress.nextIndex === 0
      ? null
      : verses[lastIndex];

    res.json({
      running: botProcess !== null,
      total: verses.length,
      nextIndex,
      completed: progress.nextIndex,
      nextVerse: {
        ...nextVerse,
        tweet: formatTweet(nextVerse)
      },
      lastVerse: lastVerse
        ? {
            ...lastVerse,
            tweet: formatTweet(lastVerse)
          }
        : null,
      intervalMinutes: 5,
      startedAt: botStartedAt
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// سجل آخر 100 آية
app.get("/api/history", (req, res) => {
  try {
    res.json(getHistory());
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// تشغيل البوت
app.post("/api/start", (req, res) => {
  if (botProcess) {
    return res.status(400).json({
      error: "البوت يعمل بالفعل"
    });
  }

  botProcess = spawn(
    process.execPath,
    ["scheduler.js"],
    {
      cwd: __dirname,
      stdio: "inherit"
    }
  );

  botStartedAt = new Date().toISOString();

  botProcess.on("error", (error) => {
    console.error("خطأ في تشغيل البوت:", error);

    botProcess = null;
    botStartedAt = null;
  });

  botProcess.on("exit", () => {
    botProcess = null;
    botStartedAt = null;
  });

  res.json({
    success: true,
    message: "تم تشغيل البوت"
  });
});

// إيقاف البوت
app.post("/api/stop", (req, res) => {
  if (!botProcess) {
    return res.status(400).json({
      error: "البوت متوقف بالفعل"
    });
  }

  botProcess.kill();

  res.json({
    success: true,
    message: "تم طلب إيقاف البوت"
  });
});

// إعادة التقدم إلى البداية
app.post("/api/reset", (req, res) => {
  if (botProcess) {
    return res.status(400).json({
      error: "أوقف البوت أولاً قبل إعادة التقدم"
    });
  }

  fs.writeFileSync(
    PROGRESS_FILE,
    JSON.stringify({ nextIndex: 0 }, null, 2),
    "utf8"
  );

  res.json({
    success: true,
    message: "تمت إعادة التقدم إلى أول آية"
  });
});

// تشغيل الخادم
app.listen(PORT, () => {
  console.log("--------------------------------");
  console.log("لوحة تحكم القرآن تعمل الآن");
  console.log(`http://localhost:${PORT}`);
  console.log("--------------------------------");
});
"dry-run-progress.json"