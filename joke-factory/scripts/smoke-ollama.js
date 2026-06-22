const { loadConfig } = require("../lib/config");
const { createOllama } = require("../lib/ollama-client");
const { generateBatch } = require("../lib/session");
const { getExistingJokes } = require("../lib/jokes-repo");

(async () => {
  const cfg = loadConfig();
  const ollama = createOllama(cfg);
  const existing = getExistingJokes("fat", cfg.jokesDir);
  console.log(`Existing 'fat' jokes: ${existing.length}`);
  const batch = await generateBatch({
    chat: ollama.chat, embed: ollama.embed, model: cfg.model,
    category: "fat", existingJokes: existing, count: 3, threshold: cfg.threshold,
  });
  console.log("Generated novel jokes:");
  batch.forEach((j, i) => console.log(`  ${i + 1}. ${j}`));
})().catch((e) => { console.error(e); process.exit(1); });
