import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiInstance = null;
if (process.env.GEMINI_API_KEY) {
  try {
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (err) {
    console.error('Failed to initialize Google Gen AI:', err.message);
  }
}

/**
 * Fallback local sentiment analysis based on keyword counting.
 */
function localAnalyze(content) {
  if (!content) return { sentiment: 'NEU', sentimentScore: 0.0 };

  const positiveWords = [
    'great', 'love', 'amazing', 'good', 'happy', 'excellent', 'awesome', 'best', 
    'satisfied', 'perfect', 'fantastic', 'beautiful', 'cool', 'helpful', 'useful', 
    'smooth', 'fast', 'quick', 'easy', 'recommend', 'thanks', 'thank you', 'delightful'
  ];

  const negativeWords = [
    'bad', 'hate', 'issue', 'problem', 'broken', 'fail', 'slow', 'error', 'worst', 
    'poor', 'annoyed', 'frustrated', 'disappointed', 'terrible', 'useless', 'difficult', 
    'crash', 'bug', 'glitch', 'expensive', 'useless', 'waste', 'hate', 'defect'
  ];

  const text = content.toLowerCase();
  let posCount = 0;
  let negCount = 0;

  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = text.match(regex);
    if (matches) posCount += matches.length;
  });

  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    const matches = text.match(regex);
    if (matches) negCount += matches.length;
  });

  const diff = posCount - negCount;
  const total = posCount + negCount;

  if (total === 0) {
    return { sentiment: 'NEU', sentimentScore: 0.0 };
  }

  const score = diff / total; // between -1 and 1

  let sentiment = 'NEU';
  if (score > 0.15) {
    sentiment = 'POS';
  } else if (score < -0.15) {
    sentiment = 'NEG';
  }

  return { sentiment, sentimentScore: parseFloat(score.toFixed(2)) };
}

/**
 * Analyzes content sentiment.
 * @param {string} content 
 * @returns {Promise<{ sentiment: 'POS'|'NEU'|'NEG', sentimentScore: number }>}
 */
export async function analyzeFeedbackSentiment(content) {
  if (!content || !content.trim()) {
    return { sentiment: 'NEU', sentimentScore: 0.0 };
  }

  if (!aiInstance) {
    return localAnalyze(content);
  }

  try {
    const prompt = `Analyze the sentiment of the following customer feedback text. 
Respond ONLY with a JSON object in this format: 
{
  "sentiment": "POS" | "NEU" | "NEG",
  "score": <float between -1.0 and 1.0>
}
Feedback text: "${content.replace(/"/g, '\\"')}"`;

    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const responseText = response.text || '';
    // Strip markdown formatting if any (like ```json ... ```)
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonStr);

    const validSentiments = ['POS', 'NEU', 'NEG'];
    const sentiment = validSentiments.includes(result.sentiment) ? result.sentiment : 'NEU';
    const sentimentScore = typeof result.score === 'number' ? result.score : 0.0;

    return { sentiment, sentimentScore };
  } catch (error) {
    console.warn('Gemini sentiment analysis failed, falling back to local analysis:', error.message);
    return localAnalyze(content);
  }
}
