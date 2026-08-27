import { z } from 'zod';

export const ReportNarrativeSchema = z.object({
  summary: z.string(),
  sentimentNarrative: z.string(),
  themeNarratives: z.array(z.object({
    themeId: z.string(),
    narrative: z.string(),
  })),
  recommendedActions: z.array(z.string()),
});