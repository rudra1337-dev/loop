import { Feedback, FeedbackTheme, Theme, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import { classifyFeedback } from '../utils/ai.js';
import { getWorkspaceThemes, attachThemeToFeedback, cleanupOrphanedThemes } from '../services/theme.service.js';

/**
 * Get feedback items for the current workspace with pagination, search, and filters.
 */
export const getFeedbacks = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const { page = 1, limit = 10, search = '', channel, sentiment, status, theme, from, to } = req.query;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedPage) || parsedPage <= 0) {
      return res.status(400).json({ error: 'Page must be a positive integer' });
    }
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ error: 'Limit must be a positive integer' });
    }

    const validStatuses = ['NEW', 'REVIEWED', 'ACTIONED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const validSentiments = ['POS', 'NEU', 'NEG'];
    if (sentiment && !validSentiments.includes(sentiment)) {
      return res.status(400).json({ error: 'Invalid sentiment value' });
    }

    if (from && isNaN(Date.parse(from))) {
      return res.status(400).json({ error: 'Invalid "from" date format' });
    }
    if (to && isNaN(Date.parse(to))) {
      return res.status(400).json({ error: 'Invalid "to" date format' });
    }

    const offset = (parsedPage - 1) * parsedLimit;
    const whereClause = { workspaceId };

    if (search && search.trim() !== '') {
      whereClause.content = { [Op.like]: `%${search.trim()}%` };
    }
    if (channel) whereClause.channel = channel;
    if (sentiment) whereClause.sentiment = sentiment;
    if (status) whereClause.status = status;
    if (from || to) {
      whereClause.createdAt = {};
      if (from) whereClause.createdAt[Op.gte] = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        whereClause.createdAt[Op.lte] = toDate;
      }
    }

    const includeOptions = [
      theme
        ? { model: Theme, where: { name: theme }, through: { attributes: [] }, required: true }
        : { model: Theme, through: { attributes: [] }, required: false },
    ];

    const { rows: feedbacks, count } = await Feedback.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      limit: parsedLimit,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    res.json({
      success: true,
      data: feedbacks,
      feedbacks,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: count,
        totalPages: Math.ceil(count / parsedLimit),
        currentPage: parsedPage,
        totalItems: count,
      },
    });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ error: 'Failed to retrieve feedbacks' });
  }
};

/**
 * Delete a specific feedback item.
 */
export const deleteFeedback = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const { id } = req.params;

    const feedback = await Feedback.findOne({ where: { id, workspaceId } });
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback item not found in this workspace' });
    }

    await feedback.destroy();
    res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
};

/**
 * Update the status of a specific feedback item.
 */
export const updateStatus = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['NEW', 'REVIEWED', 'ACTIONED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const feedback = await Feedback.findOne({ where: { id, workspaceId } });
    if (!feedback) {
      return res.status(404).json({ error: 'Feedback item not found' });
    }

    feedback.status = status;
    await feedback.save();

    res.json({ success: true, message: 'Feedback status updated successfully', feedback });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({ error: 'Failed to update feedback status' });
  }
};

/**
 * Re-runs AI classification (sentiment + theme, together) for one or more
 * feedback items, ignoring their current stored values entirely — this is
 * a fresh opinion, not a merge with whatever's already saved. Works
 * identically for a single id or many, per the "one endpoint, no separate
 * bulk concept" decision (POST /api/feedback/reclassify, { feedbackIds }).
 *
 * Processes items sequentially rather than in parallel — protects Gemini
 * rate limits on a large selection, same reasoning as the existing
 * sequential-CSV-processing tradeoff elsewhere in this codebase.
 */
export const reclassifyFeedbacks = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const { feedbackIds } = req.body;

    if (!Array.isArray(feedbackIds) || feedbackIds.length === 0) {
      return res.status(400).json({ error: 'feedbackIds must be a non-empty array' });
    }

    // Workspace-scoped — any id belonging to another workspace is silently
    // dropped from the batch rather than erroring the whole request, same
    // "404 not 403" tenant-isolation convention used elsewhere.
    const feedbacks = await Feedback.findAll({
      where: { id: { [Op.in]: feedbackIds }, workspaceId },
    });

    if (feedbacks.length === 0) {
      return res.status(404).json({ error: 'No matching feedback found in this workspace' });
    }

    // Fetched once for the whole batch, not once per item — same pattern as
    // ingestion, and mutated in place by attachThemeToFeedback if any item
    // in this batch proposes a genuinely new theme.
    const themesCache = await getWorkspaceThemes(workspaceId);

    const results = [];
    const errors = [];
    const previousThemeIds = new Set();

    for (const feedback of feedbacks) {
      try {
        const existingLinks = await FeedbackTheme.findAll({ where: { feedbackId: feedback.id } });
        existingLinks.forEach((link) => previousThemeIds.add(link.themeId));

        const classification = await classifyFeedback(feedback.content, themesCache);

        feedback.sentiment = classification.sentiment;
        feedback.sentimentScore = parseFloat(classification.sentimentScore);
        await feedback.save();

        if (existingLinks.length > 0) {
          await FeedbackTheme.destroy({ where: { feedbackId: feedback.id } });
        }

        const attached = await attachThemeToFeedback(feedback.id, classification.theme, themesCache, workspaceId);

        results.push({
          feedbackId: feedback.id,
          sentiment: feedback.sentiment,
          sentimentScore: feedback.sentimentScore,
          theme: attached
            ? {
                id: attached.theme.id,
                name: attached.theme.name,
                color: attached.theme.color,
                confidence: attached.feedbackTheme.confidence,
              }
            : null,
        });
      } catch (err) {
        console.error(`Failed to reclassify feedback ${feedback.id}:`, err);
        errors.push({ feedbackId: feedback.id, error: err.message || 'Reclassification failed' });
      }
    }

    // Run once after the full batch, not mid-loop — two items in this same
    // batch could have shared an old theme, so checking per-item would risk
    // deleting a theme item #2 still needed before item #2 even runs.
    if (previousThemeIds.size > 0) {
      await cleanupOrphanedThemes([...previousThemeIds]);
    }

    res.json({
      success: true,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error reclassifying feedback:', error);
    res.status(500).json({ error: 'Failed to reclassify feedback' });
  }
};