import { Embedding, Feedback } from '../models/index.js';

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Workspace-scoped semantic retrieval. workspaceId MUST come from the
 * authenticated session — never from the request body — so this function
 * intentionally only accepts it as a plain argument, forcing the caller
 * (ask.service) to supply it from req.user.
 */
export async function retrieveRelevantFeedback(questionEmbedding, workspaceId, { topK = 5, minSimilarity = 0.35 } = {}) {
  const embeddings = await Embedding.findAll({
    include: [{
      model: Feedback,
      where: { workspaceId },
      attributes: ['id', 'content', 'channel', 'sentiment', 'sentimentScore', 'status', 'createdAt'],
    }],
  });

  const scored = embeddings
    .filter((e) => e.Feedback && Array.isArray(e.vector))
    .map((e) => ({ feedback: e.Feedback, similarity: cosineSimilarity(questionEmbedding, e.vector) }))
    .sort((a, b) => b.similarity - a.similarity);

  const top = scored.slice(0, topK);
  const relevant = top.filter((r) => r.similarity >= minSimilarity);

  return { top, relevant };
}