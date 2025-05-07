// Import necessary Node.js modules
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const readline = require("readline/promises"); // For user interaction
const { Ollama } = require("ollama");

const ollama = new Ollama({ host: "http://127.0.0.1:11434" });

// --- Configuration ---
const JOKES_DIR = path.join("./jokes");
const SITEMAP_PATH = path.join("./public", "sitemap.xml");
const NUM_CATEGORIES_TO_SELECT = 1;
const GIT_COMMIT_MESSAGE = "New jokes created";

// --- Available Categories (assuming file names match categories) ---
const ALL_CATEGORIES = [
  "awful",
  "bald",
  "clumsy",
  "dirty",
  "dumb",
  "entitled",
  "evil",
  "fat",
  "greedy",
  "hairy",
  "lazy",
  "loud",
  "nasty",
  "old",
  "poor",
  "scary",
  "short",
  "skinny",
  "tall",
  "ugly",
]; // Or dynamically read from JOKES_DIR if preferred

// --- Helper Functions ---

/**
 * Selects N random elements from an array without repetition.
 */
function getRandomElements(arr, n) {
  if (n > arr.length) {
    console.warn(
      "Requested more elements than available. Returning all elements."
    );
    n = arr.length;
  }
  const shuffled = arr.slice(); // Create a copy
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap
  }
  return shuffled.slice(0, n);
}

/**
 * Reads the jokes from a category file.
 * Returns an array of existing jokes.
 */
function getExistingJokes(category) {
  const filePath = path.join(JOKES_DIR, `${category}.ts`);
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    // Basic extraction assuming standard format 'export default ["joke1", "joke2"];'
    const match = content.match(/export default\s*(\[[\s\S]*?\]);?/);
    if (match && match[1]) {
      // Use Function constructor for safe evaluation of the array literal
      // It's generally safer than eval() for parsing known structures
      try {
        const jokesArray = new Function(`return ${match[1]};`)();
        if (Array.isArray(jokesArray)) {
          return jokesArray.map((j) => String(j)); // Ensure all are strings
        }
      } catch (parseError) {
        console.error(`Error parsing jokes array in ${filePath}:`, parseError);
        return []; // Return empty on parse failure
      }
    }
    console.warn(
      `Could not extract jokes array from ${filePath}. Assuming empty.`
    );
    return [];
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return []; // Return empty if file read fails
  }
}

/**
 * Calculates the cosine similarity between two vectors (embeddings).
 * @param {number[]} vecA - The first vector.
 * @param {number[]} vecB - The second vector.
 * @returns {number} The cosine similarity score (between -1 and 1).
 */
function calculateCosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) {
    // Return 0 if vectors are invalid or incompatible
    // console.error("Invalid vectors for cosine similarity.", vecA, vecB);
    return 0;
  }

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  if (magA === 0 || magB === 0) {
    // Handle case of zero vectors to avoid division by zero
    return 0;
  }

  // Similarity is dot product divided by the product of magnitudes
  const similarity = dotProduct / (magA * magB);

  // Clamp the value between -1 and 1 due to potential floating point inaccuracies
  return Math.max(-1, Math.min(1, similarity));
}

async function generateUniqueJokeLLM(category, existingJokes) {
  const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3:latest";
  const OLLAMA_EMBEDDING_MODEL =
    process.env.OLLAMA_EMBEDDING_MODEL || "mxbai-embed-large";
  const MAX_RETRIES = 40;
  const SIMILARITY_THRESHOLD = 0.8;

  console.log(
    `\t-> Calling Ollama (${OLLAMA_MODEL} / ${OLLAMA_EMBEDDING_MODEL}) for category: ${category}...`
  );

  const existingJokesSample = existingJokes.map((j) => `- ${j}`).join("\n");

  // ***** REVISED PROMPT LOGIC *****
  // Base prompt emphasizing the category
  const basePrompt = `Generate one short, funny, and truly original yo mama joke.
The joke's main theme MUST be directly inspired by and related to the specific category: "${category}".

Allowed starting phrases include "Yo mama", "Your mom", "Yo mama is so", "Yo mama's so", or similar common variations naturally fitting the joke's structure and the category "${category}".

Maintain a classic yo mama joke vibe - witty and humorous. The joke should be concise (1-2 sentences).

Ensure the joke is unique and significantly different from these existing examples provided for context:
${
  existingJokesSample || "(No existing examples provided for this category yet)"
}

CRITICAL OUTPUT INSTRUCTION: Generate *only* the final joke text itself. Do *not* include surrounding quotes, introductions, labels, numbers, or explanations. Just the raw joke text.`;

  let attempts = 0;
  let generatedJokeText = "";
  let unique = false;
  let latestSimilarityScore = 0;
  let existingVectors = []; // Hold embeddings for existing jokes

  // Pre-calculate existing joke embeddings (as before)
  if (existingJokes.length > 0) {
    console.log(
      `\t   Generating embeddings for ${existingJokes.length} existing jokes...`
    );
    try {
      const responses = await Promise.all(
        existingJokes.map((joke) =>
          ollama.embeddings({ model: OLLAMA_EMBEDDING_MODEL, prompt: joke })
        )
      );
      existingVectors = responses.map((e) => e.embedding);
      console.log(`\t   Existing embeddings generated.`);
    } catch (embedError) {
      console.error(
        `\t   ERROR generating existing embeddings:`,
        embedError.message
      );
      existingVectors = [];
    }
  }

  while (attempts < MAX_RETRIES && !unique) {
    attempts++;
    latestSimilarityScore = 0;

    // Construct the prompt for this attempt
    let currentPrompt = basePrompt;
    if (attempts > 1) {
      console.log(
        `\t   Attempt ${attempts} (Retrying - Last similarity: ${(
          latestSimilarityScore * 100
        ).toFixed(1)}%)...`
      );
      await new Promise((resolve) => setTimeout(resolve, 300 * attempts));

      // ** Explicitly reinforce category AND uniqueness in retry prompt **
      currentPrompt = `${basePrompt}\n\n---
ATTEMPT ${attempts}: The previous attempt was too similar (score ${(
        latestSimilarityScore * 100
      ).toFixed(1)}%) or failed validation: "${generatedJokeText}"
Your new joke MUST still be about the category "${category}", but also significantly different from the previous attempt AND the examples provided earlier. Follow all output format rules strictly.
---`;
    }

    try {
      // --- 1. Generate Candidate Joke ---
      // ** Cap temperature increase to avoid excessive randomness **
      const temperature = Math.min(1.0, 0.8 + (attempts - 1) * 0.05); // Cap at 1.0

      const generateResponse = await ollama.generate({
        model: OLLAMA_MODEL,
        prompt: currentPrompt, // Use the potentially modified prompt
        stream: false,
        options: {
          temperature: temperature,
          num_predict: 60,
          stop: ["\n", '"', "."],
        },
      });

      if (!generateResponse || !generateResponse.response) {
        /* ... handle empty ... */ continue;
      }

      // Clean generated text (as before)
      generatedJokeText = generateResponse.response
        .trim()
        .replace(/^["'\-\*\d\.]+\s*/, "")
        .replace(/["']$/, "");
      generatedJokeText = generatedJokeText.split("\n")[0].trim();

      if (!generatedJokeText) {
        /* ... handle empty after clean ... */ continue;
      }

      // ***** ADDED: Basic category keyword check (optional but helpful) *****
      // Simple check if the category word (or a related term) appears. Case-insensitive.
      // This is a heuristic and might not work for all categories/jokes.
      const categoryPattern = new RegExp(
        category.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"),
        "i"
      ); // Escape category for regex
      if (!categoryPattern.test(generatedJokeText)) {
        // Also check common variations if applicable (e.g., 'fat' -> 'heavy', 'dumb' -> 'stupid') - Add more if needed
        let relatedMatch = false;
        if (
          category === "fat" &&
          /heavy|large|big|weight/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "dumb" &&
          /stupid|idiot|brainless|clueless/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "old" &&
          /ancient|aged|senior/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "skinny" &&
          /thin|slim|slender/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "tall" &&
          /height|towering|giant/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "short" &&
          /tiny|small|petite/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "ugly" &&
          /unattractive|hideous|repulsive/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "lazy" &&
          /slothful|idle|inactive/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "greedy" &&
          /selfish|avaricious|grasping/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "bald" &&
          /hairless|hairfree|smooth/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "clumsy" &&
          /awkward|uncoordinated|graceless/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "dirty" &&
          /filthy|unclean|grimy/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "nasty" &&
          /gross|disgusting|repulsive|greasy/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "scary" &&
          /frightening|terrifying|spooky/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "entitled" &&
          /privileged|self-important|arrogant/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "evil" &&
          /wicked|malevolent|sinister/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "loud" &&
          /noisy|boisterous|clamorous/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "poor" &&
          /broke|destitute|impoverished/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "hairy" &&
          /furry|hair|shaggy|unshorn/i.test(generatedJokeText)
        )
          relatedMatch = true;
        if (
          category === "awful" &&
          /terrible|horrible|dreadful/i.test(generatedJokeText)
        )
          relatedMatch = true;
        // Add more category-specific checks here...

        if (!relatedMatch) {
          console.warn(
            `\t   WARN (Attempt ${attempts}): Joke might not be relevant to category "${category}". Text: "${generatedJokeText}"`
          );
          // Decide whether to retry based on this warning. For now, let's proceed to similarity check,
          // but this warning indicates a potential issue. You could 'continue' here to force a retry.
        }
      }
      // *********************************************************************

      // --- 2. Check for Exact Duplicates ---
      if (existingJokes.includes(generatedJokeText)) {
        /* ... handle exact duplicate ... */ continue;
      }

      // --- 3. Semantic Similarity Check ---
      if (existingVectors.length === 0) {
        /* ... skip check ... */ unique = true;
      } else {
        // console.log(`\t   Checking similarity for: "${generatedJokeText}"`); // Maybe reduce logging verbosity
        const newJokeEmbeddingResponse = await ollama.embeddings({
          model: OLLAMA_EMBEDDING_MODEL,
          prompt: generatedJokeText,
        });
        const newJokeVector = newJokeEmbeddingResponse?.embedding;

        if (!newJokeVector) {
          /* ... handle embedding failure ... */ unique = true;
        } else {
          let maxSimilarity = 0;
          for (const existingVec of existingVectors) {
            const similarity = calculateCosineSimilarity(
              newJokeVector,
              existingVec
            );
            maxSimilarity = Math.max(maxSimilarity, similarity);
          }
          latestSimilarityScore = maxSimilarity;

          // console.log(`\t   Max similarity score: ${(maxSimilarity * 100).toFixed(1)}% ...`); // Reduce logging

          if (maxSimilarity < SIMILARITY_THRESHOLD) {
            unique = true; // Joke accepted!
          } else {
            console.warn(
              `\t   Joke rejected: Too similar (Score: ${(
                maxSimilarity * 100
              ).toFixed(1)}% >= ${SIMILARITY_THRESHOLD * 100}%).`
            );
            // Loop continues
          }
        }
      } // End similarity check
    } catch (error) {
      console.error(`\t   Error during attempt ${attempts}:`, error.message);
      if (
        error.cause?.code === "ECONNREFUSED" ||
        error.message?.includes("model not found")
      ) {
        /* ... handle critical ... */ break;
      }
    }
  } // End while loop

  // --- 4. Final Outcome ---
  if (!unique || !generatedJokeText) {
    console.error(
      `\t<- Failed to generate a unique/relevant joke for ${category} after ${MAX_RETRIES} attempts.`
    );
    return `Yo mama so ${category}, the LLM failed uniqueness/relevance checks! (${Math.random()
      .toString(36)
      .substring(7)})`; // Fallback
  }

  console.log(
    `\t<- Ollama generated unique joke for ${category}: "${generatedJokeText}"`
  );
  // Final sanitization for TS file insertion
  return generatedJokeText
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/"/g, '\\"');
}

/**
 * Updates the TypeScript file for a category by adding the new joke.
 */
function updateJokeFile(category, newJoke) {
  const filePath = path.join(JOKES_DIR, `${category}.ts`);
  console.log(`Updating file: ${filePath}`);
  try {
    let content = fs.readFileSync(filePath, "utf-8");

    // Find the index of the last closing square bracket ']'
    const lastBracketIndex = content.lastIndexOf("]");
    if (lastBracketIndex === -1) {
      // This shouldn't happen if the file structure is always correct, but good to check.
      console.error(
        `Could not find closing array bracket ']' in ${filePath}. Cannot add joke.`
      );
      return false;
    }

    const jokeToAdd = `\n  "${newJoke}",`; // Ensure proper indentation and trailing comma

    // Insert the formatted joke string right before the last closing bracket
    content =
      content.slice(0, lastBracketIndex) +
      jokeToAdd +
      content.slice(lastBracketIndex);

    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`Successfully added joke to ${category}.ts`);
    return true; // Indicate success
  } catch (error) {
    console.error(`Error updating file ${filePath}:`, error);
    return false; // Indicate failure
  }
}

/**
 * Updates the lastmod date in the sitemap.xml for the specified categories.
 */
function updateSitemap(updatedCategories) {
  console.log("\nUpdating sitemap.xml...");
  if (updatedCategories.length === 0) {
    console.log("No categories were updated, skipping sitemap update.");
    return;
  }

  try {
    let sitemapContent = fs.readFileSync(SITEMAP_PATH, "utf-8");
    const today = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD format

    let updatedCount = 0;
    for (const category of updatedCategories) {
      // Construct the expected <loc> content for the category page
      const locContent = `https://yomamajokescentral.com/jokes/${category}-yo-mama-jokes`;

      // Regex to find the <url> block for the specific category and update its <lastmod>
      // This regex is specific and might break if the structure changes significantly
      const urlBlockRegex = new RegExp(
        `(<url>\\s*<loc>${locContent.replace(
          /[-\/\\^$*+?.()|[\]{}]/g,
          "\\$&"
        )}<\\/loc>[\\s\\S]*?<lastmod>)[^<]+(<\\/lastmod>[\\s\\S]*?<\\/url>)`,
        "g"
      );

      let found = false;
      sitemapContent = sitemapContent.replace(
        urlBlockRegex,
        (match, prefix, suffix) => {
          found = true;
          updatedCount++;
          console.log(`  - Updating lastmod for ${category} to ${today}`);
          return `${prefix}${today}${suffix}`; // Replace content between <lastmod> tags
        }
      );

      if (!found) {
        console.warn(
          `  - Could not find URL entry for category '${category}' in sitemap.xml. URL checked: ${locContent}`
        );
      }
    }

    if (updatedCount > 0) {
      fs.writeFileSync(SITEMAP_PATH, sitemapContent, "utf-8");
      console.log(
        `Sitemap updated successfully for ${updatedCount} categories.`
      );
    } else {
      console.log("No matching categories found in sitemap to update.");
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
    console.log("Executing: git add --all");
    execSync("git add --all", { stdio: "inherit" }); // Show output

    console.log(`Executing: git commit -m "${GIT_COMMIT_MESSAGE}"`);
    execSync(`git commit -m "${GIT_COMMIT_MESSAGE}"`, { stdio: "inherit" });

    console.log("Executing: git push");
    execSync("git push", { stdio: "inherit" });

    console.log("\nGit commands executed successfully!");
  } catch (error) {
    console.error("\nError running Git commands:");
    console.error(
      "Please check your Git configuration, credentials, and staging area."
    );
    // The error output from execSync should provide more details above.
  }
}

// --- Main Execution ---
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("--- Yo Mama Joke Generator ---");

  // 1. Select random categories
  const selectedCategories = getRandomElements(
    ALL_CATEGORIES,
    NUM_CATEGORIES_TO_SELECT
  );
  if (selectedCategories.length === 0) {
    console.error("No categories selected. Exiting.");
    rl.close();
    return;
  }
  const numJokes = selectedCategories.length; // Store number of jokes for easy access

  const generatedJokes = {}; // Store as { category: joke }

  // 2. Generate initial jokes (using Promise.all for potential speed)
  console.log(
    `\nGenerating initial ${numJokes} jokes (using Ollama package)...`
  );
  await Promise.all(
    selectedCategories.map(async (category) => {
      const existing = getExistingJokes(category);
      generatedJokes[category] = await generateUniqueJokeLLM(
        category,
        existing
      );
    })
  );
  console.log("Initial generation complete.");

  // 3. Interaction Loop (Refresh/Confirm)
  let confirmed = false;
  while (!confirmed) {
    console.log("\n--- Generated Jokes ---");
    selectedCategories.forEach((category, index) => {
      const jokeText = generatedJokes[category] || "[Failed to generate]";
      console.log(`${index + 1}. [${category.padEnd(10)}] ${jokeText}`);
    });
    console.log("----------------------");

    // ***** Updated Prompt *****
    const answer = await rl.question(
      `Enter 'c' to confirm, 'r<numbers>' to refresh (e.g., r1,3,4), 'ra' to refresh all, or 'a' to abort: `
    );
    const command = answer.trim().toLowerCase();

    if (command === "c") {
      confirmed = true;
    } else if (command === "a") {
      console.log("Aborting operation. No files changed.");
      rl.close();
      return;
      // ***** Updated 'r' command handling for single or multiple indices *****
    } else if (command.startsWith("r") && command !== "ra") {
      const indexInputString = command.substring(1); // Get the part after 'r'
      if (!indexInputString) {
        console.log(
          "Invalid format. Please specify indices after 'r' (e.g., r1 or r1,3,4)."
        );
        continue; // Skip to next loop iteration
      }

      const indexStrings = indexInputString.split(",");
      const indicesToRefresh = new Set(); // Use a Set to automatically handle duplicates like r1,1,3
      let parseError = false;

      for (const str of indexStrings) {
        const trimmedStr = str.trim();
        if (trimmedStr === "") continue; // Allow for trailing commas like r1,3,

        const index = parseInt(trimmedStr, 10);
        // Validate: is it a number, and is it within the 1-based range?
        if (isNaN(index) || index < 1 || index > numJokes) {
          console.log(
            `Invalid index: '${trimmedStr}'. Please enter numbers between 1 and ${numJokes}.`
          );
          parseError = true;
          break; // Stop parsing on first error
        }
        indicesToRefresh.add(index - 1); // Add the 0-based index to the Set
      }

      if (!parseError && indicesToRefresh.size > 0) {
        const uniqueIndices = Array.from(indicesToRefresh); // Convert Set back to array
        console.log(
          `\nRefreshing joke(s) at index/indices: ${uniqueIndices
            .map((i) => i + 1)
            .join(", ")}...`
        );

        try {
          // Use Promise.all to run LLM calls concurrently
          await Promise.all(
            uniqueIndices.map(async (idx) => {
              const categoryToRefresh = selectedCategories[idx];
              console.log(` -> Refreshing: ${idx + 1}. ${categoryToRefresh}`);
              const existing = getExistingJokes(categoryToRefresh);
              // Pass existing from file + the current generated one to avoid immediate repetition
              const newJoke = await generateUniqueJokeLLM(
                categoryToRefresh,
                existing.concat(generatedJokes[categoryToRefresh] || [])
              );
              generatedJokes[categoryToRefresh] = newJoke; // Update the joke in our main object
            })
          );
          console.log("Selected joke(s) refreshed.");
        } catch (err) {
          // Although generateUniqueJokeLLM has internal error handling, catch potential issues from Promise.all
          console.error(
            "\nAn error occurred during the parallel refresh:",
            err
          );
        }
      } else if (!parseError && indicesToRefresh.size === 0) {
        console.log("No valid indices provided to refresh.");
      }
      // If parseError is true, the error message was already shown.
      // ****************************************************************
    } else if (command === "ra") {
      console.log(`\nRefreshing jokes for all ${numJokes} categories...`);
      try {
        // Use Promise.all for potentially faster refresh-all as well
        await Promise.all(
          selectedCategories.map(async (category, idx) => {
            console.log(` -> Refreshing: ${idx + 1}. ${category}`);
            const existing = getExistingJokes(category);
            const newJoke = await generateUniqueJokeLLM(
              category,
              existing.concat(generatedJokes[category] || [])
            );
            generatedJokes[category] = newJoke;
          })
        );
        console.log("All jokes refreshed.");
      } catch (err) {
        console.error(
          "\nAn error occurred during the 'refresh all' operation:",
          err
        );
      }
    } else {
      console.log(
        "Invalid command. Please use 'c', 'r<numbers>', 'ra', or 'a'."
      );
    }
  } // End while loop

  rl.close(); // Close readline interface

  // 4. Update files, sitemap, and run git commands (only if confirmed)
  console.log("\nConfirmation received. Processing updates...");
  // ... (The rest of the update/save/git logic remains the same) ...
  const successfullyUpdatedCategories = [];
  let anyFailed = false;
  for (const category of selectedCategories) {
    if (
      generatedJokes[category] &&
      !generatedJokes[category].startsWith("ERROR Yo mama so")
    ) {
      // Basic check for placeholder
      const success = updateJokeFile(category, generatedJokes[category]);
      if (success) {
        successfullyUpdatedCategories.push(category);
      } else {
        anyFailed = true;
      }
    } else {
      console.warn(
        `Skipping file update for category '${category}' due to generation failure or placeholder content.`
      );
      anyFailed = true;
    }
  }
  if (successfullyUpdatedCategories.length > 0) {
    updateSitemap(successfullyUpdatedCategories);
    if (!anyFailed) {
      runGitCommands();
    } else {
      console.warn(
        "\nSkipping Git commands because one or more jokes failed to generate or save correctly."
      );
    }
  } else {
    console.log(
      "\nNo jokes were successfully updated. Skipping sitemap and Git commands."
    );
  }
  console.log("\n--- Process Complete ---");
}

// Run the main function
main().catch((error) => {
  console.error("\nAn unexpected error occurred:", error);
  process.exit(1); // Exit with error code
});
