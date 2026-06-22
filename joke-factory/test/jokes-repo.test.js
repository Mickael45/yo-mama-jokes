const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { getExistingJokes, appendJokes } = require("../lib/jokes-repo");

function tmpJokesDir(initial) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "jokes-"));
  fs.writeFileSync(path.join(dir, "fat.ts"), initial, "utf-8");
  return dir;
}

test("getExistingJokes parses an export default array", () => {
  const dir = tmpJokesDir('export default [\n  "Yo mama A.",\n  "Yo mama B.",\n];\n');
  assert.deepEqual(getExistingJokes("fat", dir), ["Yo mama A.", "Yo mama B."]);
});

test("getExistingJokes returns [] for a missing category", () => {
  const dir = tmpJokesDir("export default [];\n");
  assert.deepEqual(getExistingJokes("nope", dir), []);
});

test("appendJokes adds jokes and escapes quotes", () => {
  const dir = tmpJokesDir('export default [\n  "Yo mama A.",\n];\n');
  const n = appendJokes("fat", ['Yo mama "quoted".', "Yo mama C."], dir);
  assert.equal(n, 2);
  const after = getExistingJokes("fat", dir);
  assert.equal(after.length, 3);
  assert.ok(after.includes('Yo mama "quoted".'));
  assert.ok(after.includes("Yo mama C."));
});
