import { Feedback, Theme, Report, sequelize } from '../models/index.js';
import { Op } from 'sequelize';
import { generateReportNarrative } from './reportNarrative.service.js';

const TOP_THEME_LIMIT = 5;
const QUOTES_PER_THEME = 3;

function periodLengthMs(start, end) {
  return end.getTime() - start.getTime();
}

/**
 * Pure-code stats computation — zero AI involvement. Every number here is a
 * real query result; generateReportNarrative() is only ever handed this
 * object, never raw feedback, so the model has nothing to compute or invent.
 */
export async function computeReportStats(workspaceId, periodStart, periodEnd) {
  const lengthMs = periodLengthMs(periodStart, periodEnd);
  const previousEnd = new Date(periodStart.getTime() - 1); // 1ms before current period starts
  const previousStart = new Date(previousEnd.getTime() - lengthMs);

  // Fetch everything across both windows in one query, same pattern as getTrends.
  const feedbacks = await Feedback.findAll({
    where: {
      workspaceId,
      createdAt: { [Op.between]: [previousStart, periodEnd] },
    },
    attributes: ['id', 'content', 'sentiment', 'sentimentScore', 'createdAt'],
    include: [{
      model: Theme,
      as: 'Themes',
      attributes: ['id', 'name', 'color'],
      through: { attributes: [] },
    }],
  });

  const isCurrent = (d) => d >= periodStart && d <= periodEnd;
  const isPrevious = (d) => d >= previousStart && d <= previousEnd;

  const current = feedbacks.filter((f) => isCurrent(new Date(f.createdAt)));
  const previous = feedbacks.filter((f) => isPrevious(new Date(f.createdAt)));

  // --- Volume ---
  const volume = {
    current: current.length,
    previous: previous.length,
    pctChange: previous.length === 0
      ? (current.length > 0 ? 100 : 0)
      : Math.round(((current.length - previous.length) / previous.length) * 100),
  };

  // --- Sentiment breakdown + shift ---
  const sentimentCounts = (list) => list.reduce((acc, f) => {
    acc[f.sentiment] = (acc[f.sentiment] || 0) + 1;
    return acc;
  }, { POS: 0, NEU: 0, NEG: 0 });

  const toPct = (counts, total) => ({
    POS: total ? Math.round((counts.POS / total) * 100) : 0,
    NEU: total ? Math.round((counts.NEU / total) * 100) : 0,
    NEG: total ? Math.round((counts.NEG / total) * 100) : 0,
  });

  const currentSentimentCounts = sentimentCounts(current);
  const previousSentimentCounts = sentimentCounts(previous);
  const currentSentimentPct = toPct(currentSentimentCounts, current.length);
  const previousSentimentPct = toPct(previousSentimentCounts, previous.length);

  const sentiment = {
    current: currentSentimentPct,
    previous: previousSentimentPct,
    shift: {
      POS: currentSentimentPct.POS - previousSentimentPct.POS,
      NEU: currentSentimentPct.NEU - previousSentimentPct.NEU,
      NEG: currentSentimentPct.NEG - previousSentimentPct.NEG,
    },
  };

  // --- Top themes with counts + quotes ---
  const themeBuckets = {}; // themeId -> { name, color, currentItems: [], previousCount }

  current.forEach((f) => {
    (f.Themes || []).forEach((t) => {
      if (!themeBuckets[t.id]) themeBuckets[t.id] = { id: t.id, name: t.name, color: t.color, currentItems: [], previousCount: 0 };
      themeBuckets[t.id].currentItems.push(f);
    });
  });
  previous.forEach((f) => {
    (f.Themes || []).forEach((t) => {
      if (!themeBuckets[t.id]) themeBuckets[t.id] = { id: t.id, name: t.name, color: t.color, currentItems: [], previousCount: 0 };
      themeBuckets[t.id].previousCount += 1;
    });
  });

  const topThemes = Object.values(themeBuckets)
    .map((bucket) => {
      const currentCount = bucket.currentItems.length;
      const pctChange = bucket.previousCount === 0
        ? (currentCount > 0 ? 100 : 0)
        : Math.round(((currentCount - bucket.previousCount) / bucket.previousCount) * 100);

      // Quote selection: prefer sentiment diversity over pure recency —
      // one negative + one positive if both exist, filling remaining slots
      // with most recent. Real feedback.content strings only, never edited.
      const neg = bucket.currentItems.filter((f) => f.sentiment === 'NEG');
      const pos = bucket.currentItems.filter((f) => f.sentiment === 'POS');
      const sortedByRecency = [...bucket.currentItems].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const quotePicks = [];
      if (neg.length) quotePicks.push(neg[0]);
      if (pos.length) quotePicks.push(pos[0]);
      for (const f of sortedByRecency) {
        if (quotePicks.length >= QUOTES_PER_THEME) break;
        if (!quotePicks.find((q) => q.id === f.id)) quotePicks.push(f);
      }

      return {
        themeId: bucket.id,
        name: bucket.name,
        color: bucket.color,
        currentCount,
        previousCount: bucket.previousCount,
        pctChange,
        isSpiking: pctChange >= 30,
        quotes: quotePicks.slice(0, QUOTES_PER_THEME).map((f) => ({
          id: f.id,
          content: f.content,
          sentiment: f.sentiment,
        })),
      };
    })
    .sort((a, b) => b.currentCount - a.currentCount)
    .slice(0, TOP_THEME_LIMIT)
    .filter((t) => t.currentCount > 0);

  return {
    period: { start: periodStart.toISOString(), end: periodEnd.toISOString() },
    volume,
    sentiment,
    topThemes,
  };
}

/**
 * Orchestrates: compute real stats (code) -> generate narrative (AI, given
 * only those stats) -> save. Narrative failure never blocks report
 * creation — the report is still useful with stats alone.
 */
export async function createReport(workspaceId, userId, periodStart, periodEnd) {
  const stats = await computeReportStats(workspaceId, periodStart, periodEnd);

  let narrative = null;
  if (stats.volume.current > 0) {
    try {
      narrative = await generateReportNarrative(stats);
    } catch (err) {
      console.error('[Report] Narrative generation failed, saving stats-only report:', err.message);
    }
  }

  const title = `Voice of Customer — ${new Date(periodStart).toLocaleDateString()} to ${new Date(periodEnd).toLocaleDateString()}`;

  const report = await Report.create({
    title,
    periodStart,
    periodEnd,
    workspaceId,
    generatedBy: userId,
    contentJson: { stats, narrative },
  });

  return report;
}

export async function listReports(workspaceId, { page = 1, limit = 10 } = {}) {
  const offset = (page - 1) * limit;
  const { rows, count } = await Report.findAndCountAll({
    where: { workspaceId },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  return { rows, count };
}

export async function getReportById(workspaceId, reportId) {
  return Report.findOne({ where: { id: reportId, workspaceId } });
}