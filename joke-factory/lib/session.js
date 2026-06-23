const { generateJokes } = require("./generator");
const { filterNovel } = require("./dedup");

async function generateBatch({
  chat, embed, model, category, existingJokes,
  count = 5, threshold = 0.84, steer = "", maxAttempts = 5, onNovel,
}) {
  const collected = [];
  for (let attempt = 0; attempt < maxAttempts && collected.length < count; attempt++) {
    let candidates;
    try {
      candidates = await generateJokes({ chat, model, category, existingJokes, count, steer });
    } catch (err) {
      // A transient ollama error (e.g. a 500 from the CPU runner) should cost
      // one attempt, not abort the whole nightly session — retry next loop.
      console.error(`[factory] generation attempt ${attempt + 1} failed: ${err.message}`);
      continue;
    }
    if (candidates.length === 0) continue;
    const { novel } = await filterNovel({
      candidates,
      existingJokes: [...existingJokes, ...collected],
      embed,
      threshold,
    });
    if (novel.length === 0) continue;
    // Don't overshoot the batch size — keep only what still fits the budget.
    const added = novel.slice(0, count - collected.length);
    collected.push(...added);
    // Hand each productive attempt's jokes to the caller as they're found so they
    // can be delivered immediately, rather than withholding the whole batch until
    // every attempt finishes (~25-30 min each on CPU).
    if (onNovel) await onNovel(added);
  }
  return collected.slice(0, count);
}

module.exports = { generateBatch };
