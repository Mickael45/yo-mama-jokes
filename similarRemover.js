const fs = require('fs').promises;
const path = require('path');
const { Ollama } = require('ollama');

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

async function processArrayInFile(filePath, processFunction) {
  try {
    // 1. Dynamic import the file
    const module = await import(path.resolve(filePath));
    let array = module.default;

    if (!Array.isArray(array)) {
      console.error('Default export is not an array.');
      return;
    }

    // 2. Process the array
    array = await processFunction(array);

    // 3. Generate the updated content
    const updatedContent = `export default ${JSON.parse(array)};\n`;

    // 4. Write the updated content back to the file
    await fs.writeFile(filePath, updatedContent, 'utf8');

    console.log('File updated successfully.');
  } catch (error) {
    console.error('Error processing file:', error);
  }
}
const removeSimilarJokes = async (jokes) => {
    try {
        const ollamaPayload = {
            model: 'llama3.2:3b-instruct-q8_0',
            messages: [{
                role: 'user',
                content: `
                I need you to parse a list for strings that have the same meaning.
                The meaning of those remains the same, there's just a bit changing
                
                "Yo mama so silly, she put airbags on her computer in case it crashed.",
                "Yo mama so dumb, she put airbags on her computer in case it crashed.",
                "Your momma is so stupid she put airbags on her computer in case it crashed.",

                I want you to output a JSON string array version of the list without duplicates.
                I don't want any code, any script or whatever, just the list of curated elements in JSON string array.
                I don't want any comment, what you return me MUST BE a list of jokes in JSON string array.
              
                Here's the list to parse: ${jokes}.
                `,
            }]
        };
        const ollamaResponse = await ollama.chat(ollamaPayload);
        let text = ollamaResponse.message.content;
        console.log(ollamaResponse.message)
        return text
    } catch (error) {
        console.error("Ollama API error (ollama package):", error);
    }
}

async function main() {
    const filePath = './test.js'; // Replace with your file path
  
    const result = await processArrayInFile(filePath, removeSimilarJokes); //use one of the process functions.

    console.log(result)
}
  
  main();