
require("dotenv").config();

const fs = require("fs");
const path = require("path");

const { loadQuran, formatTweet } = require("./quran");

const INTERVAL_MINUTES = 5;
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

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

const TOKEN = process.env.THREADS_ACCESS_TOKEN;

let isPublishing = false;
let timer = null;

function loadProgress() {
  if (!fs.existsSync(PROGRESS_FILE)) {
    return { nextIndex: 1 };
  }

  const data = JSON.parse(
    fs.readFileSync(PROGRESS_FILE, "utf8")
  );

  if (
    !Number.isInteger(data.nextIndex) ||
    data.nextIndex < 0
  ) {
    throw new Error("ملف تقدم Threads غير صالح");
  }

  return data;
}

function saveProgress(progress) {
  fs.writeFileSync(
    PROGRESS_FILE,
    JSON.stringify(progress, null, 2),
    "utf8"
  );
}

function saveHistory(verse, tweet, postId) {
  let history = [];

  if (fs.existsSync(HISTORY_FILE)) {
    history = JSON.parse(
      fs.readFileSync(HISTORY_FILE, "utf8")
    );
  }

  history.unshift({
    id: verse.id,
    surah: verse.surah,
    ayah: verse.ayah,
    tweet,
    platform: "Threads",
    postId,
    time: new Date().toISOString()
  });

  history = history.slice(0, 100);

  fs.writeFileSync(
    HISTORY_FILE,
    JSON.stringify(history, null, 2),
    "utf8"
  );
}

async function apiRequest(url, params) {
  const response = await fetch(url, {
    method: "POST",
    body: params
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message || "فشل طلب Threads"
    );
  }

  return data;
}

async function publishNextVerse() {
  if (isPublishing) {
    console.log("هناك عملية نشر قيد التنفيذ.");
    return;
  }

  isPublishing = true;

  try {
    const verses = loadQuran();
    const progress = loadProgress();

    const index = progress.nextIndex % verses.length;
    const verse = verses[index];
    const tweet = formatTweet(verse);

    console.log("\n================================");
    console.log("نشر آية جديدة على Threads");
    console.log("================================");
    console.log("رقم الآية:", verse.id);
    console.log("\n", tweet);

    // الخطوة الأولى: إنشاء حاوية المنشور
    const container = await apiRequest(
      "https://graph.threads.net/v1.0/me/threads",
      new URLSearchParams({
        media_type: "TEXT",
        text: tweet,
        access_token: TOKEN
      })
    );

    if (!container.id) {
      throw new Error("لم يتم إنشاء حاوية المنشور");
    }

    // الخطوة الثانية: نشر المنشور
    const published = await apiRequest(
      "https://graph.threads.net/v1.0/me/threads_publish",
      new URLSearchParams({
        creation_id: container.id,
        access_token: TOKEN
      })
    );

    if (!published.id) {
      throw new Error("لم يتم تأكيد نشر المنشور");
    }

    // نحفظ التقدم بعد نجاح النشر فقط
    progress.nextIndex = (index + 1) % verses.length;
    saveProgress(progress);

    saveHistory(verse, tweet, published.id);

    console.log("\nتم نشر الآية بنجاح!");
    console.log("معرف المنشور:", published.id);
    console.log("الآية التالية:", progress.nextIndex + 1);

  } catch (error) {
    console.error("\nفشل النشر:");
    console.error(error.message);
    console.log("سيبقى التقدم محفوظًا للمحاولة القادمة.");
  } finally {
    isPublishing = false;
  }
}

async function start() {
  if (!TOKEN) {
    console.error("لم يتم العثور على THREADS_ACCESS_TOKEN في .env");
    process.exit(1);
  }

  const verses = loadQuran();

  console.log("بدأ ناشر القرآن على Threads");
  console.log("عدد الآيات:", verses.length);
  console.log("الفاصل الزمني:", INTERVAL_MINUTES, "دقائق");

  // نشر أول آية مباشرة
  await publishNextVerse();

  // ثم النشر كل خمس دقائق
  timer = setInterval(() => {
    publishNextVerse();
  }, INTERVAL_MS);
}

process.on("SIGINT", () => {
  if (timer) {
    clearInterval(timer);
  }

  console.log("\nتم إيقاف ناشر Threads.");
  process.exit(0);
});

start().catch(error => {
  console.error("تعذر تشغيل الناشر:", error.message);
  process.exit(1);
});
