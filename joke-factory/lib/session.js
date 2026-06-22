const { generateJokes } = require("./generator");
const { filterNovel } = require("./dedup");

async function generateBatch({
  chat, embed, model, category, existingJokes,
  count = 5, threshold = 0.84, steer = "", maxAttempts = 5,
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
    collected.push(...novel);
  }
  return collected.slice(0, count);
}

module.exports = { generateBatch };
