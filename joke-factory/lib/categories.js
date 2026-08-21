const CATEGORIES = Object.freeze([
  "awful", "bald", "clumsy", "dumb", "entitled", "evil", "fat",
  "greedy", "hairy", "lazy", "loud", "old", "other", "poor",
  "scary", "short", "skinny", "tall", "ugly",
]);

// mulberry32: tiny deterministic PRNG seeded by an integer.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickDailyCategory(date, categories = CATEGORIES) {
  const iso = date.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  const seed = parseInt(iso.replace(/-/g, ""), 10); // e.g. 20260622
  const r = mulberry32(seed)();
  return categories[Math.floor(r * categories.length)];
}

module.exports = { CATEGORIES, pickDailyCategory };
