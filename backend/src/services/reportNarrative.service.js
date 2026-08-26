import { GoogleGenAI } from '@google/genai';
import { aiConfig } from '../config/ai.config.js';
import { ReportNarrativeSchema } from '../lib/validation/report.js';

let aiInstance = null;
if (aiConfig.apiKey) {
  try {
    aiInstance = new GoogleGenAI({ apiKey: aiConfig.apiKey });
  } catch (err) {
    console.error(`[AI ERROR] Failed to initialize ${aiConfig.providerName} for reports:`, err.message);
  }
}

function buildReportPrompt(stats) {
  const themesBlock = stats.topThemes.length > 0
    ? stats.topThemes.map((t) =>
        `- "${t.name}" (id: ${t.themeId}): ${t.currentCount} items this period (${t.previousCount} previous period, ${t.pctChange >= 0 ? '+' : ''}${t.pctChange}%)${t.isSpiking ? ' — SPIKING' : ''}\n  Sample quotes: ${t.quotes.map((q) => `"${q.content.replace(/"/g, '\\"')}" (${q.sentiment})`).join('; ')}`
      ).join('\n')
    : '(no themes had activity this period)';

  return `You are writing a Voice-of-Customer report for a product team, using ONLY the real, pre-computed statistics below. Do not invent, estimate, or restate any number that isn't given here — every figure the reader sees must trace back to this data.

PERIOD: ${stats.period.start} to ${stats.period.end}

VOLUME: ${stats.volume.current} feedback items this period vs ${stats.volume.previous} previous period (${stats.volume.pctChange >= 0 ? '+' : ''}${stats.volume.pctChange}%)

SENTIMENT: Positive ${stats.sentiment.current.POS}% (was ${stats.sentiment.previous.POS}%), Neutral ${stats.sentiment.current.NEU}% (was ${stats.sentiment.previous.NEU}%), Negative ${stats.sentiment.current.NEG}% (was ${stats.sentiment.previous.NEG}%)

TOP THEMES:
${themesBlock}

Write a professional but readable executive summary a product manager could forward to leadership without editing. Recommended actions should follow directly from spiking or notable themes above — don't give generic advice unconnected to this data.

Respond ONLY with JSON, no markdown fences:
{
  "summary": <2-3 sentence executive overview>,
  "sentimentNarrative": <1-2 sentences on the sentiment shift, using only the percentages above>,
  "themeNarratives": [{ "themeId": <string, must match an id given above>, "narrative": <1-2 sentences on this theme's trend> }],
  "recommendedActions": [<3-5 short, specific, actionable bullet strings>]
}`;
}

export async function generateReportNarrative(stats) {
  if (!aiInstance) {
    throw new Error('AI provider unavailable — cannot generate report narrative');
  }

  const response = await aiInstance.models.generateContent({
    model: aiConfig.model,
    contents: buildReportPrompt(stats),
  });

  const responseText = response.text || '';
  const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(jsonStr);

  const validation = ReportNarrativeSchema.safeParse(parsed);
  if (!validation.success) {
    console.warn('[Report] Narrative failed schema validation:', validation.error.format());
    throw new Error('AI report narrative returned invalid data');
  }

  // Discard any themeId the model referenced that wasn't actually in the
  // stats it was given — same "never trust the model's own references"
  // discipline as Ask LOOP's citation validation.
  const validThemeIds = new Set(stats.topThemes.map((t) => t.themeId));
  const themeNarratives = validation.data.themeNarratives.filter((tn) => validThemeIds.has(tn.themeId));

  return { ...validation.data, themeNarratives };
}