const { Ollama } = require("ollama");

function createOllama({ host, model, embeddingModel }) {
  const client = new Ollama({ host });
  return {
    model,
    chat: (args) => client.chat(args),
    embed: async (text) => {
      const res = await client.embeddings({ model: embeddingModel, prompt: text });
      return res.embedding;
    },
  };
}

module.exports = { createOllama };
