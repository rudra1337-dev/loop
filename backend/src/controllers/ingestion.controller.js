import { Feedback } from '../models/index.js';
import fs from 'fs';
import csvParser from 'csv-parser';
import { classifyWithOverrides } from '../services/classification.service.js';
import {
  getWorkspaceThemes,
  resolveTheme,
  attachThemeToFeedback,
  attachResolvedThemesToFeedbacks,
} from '../services/theme.service.js';
import { getSimulatedItems, channelTemplates } from '../data/channelTemplates.js';

/**
 * Ingest a single feedback item.
 * Any of sentiment / sentimentScore / themeName supplied in the request body
 * take precedence over AI classification for that field; unsupplied fields
 * are filled in by classifyWithOverrides (AI-first, keyword fallback).
 */
export const ingestSingle = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const { content, channel, customerLabel, themeName, sentiment, sentimentScore } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Feedback content is required' });
    }
    if (!channel || !channel.trim()) {
      return res.status(400).json({ error: 'Channel is required' });
    }

    const themesCache = await getWorkspaceThemes(workspaceId);

    let classification;
    try {
      classification = await classifyWithOverrides({
        content,
        existingThemes: themesCache,
        overrides: { sentiment, sentimentScore, themeName },
      });
    } catch (err) {
      return res.status(502).json({ error: 'AI classification returned invalid data' });
    }

    const feedback = await Feedback.create({
      content: content.trim(),
      channel: channel.trim(),
      customerLabel: customerLabel ? customerLabel.trim() : null,
      sentiment: classification.sentiment,
      sentimentScore: parseFloat(classification.sentimentScore),
      workspaceId,
      status: 'NEW',
    });

    try {
      await attachThemeToFeedback(feedback.id, classification.theme, themesCache, workspaceId);
    } catch (err) {
      console.error('Failed to assign theme to manual feedback:', err);
    }

    res.status(201).json({ success: true, message: 'Feedback ingested successfully', feedback });
  } catch (error) {
    console.error('Error ingesting feedback:', error);
    res.status(500).json({ error: 'Failed to ingest feedback' });
  }
};

/**
 * Ingest feedback items from a CSV file.
 * Optional per-row `theme`/`Theme`/`themeName` column is honored the same
 * way sentiment/sentimentScore columns already are — given values win over
 * AI classification for that row.
 *
 * themesCache is fetched once (not once per row) and mutated in place as
 * new themes get created mid-loop, so later rows in the same file correctly
 * reuse a theme created by an earlier row instead of proposing a duplicate.
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

    const themesCache = await getWorkspaceThemes(workspaceId);

    const feedbackRecords = [];
    const themeResolutions = []; // parallel to feedbackRecords, matched by index
    const errors = [];

    for (let i = 0; i < results.length; i++) {
      const row = results[i];
      const content = row.content || row.Content || row.text || row.Text || row.feedback || row.Feedback || row.description || row.Description || row.desc || row.Desc;
      const channel = row.channel || row.Channel || defaultChannel;
      const customerLabel = row.customerLabel || row.customer_label || row.customer || row.Customer || row.user || row.User;
      const themeName = row.theme || row.Theme || row.themeName;
      const sentiment = row.sentiment || row.Sentiment;
      const sentimentScore = row.sentimentScore || row.sentiment_score || row.score || row.Score;

      if (!content || !content.trim()) {
        errors.push({ row: i + 1, error: 'Content column (or text/description) is empty or missing' });
        continue;
      }

      try {
        const classification = await classifyWithOverrides({
          content,
          existingThemes: themesCache,
          overrides: { sentiment, sentimentScore, themeName },
        });

        const resolvedTheme = await resolveTheme(classification.theme, themesCache, workspaceId);

        feedbackRecords.push({
          content: content.trim(),
          channel: channel.trim(),
          customerLabel: customerLabel ? customerLabel.trim() : null,
          sentiment: classification.sentiment,
          sentimentScore: parseFloat(classification.sentimentScore),
          workspaceId,
          status: 'NEW',
        });
        themeResolutions.push(
          resolvedTheme ? { themeId: resolvedTheme.id, confidence: classification.theme.confidence ?? 0.5 } : null
        );
      } catch (err) {
        errors.push({ row: i + 1, error: err.message || 'AI Classification failed' });
      }
    }

    let createdCount = 0;
    if (feedbackRecords.length > 0) {
      const created = await Feedback.bulkCreate(feedbackRecords);
      createdCount = created.length;

      try {
        await attachResolvedThemesToFeedbacks(created, themeResolutions);
      } catch (err) {
        console.error('Failed to bulk-assign themes to CSV feedback:', err);
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
 * Sentiment/score come from the fixed template data (treated as overrides,
 * same as everywhere else) — but theme classification still runs through
 * the same AI-first pipeline as every other ingestion path, so simulated
 * items get real themes instead of being left out of trend/theme analytics.
 *
 * This costs one AI call per simulated item (10 per click). If you'd rather
 * keep this specific path keyword-only to save Gemini quota on what is,
 * after all, fake seed-like data, that's a one-line change: pass
 * `themeName: undefined` normally but short-circuit straight to
 * localClassify-style keyword matching instead of classifyWithOverrides —
 * flag if you want that swapped.
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
    const themesCache = await getWorkspaceThemes(workspaceId);

    const feedbackRecords = [];
    const themeResolutions = [];

    for (const item of items) {
      const classification = await classifyWithOverrides({
        content: item.content,
        existingThemes: themesCache,
        overrides: { sentiment: item.sentiment, sentimentScore: item.sentimentScore },
      });

      const resolvedTheme = await resolveTheme(classification.theme, themesCache, workspaceId);

      feedbackRecords.push({
        content: item.content,
        channel,
        sentiment: classification.sentiment,
        sentimentScore: parseFloat(classification.sentimentScore),
        workspaceId,
        status: 'NEW',
      });
      themeResolutions.push(
        resolvedTheme ? { themeId: resolvedTheme.id, confidence: classification.theme.confidence ?? 0.5 } : null
      );
    }

    const created = await Feedback.bulkCreate(feedbackRecords);

    try {
      await attachResolvedThemesToFeedbacks(created, themeResolutions);
    } catch (err) {
      console.error('Failed to auto-assign themes to channel feedback:', err);
    }

    res.status(201).json({ success: true, message: `Simulated ${created.length} items from ${channel}`, count: created.length });
  } catch (error) {
    console.error('Error simulating channel ingestion:', error);
    res.status(500).json({ error: 'Failed to simulate channel ingestion' });
  }
};