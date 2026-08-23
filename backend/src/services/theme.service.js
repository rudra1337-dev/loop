import { Theme, FeedbackTheme } from '../models/index.js';
import { getNextThemeColor } from '../utils/themeColors.js';

/**
 * Theme Service
 *
 * Owns all Theme/FeedbackTheme persistence so controllers never touch those
 * models directly — matches this project's controllers-are-thin-HTTP-layers
 * convention. Also owns the in-memory theme cache pattern used during batch
 * ingestion, so e.g. a 120-row CSV doesn't create 120 near-duplicate "new"
 * themes for what's really the same underlying topic.
 */

export async function getWorkspaceThemes(workspaceId) {
  return Theme.findAll({ where: { workspaceId } });
}

/**
 * Finds an existing theme by name (case-insensitive) in the given cache, or
 * creates a new one if nothing matches — regardless of what the classifier's
 * `isNew` flag claimed. Checking the cache directly (rather than trusting
 * the classifier's own new/existing judgment) protects against a model that
 * proposes a name close to, but not exactly matching, one already on the
 * list — and also handles the case where a caller explicitly overrides the
 * theme name with something that already exists.
 *
 * Mutates `themesCache` in place when a new theme is created, so subsequent
 * calls in the same batch see it and don't create a duplicate.
 *
 * NOTE: two concurrent requests each proposing a brand-new theme with the
 * same name (e.g. two ingestion requests racing at once) can still both
 * pass this in-memory check and create duplicate Theme rows, since there's
 * no DB-level unique constraint on (workspaceId, name). Not fixed here —
 * worth a follow-up if this becomes a real issue in practice.
 */
export async function resolveTheme(themeData, themesCache, workspaceId) {
  if (!themeData || !themeData.name) return null;

  const normalizedName = themeData.name.trim();
  const existing = themesCache.find(
    (t) => t.name.toLowerCase() === normalizedName.toLowerCase()
  );
  if (existing) return existing;

  const created = await Theme.create({
    name: normalizedName,
    description: themeData.description || null,
    color: getNextThemeColor(themesCache.length),
    workspaceId,
  });
  themesCache.push(created);
  return created;
}

/**
 * Resolves and attaches a theme to a single already-created feedback item.
 * Used by ingestSingle and by reclassifyFeedbacks.
 *
 * Returns { theme, feedbackTheme } (not just the join row) so callers that
 * need to report back the theme's name/color — e.g. the reclassify response,
 * which has to tell the frontend what the new theme actually is — don't
 * need a second lookup.
 */
export async function attachThemeToFeedback(feedbackId, themeData, themesCache, workspaceId) {
  const resolved = await resolveTheme(themeData, themesCache, workspaceId);
  if (!resolved) return null;

  const feedbackTheme = await FeedbackTheme.create({
    feedbackId,
    themeId: resolved.id,
    confidence: themeData.confidence ?? 0.5,
  });

  return { theme: resolved, feedbackTheme };
}

/**
 * Bulk version for CSV/channel ingestion: given the Feedback rows Sequelize
 * just bulkCreate'd (in the same order as `themeResolutions`) and the theme
 * resolution already computed per row during classification, builds and
 * bulk-inserts all the FeedbackTheme join rows in a single query.
 *
 * @param {object[]} createdFeedbacks - result of Feedback.bulkCreate(), same order as themeResolutions
 * @param {({themeId: string, confidence: number}|null)[]} themeResolutions
 */
export async function attachResolvedThemesToFeedbacks(createdFeedbacks, themeResolutions) {
  const rows = createdFeedbacks
    .map((fb, idx) => {
      const resolution = themeResolutions[idx];
      if (!resolution) return null;
      return { feedbackId: fb.id, themeId: resolution.themeId, confidence: resolution.confidence };
    })
    .filter(Boolean);

  if (rows.length > 0) {
    await FeedbackTheme.bulkCreate(rows);
  }
}

/**
 * Deletes any theme in the given id list that no longer has any feedback
 * attached to it. Intended to run once, after a full reclassify batch
 * finishes — not per-item mid-loop — since two items in the same batch
 * could share an old theme; deleting it after the first item would orphan
 * the second item's data before that item even runs.
 */
export async function cleanupOrphanedThemes(themeIds) {
  for (const themeId of themeIds) {
    const remaining = await FeedbackTheme.count({ where: { themeId } });
    if (remaining === 0) {
      await Theme.destroy({ where: { id: themeId } });
    }
  }
}