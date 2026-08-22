/**
 * Classification Service
 *
 * Single responsibility: decide the final sentiment / sentimentScore / theme
 * for a piece of feedback, respecting any fields the caller explicitly
 * supplied (manual entry form, CSV columns) over whatever classifyFeedback()
 * (AI or local fallback) would have produced. This file knows nothing about
 * HTTP, Sequelize, or Gemini — it only orchestrates precedence rules, which
 * is what makes it directly reusable by ingestSingle, ingestCSV,
 * ingestChannel, and the upcoming manual re-classify endpoint (#21) without
 * duplicating this logic in each one.
 */
import { classifyFeedback } from '../utils/ai.js';

const VALID_SENTIMENTS = ['POS', 'NEU', 'NEG'];

function isGivenSentiment(value) {
  return typeof value === 'string' && VALID_SENTIMENTS.includes(value.toUpperCase());
}

function isGivenScore(value) {
  return value !== undefined && value !== null && value !== '' && !Number.isNaN(parseFloat(value));
}

function isGivenThemeName(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// Used only when sentiment is supplied manually without an explicit score —
// mirrors the same convention the original CSV path already used, just
// centralized here instead of duplicated per ingestion path.
function defaultScoreForSentiment(sentiment) {
  if (sentiment === 'POS') return 0.8;
  if (sentiment === 'NEG') return -0.8;
  return 0.0;
}

/**
 * @param {object} params
 * @param {string} params.content
 * @param {{id: string, name: string, description?: string}[]} params.existingThemes
 * @param {{sentiment?: string, sentimentScore?: number|string, themeName?: string}} [params.overrides]
 * @returns {Promise<{sentiment: string, sentimentScore: number, theme: {name: string|null, description?: string, confidence: number}}>}
 */
export async function classifyWithOverrides({ content, existingThemes, overrides = {} }) {
  const sentimentGiven = isGivenSentiment(overrides.sentiment);
  const scoreGiven = isGivenScore(overrides.sentimentScore);
  const themeNameGiven = isGivenThemeName(overrides.themeName);

  // Skip classification entirely if the caller already supplied both
  // sentiment and theme — no reason to spend an AI call (or even run local
  // keyword matching) producing data we're about to discard.
  const needsClassification = !sentimentGiven || !themeNameGiven;
  const classified = needsClassification
    ? await classifyFeedback(content, existingThemes)
    : null;

  const sentiment = sentimentGiven ? overrides.sentiment.toUpperCase() : classified.sentiment;
  const sentimentScore = scoreGiven
    ? parseFloat(overrides.sentimentScore)
    : (sentimentGiven ? defaultScoreForSentiment(sentiment) : classified.sentimentScore);

  const theme = themeNameGiven
    ? { name: overrides.themeName.trim(), description: undefined, confidence: 1.0 }
    : classified.theme;

  return { sentiment, sentimentScore, theme };
}