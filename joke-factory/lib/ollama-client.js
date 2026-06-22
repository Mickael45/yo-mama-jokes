const { Ollama } = require("ollama");

function createOllama({ host, ollamaHost, model, embeddingModel }) {
  const resolvedHost = host || ollamaHost || "http://127.0.0.1:11434";
  const client = new Ollama({ host: resolvedHost });
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
