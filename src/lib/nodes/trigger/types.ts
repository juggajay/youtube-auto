import { z } from 'zod';

export const TriggerInputSchema = z.object({
  topic: z.string().min(3).max(200),
  archetypeId: z.string().default('explainer'),
  sourceType: z.enum(['manual', 'scheduled', 'webhook', 'nicheradar']).default('manual'),
  sourceData: z.record(z.unknown()).optional(),
});

export const TriggerOutputSchema = z.object({
  topic: z.string(),
  archetypeId: z.string(),
  sourceType: z.enum(['manual', 'scheduled', 'webhook', 'nicheradar']),
  sourceData: z.record(z.unknown()).optional(),
});

export const TriggerConfigSchema = z.object({
  defaultArchetype: z.string().default('explainer'),
});

export type TriggerInput = z.infer<typeof TriggerInputSchema>;
export type TriggerOutput = z.infer<typeof TriggerOutputSchema>;
export type TriggerConfig = z.infer<typeof TriggerConfigSchema>;
