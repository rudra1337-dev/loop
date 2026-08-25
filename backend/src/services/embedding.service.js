import { Embedding } from '../models/index.js';
import { generateEmbedding } from '../utils/ai.js';

/**
 * Embeds a single feedback item's content and stores it. Never throws —
 * embedding failure must never block or fail the feedback save it's
 * attached to, same philosophy as theme-assignment failures elsewhere.
 */
export async function embedAndStoreFeedback(feedback) {
  const vector = await generateEmbedding(feedback.content);
  if (!vector) return null;

  try {
    return await Embedding.create({ feedbackId: feedback.id, vector });
  } catch (err) {
    console.error('[Embedding] Failed to store embedding for feedback', feedback.id, err.message);
    return null;
  }
}

/**
 * Sequential batch embedding — mirrors the sequential CSV classification
 * loop (rate-limit safety over parallel throughput).
 */
export async function embedAndStoreFeedbackBatch(feedbacks) {
  const results = [];
  for (const fb of feedbacks) {
    results.push(await embedAndStoreFeedback(fb));
  }
  return results;
}