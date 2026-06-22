function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return Math.max(-1, Math.min(1, dot / (Math.sqrt(magA) * Math.sqrt(magB))));
}

async function filterNovel({ candidates, existingJokes, embed, threshold = 0.84 }) {
  const refVectors = [];
  for (const j of existingJokes) {
    try { refVectors.push(await embed(j)); } catch (_) { /* skip */ }
  }

  const novel = [];
  const rejected = [];
  for (const cand of candidates) {
    let vec = null;
    try { vec = await embed(cand); } catch (_) { vec = null; }
    if (!vec) { rejected.push({ joke: cand, reason: "embed-failed" }); continue; }

    let maxSim = 0, closest = null;
    for (const rv of refVectors) {
      const s = cosineSimilarity(vec, rv);
      if (s > maxSim) { maxSim = s; }
    }
    if (maxSim >= threshold) {
      rejected.push({ joke: cand, reason: "duplicate", score: maxSim, closest });
    } else {
      novel.push(cand);
      refVectors.push(vec); // guard against intra-batch dupes
    }
  }
  return { novel, rejected };
}

module.exports = { cosineSimilarity, filterNovel };
