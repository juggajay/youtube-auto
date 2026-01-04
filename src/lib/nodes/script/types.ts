import { z } from 'zod';

// === Section Definition ===
const SectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  purpose: z.string(),
  targetDuration: z.number().optional(),  // seconds
  required: z.boolean().default(true),
  notes: z.string().optional(),           // User notes for this section
});

// === Structure ===
const StructureSchema = z.object({
  sections: z.array(SectionSchema).min(1),
  turnPlacement: z.number().min(0).max(100).optional(),  // percentage
  totalDuration: z.object({
    min: z.number(),  // seconds
    max: z.number(),
  }),
});

// === Rules ===
const RulesSchema = z.object({
  alwaysInclude: z.array(z.string()).default([]),
  neverInclude: z.array(z.string()).default([]),
  tone: z.string().optional(),
  vocabulary: z.object({
    useJargon: z.boolean().default(false),
    bannedWords: z.array(z.string()).default([]),
    preferredPhrases: z.array(z.string()).default([]),
  }).optional(),
  customInstructions: z.string().optional(),  // Freeform user notes
});

// === Script Example (few-shot) ===
const ScriptExampleSchema = z.object({
  name: z.string(),
  topic: z.string(),
  script: z.string(),
  notes: z.string().optional(),
});

// === INPUT SCHEMA ===
export const ScriptInputSchema = z.object({
  // Required
  topic: z.string().min(3).max(500),
  structure: StructureSchema,

  // Rules (merged with channel bible in prompt)
  rules: RulesSchema.optional(),

  // Optional context from previous nodes or user
  research: z.object({
    summary: z.string(),
    keyPoints: z.array(z.string()),
    sources: z.array(z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
    })),
  }).optional(),

  // Few-shot examples
  examples: z.array(ScriptExampleSchema).optional(),

  // Run-specific instructions
  instructions: z.string().optional(),
});

// === Output Section ===
const OutputSectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
  visualNotes: z.string(),
  bRollSuggestions: z.array(z.string()),
  durationEstimate: z.number(),  // seconds
});

// === OUTPUT SCHEMA ===
export const ScriptOutputSchema = z.object({
  title: z.string(),

  hook: z.object({
    content: z.string(),
    visualNotes: z.string(),
    durationEstimate: z.number(),
  }),

  sections: z.array(OutputSectionSchema),

  outro: z.object({
    content: z.string(),
    cta: z.string(),
    visualNotes: z.string(),
  }),

  metadata: z.object({
    description: z.string(),
    tags: z.array(z.string()),
    chapters: z.array(z.object({
      timestamp: z.string(),
      title: z.string(),
    })),
  }),

  // Computed
  totalDurationEstimate: z.number(),
  wordCount: z.number(),
});

// === CONFIG SCHEMA ===
export const ScriptConfigSchema = z.object({
  model: z.enum([
    'claude-sonnet-4-20250514',
    'claude-opus-4-20250514',
    'gpt-4o',
  ]).default('claude-sonnet-4-20250514'),

  temperature: z.number().min(0).max(1).default(0.7),

  // If true, include visual notes and b-roll suggestions
  includeVisualNotes: z.boolean().default(true),

  // If true, generate YouTube metadata
  includeMetadata: z.boolean().default(true),
});

// Export Zod schemas for use in node contract
export { SectionSchema, StructureSchema, RulesSchema };

export type ScriptInput = z.infer<typeof ScriptInputSchema>;
export type ScriptOutput = z.infer<typeof ScriptOutputSchema>;
export type ScriptConfig = z.infer<typeof ScriptConfigSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Structure = z.infer<typeof StructureSchema>;
export type Rules = z.infer<typeof RulesSchema>;
