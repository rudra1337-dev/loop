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

/**
 * Get feedback trends: theme volume changes and spikes over a period (7d, 30d, 90d)
 */
export const getTrends = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const { period } = req.query;

    if (!['7d', '30d', '90d'].includes(period)) {
      return res.status(400).json({ error: 'Invalid period parameter. Allowed values: 7d, 30d, 90d' });
    }

    const days = parseInt(period);

    // Current period and previous period date calculations in UTC to prevent timezone shifts
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const currentEndDate = new Date(`${todayStr}T23:59:59.999Z`);
    
    const currentStartDate = new Date(currentEndDate);
    currentStartDate.setUTCDate(currentStartDate.getUTCDate() - days + 1);
    currentStartDate.setUTCHours(0, 0, 0, 0);
    
    const previousEndDate = new Date(currentStartDate);
    previousEndDate.setUTCDate(previousEndDate.getUTCDate() - 1);
    previousEndDate.setUTCHours(23, 59, 59, 999);
    
    const previousStartDate = new Date(previousEndDate);
    previousStartDate.setUTCDate(previousStartDate.getUTCDate() - days + 1);
    previousStartDate.setUTCHours(0, 0, 0, 0);

    // 1. Fetch all themes in the workspace
    const themes = await Theme.findAll({
      where: { workspaceId },
      attributes: ['id', 'name', 'color']
    });

    // 2. Fetch all feedback items in the range previousStartDate to currentEndDate
    const feedbacks = await Feedback.findAll({
      where: {
        workspaceId,
        createdAt: {
          [Op.between]: [previousStartDate, currentEndDate]
        }
      },
      attributes: ['id', 'createdAt'],
      include: [
        {
          model: Theme,
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });

    // 3. Create all dates for current period for daily padding
    const datesList = [];
    const tempDate = new Date(currentStartDate);
    while (tempDate <= currentEndDate) {
      datesList.push(tempDate.toISOString().split('T')[0]);
      tempDate.setUTCDate(tempDate.getUTCDate() + 1);
    }

    // Initialize mapping
    const themeTrends = themes.map(theme => {
      const dailyVolumeMap = {};
      datesList.forEach(d => {
        dailyVolumeMap[d] = 0;
      });

      return {
        themeId: theme.id,
        themeName: theme.name,
        color: theme.color || '#6366f1',
        currentCount: 0,
        previousCount: 0,
        dailyVolumeMap
      };
    });

    const trendsMap = themeTrends.reduce((acc, curr) => {
      acc[curr.themeId] = curr;
      return acc;
    }, {});

    // 4. Populate counts
    feedbacks.forEach(feedback => {
      const createdAt = new Date(feedback.createdAt);
      const isCurrent = createdAt >= currentStartDate && createdAt <= currentEndDate;
      const isPrevious = createdAt >= previousStartDate && createdAt <= previousEndDate;

      if (isCurrent || isPrevious) {
        const dateStr = createdAt.toISOString().split('T')[0];
        const associatedThemes = feedback.Themes || feedback.themes || [];
        associatedThemes.forEach(theme => {
          const themeTrend = trendsMap[theme.id];
          if (themeTrend) {
            if (isCurrent) {
              themeTrend.currentCount += 1;
              if (themeTrend.dailyVolumeMap[dateStr] !== undefined) {
                themeTrend.dailyVolumeMap[dateStr] += 1;
              }
            } else if (isPrevious) {
              themeTrend.previousCount += 1;
            }
          }
        });
      }
    });

    // 5. Final percentage change and spike check
    const formattedThemes = themeTrends.map(t => {
      const pctChange = t.previousCount === 0
        ? (t.currentCount > 0 ? 100 : 0)
        : Math.round(((t.currentCount - t.previousCount) / t.previousCount) * 100);

      const isSpiking = pctChange >= 30;

      const dailyVolume = datesList.map(date => ({
        date,
        count: t.dailyVolumeMap[date]
      }));

      return {
        themeId: t.themeId,
        themeName: t.themeName,
        color: t.color,
        currentCount: t.currentCount,
        previousCount: t.previousCount,
        pctChange,
        isSpiking,
        dailyVolume
      };
    });

    res.json({
      success: true,
      period,
      startDate: currentStartDate.toISOString().split('T')[0],
      endDate: currentEndDate.toISOString().split('T')[0],
      spikeThreshold: 30,
      themes: formattedThemes
    });

  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to retrieve feedback trends' });
  }
};