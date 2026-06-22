const DefaultBotApi = require("node-telegram-bot-api");
const { generateBatch } = require("./lib/session");

function keyboardFor(jokes, kept) {
  const rows = jokes.map((j, i) => [{
    text: `${kept.has(i) ? "✅" : "👍"} ${i + 1}`,
    callback_data: `keep:${i}`,
  }]);
  rows.push([
    { text: "🔁 5 more", callback_data: "regen" },
    { text: "🎯 steer", callback_data: "steer" },
  ]);
  rows.push([{ text: "✅ Done", callback_data: "done" }]);
  return { reply_markup: { inline_keyboard: rows } };
}

function renderBatch(category, jokes) {
  const lines = jokes.map((j, i) => `${i + 1}. ${j}`).join("\n");
  return `🎲 Category: *${category}*\n\n${lines || "(no novel jokes this round)"}\n\nTap 👍 to keep, 🔁 for more, 🎯 to steer, ✅ when done.`;
}

function runTelegramSession({
  botToken, chatId, category, existingJokes,
  chat, embed, model, batchSize = 5, threshold = 0.84,
  idleTimeoutMin = 120, BotApi = DefaultBotApi,
}) {
  return new Promise((resolve) => {
    const bot = new BotApi(botToken, { polling: true });
    let jokes = [];
    const kept = new Set();
    let awaitingSteer = false;
    let messageId = null;
    let timer = null;

    const finish = async (result) => {
      clearTimeout(timer);
      try { await bot.stopPolling(); } catch (_) {}
      resolve(result);
    };

    const armTimeout = () => {
      clearTimeout(timer);
      timer = setTimeout(() => finish([]), idleTimeoutMin * 60 * 1000);
    };

    const sendBatch = async (steer = "") => {
      jokes = await generateBatch({
        chat, embed, model, category, existingJokes, count: batchSize, threshold, steer,
      });
      kept.clear();
      const opts = keyboardFor(jokes, kept);
      const msg = await bot.sendMessage(chatId, renderBatch(category, jokes), { parse_mode: "Markdown", ...opts });
      messageId = msg.message_id;
      armTimeout();
    };

    bot.on("callback_query", async (q) => {
      if (String(q.message.chat.id) !== String(chatId)) return;
      armTimeout();
      const data = q.data;
      try {
        if (data === "regen") {
          await bot.answerCallbackQuery(q.id, { text: "Regenerating…" });
          await sendBatch();
        } else if (data === "steer") {
          awaitingSteer = true;
          await bot.answerCallbackQuery(q.id, { text: "Send your steer text" });
          await bot.sendMessage(chatId, "✍️ Reply with how to steer the next batch (e.g. 'make them about traffic').");
        } else if (data.startsWith("keep:")) {
          const i = parseInt(data.split(":")[1], 10);
          if (kept.has(i)) kept.delete(i); else kept.add(i);
          await bot.answerCallbackQuery(q.id, { text: kept.has(i) ? "Kept" : "Removed" });
          await bot.editMessageReplyMarkup(keyboardFor(jokes, kept).reply_markup, {
            chat_id: chatId, message_id: messageId,
          });
        } else if (data === "done") {
          await bot.answerCallbackQuery(q.id, { text: "Saving keepers" });
          const approved = [...kept].sort((a, b) => a - b).map((i) => jokes[i]);
          await bot.sendMessage(chatId, approved.length
            ? `✅ Saving ${approved.length} joke(s) and pushing.`
            : "Nothing kept — nothing committed.");
          await finish(approved);
        }
      } catch (err) {
        await bot.sendMessage(chatId, `⚠️ ${err.message}`);
      }
    });

    bot.on("message", async (m) => {
      if (String(m.chat.id) !== String(chatId)) return;
      if (awaitingSteer && m.text && !m.text.startsWith("/")) {
        awaitingSteer = false;
        armTimeout();
        await bot.sendMessage(chatId, `🎯 Steering: "${m.text}"`);
        await sendBatch(m.text);
      }
    });

    sendBatch().catch((err) => {
      bot.sendMessage(chatId, `⚠️ Generation failed: ${err.message}`).finally(() => finish([]));
    });
  });
}

module.exports = { runTelegramSession, keyboardFor, renderBatch };
