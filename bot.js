const { Telegraf } = require("telegraf");
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where
} = require("firebase/firestore");
const {
  getRemoteConfig,
  fetchAndActivate,
  getValue
} = require("firebase/remote-config");
require("dotenv").config();

// 🔐 Firebase config из переменных окружения
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  appId: process.env.FIREBASE_APP_ID,               // 👈 ОБЯЗАТЕЛЕН
  messagingSenderId: process.env.FIREBASE_SENDER_ID // 👈 Желателен
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const remoteConfig = getRemoteConfig(firebaseApp);

// Настройки Remote Config
remoteConfig.settings = {
  minimumFetchIntervalMillis: 0 // Обновлять всегда (удобно на тестах)
};

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

// 📲 START команда Telegram-бота
bot.start(async (ctx) => {
  const referredUserId = ctx.from.id.toString();
  const refParam = ctx.startPayload;
  const referrerId = refParam?.replace("ref", "");

  // 🛡️ Защита от самореферала
  if (referrerId && referredUserId !== referrerId) {
    const q = query(
      collection(db, "referrals"),
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
      console.log(`✅ Реферал добавлен: ${referredUserId} ← ${referrerId}`);
    } else {
      console.log(`ℹ️ Повторный заход по рефералке: ${referredUserId}`);
    }
  }

  // 📡 Получение ссылки из Remote Config
  let gameUrl = "https://default-url.com"; // запасная ссылка
  try {
    await fetchAndActivate(remoteConfig);
    gameUrl = getValue(remoteConfig, "gameUrl").asString();
    console.log(`🌐 Ссылка из Remote Config: ${gameUrl}`);
  } catch (err) {
    console.error("❌ Ошибка при получении gameUrl из Remote Config:", err);
  }

  // 📎 Ответ с кнопкой
  await ctx.reply("🚀 Добро пожаловать в игру!", {
    reply_markup: {
      inline_keyboard: [[{
        text: "Открыть мини-приложение",
        web_app: { url: gameUrl }
      }]]
    }
  });
});

// 🚀 Запуск бота
bot.launch().then(() => {
  console.log("🤖 Бот запущен");
});
