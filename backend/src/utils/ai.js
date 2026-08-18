import { GoogleGenAI } from '@google/genai';
import { aiConfig } from '../config/ai.config.js';
import { ClassificationSchema } from '../lib/validation/classification.js';

let aiInstance = null;

if (aiConfig.apiKey) {
  try {
    aiInstance = new GoogleGenAI({ apiKey: aiConfig.apiKey });
    console.log(`[AI] ${aiConfig.providerName} initialized with model: ${aiConfig.model}`);
  } catch (err) {
    console.error(`[AI ERROR] Failed to initialize ${aiConfig.providerName}:`, err.message);
  }
}

/**
 * Fallback local sentiment analysis based on keyword counting.
 * Only used if the AI provider is unavailable or the API call fails.
 */
function localAnalyze(content) {
  if (!content) return { sentiment: 'NEU', sentimentScore: 0.0 };

  const positiveWords = [
    'great', 'love', 'amazing', 'good', 'happy', 'excellent', 'awesome', 'best',
    'satisfied', 'perfect', 'fantastic', 'beautiful', 'cool', 'helpful', 'useful',
    'smooth', 'fast', 'quick', 'easy', 'recommend', 'thanks', 'thank you', 'delightful',
    'worth', 'changed', 'productive'
  ];

  const negativeWords = [
    'bad', 'hate', 'issue', 'problem', 'broken', 'fail', 'failure', 'failed', 'slow',
    'error', 'worst', 'poor', 'annoyed', 'frustrated', 'disappointed', 'terrible',
    'useless', 'difficult', 'crash', 'crashed', 'bug', 'glitch', 'expensive', 'waste',
    'defect', 'cancel', 'cancelled', 'lost'
  ];

  const text = content.toLowerCase();
  let posCount = 0;
  let negCount = 0;

  positiveWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = text.match(regex);
    if (matches) posCount += matches.length;
  });

  negativeWords.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = text.match(regex);
    if (matches) negCount += matches.length;
  });

  const diff = posCount - negCount;
  const total = posCount + negCount;

  if (total === 0) {
    return { sentiment: 'NEU', sentimentScore: 0.0 };
  }

  const score = diff / total;
  let sentiment = 'NEU';
  if (score > 0.15) sentiment = 'POS';
  else if (score < -0.15) sentiment = 'NEG';

  return { sentiment, sentimentScore: parseFloat(score.toFixed(2)) };
}

/**
 * Analyzes content sentiment using the configured AI provider.
 * Validates the response schema using Zod before returning.
 * Falls back to local keyword analysis if unavailable or validation fails.
 */
export async function analyzeFeedbackSentiment(content) {
  if (!content || !content.trim()) {
    return { sentiment: 'NEU', sentimentScore: 0.0 };
  }

  if (!aiInstance) {
    console.warn('[AI] No active AI instance — using local fallback analysis.');
    return localAnalyze(content);
  }

  try {
    const prompt = `Analyze the sentiment of the following customer feedback text.
Respond ONLY with a JSON object in this exact format:
{
  "sentiment": "POS" | "NEU" | "NEG",
  "sentimentScore": <number between -1 and 1>
}
Rules:
- sentiment must be exactly one of: "POS", "NEU", or "NEG"
- sentimentScore must be a number between -1 and 1
- Do NOT wrap in \`\`\`json fences
- Return JSON only, no explanations
Feedback text: "${content.replace(/"/g, '\\"')}"`;

    const response = await aiInstance.models.generateContent({
      model: aiConfig.model,
      contents: prompt,
    });

    const responseText = response.text || '';
    // Strip accidental Markdown fences if the AI adds them
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    // Validate against schema using Zod
    const validation = ClassificationSchema.safeParse(parsed);
    if (!validation.success) {
      console.warn('[AI] Response failed schema validation:', validation.error.format());
      return localAnalyze(content);
    }

    const { sentiment, sentimentScore } = validation.data;
    return { sentiment, sentimentScore };
  } catch (error) {
    // Any error (API call, JSON parse, Zod validation) → fallback
    console.error(`[AI ERROR] ${aiConfig.providerName} sentiment analysis failed:`, error.message);
    return localAnalyze(content);
  }
}