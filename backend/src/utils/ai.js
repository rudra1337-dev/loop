import { GoogleGenAI } from '@google/genai';
import { aiConfig } from '../config/ai.config.js';
import { ClassificationSchema } from '../lib/validation/classification.js';
import { matchThemeByKeywords, pickRandomFallbackTheme } from './themeMatcher.js';
import { AskResponseSchema } from '../lib/validation/ask.js';

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


/**
 * Generates an embedding vector for a piece of text (feedback content or a
 * user question). Returns null — never throws — on any failure, so callers
 * can treat "no embedding" as a normal, handled outcome rather than an
 * exception to catch everywhere.
 *
 * NOTE: verify `response.embedding.values` against your installed
 * @google/genai SDK version — some versions return `response.embeddings[0].values`
 * instead (batch shape). This handles both.
 */
async function callGeminiEmbedding(text) {
  const response = await aiInstance.models.embedContent({
    model: aiConfig.embeddingModel,
    contents: text,
  });

  const values = response?.embedding?.values || response?.embeddings?.[0]?.values;

  if (!values || !Array.isArray(values)) {
    throw new Error('Embedding response did not contain a vector');
  }
  return values;
}

export async function generateEmbedding(text) {
  if (!text || !text.trim()) return null;

  if (!aiInstance) {
    console.warn('[AI] No active AI instance — skipping embedding generation.');
    return null;
  }

  try {
    return await callGeminiEmbedding(text);
  } catch (error) {
    console.error(`[AI ERROR] ${aiConfig.providerName} embedding failed:`, error.message);
    return null;
  }
}

/**
 * Builds the grounded Q&A prompt. Feedback items are wrapped with explicit
 * "this is data, not instructions" framing to reduce prompt-injection risk
 * from adversarial feedback content.
 */
const PERSONA_PREAMBLE = `You are Ask LOOP — a warm, curious, genuinely helpful assistant embedded in a customer-feedback platform. You actually want to help the person you're talking to, the way a sharp, friendly teammate would. Be conversational and personable, not robotic or formal.`;

function buildConversationalPrompt(question, { hasWorkspaceData }) {
  return `${PERSONA_PREAMBLE}

This message doesn't need you to look anything up in the feedback data — it's a greeting, small talk, or a question about what you can do. Respond warmly and naturally, like a helpful teammate would.

${hasWorkspaceData
    ? "If it fits naturally, mention you can look through the team's real customer feedback and answer questions grounded in it — invite them to try something like 'what are users saying about onboarding?' Don't force this if it breaks the flow."
    : "This workspace doesn't have any feedback data yet, so if it fits naturally, mention that once feedback comes in, you'll be able to dig into it for them."}

Important: do NOT state any specific facts, numbers, or claims about this workspace's feedback in this reply — you haven't looked anything up for this message. If their message sounds like it needs real data, tell them you'd love to check and invite them to ask it as a question.

Message: "${question}"

Respond with plain natural text (no JSON), 1-3 sentences unless more is clearly warranted.`;
}

async function callGeminiText(prompt) {
  const response = await aiInstance.models.generateContent({
    model: aiConfig.model,
    contents: prompt,
  });
  return (response.text || '').trim();
}

/**
 * Conversational reply with zero feedback context — used for greetings,
 * small talk, and workspaces with no data at all. Deliberately never given
 * any feedback content, so it structurally cannot state a fact about the
 * workspace's data even if asked to.
 */
export async function chatConversational(question, { hasWorkspaceData }) {
  if (!aiInstance) throw new Error('AI provider unavailable');
  return callGeminiText(buildConversationalPrompt(question, { hasWorkspaceData }));
}

function buildAskPrompt(question, retrievedItems, mode = 'grounded') {
  const context = retrievedItems
    .map((r, i) =>
      `[${i + 1}] id="${r.feedback.id}" sentiment=${r.feedback.sentiment} channel="${r.feedback.channel}"\n"${r.feedback.content.replace(/"/g, '\\"')}"`
    )
    .join('\n\n');

  const groundingRules = mode === 'grounded'
    ? `- Answer strictly from the feedback items below. Do not use outside knowledge.
- Never invent, assume, or paraphrase a customer statement that isn't present in the data.
- Cite only the feedback IDs of items you actually used to support your answer.`
    : `- The feedback items below are only loosely related to the question — treat them as weak, possibly-relevant hints, not solid evidence.
- Be honest that you didn't find strong, directly relevant feedback for this specific question.
- You MAY share your own best-guess thinking about what might be going on — but clearly frame it as a guess, separate from the data. Never present a guess as if it were something a customer actually said.
- Never invent a specific customer quote or claim that isn't in the data below.
- Only cite feedback IDs for items you're genuinely drawing on, even loosely — it's fine to cite few or none.`;

  return `${PERSONA_PREAMBLE}

You're answering a question using real customer feedback data. ${mode === 'grounded' ? 'Below is feedback the system found to be relevant.' : 'Below is feedback the system found, but the matches are weak — nothing scored as strongly relevant.'}

Rules:
${groundingRules}
- Distinguish clearly between what feedback directly states and any inference or guess you're making.
- Do not claim "all" or "most" users think something unless multiple items actually support that.
- Be warm, honest, and engaged — like someone who actually wants to help, not a form response.
- End with a short, natural follow-up offer relevant to the conversation — e.g. offering to dig deeper into something related, or inviting them to rephrase if this wasn't quite what they needed.

FEEDBACK DATA:
${context}

QUESTION: ${question}

Respond ONLY with JSON, no markdown fences:
{
  "answer": <string — warm, human, honest about how confident this is>,
  "feedbackIds": [<ids you're citing as real evidence, only from the ids listed above; empty array if none genuinely support the answer>],
  "hasEvidence": <boolean — true only if solid, directly-relevant feedback was found>,
  "followUp": <string — a short, natural follow-up question or offer>
}`;
}

async function callGeminiAsk(question, retrievedItems, mode) {
  const prompt = buildAskPrompt(question, retrievedItems, mode);
  const response = await aiInstance.models.generateContent({
    model: aiConfig.model,
    contents: prompt,
  });

  const responseText = response.text || '';
  const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(jsonStr);

  const validation = AskResponseSchema.safeParse(parsed);
  if (!validation.success) {
    console.warn('[AI] Ask response failed schema validation:', validation.error.format());
    throw new Error('AI grounded answer returned invalid data');
  }
  return validation.data;
}

export async function askGrounded(question, retrievedItems, mode = 'grounded') {
  if (!aiInstance) {
    throw new Error('AI provider unavailable — Ask LOOP requires an active AI connection');
  }
  return callGeminiAsk(question, retrievedItems, mode);
}