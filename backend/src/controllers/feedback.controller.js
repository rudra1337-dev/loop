import { Feedback, Theme, FeedbackTheme, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import fs from 'fs';
import csvParser from 'csv-parser';
import { analyzeFeedbackSentiment } from '../utils/ai.js';
import { getSimulatedItems, channelTemplates } from '../data/channelTemplates.js';
import { matchThemeByKeywords, pickRandomFallbackTheme } from '../utils/themeMatcher.js';

/**
 * Get feedback items for the current workspace with pagination, search, and filters.
 */
export const getFeedbacks = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      channel, 
      sentiment, 
      status,
      theme,
      from,
      to
    } = req.query;

    // Validate page & limit
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedPage) || parsedPage <= 0) {
      return res.status(400).json({ error: 'Page must be a positive integer' });
    }
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({ error: 'Limit must be a positive integer' });
    }

    // Validate status
    const validStatuses = ['NEW', 'REVIEWED', 'ACTIONED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Validate sentiment
    const validSentiments = ['POS', 'NEU', 'NEG'];
    if (sentiment && !validSentiments.includes(sentiment)) {
      return res.status(400).json({ error: 'Invalid sentiment value' });
    }

    // Validate dates
    if (from && isNaN(Date.parse(from))) {
      return res.status(400).json({ error: 'Invalid "from" date format' });
    }
    if (to && isNaN(Date.parse(to))) {
      return res.status(400).json({ error: 'Invalid "to" date format' });
    }

    const offset = (parsedPage - 1) * parsedLimit;
    const whereClause = { workspaceId };

    if (search && search.trim() !== '') {
      whereClause.content = {
        [Op.like]: `%${search.trim()}%`
      };
    }

    if (channel) {
      whereClause.channel = channel;
    }

    if (sentiment) {
      whereClause.sentiment = sentiment;
    }

    if (status) {
      whereClause.status = status;
    }

    if (from || to) {
      whereClause.createdAt = {};
      if (from) {
        whereClause.createdAt[Op.gte] = new Date(from);
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        whereClause.createdAt[Op.lte] = toDate;
      }
    }

    const includeOptions = [];
    if (theme) {
      includeOptions.push({
        model: Theme,
        where: { name: theme },
        through: { attributes: [] },
        required: true
      });
    } else {
      includeOptions.push({
        model: Theme,
        through: { attributes: [] },
        required: false
      });
    }

    const { rows: feedbacks, count } = await Feedback.findAndCountAll({
      where: whereClause,
      include: includeOptions,
      limit: parsedLimit,
      offset: offset,
      order: [['createdAt', 'DESC']],
      distinct: true
    });

    const totalPages = Math.ceil(count / parsedLimit);

    res.json({
      success: true,
      data: feedbacks,
      feedbacks, // for backward compatibility
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: count,
        totalPages,
        // for backward compatibility
        currentPage: parsedPage,
        totalItems: count
      }
    });
  } catch (error) {
    console.error('Error fetching feedbacks:', error);
    res.status(500).json({ error: 'Failed to retrieve feedbacks' });
  }
};

/**
 * Ingest a single feedback item.
 */
export const ingestSingle = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const { content, channel, customerLabel } = req.body;
    let { sentiment, sentimentScore } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Feedback content is required' });
    }

    if (!channel || !channel.trim()) {
      return res.status(400).json({ error: 'Channel is required' });
    }

    // Analyze sentiment if not provided
    if (!sentiment || !['POS', 'NEU', 'NEG'].includes(sentiment)) {
      const analysis = await analyzeFeedbackSentiment(content);
      sentiment = analysis.sentiment;
      sentimentScore = analysis.sentimentScore;
    }

    const feedback = await Feedback.create({
      content: content.trim(),
      channel: channel.trim(),
      customerLabel: customerLabel ? customerLabel.trim() : null,
      sentiment,
      sentimentScore: sentimentScore !== undefined ? parseFloat(sentimentScore) : 0.0,
      workspaceId,
      status: 'NEW'
    });

    // Auto assign theme
    try {
      await assignThemesToFeedbacks([feedback], workspaceId);
    } catch (err) {
      console.error('Failed to auto-assign theme to manual feedback:', err);
    }

    res.status(201).json({
      success: true,
      message: 'Feedback ingested successfully',
      feedback
    });
  } catch (error) {
    console.error('Error ingesting feedback:', error);
    res.status(500).json({ error: 'Failed to ingest feedback' });
  }
};

/**
 * Ingest feedback items from a CSV file.
 */
export const ingestCSV = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const defaultChannel = req.body.defaultChannel || 'CSV Import';

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a CSV file' });
    }

    const results = [];
    const filePath = req.file.path;

    // Read and parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Delete the file from local storage after reading
    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete temporary CSV file:', err);
    });

    if (results.length === 0) {
      return res.status(400).json({ error: 'The uploaded CSV file is empty' });
    }

    const feedbackRecords = [];
    const errors = [];

    // Process rows and analyze sentiment
    // To handle rate limiting or large files, we do sentiment analysis sequentially or in concurrent batches.
    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      
      // Determine columns by looking for matches (including description and desc)
      const content = row.content || row.Content || row.text || row.Text || row.feedback || row.Feedback || row.description || row.Description || row.desc || row.Desc;
      const channel = row.channel || row.Channel || defaultChannel;
      const customerLabel = row.customerLabel || row.customer_label || row.customer || row.Customer || row.user || row.User;
      let sentiment = row.sentiment || row.Sentiment;
      let sentimentScore = row.sentimentScore || row.sentiment_score || row.score || row.Score;

      if (!content || !content.trim()) {
        errors.push({ row: i + 1, error: 'Content column (or text/description) is empty or missing' });
        continue;
      }

      // Check or analyze sentiment
      if (!sentiment || !['POS', 'NEU', 'NEG'].includes(sentiment.toUpperCase())) {
        const analysis = await analyzeFeedbackSentiment(content);
        sentiment = analysis.sentiment;
        sentimentScore = analysis.sentimentScore;
      } else {
        sentiment = sentiment.toUpperCase();
        sentimentScore = sentimentScore !== undefined ? parseFloat(sentimentScore) : (sentiment === 'POS' ? 0.8 : sentiment === 'NEG' ? -0.8 : 0.0);
      }

      feedbackRecords.push({
        content: content.trim(),
        channel: channel.trim(),
        customerLabel: customerLabel ? customerLabel.trim() : null,
        sentiment,
        sentimentScore: parseFloat(sentimentScore),
        workspaceId,
        status: 'NEW'
      });
    }

    let createdCount = 0;
    if (feedbackRecords.length > 0) {
      const created = await Feedback.bulkCreate(feedbackRecords);
      createdCount = created.length;

      // Auto assign themes
      try {
        await assignThemesToFeedbacks(created, workspaceId);
      } catch (err) {
        console.error('Failed to auto-assign themes to CSV feedback:', err);
      }
    }

    res.json({
      success: true,
      message: `Successfully imported ${createdCount} feedback items.`,
      stats: {
        totalRows: results.length,
        imported: createdCount,
        failed: errors.length
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error ingesting CSV feedback:', error);
    res.status(500).json({ error: 'Failed to ingest CSV file' });
  }
};

/**
 * Delete a specific feedback item.
 */
export const deleteFeedback = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const { id } = req.params;

    const feedback = await Feedback.findOne({
      where: { id, workspaceId }
    });

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback item not found in this workspace' });
    }

    await feedback.destroy();

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
};

/**
 * Get dashboard stats for feedback ingestion.
 */
export const getStats = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const { channel, sentiment, status, theme, from, to } = req.query;

    // Build filters for Feedbacks
    const whereClause = { workspaceId };
    if (channel) {
      whereClause.channel = channel;
    }
    if (sentiment) {
      whereClause.sentiment = sentiment;
    }
    if (status) {
      whereClause.status = status;
    }
    if (from || to) {
      whereClause.createdAt = {};
      if (from) {
        whereClause.createdAt[Op.gte] = new Date(from);
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        whereClause.createdAt[Op.lte] = toDate;
      }
    }

    // Build theme inclusion
    const includeOptions = [];
    if (theme) {
      includeOptions.push({
        model: Theme,
        where: { name: theme },
        through: { attributes: [] },
        required: true,
        attributes: [] // Critical: Prevents selecting Theme columns in aggregates violating ONLY_FULL_GROUP_BY
      });
    }

    // 1. Total Count (matching active filters)
    const totalCount = await Feedback.count({
      where: whereClause,
      include: includeOptions,
      distinct: true,
      col: 'id'
    });

    // 2. Sentiment Breakdown
    const sentimentCounts = await Feedback.findAll({
      where: whereClause,
      include: includeOptions,
      attributes: [
        'sentiment',
        [sequelize.fn('COUNT', sequelize.literal('DISTINCT Feedback.id')), 'count']
      ],
      group: ['sentiment'],
      raw: true
    });

    const sentimentObj = sentimentCounts.reduce(
      (acc, curr) => {
        acc[curr.sentiment] = parseInt(curr.count || 0);
        return acc;
      },
      { POS: 0, NEU: 0, NEG: 0 }
    );

    // Calculate negative percentage
    const negativePct = totalCount > 0 ? Math.round((sentimentObj.NEG / totalCount) * 100) : 0;

    // 3. Channel Breakdown
    const channelCounts = await Feedback.findAll({
      where: whereClause,
      include: includeOptions,
      attributes: [
        'channel',
        [sequelize.fn('COUNT', sequelize.literal('DISTINCT Feedback.id')), 'count']
      ],
      group: ['channel'],
      raw: true
    });

    const channels = channelCounts.map(c => ({
      channel: c.channel,
      count: parseInt(c.count || 0)
    }));

    // 4. Average Sentiment Score
    const avgSentiment = await Feedback.findOne({
      where: whereClause,
      include: includeOptions,
      attributes: [
        [sequelize.fn('AVG', sequelize.col('Feedback.sentimentScore')), 'avgScore']
      ],
      raw: true,
      subQuery: false // prevents Sequelize's derived-subquery wrapping, which
                      // auto-injects Feedback.id into the SELECT and breaks
                      // MySQL's ONLY_FULL_GROUP_BY when a Theme include is active
    });
    const averageSentimentScore = parseFloat(avgSentiment?.avgScore || 0).toFixed(2);

    // 5. Top Themes
    const themeWhere = { workspaceId };
    if (theme) {
      themeWhere.name = theme;
    }
    const themeCounts = await Theme.findAll({
      where: themeWhere,
      attributes: [
        'id',
        'name',
        'color',
        [sequelize.fn('COUNT', sequelize.col('Feedbacks.id')), 'feedbackCount']
      ],
      include: [{
        model: Feedback,
        where: whereClause,
        through: { attributes: [] },
        required: true,
        attributes: [] // Critical: Prevents selecting Feedback columns in aggregates violating ONLY_FULL_GROUP_BY
      }],
      group: ['Theme.id', 'Theme.name', 'Theme.color'],
      order: [[sequelize.literal('feedbackCount'), 'DESC']],
      limit: 10,
      subQuery: false
    });

    const topThemes = themeCounts.map(t => ({
      id: t.id,
      name: t.name,
      color: t.color || '#6366f1',
      count: parseInt(t.get('feedbackCount') || 0)
    }));

    // 6. New This Week (ignoring search date filter bounds, last 7 days velocity)
    const newThisWeekWhere = {
      workspaceId,
      createdAt: {
        [Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000)
      }
    };
    if (channel) newThisWeekWhere.channel = channel;
    if (sentiment) newThisWeekWhere.sentiment = sentiment;
    if (status) newThisWeekWhere.status = status;

    const newThisWeek = await Feedback.count({
      where: newThisWeekWhere,
      include: includeOptions,
      distinct: true,
      col: 'id'
    });

    // 7. Daily Trend
    const dailyTrendRows = await Feedback.findAll({
      where: whereClause,
      include: includeOptions,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('Feedback.createdAt')), 'dateLabel'],
        [sequelize.fn('COUNT', sequelize.literal('DISTINCT Feedback.id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('Feedback.createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('Feedback.createdAt')), 'ASC']],
      raw: true
    });

    // Pad daily trend dates
    let startDate = from ? new Date(from) : null;
    let endDate = to ? new Date(to) : new Date();

    if (!startDate && dailyTrendRows.length > 0) {
      const dates = dailyTrendRows.map(r => new Date(r.dateLabel));
      startDate = new Date(Math.min(...dates));
    } else if (!startDate) {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    const trendMap = {};
    const tempDate = new Date(startDate);
    while (tempDate <= endDate) {
      const dateStr = tempDate.toISOString().split('T')[0];
      trendMap[dateStr] = 0;
      tempDate.setDate(tempDate.getDate() + 1);
    }

    dailyTrendRows.forEach(row => {
      if (row.dateLabel) {
        const dateStr = new Date(row.dateLabel).toISOString().split('T')[0];
        if (trendMap[dateStr] !== undefined) {
          trendMap[dateStr] = parseInt(row.count || 0);
        }
      }
    });

    const trend = Object.keys(trendMap).map(dateStr => ({
      date: dateStr,
      count: trendMap[dateStr]
    }));

    res.json({
      success: true,
      stats: {
        total: totalCount,
        negativePercentage: negativePct,
        newThisWeek,
        averageSentimentScore,
        sentiment: sentimentObj,
        channels,
        topThemes,
        trend
      }
    });

  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({ error: 'Failed to retrieve feedback stats' });
  }
};


/**
 * Simulates a channel integration by bulk-creating realistic feedback
 * items for the given channel. No real third-party connection is made —
 * this satisfies the brief's "simulated channel" requirement (C3 #3)
 * without building actual Zendesk/Slack/API infrastructure, which is
 * explicitly out of scope.
 */
export const ingestChannel = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const { channel } = req.body;

    const validChannels = Object.keys(channelTemplates);
    if (!channel || !validChannels.includes(channel)) {
      return res.status(400).json({
        error: `Invalid channel. Must be one of: ${validChannels.join(', ')}`,
      });
    }

    const items = getSimulatedItems(channel, 10);

    const feedbackRecords = items.map((item) => ({
      content: item.content,
      channel,
      sentiment: item.sentiment,
      sentimentScore: item.sentimentScore,
      workspaceId,
      status: 'NEW',
    }));

    const created = await Feedback.bulkCreate(feedbackRecords);

    // Auto assign themes
    try {
      await assignThemesToFeedbacks(created, workspaceId);
    } catch (err) {
      console.error('Failed to auto-assign themes to channel feedback:', err);
    }

    res.status(201).json({
      success: true,
      message: `Simulated ${created.length} items from ${channel}`,
      count: created.length,
    });
  } catch (error) {
    console.error('Error simulating channel ingestion:', error);
    res.status(500).json({ error: 'Failed to simulate channel ingestion' });
  }
};

/**
 * Get all themes for the current workspace.
 */
export const getThemes = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const themes = await Theme.findAll({
      where: { workspaceId },
      order: [['name', 'ASC']]
    });
    res.json({
      success: true,
      themes
    });
  } catch (error) {
    console.error('Error fetching themes:', error);
    res.status(500).json({ error: 'Failed to retrieve themes' });
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
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const feedback = await Feedback.findOne({
      where: { id, workspaceId }
    });

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback item not found' });
    }

    feedback.status = status;
    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback status updated successfully',
      feedback
    });
  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({ error: 'Failed to update feedback status' });
  }
};


/**
 * Automatically assigns themes to feedback records based on keyword matching.
 * Falls back to a random theme (not always the same one) when no keyword
 * rule matches, to avoid skewing theme distribution charts toward whichever
 * theme happens to load first from the database.
 */
async function assignThemesToFeedbacks(feedbacks, workspaceId) {
  const themes = await Theme.findAll({ where: { workspaceId } });
  if (themes.length === 0) return;

  const feedbackThemesToCreate = [];

  for (const item of feedbacks) {
    const matchedTheme =
      matchThemeByKeywords(item.content, themes) || pickRandomFallbackTheme(themes);

    if (!matchedTheme) continue; // no themes exist at all — skip rather than crash

    feedbackThemesToCreate.push({
      feedbackId: item.id,
      themeId: matchedTheme.id,
      // Lower confidence for the random fallback vs. a real keyword match —
      // this is more honest than claiming 1.0 certainty on a guess.
      confidence: matchThemeByKeywords(item.content, themes) ? 1.0 : 0.3,
    });
  }

  if (feedbackThemesToCreate.length > 0) {
    await FeedbackTheme.bulkCreate(feedbackThemesToCreate);
  }
}