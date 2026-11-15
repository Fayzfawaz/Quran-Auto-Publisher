
require("dotenv").config();

const { loadQuran, formatTweet } = require("./quran");
const readline = require("readline/promises");

async function main() {
  const token = process.env.THREADS_ACCESS_TOKEN;

  if (!token) {
    console.log("رمز الوصول غير موجود.");
    return;
  }

  const verses = loadQuran();
  const text = formatTweet(verses[0]);

  console.log("\nالمنشور الذي سيُنشر:\n");
  console.log(text);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await rl.question(
    "\nهل تريد نشر هذه الآية على Threads؟ اكتب نعم للتأكيد: "
  );

  rl.close();

  if (answer.trim() !== "نعم") {
    console.log("تم إلغاء النشر.");
    return;
  }

  const createUrl =
    "https://graph.threads.net/v1.0/me/threads";

  const createParams = new URLSearchParams({
    media_type: "TEXT",
    text,
    access_token: token
  });

  const createResponse = await fetch(createUrl, {
    method: "POST",
    body: createParams
  });

  const container = await createResponse.json();

  if (!createResponse.ok) {
    console.log("فشل إنشاء المنشور:", container.error?.message);
    return;
  }

  const publishUrl =
    "https://graph.threads.net/v1.0/me/threads_publish";

  const publishParams = new URLSearchParams({
    creation_id: container.id,
    access_token: token
  });

  const publishResponse = await fetch(publishUrl, {
    method: "POST",
    body: publishParams
  });

  const result = await publishResponse.json();

  if (!publishResponse.ok) {
    console.log("فشل النشر:", result.error?.message);
    return;
  }

  console.log("تم نشر الآية بنجاح!");
  console.log("معرف المنشور:", result.id);
}

main().catch(error => {
  console.log("حدث خطأ:", error.message);
});
