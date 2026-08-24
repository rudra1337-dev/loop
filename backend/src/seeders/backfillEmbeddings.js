/**
 * One-time backfill: generates embeddings for any Feedback rows that don't
 * already have one (pre-existing seed data, or data ingested before Ask LOOP
 * shipped). Safe to re-run — it only processes feedback missing an
 * Embedding, so running it twice is a no-op the second time.
 *
 * Usage: npm run backfill-embeddings   (from backend/)
 */
import { sequelize, Feedback, Embedding } from '../models/index.js';
import { embedAndStoreFeedback } from '../services/embedding.service.js';

const BATCH_SIZE = 25; // fetched from DB in pages, not all at once
const DELAY_MS = 150;  // small pause between items — rate-limit safety, same spirit as sequential CSV processing

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  await sequelize.authenticate();
  console.log('[Backfill] Connected to database.');

  let totalProcessed = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;

  while (true) {
    // Find feedback with no associated Embedding row, one page at a time.
    const batch = await Feedback.findAll({
      include: [{
        model: Embedding,
        required: false,
      }],
      where: sequelize.where(sequelize.col('Embedding.id'), null),
      limit: BATCH_SIZE,
      subQuery: false,
    });

    if (batch.length === 0) break;

    for (const feedback of batch) {
      totalProcessed++;
      const result = await embedAndStoreFeedback(feedback);
      if (result) {
        totalSucceeded++;
      } else {
        totalFailed++;
        console.warn(`[Backfill] Failed to embed feedback ${feedback.id} (workspace ${feedback.workspaceId})`);
      }

      if (totalProcessed % 10 === 0) {
        console.log(`[Backfill] Progress: ${totalProcessed} processed (${totalSucceeded} ok, ${totalFailed} failed)`);
      }

      await sleep(DELAY_MS);
    }
  }

  console.log('[Backfill] Done.');
  console.log(`[Backfill] Total: ${totalProcessed} processed, ${totalSucceeded} succeeded, ${totalFailed} failed.`);

  if (totalFailed > 0) {
    console.log('[Backfill] Re-run this script to retry failed items — it only targets feedback still missing an embedding.');
  }

  await sequelize.close();
  process.exit(totalFailed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('[Backfill] Fatal error:', err);
  process.exit(1);
});