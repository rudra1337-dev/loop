import { z } from "zod";

export const ClassificationSchema = z.object({
  sentiment: z.enum(["POS", "NEU", "NEG"]),

  sentimentScore: z
    .number()
    .min(-1)
    .max(1),

  themes: z
    .array(z.string()),

  featureArea: z.string(),

  rationale: z.string()
});
