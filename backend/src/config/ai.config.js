import dotenv from 'dotenv';
dotenv.config();

// Centralizes all AI-provider configuration in one place so switching
// keys, models, or providers later never requires touching ai.js itself —
// only this config file and the .env need to change.
export const aiConfig = {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
    providerName: process.env.AI_PROVIDER_NAME || 'Gemini',
};

// Fail loudly and early at startup if the key is missing, instead of
// silently falling back to local keyword analysis on every request —
// that failure mode is confusing and hard to diagnose in production.
if (!aiConfig.apiKey) {
    console.warn(
        `[AI CONFIG WARNING] No GEMINI_API_KEY found in environment. ` +
        `All sentiment analysis will use the local keyword fallback until this is set.`
    );
}