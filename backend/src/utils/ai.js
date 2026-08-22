import { GoogleGenAI } from '@google/genai';
import { aiConfig } from '../config/ai.config.js';
import { ClassificationSchema } from '../lib/validation/classification.js';
import { matchThemeByKeywords, pickRandomFallbackTheme } from './themeMatcher.js';

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
 * Unchanged from the original implementation — still exported standalone
 * in case anything only needs sentiment (e.g. tests, a future lightweight
 * endpoint) without pulling in theme classification.
 */
export function localAnalyze(content) {
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
 * Fallback local classification: sentiment via keyword counting (above),
 * theme via keyword-regex matching, falling back further to a random
 * existing theme if no keyword rule matches. Deliberately never invents a
 * brand-new theme — deciding "this deserves its own new category" is a
 * judgment call that's only safe to make with real language understanding,
 * which regex matching doesn't have.
 */
function localClassify(content, existingThemes) {
  const { sentiment, sentimentScore } = localAnalyze(content);

  const keywordMatch = matchThemeByKeywords(content, existingThemes);
  const matchedTheme = keywordMatch || pickRandomFallbackTheme(existingThemes);

  return {
    sentiment,
    sentimentScore,
    theme: matchedTheme
      ? { name: matchedTheme.name, description: undefined, confidence: keywordMatch ? 1.0 : 0.3 }
      : { name: null, description: undefined, confidence: 0 },
  };
}

function buildClassificationPrompt(content, existingThemes) {
  const themeList = existingThemes.length > 0
    ? existingThemes.map((t) => `- ${t.name}${t.description ? `: ${t.description}` : ''}`).join('\n')
    : '(no themes exist yet in this workspace)';

  return `Analyze the following customer feedback and classify it.

Existing themes in this workspace:
${themeList}

Respond ONLY with a JSON object in this exact format:
{
  "sentiment": "POS" | "NEU" | "NEG",
  "sentimentScore": <number between -1 and 1>,
  "theme": {
    "name": <string>,
    "isNew": <boolean>,
    "description": <string, one sentence, only meaningful if isNew is true>,
    "confidence": <number between 0 and 1>
  }
}

Rules:
- sentiment must be exactly one of: "POS", "NEU", or "NEG"
- Try to match one of the existing themes listed above by name first. Only set
  "isNew": true and propose a new theme name + a short one-sentence description
  if none of the existing themes reasonably fit this feedback.
- confidence reflects how well the feedback matches the chosen (or proposed)
  theme, from 0 to 1.
- Do NOT wrap the response in \`\`\`json fences. Return JSON only, no explanations.

Feedback text: "${content.replace(/"/g, '\\"')}"`;
}

async function callGemini(content, existingThemes) {
  const prompt = buildClassificationPrompt(content, existingThemes);

  const response = await aiInstance.models.generateContent({
    model: aiConfig.model,
    contents: prompt,
  });

  const responseText = response.text || '';
  const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(jsonStr);

  const validation = ClassificationSchema.safeParse(parsed);
  if (!validation.success) {
    console.warn('[AI] Response failed schema validation:', validation.error.format());
    throw new Error('AI classification returned invalid data');
  }

  const { sentiment, sentimentScore, theme } = validation.data;
  return {
    sentiment,
    sentimentScore,
    theme: {
      name: theme.name,
      // Only carry the description through when the model actually flagged
      // this as new — an existing-theme match shouldn't overwrite that
      // theme's real description with whatever one-liner the model made up.
      description: theme.isNew ? theme.description : undefined,
      confidence: theme.confidence,
    },
  };
}

/**
 * Classifies feedback content — sentiment AND theme — using the configured
 * AI provider in a single combined call (half the API calls of running two
 * separate requests). Falls back to local keyword-based classification if
 * the AI is unavailable, the API call fails, the response isn't valid JSON,
 * or it fails schema validation — callers never need to know which path ran,
 * since both return the exact same shape.
 *
 * @param {string} content
 * @param {{id: string, name: string, description?: string}[]} existingThemes
 * @returns {Promise<{sentiment: string, sentimentScore: number, theme: {name: string|null, description?: string, confidence: number}}>}
 */
export async function classifyFeedback(content, existingThemes = []) {
  if (!content || !content.trim()) {
    return { sentiment: 'NEU', sentimentScore: 0.0, theme: { name: null, description: undefined, confidence: 0 } };
  }

  if (!aiInstance) {
    console.warn('[AI] No active AI instance — using local fallback classification.');
    return localClassify(content, existingThemes);
  }

  try {
    return await callGemini(content, existingThemes);
  } catch (error) {
    console.error(`[AI ERROR] ${aiConfig.providerName} classification failed:`, error.message);
    return localClassify(content, existingThemes);
  }
}