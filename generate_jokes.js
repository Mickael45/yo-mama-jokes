// Import necessary Node.js modules
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline/promises'); // For user interaction
const { Ollama } = require('ollama');

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

// --- Configuration ---
const JOKES_DIR = path.join('./jokes');
const SITEMAP_PATH = path.join('./public', 'sitemap.xml');
const NUM_CATEGORIES_TO_SELECT = 5;
const GIT_COMMIT_MESSAGE = "New jokes created";

// --- Available Categories (assuming file names match categories) ---
const ALL_CATEGORIES = [
    'awful', 'bald', 'clumsy', 'dirty', 'dumb', 'entitled', 'evil',
    'fat', 'greedy', 'hairy', 'lazy', 'loud', 'nasty', 'old',
    'poor', 'scary', 'short', 'skinny', 'tall', 'ugly'
]; // Or dynamically read from JOKES_DIR if preferred

// --- Helper Functions ---

/**
 * Selects N random elements from an array without repetition.
 */
function getRandomElements(arr, n) {
    if (n > arr.length) {
        console.warn("Requested more elements than available. Returning all elements.");
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
        const content = fs.readFileSync(filePath, 'utf-8');
        // Basic extraction assuming standard format 'export default ["joke1", "joke2"];'
        const match = content.match(/export default\s*(\[[\s\S]*?\]);?/);
        if (match && match[1]) {
            // Use Function constructor for safe evaluation of the array literal
            // It's generally safer than eval() for parsing known structures
            try {
                const jokesArray = new Function(`return ${match[1]};`)();
                if (Array.isArray(jokesArray)) {
                    return jokesArray.map(j => String(j)); // Ensure all are strings
                }
            } catch (parseError) {
                console.error(`Error parsing jokes array in ${filePath}:`, parseError);
                return []; // Return empty on parse failure
            }
        }
        console.warn(`Could not extract jokes array from ${filePath}. Assuming empty.`);
        return [];
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return []; // Return empty if file read fails
    }
}


async function generateUniqueJokeLLM(category, existingJokes) {
      // --- Configuration ---
      const OLLAMA_MODEL = 'mistral:7b'; // Use environment variable or default (e.g., 'mistral:7b')
      const MAX_RETRIES = 3; // Max attempts to get a unique joke
  
      console.log(`\t-> Calling Ollama (${OLLAMA_MODEL}) for category: ${category}...`);
  
      // Select a small sample of existing jokes to provide context
      const existingJokesSample = existingJokes
          .map(j => `- ${j}`) // Format as a list
          .join('\n');
  
      // Construct the prompt for the LLM
      const prompt = `Generate one short, funny, and truly original yo mama joke.
The joke must be directly inspired by the category: "${category}".

Allowed starting phrases include "Yo mama", "Your mom", "Yo mama is so", "Yo mama's so", or similar common variations naturally fitting the joke's structure.

Maintain a classic yo mama joke vibe - witty and humorous. The joke should be concise, typically 1-2 sentences.

Most importantly, ensure the joke is unique and significantly different from these existing examples provided for context:
${existingJokesSample || "(No existing examples provided for this category yet)"}

CRITICAL OUTPUT INSTRUCTION: Generate *only* the final joke text itself. Do *not* include:
- Any surrounding quotation marks ("").
- Any introduction like "Here's a joke:".
- Any labels or list numbers (like "1.").
- Any explanations or commentary about the joke.
Just the raw joke text.`;
  
  let attempts = 0;
  let newJoke = '';
  let unique = false;

  while (attempts < MAX_RETRIES && !unique) {
      attempts++;
      if (attempts > 1) {
          console.log(`\t   Attempt ${attempts}: Regenerating due to non-uniqueness or error...`);
          // Add a small delay before retrying
          await new Promise(resolve => setTimeout(resolve, 200 * attempts));
      }

      try {
          // --- Use ollama.generate from the package ---
          const response = await ollama.generate({ // **** KEY CHANGE: Use the package method ****
              model: OLLAMA_MODEL,
              prompt: attempts > 1 ? `${prompt}\n\nAvoid generating a joke similar to: "${newJoke}"` : prompt,
              stream: false, // Get the full response object at once
               options: { // Pass options here
                  temperature: 0.8, // Adjust creativity
                  num_predict: 60,   // Limit response length
                  stop: ["\n", "\""] // Attempt to stop extraneous output
              }
          });
          // --- Package call finished ---

          // Extract the joke from the package's response structure
          if (response && response.response) { // **** Package typically returns { response: 'text', ... } ****
               newJoke = response.response
                            .trim() // Remove leading/trailing whitespace
                            .replace(/^"|"$/g, '') // Remove surrounding quotes if added
                            // .replace(/^Joke: /i, ''); // Remove potential prefixes if needed

              // Basic uniqueness check (exact match)
               if (!existingJokes.includes(newJoke) && newJoke.toLowerCase().includes(category)) { // Also check if category seems present
                  unique = true;
              } else {
                   if (existingJokes.includes(newJoke)) {
                      console.warn(`\t   Duplicate detected (Attempt ${attempts}): "${newJoke}"`);
                   } else {
                      // Optional: Warn if the category doesn't seem present in the response
                      console.warn(`\t   Generated joke might not relate well to category "${category}" (Attempt ${attempts}): "${newJoke}"`);
                       // Decide if you accept it anyway if it's unique
                       if (!existingJokes.includes(newJoke)) unique = true; // Accept if unique, even if maybe off-topic
                   }
              }
          } else {
               console.error(`\t   Ollama package response format unexpected (Attempt ${attempts}):`, response);
               newJoke = ''; // Reset joke on format error
          }

      } catch (error) {
          console.error(`\t   Error using ollama package (Attempt ${attempts}):`, error.message);
           // Check for common errors from the package
          if (error.message && error.message.includes('ECONNREFUSED')) {
               console.error(`\t   >>> Is the Ollama server running? The 'ollama' package could not connect.`);
               // Stop retrying if connection is refused
               break;
           }
          if (error.message && error.message.includes('model not found')) {
               console.error(`\t   >>> Model "${OLLAMA_MODEL}" not found. Make sure you have run 'ollama pull ${OLLAMA_MODEL}'.`);
               // Stop retrying if model is missing
               break;
           }
          newJoke = ''; // Reset joke on other errors
      }
  } // End while loop

  if (!unique || !newJoke) {
      console.error(`\t<- Failed to generate a unique joke for ${category} after ${MAX_RETRIES} attempts.`);
      // Return a fallback or throw an error - returning placeholder for now
      return `ERROR Yo mama so ${category}, the LLM couldn't think of a joke! (${Math.random().toString(36).substring(7)})`;
  }

  console.log(`\t<- Ollama (${OLLAMA_MODEL}) generated via package for ${category}: "${newJoke}"`);
  // Basic sanitization: escape backticks and double quotes for file writing
  return newJoke.replace(/`/g, '\\`').replace(/"/g, '\\"');
}


/**
 * Updates the TypeScript file for a category by adding the new joke.
 */
function updateJokeFile(category, newJoke) {
    const filePath = path.join(JOKES_DIR, `${category}.ts`);
    console.log(`Updating file: ${filePath}`);
    try {
        let content = fs.readFileSync(filePath, 'utf-8');
        // Find the last closing bracket ']' of the array
        const lastBracketIndex = content.lastIndexOf(']');
        if (lastBracketIndex === -1) {
            console.error(`Could not find closing array bracket ']' in ${filePath}. Cannot add joke.`);
            return false; // Indicate failure
        }

        content = content.slice(0, lastBracketIndex) + newJoke + content.slice(lastBracketIndex);

        fs.writeFileSync(filePath, content, 'utf-8');
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
        let sitemapContent = fs.readFileSync(SITEMAP_PATH, 'utf-8');
        const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format

        let updatedCount = 0;
        for (const category of updatedCategories) {
            // Construct the expected <loc> content for the category page
            const locContent = `https://yomamajokescentral.com/jokes/${category}-yo-mama-jokes`;

            // Regex to find the <url> block for the specific category and update its <lastmod>
            // This regex is specific and might break if the structure changes significantly
            const urlBlockRegex = new RegExp(
                `(<url>\\s*<loc>${locContent.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}<\\/loc>[\\s\\S]*?<lastmod>)[^<]+(<\\/lastmod>[\\s\\S]*?<\\/url>)`,
                'g'
            );

            let found = false;
            sitemapContent = sitemapContent.replace(urlBlockRegex, (match, prefix, suffix) => {
                found = true;
                updatedCount++;
                console.log(`  - Updating lastmod for ${category} to ${today}`);
                return `${prefix}${today}${suffix}`; // Replace content between <lastmod> tags
            });

            if (!found) {
                 console.warn(`  - Could not find URL entry for category '${category}' in sitemap.xml. URL checked: ${locContent}`);
            }
        }

        if (updatedCount > 0) {
            fs.writeFileSync(SITEMAP_PATH, sitemapContent, 'utf-8');
            console.log(`Sitemap updated successfully for ${updatedCount} categories.`);
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
        execSync('git add --all', { stdio: 'inherit' }); // Show output

        console.log(`Executing: git commit -m "${GIT_COMMIT_MESSAGE}"`);
        execSync(`git commit -m "${GIT_COMMIT_MESSAGE}"`, { stdio: 'inherit' });

        console.log("Executing: git push");
        execSync('git push', { stdio: 'inherit' });

        console.log("\nGit commands executed successfully!");
    } catch (error) {
        console.error("\nError running Git commands:");
        console.error("Please check your Git configuration, credentials, and staging area.");
        // The error output from execSync should provide more details above.
    }
}

// --- Main Execution ---
async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("--- Yo Mama Joke Generator ---");

    // 1. Select random categories
    const selectedCategories = getRandomElements(ALL_CATEGORIES, NUM_CATEGORIES_TO_SELECT);
    if (selectedCategories.length === 0) {
        console.error("No categories selected. Exiting.");
        rl.close();
        return;
    }
    const numJokes = selectedCategories.length; // Store number of jokes for easy access

    const generatedJokes = {}; // Store as { category: joke }

    // 2. Generate initial jokes (using Promise.all for potential speed)
    console.log(`\nGenerating initial ${numJokes} jokes (using Ollama package)...`);
    await Promise.all(selectedCategories.map(async (category) => {
        const existing = getExistingJokes(category);
        generatedJokes[category] = await generateUniqueJokeLLM(category, existing);
    }));
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
        const answer = await rl.question(`Enter 'c' to confirm, 'r<numbers>' to refresh (e.g., r1,3,4), 'ra' to refresh all, or 'a' to abort: `);
        const command = answer.trim().toLowerCase();

        if (command === 'c') {
            confirmed = true;
        } else if (command === 'a') {
            console.log("Aborting operation. No files changed.");
            rl.close();
            return;
        // ***** Updated 'r' command handling for single or multiple indices *****
        } else if (command.startsWith('r') && command !== 'ra') {
            const indexInputString = command.substring(1); // Get the part after 'r'
            if (!indexInputString) {
                 console.log("Invalid format. Please specify indices after 'r' (e.g., r1 or r1,3,4).");
                 continue; // Skip to next loop iteration
            }

            const indexStrings = indexInputString.split(',');
            const indicesToRefresh = new Set(); // Use a Set to automatically handle duplicates like r1,1,3
            let parseError = false;

            for (const str of indexStrings) {
                const trimmedStr = str.trim();
                if (trimmedStr === '') continue; // Allow for trailing commas like r1,3,

                const index = parseInt(trimmedStr, 10);
                // Validate: is it a number, and is it within the 1-based range?
                if (isNaN(index) || index < 1 || index > numJokes) {
                    console.log(`Invalid index: '${trimmedStr}'. Please enter numbers between 1 and ${numJokes}.`);
                    parseError = true;
                    break; // Stop parsing on first error
                }
                indicesToRefresh.add(index - 1); // Add the 0-based index to the Set
            }

            if (!parseError && indicesToRefresh.size > 0) {
                const uniqueIndices = Array.from(indicesToRefresh); // Convert Set back to array
                console.log(`\nRefreshing joke(s) at index/indices: ${uniqueIndices.map(i => i + 1).join(', ')}...`);

                try {
                    // Use Promise.all to run LLM calls concurrently
                    await Promise.all(uniqueIndices.map(async (idx) => {
                        const categoryToRefresh = selectedCategories[idx];
                        console.log(` -> Refreshing: ${idx + 1}. ${categoryToRefresh}`);
                        const existing = getExistingJokes(categoryToRefresh);
                        // Pass existing from file + the current generated one to avoid immediate repetition
                        const newJoke = await generateUniqueJokeLLM(categoryToRefresh, existing.concat(generatedJokes[categoryToRefresh] || []));
                        generatedJokes[categoryToRefresh] = newJoke; // Update the joke in our main object
                    }));
                    console.log("Selected joke(s) refreshed.");
                } catch (err) {
                     // Although generateUniqueJokeLLM has internal error handling, catch potential issues from Promise.all
                     console.error("\nAn error occurred during the parallel refresh:", err);
                }

            } else if (!parseError && indicesToRefresh.size === 0) {
                 console.log("No valid indices provided to refresh.");
            }
            // If parseError is true, the error message was already shown.
        // ****************************************************************
        } else if (command === 'ra') {
            console.log(`\nRefreshing jokes for all ${numJokes} categories...`);
            try {
                 // Use Promise.all for potentially faster refresh-all as well
                 await Promise.all(selectedCategories.map(async (category, idx) => {
                     console.log(` -> Refreshing: ${idx + 1}. ${category}`);
                     const existing = getExistingJokes(category);
                     const newJoke = await generateUniqueJokeLLM(category, existing.concat(generatedJokes[category] || []));
                     generatedJokes[category] = newJoke;
                 }));
                 console.log("All jokes refreshed.");
            } catch (err) {
                 console.error("\nAn error occurred during the 'refresh all' operation:", err);
            }
        } else {
            console.log("Invalid command. Please use 'c', 'r<numbers>', 'ra', or 'a'.");
        }
    } // End while loop

    rl.close(); // Close readline interface

    // 4. Update files, sitemap, and run git commands (only if confirmed)
    console.log("\nConfirmation received. Processing updates...");
    // ... (The rest of the update/save/git logic remains the same) ...
    const successfullyUpdatedCategories = [];
    let anyFailed = false;
    for (const category of selectedCategories) {
         if (generatedJokes[category] && !generatedJokes[category].startsWith('ERROR Yo mama so')) { // Basic check for placeholder
            const success = updateJokeFile(category, generatedJokes[category]);
            if (success) {
                successfullyUpdatedCategories.push(category);
            } else {
                 anyFailed = true;
            }
         } else {
             console.warn(`Skipping file update for category '${category}' due to generation failure or placeholder content.`);
             anyFailed = true;
         }
    }
    if (successfullyUpdatedCategories.length > 0) {
         updateSitemap(successfullyUpdatedCategories);
         if (!anyFailed) {
             runGitCommands();
         } else {
             console.warn("\nSkipping Git commands because one or more jokes failed to generate or save correctly.");
         }
    } else {
         console.log("\nNo jokes were successfully updated. Skipping sitemap and Git commands.");
    }
    console.log("\n--- Process Complete ---");
}

// Run the main function
main().catch(error => {
    console.error("\nAn unexpected error occurred:", error);
    process.exit(1); // Exit with error code
});