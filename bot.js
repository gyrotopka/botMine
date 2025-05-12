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
require("dotenv").config();

// 🔐 Firebase config из переменных окружения
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  appId: process.env.FIREBASE_APP_ID,
  messagingSenderId: process.env.FIREBASE_SENDER_ID
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const BOT_TOKEN = process.env.BOT_TOKEN;
const bot = new Telegraf(BOT_TOKEN);

// 🌍 Функция перевода приветствия
function getLocalizedWelcome(lang) {
  const messages = {
    ru: '🚀 Добро пожаловать в игру!',
    en: '🚀 Welcome to the game!',
    es: '🚀 ¡Bienvenido al juego!',
    fr: '🚀 Bienvenue dans le jeu !',
    de: '🚀 Willkommen im Spiel!',
  };
  return messages[lang] || messages.en;
}

// 🌍 Функция перевода кнопки "Начать"
function getLocalizedStartButton(lang) {
  const labels = {
    ru: 'Начать',
    en: 'Start',
    es: 'Empezar',
    fr: 'Commencer',
    de: 'Starten',
  };
  return labels[lang] || labels.en;
}

// 📲 START команда Telegram-бота
bot.start(async (ctx) => {
  const referredUserId = ctx.from.id.toString();
  const languageCode = ctx.from.language_code || 'en';
  const welcomeMessage = getLocalizedWelcome(languageCode);
  const startButtonText = getLocalizedStartButton(languageCode);

  const refParam = ctx.startPayload;
  const referrerId = refParam?.replace("ref", "");

  // 🛡️ Защита от самореферала
  if (referrerId && referredUserId !== referrerId) {
    const q = query(
      collection(db, "refferals"),
      where("referredUserId", "==", referredUserId)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      // 1. Найдём пригласившего по tgId
      const userQuery = query(
        collection(db, "users"),
        where("tgId", "==", referrerId)
      );
      const userSnap = await getDocs(userQuery);

      if (userSnap.empty) {
        console.warn(⚠️ Пригласивший пользователь с tgId=${referrerId} не найден);
      } else {
        const referrerUserDoc = userSnap.docs[0];
        const referrerUserData = referrerUserDoc.data();

        const refferedPercent = referrerUserData.refferedPercent ?? 5;

        await addDoc(collection(db, "refferals"), {
          referredUserId,
          referrerId,
          refferedPercent,
          createdAt: new Date(),
          bonusGiven: false
        });

        console.log(✅ Реферал добавлен: ${referredUserId} ← ${referrerId}, %=${refferedPercent});
      }
    } else {
      console.log(ℹ️ Повторный заход по рефералке: ${referredUserId});
    }
  }

  // 📎 Ответ с кнопкой
  const gameUrl = "https://miner-d9gz232.flutterflow.app";
  await ctx.reply(welcomeMessage, {
    reply_markup: {
      inline_keyboard: [[{
        text: startButtonText,
        web_app: { url: gameUrl }
      }]]
    }
  });
});

// 🚀 Запуск бота
bot.launch().then(() => {
  console.log("🤖 Бот запущен");
});
