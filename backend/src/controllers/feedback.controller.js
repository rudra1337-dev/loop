import { Feedback, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import fs from 'fs';
import csvParser from 'csv-parser';
import { analyzeFeedbackSentiment } from '../utils/ai.js';

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
      status 
    } = req.query;

    const offset = (page - 1) * limit;

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

    const { rows: feedbacks, count } = await Feedback.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      feedbacks,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit)
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

    // Total counts
    const totalCount = await Feedback.count({ where: { workspaceId } });

    // Sentiment breakdown
    const sentimentCounts = await Feedback.findAll({
      where: { workspaceId },
      attributes: ['sentiment', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['sentiment']
    });

    // Channel breakdown
    const channelCounts = await Feedback.findAll({
      where: { workspaceId },
      attributes: ['channel', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['channel']
    });

    // Recent average sentiment score
    const avgSentiment = await Feedback.findOne({
      where: { workspaceId },
      attributes: [[sequelize.fn('AVG', sequelize.col('sentimentScore')), 'avgScore']]
    });

    // Daily/Weekly trend (last 30 days)
    // We group by date formatted string
    const dailyTrend = await Feedback.findAll({
      where: {
        workspaceId,
        createdAt: {
          [Op.gte]: new Date(new Date() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('sentimentScore')), 'avgScore']
      ],
      group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
      order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
    });

    res.json({
      success: true,
      stats: {
        total: totalCount,
        sentiment: sentimentCounts.reduce((acc, curr) => {
          acc[curr.sentiment] = parseInt(curr.get('count'));
          return acc;
        }, { POS: 0, NEU: 0, NEG: 0 }),
        channels: channelCounts.map(c => ({
          channel: c.channel,
          count: parseInt(c.get('count'))
        })),
        averageSentimentScore: parseFloat(avgSentiment?.get('avgScore') || 0).toFixed(2),
        trend: dailyTrend.map(t => ({
          date: t.get('date'),
          count: parseInt(t.get('count')),
          avgScore: parseFloat(t.get('avgScore') || 0).toFixed(2)
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({ error: 'Failed to retrieve feedback stats' });
  }
};
