const { loadConfig } = require("./lib/config");
const { CATEGORIES, pickDailyCategory } = require("./lib/categories");
const { getExistingJokes, appendJokes } = require("./lib/jokes-repo");
const { createOllama } = require("./lib/ollama-client");
const { runTelegramSession } = require("./bot");
const { commitAndPush } = require("./lib/git");

async function main() {
  const cfg = loadConfig();
  const category = pickDailyCategory(new Date(), CATEGORIES);
  const existing = getExistingJokes(category, cfg.jokesDir);
  const ollama = createOllama(cfg);

  console.log(`[factory] category=${category} existing=${existing.length}`);

  const approved = await runTelegramSession({
    botToken: cfg.botToken, chatId: cfg.chatId, category, existingJokes: existing,
    chat: ollama.chat, embed: ollama.embed, model: cfg.model,
    batchSize: cfg.batchSize, threshold: cfg.threshold, idleTimeoutMin: cfg.idleTimeoutMin,
  });

  if (!approved.length) {
    console.log("[factory] nothing approved; exiting without commit.");
    return;
  }

  const added = appendJokes(category, approved, cfg.jokesDir);
  console.log(`[factory] appended ${added} joke(s) to ${category}.ts`);
  const res = commitAndPush({ message: cfg.commitMessage });
  console.log(res.pushed ? "[factory] pushed." : `[factory] push failed: ${res.error}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
