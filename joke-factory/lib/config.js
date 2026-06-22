const path = require("path");

function loadConfig(env = process.env) {
  const botToken = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID;
  if (!botToken) throw new Error("Missing TELEGRAM_BOT_TOKEN");
  if (!chatId) throw new Error("Missing TELEGRAM_CHAT_ID");

  return {
    botToken,
    chatId: String(chatId),
    jokesDir: env.JOKES_DIR || path.join(__dirname, "..", "..", "jokes"),
    wakeTime: env.WAKE_TIME || "20:00",
    idleTimeoutMin: parseInt(env.IDLE_TIMEOUT_MINUTES || "120", 10),
    batchSize: parseInt(env.BATCH_SIZE || "5", 10),
    threshold: parseFloat(env.SIMILARITY_THRESHOLD || "0.84"),
    ollamaHost: env.OLLAMA_HOST || "http://127.0.0.1:11434",
    model: env.OLLAMA_MODEL || "gemma4:26b-a4b",
    embeddingModel: env.OLLAMA_EMBEDDING_MODEL || "jina/jina-embeddings-v2-base-en",
    commitMessage: env.COMMIT_MESSAGE || "feat: add nightly verified yo mama jokes",
  };
}

module.exports = { loadConfig };
