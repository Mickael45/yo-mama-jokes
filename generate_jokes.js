// Import necessary Node.js modules
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline/promises");

// Ollama SDK setup
const { Ollama } = require("ollama");
const ollama = new Ollama({ host: "http://127.0.0.1:11434" });

// --- Configuration ---
const JOKES_DIR = path.join("./jokes");
const SITEMAP_PATH = path.join("./public", "sitemap.xml");
const NUM_CATEGORIES_TO_SELECT = 1;
const GIT_COMMIT_MESSAGE = "New jokes created";
const BATCH_SIZE = 7; // Number of jokes to request from LLM at once
const SIMILARITY_THRESHOLD = 0.84; // Adjusted for Jina embeddings (0.8 is often too strict for short text)

// --- Available Categories ---
const ALL_CATEGORIES = [
  "awful", "bald", "clumsy", "dirty", "dumb", "entitled", "evil",
  "fat", "greedy", "hairy", "lazy", "loud", "nasty", "old",
  "poor", "scary", "short", "skinny", "tall", "ugly",
];

// --- Global Caches ---
// Prevents recalculating embeddings for existing jokes if you refresh or run multiple times
const categoryEmbeddingCache = {};

// --- Helper Functions ---

/**
 * Selects N random elements from an array without repetition.
 */
function getRandomElements(arr, n) {
  if (n >= arr.length) return arr.slice();
  const shuffled = arr.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, n);
}

/**
 * Reads the jokes from a category file.
 */
function getExistingJokes(category) {
  const filePath = path.join(JOKES_DIR, `${category}.ts`);
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const match = content.match(/export default\s*(\[[\s\S]*?\]);?/);
    if (match && match[1]) {
      try {
        const jokesArray = new Function(`return ${match[1]};`)();
        if (Array.isArray(jokesArray)) {
          return jokesArray.map((j) => String(j));
        }
      } catch (parseError) {
        console.error(`Error parsing jokes array in ${filePath}:`, parseError);
        return [];
      }
    }
    return [];
  } catch (error) {
    return [];
  }
}

/**
 * Calculates the cosine similarity between two vectors.
 */
function calculateCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) return 0;
  let dotProduct = 0, magA = 0, magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;
  return Math.max(-1, Math.min(1, dotProduct / (magA * magB)));
}

/**
 * Embeds an array of texts in safe chunks to prevent overwhelming the local Ollama instance.
 */
async function embedInChunks(texts, model, chunkSize = 20) {
  const embeddings = [];
  for (let i = 0; i < texts.length; i += chunkSize) {
    const chunk = texts.slice(i, i + chunkSize);
    const responses = await Promise.all(
      chunk.map(text => ollama.embeddings({ model, prompt: text }).catch(() => null))
    );
    // Push the valid embeddings
    responses.forEach(r => embeddings.push(r ? r.embedding : null));
  }
  return embeddings; // Note: may contain nulls if some failed
}

/**
 * Parses a numbered list response from the LLM into an array of strings.
 */
function extractJokesFromLLMResponse(responseText) {
  return responseText
    .split('\n')
    .map(line => line.trim())
    // Remove numbers, bullets, quotes (e.g., "1. Yo mama...", "- "Yo mama..."")
    .map(line => line.replace(/^[\d\.\-\*\)]+\s*/, '').replace(/^["']|["']$/g, '').trim())
    // Ensure it looks like a valid joke
    .filter(line => line.toLowerCase().includes('yo mama') || line.toLowerCase().includes('your mom'));
}

/**
 * The core generation function (Optimized with Batching & Caching)
 */
async function generateUniqueJokeLLM(category, existingJokes) {
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma4:e4b";
  const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || "jina/jina-embeddings-v2-base-en";
  const MAX_PROMPT_RETRIES = 5; // With a batch size of 7, this tests up to 35 jokes

  console.log(`\t-> Generating batches for: ${category}...`);

  // 1. Cache or calculate existing embeddings
  let existingVectors = categoryEmbeddingCache[category];
  if (!existingVectors && existingJokes.length > 0) {
    console.log(`\t   Pre-calculating embeddings for ${existingJokes.length} existing ${category} jokes...`);
    const embeddings = await embedInChunks(existingJokes, OLLAMA_EMBEDDING_MODEL, 20);
    existingVectors = embeddings.filter(e => e !== null);
    categoryEmbeddingCache[category] = existingVectors;
    console.log(`\t   Done caching ${category} embeddings.`);
  } else if (!existingVectors) {
    existingVectors = [];
  }

  let attempts = 0;

  while (attempts < MAX_PROMPT_RETRIES) {
    attempts++;
    
    // Sample a few existing jokes as negative examples to prevent context bloat
    const negativeSample = getRandomElements(existingJokes, 10).map(j => `- ${j}`).join("\n");

    const prompt = `Generate exactly ${BATCH_SIZE} short, funny, and truly original yo mama jokes.
The main theme MUST be directly inspired by the category: "${category}".

Allowed starting phrases: "Yo mama", "Your mom", "Yo mama so", etc.
Keep them concise (1-2 sentences max).

DO NOT reuse or iterate on these existing concepts:
${negativeSample || "(No existing examples)"}

CRITICAL OUTPUT FORMAT: Output ONLY a numbered list of the jokes. Do not include introductory text.
1. Joke one
2. Joke two
...`;

    try {
      const temperature = Math.min(1.0, 0.7 + (attempts * 0.1)); // Slightly increase creativity per batch
      
      const generateResponse = await ollama.generate({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: { temperature, num_predict: 350 },
      });

      const candidateJokes = extractJokesFromLLMResponse(generateResponse.response);
      
      if (candidateJokes.length === 0) continue;

      // 2. Process the batch of candidates sequentially until one passes
      for (let i = 0; i < candidateJokes.length; i++) {
        const candidate = candidateJokes[i];

        // Ensure category relevance (Basic check)
        const categoryPattern = new RegExp(category.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"), "i");
        const isRelevant = categoryPattern.test(candidate) || checkCategorySynonyms(category, candidate);
        
        if (!isRelevant) {
          continue; // Skip to next candidate in batch
        }

        // Exact match check
        if (existingJokes.includes(candidate)) continue;

        // Similarity match check
        if (existingVectors.length === 0) {
           return finalizeJoke(candidate, category);
        }

        const candidateEmbeddingResp = await ollama.embeddings({
          model: OLLAMA_EMBEDDING_MODEL,
          prompt: candidate,
        });
        
        const candidateVector = candidateEmbeddingResp?.embedding;
        if (!candidateVector) continue;

        let maxSimilarity = 0;
        for (const existingVec of existingVectors) {
          const similarity = calculateCosineSimilarity(candidateVector, existingVec);
          if (similarity > maxSimilarity) maxSimilarity = similarity;
        }

        if (maxSimilarity < SIMILARITY_THRESHOLD) {
          console.log(`\t   [Batch attempt ${attempts}] Found unique joke! (Similarity: ${(maxSimilarity * 100).toFixed(1)}%)`);
          return finalizeJoke(candidate, category);
        } else {
          // console.log(`\t   Candidate rejected (Similarity: ${(maxSimilarity * 100).toFixed(1)}%)`);
        }
      }

    } catch (error) {
      console.error(`\t   Error during batch attempt ${attempts}:`, error.message);
    }
  }

  console.error(`\t<- Failed to find a unique joke for ${category} after ${MAX_PROMPT_RETRIES * BATCH_SIZE} generations.`);
  return `Yo mama so ${category}, the LLM failed uniqueness checks! (${Math.random().toString(36).substring(7)})`;
}

/**
 * Final formatting for TS insertion
 */
function finalizeJoke(jokeText, category) {
  console.log(`\t<- Selected unique joke for ${category}: "${jokeText}"`);
  return jokeText
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/"/g, '\\"');
}

/**
 * Checks for common synonyms to ensure relevance if the exact category word is missing.
 */
function checkCategorySynonyms(category, text) {
  const synonyms = {
    fat: /heavy|large|big|weight|obese/i,
    dumb: /stupid|idiot|brainless|clueless/i,
    old: /ancient|aged|senior|dinosaur/i,
    skinny: /thin|slim|slender|bones/i,
    tall: /height|towering|giant|giraffe/i,
    short: /tiny|small|petite|midget|dwarf/i,
    ugly: /unattractive|hideous|repulsive|scare/i,
    lazy: /sloth|idle|inactive|couch/i,
    greedy: /selfish|avaricious|grasping|money/i,
    bald: /hairless|smooth|shiny/i,
    clumsy: /awkward|uncoordinated|graceless|trip/i,
    dirty: /filthy|unclean|grimy|stink/i,
    nasty: /gross|disgusting|repulsive|greasy/i,
    scary: /frightening|terrifying|spooky/i,
    entitled: /privileged|arrogant|karen/i,
    evil: /wicked|malevolent|sinister/i,
    loud: /noisy|boisterous|clamorous|deaf/i,
    poor: /broke|destitute|impoverished|cents/i,
    hairy: /furry|hair|shaggy|unshorn|gorilla/i,
    awful: /terrible|horrible|dreadful/i
  };

  return synonyms[category] ? synonyms[category].test(text) : false;
}

/**
 * Updates the TypeScript file for a category by adding the new joke.
 */
function updateJokeFile(category, newJoke) {
  const filePath = path.join(JOKES_DIR, `${category}.ts`);
  console.log(`Updating file: ${filePath}`);
  try {
    let content = fs.readFileSync(filePath, "utf-8");
    const lastBracketIndex = content.lastIndexOf("]");
    if (lastBracketIndex === -1) {
      console.error(`Could not find closing array bracket ']' in ${filePath}.`);
      return false;
    }
    const jokeToAdd = `\n  "${newJoke}",`;
    content = content.slice(0, lastBracketIndex) + jokeToAdd + content.slice(lastBracketIndex);
    fs.writeFileSync(filePath, content, "utf-8");
    return true;
  } catch (error) {
    console.error(`Error updating file ${filePath}:`, error);
    return false;
  }
}

/**
 * Updates the lastmod date in the sitemap.xml
 */
function updateSitemap(updatedCategories) {
  console.log("\nUpdating sitemap.xml...");
  if (updatedCategories.length === 0) return;

  try {
    let sitemapContent = fs.readFileSync(SITEMAP_PATH, "utf-8");
    const today = new Date().toISOString().split("T")[0];
    let updatedCount = 0;

    for (const category of updatedCategories) {
      const locContent = `https://yomamajokescentral.com/jokes/${category}-yo-mama-jokes`;
      const urlBlockRegex = new RegExp(`(<url>\\s*<loc>${locContent.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}<\\/loc>[\\s\\S]*?<lastmod>)[^<]+(<\\/lastmod>[\\s\\S]*?<\\/url>)`, "g");
      
      let found = false;
      sitemapContent = sitemapContent.replace(urlBlockRegex, (match, prefix, suffix) => {
        found = true;
        updatedCount++;
        return `${prefix}${today}${suffix}`;
      });

      if (!found) console.warn(`  - Could not find URL entry for '${category}' in sitemap.xml.`);
    }

    if (updatedCount > 0) {
      fs.writeFileSync(SITEMAP_PATH, sitemapContent, "utf-8");
      console.log(`Sitemap updated successfully for ${updatedCount} categories.`);
    }
  } catch (error) {
    console.error(`Error updating sitemap.xml:`, error);
  }
}

/**
 * Runs the git add, commit, and push commands.
 */
function runGitCommands() {
  console.log("\nRunning Git commands...");
  try {
    execSync("git add --all", { stdio: "inherit" });
    execSync(`git commit -m "${GIT_COMMIT_MESSAGE}"`, { stdio: "inherit" });
    execSync("git push", { stdio: "inherit" });
    console.log("\nGit commands executed successfully!");
  } catch (error) {
    console.error("\nError running Git commands. Please check your config.");
  }
}

// --- Main Execution ---
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("--- Fast Yo Mama Joke Generator ---");

  const selectedCategories = getRandomElements(ALL_CATEGORIES, NUM_CATEGORIES_TO_SELECT);
  if (selectedCategories.length === 0) {
    console.error("No categories selected. Exiting.");
    rl.close();
    return;
  }
  
  const numJokes = selectedCategories.length;
  const generatedJokes = {};

  console.log(`\nGenerating initial ${numJokes} jokes...`);
  await Promise.all(
    selectedCategories.map(async (category) => {
      const existing = getExistingJokes(category);
      generatedJokes[category] = await generateUniqueJokeLLM(category, existing);
    })
  );
  console.log("Initial generation complete.");

  let confirmed = false;
  while (!confirmed) {
    console.log("\n--- Generated Jokes ---");
    selectedCategories.forEach((category, index) => {
      const jokeText = generatedJokes[category] || "[Failed to generate]";
      console.log(`${index + 1}. [${category.padEnd(10)}] ${jokeText}`);
    });
    console.log("----------------------");

    const answer = await rl.question(
      `Enter 'c' to confirm, 'r<numbers>' to refresh (e.g., r1,3), 'ra' to refresh all, or 'a' to abort: `
    );
    const command = answer.trim().toLowerCase();

    if (command === "c") {
      confirmed = true;
    } else if (command === "a") {
      console.log("Aborting operation. No files changed.");
      rl.close();
      return;
    } else if (command.startsWith("r") && command !== "ra") {
      const indexInputString = command.substring(1);
      const indexStrings = indexInputString.split(",");
      const indicesToRefresh = new Set();
      let parseError = false;

      for (const str of indexStrings) {
        const trimmedStr = str.trim();
        if (trimmedStr === "") continue;
        const index = parseInt(trimmedStr, 10);
        if (isNaN(index) || index < 1 || index > numJokes) {
          console.log(`Invalid index: '${trimmedStr}'.`);
          parseError = true;
          break;
        }
        indicesToRefresh.add(index - 1);
      }

      if (!parseError && indicesToRefresh.size > 0) {
        const uniqueIndices = Array.from(indicesToRefresh);
        console.log(`\nRefreshing joke(s)...`);
        await Promise.all(
          uniqueIndices.map(async (idx) => {
            const cat = selectedCategories[idx];
            generatedJokes[cat] = await generateUniqueJokeLLM(cat, getExistingJokes(cat).concat(generatedJokes[cat] || []));
          })
        );
      }
    } else if (command === "ra") {
      console.log(`\nRefreshing jokes for all ${numJokes} categories...`);
      await Promise.all(
        selectedCategories.map(async (category) => {
          generatedJokes[category] = await generateUniqueJokeLLM(category, getExistingJokes(category).concat(generatedJokes[category] || []));
        })
      );
    } else {
      console.log("Invalid command.");
    }
  }

  rl.close();

  console.log("\nConfirmation received. Processing updates...");
  const successfullyUpdatedCategories = [];
  let anyFailed = false;
  
  for (const category of selectedCategories) {
    if (generatedJokes[category] && !generatedJokes[category].startsWith("ERROR Yo mama so")) {
      const success = updateJokeFile(category, generatedJokes[category]);
      if (success) successfullyUpdatedCategories.push(category);
      else anyFailed = true;
    } else {
      anyFailed = true;
    }
  }

  if (successfullyUpdatedCategories.length > 0) {
    updateSitemap(successfullyUpdatedCategories);
    if (!anyFailed) runGitCommands();
    else console.warn("\nSkipping Git push because one or more jokes failed.");
  } else {
    console.log("\nNo jokes updated.");
  }
  console.log("\n--- Process Complete ---");
}

main().catch((error) => {
  console.error("\nAn unexpected error occurred:", error);
  process.exit(1);
});
