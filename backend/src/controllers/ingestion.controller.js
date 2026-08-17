import { Feedback } from '../models/index.js';
import fs from 'fs';
import csvParser from 'csv-parser';
import { analyzeFeedbackSentiment } from '../utils/ai.js';
import { getSimulatedItems, channelTemplates } from '../data/channelTemplates.js';
import { assignThemesToFeedbacks } from '../services/theme.service.js';

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
      status: 'NEW',
    });

    try {
      await assignThemesToFeedbacks([feedback], workspaceId);
    } catch (err) {
      console.error('Failed to auto-assign theme to manual feedback:', err);
    }

    res.status(201).json({ success: true, message: 'Feedback ingested successfully', feedback });
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

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    fs.unlink(filePath, (err) => {
      if (err) console.error('Failed to delete temporary CSV file:', err);
    });

    if (results.length === 0) {
      return res.status(400).json({ error: 'The uploaded CSV file is empty' });
    }

    const feedbackRecords = [];
    const errors = [];

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const content = row.content || row.Content || row.text || row.Text || row.feedback || row.Feedback || row.description || row.Description || row.desc || row.Desc;
      const channel = row.channel || row.Channel || defaultChannel;
      const customerLabel = row.customerLabel || row.customer_label || row.customer || row.Customer || row.user || row.User;
      let sentiment = row.sentiment || row.Sentiment;
      let sentimentScore = row.sentimentScore || row.sentiment_score || row.score || row.Score;

      if (!content || !content.trim()) {
        errors.push({ row: i + 1, error: 'Content column (or text/description) is empty or missing' });
        continue;
      }

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
        status: 'NEW',
      });
    }

    let createdCount = 0;
    if (feedbackRecords.length > 0) {
      const created = await Feedback.bulkCreate(feedbackRecords);
      createdCount = created.length;

      try {
        await assignThemesToFeedbacks(created, workspaceId);
      } catch (err) {
        console.error('Failed to auto-assign themes to CSV feedback:', err);
      }
    }

    res.json({
      success: true,
      message: `Successfully imported ${createdCount} feedback items.`,
      stats: { totalRows: results.length, imported: createdCount, failed: errors.length },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error ingesting CSV feedback:', error);
    res.status(500).json({ error: 'Failed to ingest CSV file' });
  }
};

/**
 * Simulates a channel integration by bulk-creating realistic feedback items.
 */
export const ingestChannel = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const { channel } = req.body;

    const validChannels = Object.keys(channelTemplates);
    if (!channel || !validChannels.includes(channel)) {
      return res.status(400).json({ error: `Invalid channel. Must be one of: ${validChannels.join(', ')}` });
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

    try {
      await assignThemesToFeedbacks(created, workspaceId);
    } catch (err) {
      console.error('Failed to auto-assign themes to channel feedback:', err);
    }

    res.status(201).json({ success: true, message: `Simulated ${created.length} items from ${channel}`, count: created.length });
  } catch (error) {
    console.error('Error simulating channel ingestion:', error);
    res.status(500).json({ error: 'Failed to simulate channel ingestion' });
  }
};