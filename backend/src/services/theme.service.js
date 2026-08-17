import { Theme, FeedbackTheme } from '../models/index.js';
import { matchThemeByKeywords, pickRandomFallbackTheme } from '../utils/themeMatcher.js';

/**
 * Automatically assigns themes to a batch of feedback records.
 * Called by every ingestion path (manual, CSV, simulated channel) so
 * theme assignment stays consistent no matter how feedback enters the system.
 */
export async function assignThemesToFeedbacks(feedbacks, workspaceId) {
  const themes = await Theme.findAll({ where: { workspaceId } });
  if (themes.length === 0) return;

  const feedbackThemesToCreate = [];

  for (const item of feedbacks) {
    const keywordMatch = matchThemeByKeywords(item.content, themes);
    const matchedTheme = keywordMatch || pickRandomFallbackTheme(themes);
    if (!matchedTheme) continue;

    feedbackThemesToCreate.push({
      feedbackId: item.id,
      themeId: matchedTheme.id,
      confidence: keywordMatch ? 1.0 : 0.3,
    });
  }

  if (feedbackThemesToCreate.length > 0) {
    await FeedbackTheme.bulkCreate(feedbackThemesToCreate);
  }
}