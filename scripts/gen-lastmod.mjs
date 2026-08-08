// Regenerate lastmod.json (page path -> last real change date) from FULL git
// history. Run where history is complete: a dev machine, or the daily joke
// workflow (checkout with fetch-depth: 0). Refuses to run on a shallow clone —
// that is exactly the environment that produced flat wrong dates before.
//
//   /jokes/<short>-yo-mama-jokes  -> git date of jokes/<short>.ts
//   /categories                   -> newest of its page source + any joke file
//                                    (its visible per-category counts move with jokes)
//   other static pages            -> git date of src/pages/<name>.astro
import { execSync } from "node:child_process";
import { readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const sh = (cmd) => execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();

export function jokeUrl(file) {
  return `/jokes/${file.replace(/\.ts$/, "")}-yo-mama-jokes`;
}

export function pageUrl(file) {
  if (!file.endsWith(".astro") || file.includes("[")) return undefined;
  const name = file.replace(/\.astro$/, "");
  if (name === "index" || name === "404") return undefined;
  return `/${name}`;
}

function main() {
  if (sh("git rev-parse --is-shallow-repository") === "true") {
    console.error("gen-lastmod: shallow clone — dates would be flat lies. Fetch full history first (fetch-depth: 0).");
    process.exit(1);
  }
  const gitDate = (f) => sh(`git log -1 --format=%cI -- "${f}"`) || undefined;

  const manifest = {};
  const jokeDates = [];
  for (const f of readdirSync(join(ROOT, "jokes")).filter((f) => f.endsWith(".ts"))) {
    const d = gitDate(`jokes/${f}`);
    if (!d) continue;
    manifest[jokeUrl(f)] = d;
    jokeDates.push(d);
  }
  for (const f of readdirSync(join(ROOT, "src/pages"))) {
    const url = pageUrl(f);
    if (!url) continue;
    const d = gitDate(`src/pages/${f}`);
    if (d) manifest[url] = d;
  }
  // /categories shows per-category counts, so it changes whenever jokes do.
  const catCandidates = [manifest["/categories"], ...jokeDates].filter(Boolean).sort();
  if (catCandidates.length) manifest["/categories"] = catCandidates.at(-1);

  writeFileSync(join(ROOT, "lastmod.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`gen-lastmod: wrote ${Object.keys(manifest).length} entries to lastmod.json`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
