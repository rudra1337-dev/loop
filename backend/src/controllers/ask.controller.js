import { askQuestion } from '../services/ask.service.js';

export const askFeedback = async (req, res) => {
  try {
    const { workspaceId } = req.user;
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const result = await askQuestion(question.trim(), workspaceId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error in Ask LOOP:', error);
    res.status(500).json({ error: 'Failed to process question' });
  }
};