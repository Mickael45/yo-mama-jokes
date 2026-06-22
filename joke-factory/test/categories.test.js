const { test } = require("node:test");
const assert = require("node:assert");
const { CATEGORIES, pickDailyCategory } = require("../lib/categories");

test("CATEGORIES has the 21 expected categories", () => {
  assert.equal(CATEGORIES.length, 21);
  assert.ok(CATEGORIES.includes("fat"));
  assert.ok(CATEGORIES.includes("other"));
});

test("pickDailyCategory returns a member of CATEGORIES", () => {
  const c = pickDailyCategory(new Date("2026-06-22T00:00:00Z"));
  assert.ok(CATEGORIES.includes(c));
});

test("pickDailyCategory is deterministic for the same date", () => {
  const d = new Date("2026-06-22T00:00:00Z");
  assert.equal(pickDailyCategory(d), pickDailyCategory(d));
});

test("pickDailyCategory varies across dates", () => {
  const picks = new Set();
  for (let day = 1; day <= 15; day++) {
    picks.add(pickDailyCategory(new Date(`2026-06-${String(day).padStart(2, "0")}T00:00:00Z`)));
  }
  assert.ok(picks.size > 1, "expected more than one distinct category across 15 days");
});
