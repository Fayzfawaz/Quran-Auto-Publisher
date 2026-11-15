
const fs = require("fs");
const path = require("path");

// عدد آيات كل سورة بالترتيب
const SURAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109,
  123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
  34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45,
  60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
  28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
  15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3,
  5, 4, 5, 6
];

const QURAN_FILE = path.join(__dirname, "data", "quran.txt");

function loadQuran() {
  if (!fs.existsSync(QURAN_FILE)) {
    throw new Error("لم يتم العثور على الملف data/quran.txt");
  }

  const content = fs.readFileSync(QURAN_FILE, "utf8");

  // تجاهل أسطر التعليقات الفارغة أو التي تبدأ بـ #
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith("#"));

  const verses = [];
  let expectedSurah = 1;
  let expectedAyah = 1;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    // تقسيم السطر إلى: رقم السورة | رقم الآية | النص
    const parts = line.split("|");

    if (parts.length < 3) {
      throw new Error(
        `صيغة السطر غير صحيحة عند السطر ${index + 1}: ${line}`
      );
    }

    const fileSurah = Number(parts[0]);
    const fileAyah = Number(parts[1]);
    const verseText = parts.slice(2).join("|").trim();

    if (!Number.isInteger(fileSurah) || !Number.isInteger(fileAyah)) {
      throw new Error(`أرقام غير صحيحة عند السطر ${index + 1}`);
    }

    if (!verseText) {
      throw new Error(`نص الآية فارغ عند السطر ${index + 1}`);
    }

    if (fileSurah !== expectedSurah || fileAyah !== expectedAyah) {
      throw new Error(
        `خطأ في الترتيب عند السطر ${index + 1}. ` +
        `المتوقع ${expectedSurah}|${expectedAyah} ` +
        `لكن الموجود ${fileSurah}|${fileAyah}`
      );
    }

    verses.push({
      id: verses.length + 1,
      surah: fileSurah,
      ayah: fileAyah,
      text: verseText
    });

    // الانتقال إلى الآية التالية
    expectedAyah++;

    // الانتقال إلى السورة التالية عند انتهاء آيات السورة
    if (expectedAyah > SURAH_COUNTS[expectedSurah - 1]) {
      expectedSurah++;
      expectedAyah = 1;
    }
  }

  if (verses.length !== 6236) {
    throw new Error(
      `عدد الآيات غير صحيح: ${verses.length}. المتوقع 6236`
    );
  }

  if (expectedSurah !== 115 || expectedAyah !== 1) {
    throw new Error("لم يكتمل ترتيب السور والآيات بشكل صحيح");
  }

  return verses;
}

// أسماء السور
const SURAH_NAMES = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة",
  "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر",
  "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان",
  "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر",
  "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية",
  "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن",
  "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق",
  "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة",
  "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج",
  "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين",
  "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل",
  "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس"
];


const BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";

function getDisplayText(verse) {
  // الفاتحة: البسملة آية رقم 1، فلا نحذفها
  // التوبة: لا توجد بسملة في بدايتها
  if (verse.ayah === 1 && verse.surah !== 1 && verse.surah !== 9) {
    if (verse.text.startsWith(BASMALA)) {
      return verse.text.slice(BASMALA.length).trim();
    }
  }


function formatTweet(verse) {
  const surahName = SURAH_NAMES[verse.surah - 1];
  const text = getDisplayText(verse);

  const lines = [];

  // إضافة البسملة بشكل منفصل في بداية السور
  if (verse.ayah === 1 && verse.surah !== 1 && verse.surah !== 9) {
    lines.push(BASMALA);
  }

  lines.push(text);
  lines.push("");
  lines.push(`— سورة ${surahName} | الآية ${verse.ayah}`);

  return lines.join("\n");
}

  return verse.text;
}

function formatTweet(verse) {
  const surahName = SURAH_NAMES[verse.surah - 1];
  const text = getDisplayText(verse);

  const lines = [];

  if (verse.ayah === 1 && verse.surah !== 1 && verse.surah !== 9) {
    lines.push(BASMALA);
  }

  lines.push(text);
  lines.push("");
  lines.push(`— سورة ${surahName} | الآية ${verse.ayah}`);

  return lines.join("\n");
}

module.exports = {
  loadQuran,
  SURAH_COUNTS,
  SURAH_NAMES,
  getDisplayText,
  formatTweet
};