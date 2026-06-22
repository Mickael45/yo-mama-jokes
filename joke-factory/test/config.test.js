const { test } = require("node:test");
const assert = require("node:assert");
const { loadConfig } = require("../lib/config");

test("loadConfig applies defaults", () => {
  const c = loadConfig({ TELEGRAM_BOT_TOKEN: "t", TELEGRAM_CHAT_ID: "1" });
  assert.equal(c.batchSize, 5);
  assert.equal(c.idleTimeoutMin, 120);
  assert.equal(c.threshold, 0.84);
  assert.equal(c.embeddingModel, "jina/jina-embeddings-v2-base-en");
  assert.equal(c.ollamaHost, "http://127.0.0.1:11434");
});

test("loadConfig overrides from env", () => {
  const c = loadConfig({ TELEGRAM_BOT_TOKEN: "t", TELEGRAM_CHAT_ID: "1", BATCH_SIZE: "8", OLLAMA_MODEL: "gemma4:12b" });
  assert.equal(c.batchSize, 8);
  assert.equal(c.model, "gemma4:12b");
});

test("loadConfig throws when bot token missing", () => {
  assert.throws(() => loadConfig({ TELEGRAM_CHAT_ID: "1" }), /TELEGRAM_BOT_TOKEN/);
});
