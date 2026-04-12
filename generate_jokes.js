// Import necessary Node.js modules
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline/promises");
const { Ollama } = require("ollama");

// Initialize Ollama specifically for Embeddings
const ollama = new Ollama({ host: "http://127.0.0.1:11434" });

// --- Configuration ---
const JOKES_DIR = path.join("./jokes");
const SITEMAP_PATH = path.join("./public", "sitemap.xml");
const GIT_COMMIT_MESSAGE = "feat: added daily verified yo mama joke";
const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || "jina/jina-embeddings-v2-base-en";
const SIMILARITY_THRESHOLD = 0.84; 

// --- Global Caches ---
const categoryEmbeddingCache = {};

// --- Helper Functions ---
function getExistingJokes(category) {
  const filePath = path.join(JOKES_DIR, `${category.toLowerCase()}.ts`);
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const match = content.match(/export default\s*(\[[\s\S]*?\]);?/);
    if (match && match[1]) {
      return new Function(`return ${match[1]};`)().map(String);
    }
  } catch (error) {
    // If file doesn't exist or fails, return empty array
  }
  return [];
}

function calculateCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) return 0;
  let dotProduct = 0, magA = 0, magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  return Math.max(-1, Math.min(1, dotProduct / (Math.sqrt(magA) * Math.sqrt(magB))));
}

async function embedInChunks(texts, model, chunkSize = 20) {
  const embeddings = [];
  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);
    const responses = await Promise.all(
      chunk.map(text => ollama.embeddings({ model, prompt: text }).catch(() => null))
    );
    responses.forEach(r => embeddings.push(r ? r.embedding : null));
  }
  return embeddings.filter(e => e !== null);
}

// --- Main Gatekeeper Loop ---
async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("=========================================");
  console.log("🛡️  Yo Mama Joke Gatekeeper & Validator  🛡️");
  console.log("=========================================\n");

  let validJokeFound = false;
  let finalCategory = "";
  let finalJoke = "";

  while (!validJokeFound) {
    const input = await rl.question("Paste the Gem's output (Format: [Category] - Joke): \n> ");
    
    // Parse the input format "[Fat] - Yo mama..."
    const match = input.match(/^\[(.*?)\]\s*-\s*(.*)$/);
    if (!match) {
      console.log("❌ Invalid format. Please ensure it looks exactly like: [Category] - Joke text\n");
      continue;
    }

    const category = match[1].trim().toLowerCase();
    const jokeText = match[2].trim().replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/"/g, '\\"');

    console.log(`\n🔍 Validating "${jokeText}" against the [${category}] database...`);

    // Load existing jokes and calculate/cache embeddings
    const existingJokes = getExistingJokes(category);
    if (!categoryEmbeddingCache[category] && existingJokes.length > 0) {
      process.stdout.write(`   Caching ${existingJokes.length} existing embeddings... `);
      categoryEmbeddingCache[category] = await embedInChunks(existingJokes, OLLAMA_EMBEDDING_MODEL);
      console.log("Done.");
    } else if (!categoryEmbeddingCache[category]) {
      categoryEmbeddingCache[category] = [];
    }

    const existingVectors = categoryEmbeddingCache[category];

    // Check similarity if database isn't empty
    if (existingVectors.length > 0) {
      const candidateEmbeddingResp = await ollama.embeddings({
        model: OLLAMA_EMBEDDING_MODEL,
        prompt: jokeText,
      });
      const candidateVector = candidateEmbeddingResp.embedding;

      let conflictingJokes = [];

      // Gather all jokes that pass the threshold
      for (let i = 0; i < existingVectors.length; i++) {
        const similarity = calculateCosineSimilarity(candidateVector, existingVectors[i]);
        if (similarity >= SIMILARITY_THRESHOLD) {
          conflictingJokes.push({
            text: existingJokes[i],
            score: (similarity * 100).toFixed(1)
          });
        }
      }

      if (conflictingJokes.length > 0) {
        // Sort the conflicts from highest similarity to lowest
        conflictingJokes.sort((a, b) => b.score - a.score);

        console.log(`\n⚠️  WARNING: Found ${conflictingJokes.length} similar joke(s) in the database!`);
        conflictingJokes.forEach((match, index) => {
          console.log(`   ${index + 1}. [${match.score}% match] - "${match.text}"`);
        });

        const override = await rl.question("\nDo you want to override the warning and approve this joke anyway? (y/n): ");
        if (override.toLowerCase() !== 'y') {
          console.log("\n❌ REJECTED! Tell the Gem: 'Too similar, try again.'\n");
          continue; // Go back to the start of the while loop
        } else {
          console.log(`\n✅ OVERRIDDEN! Manual approval granted.`);
        }
      } else {
        console.log(`\n✅ APPROVED! Highly unique.`);
      }
    } else {
        console.log(`\n✅ APPROVED! First joke in the [${category}] category!`);
    }

    finalCategory = category;
    finalJoke = jokeText;
    validJokeFound = true;
  }

  // --- Deployment Phase ---
  const answer = await rl.question("\nDeploy this joke to the repository? (y/n): ");
  if (answer.toLowerCase() !== 'y') {
    console.log("Deployment aborted. Exiting.");
    rl.close();
    return;
  }

  console.log("\n🚀 Deploying...");

  // 1. Update TS file
  const filePath = path.join(JOKES_DIR, `${finalCategory}.ts`);
  let content = fs.readFileSync(filePath, "utf-8");
  const lastBracketIndex = content.lastIndexOf("]");
  content = content.slice(0, lastBracketIndex) + `\n  "${finalJoke}",` + content.slice(lastBracketIndex);
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`   - Updated ${finalCategory}.ts`);

  // 2. Update Sitemap
  let sitemapContent = fs.readFileSync(SITEMAP_PATH, "utf-8");
  const today = new Date().toISOString().split("T")[0];
  const locContent = `https://yomamajokescentral.com/jokes/${finalCategory}-yo-mama-jokes`;
  const urlBlockRegex = new RegExp(`(<url>\\s*<loc>${locContent.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}<\\/loc>[\\s\\S]*?<lastmod>)[^<]+(<\\/lastmod>[\\s\\S]*?<\\/url>)`, "g");
  sitemapContent = sitemapContent.replace(urlBlockRegex, `$1${today}$2`);
  fs.writeFileSync(SITEMAP_PATH, sitemapContent, "utf-8");
  console.log(`   - Updated sitemap.xml`);

  // 3. Git Push
  try {
    execSync("git add --all", { stdio: "pipe" });
    execSync(`git commit -m "${GIT_COMMIT_MESSAGE}"`, { stdio: "pipe" });
    execSync("git push", { stdio: "pipe" });
    console.log(`   - Successfully pushed to GitHub!`);
  } catch (error) {
    console.error("   - Error pushing to Git. Please check your repo state.");
  }

  console.log("\n🎉 All done! See you tomorrow.");
  rl.close();
}

main().catch(console.error);
