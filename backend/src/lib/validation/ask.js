import { z } from 'zod';

export const AskResponseSchema = z.object({
  answer: z.string(),
  feedbackIds: z.array(z.string()),
  hasEvidence: z.boolean(),
  followUp: z.string().optional(),
});