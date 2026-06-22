function buildPrompt(category, existingJokes, count, steer = "") {
  const sample = existingJokes.slice(0, 40);
  const steerLine = steer ? `\n\nExtra instruction: ${steer}` : "";
  const system =
    `You are a comedy writer specializing in classic "yo mama" jokes. ` +
    `Write original, punchy one-line jokes in the "${category}" style. ` +
    `Every joke MUST start with "Yo mama" or "Yo momma". ` +
    `Output ONLY the jokes, one per line. No numbering, no bullets, no quotes, no commentary.`;
  const user =
    `Category: ${category}\n` +
    `Write ${count} brand-new jokes that are clearly DIFFERENT from every one of these existing jokes:\n\n` +
    sample.map((j) => `- ${j}`).join("\n") +
    steerLine;
  return { system, user };
}

function parseJokes(text) {
  return String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .map((l) => l.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, "")) // strip numbering/bullets
    .map((l) => l.replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, "").trim()) // strip wrapping quotes (incl. smart quotes)
    .filter((l) => /^yo\s+m[ao]m{1,2}a\b/i.test(l));        // keep only joke lines (mama/mamma/momma)
}

async function generateJokes({ chat, model, category, existingJokes, count = 5, steer = "" }) {
  const { system, user } = buildPrompt(category, existingJokes, count, steer);
  const res = await chat({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  return parseJokes(res && res.message ? res.message.content : "");
}

module.exports = { buildPrompt, parseJokes, generateJokes };
