import { Feedback, Theme, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Get dashboard stats for feedback: totals, sentiment breakdown, channel
 * breakdown, top themes, and daily trend — all filterable.
 */
export const getStats = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const { channel, sentiment, status, theme, from, to } = req.query;

    const whereClause = { workspaceId };
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

    const includeOptions = [];
    if (theme) {
      includeOptions.push({
        model: Theme,
        where: { name: theme },
        through: { attributes: [] },
        required: true,
        attributes: [],
      });
    }

    const totalCount = await Feedback.count({ where: whereClause, include: includeOptions, distinct: true, col: 'id' });

    const sentimentCounts = await Feedback.findAll({
      where: whereClause,
      include: includeOptions,
      attributes: ['sentiment', [sequelize.fn('COUNT', sequelize.literal('DISTINCT Feedback.id')), 'count']],
      group: ['sentiment'],
      raw: true,
    });
    const sentimentObj = sentimentCounts.reduce((acc, curr) => {
      acc[curr.sentiment] = parseInt(curr.count || 0);
      return acc;
    }, { POS: 0, NEU: 0, NEG: 0 });

    const negativePct = totalCount > 0 ? Math.round((sentimentObj.NEG / totalCount) * 100) : 0;

    const channelCounts = await Feedback.findAll({
      where: whereClause,
      include: includeOptions,
      attributes: ['channel', [sequelize.fn('COUNT', sequelize.literal('DISTINCT Feedback.id')), 'count']],
      group: ['channel'],
      raw: true,
    });
    const channels = channelCounts.map((c) => ({ channel: c.channel, count: parseInt(c.count || 0) }));

    const avgSentiment = await Feedback.findOne({
      where: whereClause,
      include: includeOptions,
      attributes: [[sequelize.fn('AVG', sequelize.col('Feedback.sentimentScore')), 'avgScore']],
      raw: true,
      subQuery: false,
    });
    const averageSentimentScore = parseFloat(avgSentiment?.avgScore || 0).toFixed(2);

    const themeWhere = { workspaceId };
    if (theme) themeWhere.name = theme;
    const themeCounts = await Theme.findAll({
      where: themeWhere,
      attributes: ['id', 'name', 'color', [sequelize.fn('COUNT', sequelize.col('Feedbacks.id')), 'feedbackCount']],
      include: [{ model: Feedback, where: whereClause, through: { attributes: [] }, required: true, attributes: [] }],
      group: ['Theme.id', 'Theme.name', 'Theme.color'],
      order: [[sequelize.literal('feedbackCount'), 'DESC']],
      limit: 10,
      subQuery: false,
    });
    const topThemes = themeCounts.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color || '#6366f1',
      count: parseInt(t.get('feedbackCount') || 0),
    }));

    const newThisWeekWhere = { workspaceId, createdAt: { [Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) } };
    if (channel) newThisWeekWhere.channel = channel;
    if (sentiment) newThisWeekWhere.sentiment = sentiment;
    if (status) newThisWeekWhere.status = status;
    const newThisWeek = await Feedback.count({ where: newThisWeekWhere, include: includeOptions, distinct: true, col: 'id' });

    const dailyTrendRows = await Feedback.findAll({
      where: whereClause,
      include: includeOptions,
      attributes: [
        [sequelize.fn('DATE', sequelize.col('Feedback.createdAt')), 'dateLabel'],
        [sequelize.fn('COUNT', sequelize.literal('DISTINCT Feedback.id')), 'count'],
      ],
      group: [sequelize.fn('DATE', sequelize.col('Feedback.createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('Feedback.createdAt')), 'ASC']],
      raw: true,
    });

    let startDate = from ? new Date(from) : null;
    let endDate = to ? new Date(to) : new Date();
    if (!startDate && dailyTrendRows.length > 0) {
      const dates = dailyTrendRows.map((r) => new Date(r.dateLabel));
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
      trendMap[tempDate.toISOString().split('T')[0]] = 0;
      tempDate.setDate(tempDate.getDate() + 1);
    }
    dailyTrendRows.forEach((row) => {
      if (row.dateLabel) {
        const dateStr = new Date(row.dateLabel).toISOString().split('T')[0];
        if (trendMap[dateStr] !== undefined) trendMap[dateStr] = parseInt(row.count || 0);
      }
    });
    const trend = Object.keys(trendMap).map((dateStr) => ({ date: dateStr, count: trendMap[dateStr] }));

    res.json({
      success: true,
      stats: { total: totalCount, negativePercentage: negativePct, newThisWeek, averageSentimentScore, sentiment: sentimentObj, channels, topThemes, trend },
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({ error: 'Failed to retrieve feedback stats' });
  }
};