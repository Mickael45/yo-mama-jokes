const { Ollama } = require("ollama");
const { Agent, fetch: undiciFetch } = require("undici");

// CPU-only inference of a ~24GB model can take >20 min, and a cold model load
// alone can exceed undici's default 300s headers timeout before the first byte
// arrives — which crashes the run with UND_ERR_HEADERS_TIMEOUT. Disable both
// timeouts (0 = no timeout) so generation is never killed mid-flight.
const noTimeoutDispatcher = new Agent({ headersTimeout: 0, bodyTimeout: 0 });
const patientFetch = (url, opts = {}) =>
  undiciFetch(url, { ...opts, dispatcher: noTimeoutDispatcher });

function createOllama({ host, ollamaHost, model, embeddingModel }) {
  const resolvedHost = host || ollamaHost || "http://127.0.0.1:11434";
  const client = new Ollama({ host: resolvedHost, fetch: patientFetch });
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
