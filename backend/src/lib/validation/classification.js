import { z } from 'zod';

export const ClassificationSchema = z.object({
  sentiment: z.enum(['POS', 'NEU', 'NEG']),
  sentimentScore: z.number().min(-1).max(1),
  theme: z.object({
    name: z.string().min(1).max(60),
    // isNew guides the model's own reasoning (whether to bother writing a
    // description) but is NOT trusted as ground truth downstream — theme
    // .service.js independently checks the existing-themes cache before
    // deciding to create anything, since a model can say isNew: false while
    // still hallucinating a name that's slightly off from anything real.
    isNew: z.boolean(),
    description: z.string().max(200).optional(),
    confidence: z.number().min(0).max(1),
  }),
});