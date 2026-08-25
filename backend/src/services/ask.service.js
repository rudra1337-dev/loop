import { Feedback } from '../models/index.js';
import { generateEmbedding, askGrounded, chatConversational } from '../utils/ai.js';
import { retrieveRelevantFeedback } from './retrieval.service.js';

const GREETING_REGEX = /^(hi|hey|hello|yo|sup|thanks|thank you|ok|okay|test|good morning|good evening|what can you do|help)\.?!?$/i;
function isMetaOrGreeting(question) {
  const trimmed = question.trim();
  return trimmed.length < 3 || GREETING_REGEX.test(trimmed);
}

const FALLBACK_TEXT = "I ran into a hiccup trying to answer that — mind trying again in a moment?";

async function hasAnyFeedback(workspaceId) {
  const count = await Feedback.count({ where: { workspaceId } });
  return count > 0;
}

export async function askQuestion(question, workspaceId) {
  // Small talk / meta — skip retrieval entirely (saves an embedding + a
  // vector scan), but still a real, personalized Gemini reply, never canned.
  if (isMetaOrGreeting(question)) {
    try {
      const hasData = await hasAnyFeedback(workspaceId);
      const answer = await chatConversational(question, { hasWorkspaceData: hasData });
      return { answer, sources: [], hasEvidence: false, followUp: null };
    } catch (err) {
      console.error('[Ask LOOP] Conversational reply failed:', err.message);
      return { answer: FALLBACK_TEXT, sources: [], hasEvidence: false, followUp: null };
    }
  }

  const questionEmbedding = await generateEmbedding(question);
  if (!questionEmbedding) {
    return {
      answer: "I'm having trouble reaching my thinking engine right now — give it a moment and try again?",
      sources: [], hasEvidence: false, followUp: null,
    };
  }

  const { top, relevant } = await retrieveRelevantFeedback(questionEmbedding, workspaceId, { topK: 5, minSimilarity: 0.35 });

  // Nothing in the workspace to search at all — still a warm, real reply.
  if (top.length === 0) {
    try {
      const answer = await chatConversational(question, { hasWorkspaceData: false });
      return { answer, sources: [], hasEvidence: false, followUp: null };
    } catch {
      return {
        answer: "Your workspace doesn't have any feedback yet, so there's nothing for me to search through — once some comes in, I'll be able to dig into it for you.",
        sources: [], hasEvidence: false, followUp: null,
      };
    }
  }

  // Strong matches → grounded mode. Only weak matches → speculative mode,
  // which is allowed to guess but must label the guess as a guess.
  const useItems = relevant.length > 0 ? relevant : top;
  const mode = relevant.length > 0 ? 'grounded' : 'speculative';

  let result;
  try {
    result = await askGrounded(question, useItems, mode);
  } catch (err) {
    console.error('[Ask LOOP] Grounded generation failed:', err.message);
    return { answer: FALLBACK_TEXT, sources: [], hasEvidence: false, followUp: null };
  }

  // Server-side citation validation — never trust model-returned IDs directly.
  const retrievedIds = new Set(useItems.map((r) => r.feedback.id));
  const validIds = result.feedbackIds.filter((id) => retrievedIds.has(id));
  if (result.feedbackIds.length > 0 && validIds.length === 0) {
    console.warn('[Ask LOOP] Model returned citations outside the retrieved set — discarding.');
  }

  const sources = useItems
    .filter((r) => validIds.includes(r.feedback.id))
    .map((r) => ({
      id: r.feedback.id,
      content: r.feedback.content,
      sentiment: r.feedback.sentiment,
      channel: r.feedback.channel,
      similarity: parseFloat(r.similarity.toFixed(3)),
    }));

  return {
    answer: result.answer,
    sources,
    // Speculative mode is always surfaced as "no solid evidence" in the UI,
    // regardless of what the model itself claimed — keeps the honesty
    // guarantee independent of model behavior.
    hasEvidence: mode === 'grounded' && result.hasEvidence && sources.length > 0,
    followUp: result.followUp || null,
  };
}