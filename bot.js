const { Telegraf } = require("telegraf");
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs, query, where } = require("firebase/firestore");

// 🔐 Прямо указываем ключи (не рекомендуется для продакшена, но можно для MVP/теста)
const firebaseConfig = {
  apiKey: "AIzaSyA4Fd-KO1dmNjk-Qz2LTk3dwlO9cMpm6oc",
  authDomain: "miner-d9gz29.firebaseapp.com",
  projectId: "miner-d9gz29.firebaseapp.com",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// 🔧 Укажи свой токен бота
const BOT_TOKEN = "7954194940:AAGzPp4iu3DTwegfEgAuzWReT7dQ2sZJyfU";

const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx) => {
  const referredUserId = ctx.from.id.toString();
  const refParam = ctx.startPayload;
  const referrerId = refParam?.replace("ref", "");

  if (referrerId && referredUserId !== referrerId) {
    const q = query(
      collection(db, "referrals"), // или "refferals" если ты оставил с ошибкой
      where("referredUserId", "==", referredUserId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      await addDoc(collection(db, "referrals"), {
        referredUserId,
        referrerId,
        createdAt: new Date(),
        bonusGiven: false
      });
      console.log(`Запись о реферале добавлена: ${referredUserId} ← ${referrerId}`);
    } else {
      console.log(`Повторный заход по рефералке: ${referredUserId}`);
    }
  }

  await ctx.reply("🚀 Добро пожаловать в игру!", {
    reply_markup: {
      inline_keyboard: [[{
        text: "Открыть мини-приложение",
        web_app: { url: "https://miner-d9gz213.flutterflow.app/" }
      }]]
    }
  });
});

bot.launch().then(() => {
  console.log("Бот запущен");
});
