const { Telegraf } = require("telegraf");
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs, query, where } = require("firebase/firestore");
require("dotenv").config(); // подключение dotenv

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const BOT_TOKEN = process.env.BOT_TOKEN;
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
        web_app: { url: "https://miner-d9gz212.flutterflow.app/" }
      }]]
    }
  });
});

bot.launch().then(() => {
  console.log("Бот запущен");
});
