import { z } from 'zod';

// Hook styles available for generation
export const HookStyleSchema = z.enum([
  'question',
  'bold_claim',
  'story',
  'statistic',
  'controversy',
]);

export type HookStyle = z.infer<typeof HookStyleSchema>;

// Channel bible context for personalized generation
export const ChannelBibleSchema = z.object({
  tone: z.string().optional(),
  audience: z.string().optional(),
  style: z.string().optional(),
});

export type ChannelBible = z.infer<typeof ChannelBibleSchema>;

// Request schema for ideation generation
export const GenerateRequestSchema = z.object({
  type: z.enum(['hook', 'title', 'description']),
  topic: z.string().min(1, 'Topic is required'),
  count: z.number().int().min(1).max(10).default(5),
  style: z.array(HookStyleSchema).optional(),
  archetype: z.string().optional(),
  channelBible: ChannelBibleSchema.optional(),
  // For description generation, we may need the title
  title: z.string().optional(),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;

// Generated option output
export interface GeneratedOption {
  content: string;
  style?: HookStyle;
  charCount?: number;
  hasNumber?: boolean;
  hasPowerWord?: boolean;
}

// Response schema
export interface GenerateResponse {
  options: GeneratedOption[];
}

// Hook output from Claude
export const HookOutputSchema = z.object({
  content: z.string(),
  style: HookStyleSchema,
});

// Title output from Claude
export const TitleOutputSchema = z.object({
  content: z.string(),
  hasNumber: z.boolean().optional(),
  hasPowerWord: z.boolean().optional(),
  charCount: z.number().optional(),
});

// Description is just a string
export type HookOutput = z.infer<typeof HookOutputSchema>;
export type TitleOutput = z.infer<typeof TitleOutputSchema>;
