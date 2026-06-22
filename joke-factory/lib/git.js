const { execSync } = require("node:child_process");

const defaultExec = (cmd) => execSync(cmd, { stdio: "pipe" });

function commitAndPush({ message, exec = defaultExec }) {
  try {
    exec("git add --all");
    exec(`git commit -m ${JSON.stringify(message)}`);
    exec("git push");
    return { pushed: true };
  } catch (err) {
    return { pushed: false, error: err.message };
  }
}

module.exports = { commitAndPush };
