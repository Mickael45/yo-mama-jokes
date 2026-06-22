const { test } = require("node:test");
const assert = require("node:assert");
const { commitAndPush } = require("../lib/git");

test("commitAndPush runs add, commit, push in order", () => {
  const calls = [];
  const res = commitAndPush({ message: "feat: x", exec: (c) => calls.push(c) });
  assert.equal(res.pushed, true);
  assert.equal(calls.length, 3);
  assert.match(calls[0], /git add --all/);
  assert.match(calls[1], /git commit -m/);
  assert.match(calls[1], /feat: x/);
  assert.match(calls[2], /git push/);
});

test("commitAndPush reports failure without throwing", () => {
  const res = commitAndPush({
    message: "feat: x",
    exec: (c) => { if (/push/.test(c)) throw new Error("no remote"); },
  });
  assert.equal(res.pushed, false);
  assert.match(res.error, /no remote/);
});
