
require("dotenv").config();

async function testThreads() {
  const token = process.env.THREADS_ACCESS_TOKEN;

  if (!token) {
    console.log("لم يتم العثور على رمز الوصول في .env");
    return;
  }

  try {
    const url = new URL("https://graph.threads.net/v1.0/me");
    url.searchParams.set("fields", "id,username");
    url.searchParams.set("access_token", token);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.log("فشل الاتصال بـ Threads:");
      console.log(data.error?.message || "خطأ غير معروف");
      return;
    }

    console.log("تم الاتصال بنجاح!");
    console.log("اسم الحساب:", data.username);
    console.log("معرف الحساب:", data.id);
  } catch (error) {
    console.log("خطأ في الاتصال:", error.message);
  }
}

testThreads();
