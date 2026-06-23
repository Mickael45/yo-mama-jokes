const { Telegraf } = require("telegraf");
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
  return `🎲 Category: ${category.toUpperCase()}\n\n${lines || "(no novel jokes this round)"}\n\nTap 👍 to keep, 🔁 for more, 🎯 to steer, ✅ when done.`;
}

function renderGenerating(category, soFar) {
  const progress = soFar ? ` (${soFar} so far)` : "";
  return `🎲 Category: ${category.toUpperCase()}\n\n⏳ Generating on CPU — this is slow${progress}. Jokes appear here as they're ready…`;
}

function runTelegramSession({
  botToken, chatId, category, existingJokes,
  chat, embed, model, batchSize = 5, threshold = 0.84,
  idleTimeoutMin = 120, Bot = Telegraf,
}) {
  return new Promise((resolve) => {
    const bot = new Bot(botToken);
    const tg = bot.telegram;
    let jokes = [];
    const kept = new Set();
    let awaitingSteer = false;
    let messageId = null;
    let timer = null;
    let done = false;

    const finish = async (result) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { bot.stop(); } catch (_) {}
      resolve(result);
    };

    const armTimeout = () => {
      clearTimeout(timer);
      timer = setTimeout(() => finish([]), idleTimeoutMin * 60 * 1000);
    };

    const sendBatch = async (steer = "") => {
      jokes = [];
      kept.clear();
      // Send a placeholder immediately so the phone isn't dead-silent for the
      // ~25-30 min a CPU batch takes; we edit it in place as jokes arrive.
      const msg = await tg.sendMessage(chatId, renderGenerating(category, 0), keyboardFor(jokes, kept));
      messageId = msg.message_id;
      armTimeout();
      await generateBatch({
        chat, embed, model, category, existingJokes, count: batchSize, threshold, steer,
        onNovel: async (novel) => {
          jokes.push(...novel);
          armTimeout();
          try {
            await tg.editMessageText(chatId, messageId, undefined, renderBatch(category, jokes), keyboardFor(jokes, kept));
          } catch (_) { /* a transient edit failure must not abort generation */ }
        },
      });
      // Nothing survived dedup: turn the placeholder into the empty-batch notice.
      if (jokes.length === 0) {
        try {
          await tg.editMessageText(chatId, messageId, undefined, renderBatch(category, jokes), keyboardFor(jokes, kept));
        } catch (_) {}
      }
    };

    bot.on("callback_query", async (ctx) => {
      const q = ctx.callbackQuery;
      if (String(q.message.chat.id) !== String(chatId)) return;
      armTimeout();
      const data = q.data;
      try {
        if (data === "regen") {
          await ctx.answerCbQuery("Regenerating…");
          await sendBatch();
        } else if (data === "steer") {
          awaitingSteer = true;
          await ctx.answerCbQuery("Send your steer text");
          await tg.sendMessage(chatId, "✍️ Reply with how to steer the next batch (e.g. 'make them about traffic').");
        } else if (data.startsWith("keep:")) {
          const i = parseInt(data.split(":")[1], 10);
          if (kept.has(i)) kept.delete(i); else kept.add(i);
          await ctx.answerCbQuery(kept.has(i) ? "Kept" : "Removed");
          await tg.editMessageReplyMarkup(chatId, messageId, undefined, keyboardFor(jokes, kept).reply_markup);
        } else if (data === "done") {
          await ctx.answerCbQuery("Saving keepers");
          const approved = [...kept].sort((a, b) => a - b).map((i) => jokes[i]);
          await tg.sendMessage(chatId, approved.length
            ? `✅ Saving ${approved.length} joke(s) and pushing.`
            : "Nothing kept — nothing committed.");
          await finish(approved);
        }
      } catch (err) {
        await tg.sendMessage(chatId, `⚠️ ${err.message}`);
      }
    });

    bot.on("message", async (ctx) => {
      const m = ctx.message;
      if (String(m.chat.id) !== String(chatId)) return;
      if (awaitingSteer && m.text && !m.text.startsWith("/")) {
        awaitingSteer = false;
        armTimeout();
        await tg.sendMessage(chatId, `🎯 Steering: "${m.text}"`);
        await sendBatch(m.text);
      }
    });

    bot.catch((err) => { console.error(`[factory] telegraf error: ${err.message}`); });

    // launch() resolves only when the bot stops, so don't await it; start
    // long-polling, then push the first batch.
    bot.launch({ dropPendingUpdates: true });
    sendBatch().catch((err) => {
      tg.sendMessage(chatId, `⚠️ Generation failed: ${err.message}`).catch(() => {}).finally(() => finish([]));
    });
  });
}

module.exports = { runTelegramSession, keyboardFor, renderBatch, renderGenerating };
