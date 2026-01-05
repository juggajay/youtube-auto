# Script Node Implementation Instructions

## Context

VidFlow Phase 1 is complete:
- Node contract interface (`src/lib/nodes/base.ts`)
- Run context with output types (`src/lib/nodes/context.ts`)
- Config resolution with cascade (`src/lib/config/resolve.ts`)
- Node registry (`src/lib/nodes/registry.ts`)
- Pipeline orchestrator (`src/lib/orchestrator/index.ts`)
- Trigger node working (`src/lib/nodes/trigger/index.ts`)
- 48 tests passing

## Your Task

Implement the Script Node — the most complex node that generates video scripts from user-defined structure and rules.

---

## Critical Design Decision

**Archetypes are PRESETS, not constraints.**

The Script Node does NOT receive an archetype ID. It receives:
1. **Structure** — sections, order, durations (user can customize)
2. **Rules** — what to include/exclude, tone, custom instructions
3. **Context** — research, examples, topic

Archetypes are used in the UI to pre-fill these fields. By the time Script Node runs, it only sees the final customized structure/rules — it doesn't know or care if an archetype was used.

---

## File Structure to Create

```
src/lib/nodes/script/
├── index.ts          # ScriptGeneratorNode class
├── types.ts          # Zod schemas for input/output/config
├── prompt.ts         # buildScriptPrompt function
├── parser.ts         # parseScriptResponse function
└── __tests__/
    └── script.test.ts
```

---

## Schema Definitions (types.ts)

```typescript
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

export type ScriptInput = z.infer<typeof ScriptInputSchema>;
export type ScriptOutput = z.infer<typeof ScriptOutputSchema>;
export type ScriptConfig = z.infer<typeof ScriptConfigSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type Structure = z.infer<typeof StructureSchema>;
export type Rules = z.infer<typeof RulesSchema>;
```

---

## Node Implementation (index.ts)

```typescript
import { z } from 'zod';
import {
  NodeContract,
  NodeMeta,
  RunContext,
  NodeResult,
  ExecutionOptions,
  ValidationResult,
  CostEstimate,
  ApiCallLog,
} from '../base';
import {
  ScriptInputSchema,
  ScriptOutputSchema,
  ScriptConfigSchema,
  ScriptInput,
  ScriptOutput,
  ScriptConfig,
} from './types';
import { buildScriptPrompt } from './prompt';
import { parseScriptResponse } from './parser';

export class ScriptGeneratorNode implements NodeContract<
  typeof ScriptInputSchema,
  typeof ScriptOutputSchema,
  typeof ScriptConfigSchema
> {
  meta: NodeMeta = {
    id: 'script',
    name: 'Script Generator',
    description: 'Generates video scripts from structure, rules, and context',
    icon: 'FileText',
    category: 'content',
    requiredCredentials: ['anthropic'],
    estimatedDuration: '30s - 2min',
  };

  inputSchema = ScriptInputSchema;
  outputSchema = ScriptOutputSchema;
  configSchema = ScriptConfigSchema;

  // === Get Input from Context ===
  
  getInputFromContext(context: RunContext): ScriptInput {
    const trigger = context.previousOutputs.trigger;
    const research = context.previousOutputs.research;
    
    // Structure must come from trigger or run overrides
    // This is set by UI before run starts
    const structure = context.runOverrides.nodeOverrides?.script?.structure 
      ?? trigger?.structure;
    
    if (!structure) {
      throw new Error('Script structure not provided');
    }
    
    return {
      topic: trigger?.topic ?? '',
      structure,
      rules: context.runOverrides.nodeOverrides?.script?.rules,
      research,
      examples: context.config.channelBible?.example_scripts,
      instructions: context.runOverrides.instructions,
    };
  }

  // === Validation ===
  
  validate(
    input: ScriptInput,
    config: ScriptConfig,
    context: RunContext
  ): ValidationResult {
    const errors: { field: string; message: string }[] = [];
    const warnings: { field: string; message: string }[] = [];

    // Topic validation
    if (input.topic.length < 10) {
      warnings.push({
        field: 'topic',
        message: 'Topic is very short — script may lack specificity',
      });
    }

    // Structure validation
    if (input.structure.sections.length === 0) {
      errors.push({
        field: 'structure.sections',
        message: 'At least one section required',
      });
    }

    // Duration sanity check
    const { min, max } = input.structure.totalDuration;
    if (min > max) {
      errors.push({
        field: 'structure.totalDuration',
        message: 'Min duration cannot exceed max duration',
      });
    }
    
    if (max > 3600) {
      warnings.push({
        field: 'structure.totalDuration',
        message: 'Videos over 60 minutes may have quality issues',
      });
    }

    // Channel bible check
    if (!context.config.channelBible?.target_audience?.demographics) {
      warnings.push({
        field: 'channelBible',
        message: 'No target audience defined — script tone may not match viewers',
      });
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // === Cost Estimation ===
  
  estimateCost(input: ScriptInput, config: ScriptConfig): CostEstimate {
    // Estimate based on structure complexity
    const sectionCount = input.structure.sections.length;
    const hasResearch = !!input.research;
    const hasExamples = (input.examples?.length ?? 0) > 0;
    
    // Rough token estimates
    const basePromptTokens = 1500;
    const perSectionTokens = 200;
    const researchTokens = hasResearch ? 800 : 0;
    const examplesTokens = hasExamples ? 1000 : 0;
    
    const promptTokens = basePromptTokens + 
      (sectionCount * perSectionTokens) + 
      researchTokens + 
      examplesTokens;
    
    // Output: ~150 words per minute of video
    const targetMinutes = input.structure.totalDuration.max / 60;
    const outputTokens = Math.round(targetMinutes * 150 * 1.5);  // 1.5 for JSON overhead
    
    const costs: Record<string, { input: number; output: number }> = {
      'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
      'claude-opus-4-20250514': { input: 0.015, output: 0.075 },
      'gpt-4o': { input: 0.005, output: 0.015 },
    };

    const modelCosts = costs[config.model];
    const total = 
      (promptTokens / 1000) * modelCosts.input + 
      (outputTokens / 1000) * modelCosts.output;

    return {
      estimated: true,
      breakdown: [{
        service: config.model.includes('claude') ? 'anthropic' : 'openai',
        units: promptTokens + outputTokens,
        unitType: 'tokens',
        cost: total,
      }],
      total,
      confidence: 'medium',
    };
  }

  // === Execution ===
  
  async execute(
    input: ScriptInput,
    config: ScriptConfig,
    context: RunContext,
    options?: ExecutionOptions
  ): Promise<NodeResult<ScriptOutput>> {
    const startedAt = new Date();
    const apiCalls: ApiCallLog[] = [];

    try {
      // Check cancellation
      if (options?.signal?.aborted) {
        return {
          success: false,
          error: { code: 'CANCELLED', message: 'Cancelled by user', retryable: false },
        };
      }

      options?.onProgress?.({ percent: 10, message: 'Building prompt...', stage: 'prompt' });

      // Build prompt with all context
      const prompt = buildScriptPrompt({
        input,
        channelBible: context.config.channelBible,
        includeVisualNotes: config.includeVisualNotes,
        includeMetadata: config.includeMetadata,
        retryContext: context.retry.attemptNumber > 1 
          ? { attemptNumber: context.retry.attemptNumber, lastError: context.retry.lastError }
          : undefined,
      });

      // Check cancellation before API call
      if (options?.signal?.aborted) {
        return {
          success: false,
          error: { code: 'CANCELLED', message: 'Cancelled by user', retryable: false },
        };
      }

      options?.onProgress?.({ percent: 30, message: 'Generating script...', stage: 'generation' });

      // Call LLM
      const requestedAt = new Date();
      const response = await this.callLLM(prompt, config, context, options?.signal);
      const respondedAt = new Date();

      apiCalls.push({
        service: config.model.includes('claude') ? 'anthropic' : 'openai',
        endpoint: '/v1/messages',
        method: 'POST',
        requestedAt,
        respondedAt,
        durationMs: respondedAt.getTime() - requestedAt.getTime(),
        status: 200,
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
      });

      options?.onProgress?.({ percent: 80, message: 'Parsing response...', stage: 'parsing' });

      // Parse response
      const parsed = parseScriptResponse(response.content, input.structure);

      // Validate all required sections are present
      this.validateSections(parsed, input.structure);

      options?.onProgress?.({ percent: 100, message: 'Complete', stage: 'done' });

      const completedAt = new Date();
      return {
        success: true,
        output: parsed,
        metadata: {
          startedAt,
          completedAt,
          durationMs: completedAt.getTime() - startedAt.getTime(),
          actualCost: this.calculateActualCost(apiCalls, config),
          apiCalls,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: this.mapError(error),
      };
    }
  }

  // === Private Helpers ===

  private async callLLM(
    prompt: string,
    config: ScriptConfig,
    context: RunContext,
    signal?: AbortSignal
  ): Promise<{ content: string; usage?: { input_tokens: number; output_tokens: number } }> {
    // Get API key from credential manager
    const apiKey = await context.services.credentials.get('anthropic');
    
    // TODO: Implement actual API call
    // For now, this is a placeholder that should be replaced with:
    // - Anthropic SDK call for Claude models
    // - OpenAI SDK call for GPT models
    
    throw new Error('LLM integration not implemented');
  }

  private validateSections(output: ScriptOutput, structure: ScriptInput['structure']): void {
    const requiredSections = structure.sections.filter(s => s.required);
    const outputSectionIds = new Set(output.sections.map(s => s.id));

    for (const required of requiredSections) {
      if (!outputSectionIds.has(required.id)) {
        throw new Error(`Missing required section: ${required.name}`);
      }
    }
  }

  private mapError(error: unknown): { code: string; message: string; retryable: boolean } {
    if (error instanceof Error) {
      if (error.message.includes('rate_limit') || error.message.includes('429')) {
        return { code: 'RATE_LIMIT', message: 'API rate limit hit', retryable: true };
      }
      if (error.message.includes('context_length') || error.message.includes('too long')) {
        return { code: 'CONTEXT_TOO_LONG', message: 'Input too long for model', retryable: false };
      }
      if (error.message.includes('invalid_api_key') || error.message.includes('401')) {
        return { code: 'INVALID_CREDENTIALS', message: 'Invalid API key', retryable: false };
      }
      return { code: 'LLM_ERROR', message: error.message, retryable: true };
    }
    return { code: 'UNKNOWN', message: String(error), retryable: true };
  }

  private calculateActualCost(
    apiCalls: ApiCallLog[],
    config: ScriptConfig
  ): CostEstimate {
    const costs: Record<string, { input: number; output: number }> = {
      'claude-sonnet-4-20250514': { input: 0.003, output: 0.015 },
      'claude-opus-4-20250514': { input: 0.015, output: 0.075 },
      'gpt-4o': { input: 0.005, output: 0.015 },
    };

    const modelCosts = costs[config.model];
    let totalTokens = 0;
    let totalCost = 0;

    for (const call of apiCalls) {
      const inputTokens = call.inputTokens ?? 0;
      const outputTokens = call.outputTokens ?? 0;
      totalTokens += inputTokens + outputTokens;
      totalCost += 
        (inputTokens / 1000) * modelCosts.input + 
        (outputTokens / 1000) * modelCosts.output;
    }

    return {
      estimated: false,
      breakdown: [{
        service: config.model.includes('claude') ? 'anthropic' : 'openai',
        units: totalTokens,
        unitType: 'tokens',
        cost: totalCost,
      }],
      total: totalCost,
      confidence: 'high',
    };
  }
}
```

---

## Prompt Builder (prompt.ts)

The prompt builder is critical. It must:
1. Include structure with section purposes
2. Merge user rules with channel bible
3. Include research if provided
4. Include examples if provided
5. Handle retry context (what went wrong last time)

```typescript
import { ScriptInput, Structure, Rules } from './types';
import { ChannelBible } from '../../config/types';

interface PromptParams {
  input: ScriptInput;
  channelBible?: ChannelBible;
  includeVisualNotes: boolean;
  includeMetadata: boolean;
  retryContext?: {
    attemptNumber: number;
    lastError?: { code: string; message: string };
  };
}

export function buildScriptPrompt(params: PromptParams): string {
  const { input, channelBible, includeVisualNotes, includeMetadata, retryContext } = params;

  const sections: string[] = [];

  // === System Context ===
  sections.push(`You are an expert YouTube script writer. Generate a complete video script based on the provided structure and rules.`);

  // === Retry Context ===
  if (retryContext) {
    sections.push(`
## IMPORTANT: This is attempt ${retryContext.attemptNumber}
${retryContext.lastError ? `Previous attempt failed: ${retryContext.lastError.message}` : ''}
Please address any issues and ensure the output is valid JSON.
`);
  }

  // === Topic ===
  sections.push(`
## Topic
${input.topic}
`);

  // === Target Audience (from channel bible) ===
  if (channelBible?.target_audience) {
    sections.push(`
## Target Audience
- Demographics: ${channelBible.target_audience.demographics || 'General audience'}
- Knowledge Level: ${channelBible.target_audience.knowledge_level || 'Beginner to intermediate'}
- Why They Watch: ${channelBible.target_audience.why_they_watch || 'To learn and be entertained'}
`);
  }

  // === Tone & Voice ===
  const tone = input.rules?.tone || channelBible?.tone?.overall || 'Professional but conversational';
  sections.push(`
## Tone & Voice
${tone}
${channelBible?.tone?.humor ? `Humor style: ${channelBible.tone.humor}` : ''}
${channelBible?.tone?.formality ? `Formality: ${channelBible.tone.formality}` : ''}
`);

  // === Structure ===
  sections.push(`
## Required Structure

Total Duration Target: ${Math.round(input.structure.totalDuration.min / 60)}-${Math.round(input.structure.totalDuration.max / 60)} minutes

### Sections (in order):
${input.structure.sections.map((s, i) => `
${i + 1}. **${s.name}** (ID: ${s.id})
   - Purpose: ${s.purpose}
   ${s.targetDuration ? `- Target Duration: ~${s.targetDuration} seconds` : ''}
   ${s.notes ? `- Notes: ${s.notes}` : ''}
   ${s.required ? '- REQUIRED' : '- Optional'}
`).join('\n')}

${input.structure.turnPlacement ? `
### Narrative Turn
Place a significant narrative pivot/revelation at approximately ${input.structure.turnPlacement}% through the video.
` : ''}
`);

  // === Rules ===
  const mergedRules = mergeRules(input.rules, channelBible);
  if (mergedRules.alwaysInclude.length > 0 || mergedRules.neverInclude.length > 0 || mergedRules.customInstructions) {
    sections.push(`
## Content Rules

${mergedRules.alwaysInclude.length > 0 ? `### Always Include:
${mergedRules.alwaysInclude.map(r => `- ${r}`).join('\n')}
` : ''}

${mergedRules.neverInclude.length > 0 ? `### Never Include:
${mergedRules.neverInclude.map(r => `- ${r}`).join('\n')}
` : ''}

${mergedRules.vocabulary?.bannedWords?.length ? `### Banned Words:
${mergedRules.vocabulary.bannedWords.join(', ')}
` : ''}

${mergedRules.vocabulary?.preferredPhrases?.length ? `### Preferred Phrases:
${mergedRules.vocabulary.preferredPhrases.join(', ')}
` : ''}

${mergedRules.customInstructions ? `### Custom Instructions:
${mergedRules.customInstructions}
` : ''}
`);
  }

  // === Research ===
  if (input.research) {
    sections.push(`
## Research Context

### Summary:
${input.research.summary}

### Key Points:
${input.research.keyPoints.map(p => `- ${p}`).join('\n')}

### Sources:
${input.research.sources.map(s => `- [${s.title}](${s.url}): ${s.snippet}`).join('\n')}
`);
  }

  // === Examples ===
  if (input.examples && input.examples.length > 0) {
    sections.push(`
## Example Scripts (for style reference)

${input.examples.map(ex => `
### Example: ${ex.name}
Topic: ${ex.topic}
${ex.notes ? `Notes: ${ex.notes}` : ''}

\`\`\`
${ex.script}
\`\`\`
`).join('\n')}
`);
  }

  // === Run Instructions ===
  if (input.instructions) {
    sections.push(`
## Additional Instructions
${input.instructions}
`);
  }

  // === Output Format ===
  sections.push(`
## Output Format

Return a valid JSON object with this exact structure:

\`\`\`json
{
  "title": "Video title (compelling, under 60 characters)",
  "hook": {
    "content": "Opening hook script (first 15-30 seconds)",
    "visualNotes": "What should be on screen"${includeVisualNotes ? '' : ' // Can be empty'},
    "durationEstimate": 20
  },
  "sections": [
    {
      "id": "section_id_from_structure",
      "name": "Section Name",
      "content": "Full script for this section...",
      "visualNotes": "B-roll and visual suggestions"${includeVisualNotes ? '' : ' // Can be empty'},
      "bRollSuggestions": ["suggestion 1", "suggestion 2"],
      "durationEstimate": 120
    }
  ],
  "outro": {
    "content": "Closing script",
    "cta": "Call to action",
    "visualNotes": "End screen suggestions"
  },
  "metadata": {
    "description": "YouTube description (2-3 paragraphs with key points and timestamps)",
    "tags": ["tag1", "tag2", "tag3"],
    "chapters": [
      { "timestamp": "0:00", "title": "Introduction" },
      { "timestamp": "1:30", "title": "Section Title" }
    ]
  }${includeMetadata ? '' : ' // metadata can be minimal'},
  "totalDurationEstimate": 600,
  "wordCount": 1500
}
\`\`\`

IMPORTANT:
- Section IDs must match the structure provided above
- Include ALL required sections
- Duration estimates should be realistic (150-170 words per minute)
- Write actual script content, not placeholders
- Make the hook compelling — this determines if viewers stay
${includeVisualNotes ? '- Include detailed visual notes for each section' : '- Visual notes can be brief'}
${includeMetadata ? '- Generate complete YouTube metadata' : '- Metadata can be minimal'}
`);

  return sections.join('\n\n');
}

function mergeRules(userRules?: Rules, channelBible?: ChannelBible): Rules {
  return {
    alwaysInclude: [
      ...(channelBible?.rules?.always_include ?? []),
      ...(userRules?.alwaysInclude ?? []),
    ],
    neverInclude: [
      ...(channelBible?.rules?.never_include ?? []),
      ...(userRules?.neverInclude ?? []),
    ],
    tone: userRules?.tone,
    vocabulary: {
      useJargon: userRules?.vocabulary?.useJargon ?? channelBible?.vocabulary?.use_jargon ?? false,
      bannedWords: [
        ...(channelBible?.vocabulary?.banned_words ?? []),
        ...(userRules?.vocabulary?.bannedWords ?? []),
      ],
      preferredPhrases: [
        ...(channelBible?.vocabulary?.preferred_phrases ?? []),
        ...(userRules?.vocabulary?.preferredPhrases ?? []),
      ],
    },
    customInstructions: userRules?.customInstructions,
  };
}
```

---

## Response Parser (parser.ts)

```typescript
import { ScriptOutput, Structure } from './types';

export function parseScriptResponse(content: string, structure: Structure): ScriptOutput {
  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || 
                    content.match(/```\n?([\s\S]*?)\n?```/);
  
  const jsonString = jsonMatch ? jsonMatch[1] : content;
  
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString.trim());
  } catch (e) {
    throw new Error(`Failed to parse LLM response as JSON: ${e}`);
  }

  // Validate required fields
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Response is not an object');
  }

  const response = parsed as Record<string, unknown>;

  if (!response.title || typeof response.title !== 'string') {
    throw new Error('Missing or invalid title');
  }

  if (!response.hook || typeof response.hook !== 'object') {
    throw new Error('Missing or invalid hook');
  }

  if (!Array.isArray(response.sections)) {
    throw new Error('Missing or invalid sections array');
  }

  if (!response.outro || typeof response.outro !== 'object') {
    throw new Error('Missing or invalid outro');
  }

  // Calculate word count if not provided
  const wordCount = response.wordCount as number ?? calculateWordCount(response);

  // Calculate total duration if not provided
  const totalDurationEstimate = response.totalDurationEstimate as number ?? 
    calculateTotalDuration(response);

  return {
    title: response.title as string,
    hook: {
      content: (response.hook as any).content ?? '',
      visualNotes: (response.hook as any).visualNotes ?? '',
      durationEstimate: (response.hook as any).durationEstimate ?? 20,
    },
    sections: (response.sections as any[]).map(s => ({
      id: s.id ?? 'unknown',
      name: s.name ?? 'Unnamed Section',
      content: s.content ?? '',
      visualNotes: s.visualNotes ?? '',
      bRollSuggestions: Array.isArray(s.bRollSuggestions) ? s.bRollSuggestions : [],
      durationEstimate: s.durationEstimate ?? 60,
    })),
    outro: {
      content: (response.outro as any).content ?? '',
      cta: (response.outro as any).cta ?? '',
      visualNotes: (response.outro as any).visualNotes ?? '',
    },
    metadata: {
      description: (response.metadata as any)?.description ?? '',
      tags: Array.isArray((response.metadata as any)?.tags) ? (response.metadata as any).tags : [],
      chapters: Array.isArray((response.metadata as any)?.chapters) ? (response.metadata as any).chapters : [],
    },
    totalDurationEstimate,
    wordCount,
  };
}

function calculateWordCount(response: Record<string, unknown>): number {
  let text = '';
  
  const hook = response.hook as any;
  if (hook?.content) text += hook.content + ' ';
  
  const sections = response.sections as any[];
  for (const section of sections) {
    if (section.content) text += section.content + ' ';
  }
  
  const outro = response.outro as any;
  if (outro?.content) text += outro.content;
  
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function calculateTotalDuration(response: Record<string, unknown>): number {
  let total = 0;
  
  const hook = response.hook as any;
  total += hook?.durationEstimate ?? 20;
  
  const sections = response.sections as any[];
  for (const section of sections) {
    total += section.durationEstimate ?? 60;
  }
  
  const outro = response.outro as any;
  total += outro?.durationEstimate ?? 30;
  
  return total;
}
```

---

## Tests (script.test.ts)

Write tests for:
1. Schema validation (valid/invalid inputs)
2. Cost estimation
3. Prompt building (verify all sections included)
4. Response parsing (valid JSON, malformed JSON, missing fields)
5. Validation logic (errors vs warnings)

```typescript
import { describe, it, expect } from 'vitest';
import { ScriptGeneratorNode } from '../index';
import { ScriptInputSchema } from '../types';
import { buildScriptPrompt } from '../prompt';
import { parseScriptResponse } from '../parser';

describe('ScriptGeneratorNode', () => {
  const node = new ScriptGeneratorNode();

  describe('meta', () => {
    it('has correct id', () => {
      expect(node.meta.id).toBe('script');
    });

    it('has correct category', () => {
      expect(node.meta.category).toBe('content');
    });

    it('requires anthropic credentials', () => {
      expect(node.meta.requiredCredentials).toContain('anthropic');
    });
  });

  describe('input validation', () => {
    it('accepts valid input', () => {
      const input = {
        topic: 'How to build a YouTube automation tool',
        structure: {
          sections: [
            { id: 'intro', name: 'Introduction', purpose: 'Hook the viewer', required: true },
            { id: 'main', name: 'Main Content', purpose: 'Deliver value', required: true },
          ],
          totalDuration: { min: 300, max: 600 },
        },
      };

      const result = ScriptInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('rejects input without sections', () => {
      const input = {
        topic: 'Test topic',
        structure: {
          sections: [],
          totalDuration: { min: 300, max: 600 },
        },
      };

      const result = ScriptInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it('rejects topic that is too short', () => {
      const input = {
        topic: 'Hi',
        structure: {
          sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook', required: true }],
          totalDuration: { min: 300, max: 600 },
        },
      };

      const result = ScriptInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  // Add more tests...
});

describe('buildScriptPrompt', () => {
  it('includes topic', () => {
    const prompt = buildScriptPrompt({
      input: {
        topic: 'Test Topic',
        structure: {
          sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook', required: true }],
          totalDuration: { min: 300, max: 600 },
        },
      },
      includeVisualNotes: true,
      includeMetadata: true,
    });

    expect(prompt).toContain('Test Topic');
  });

  it('includes all sections', () => {
    const prompt = buildScriptPrompt({
      input: {
        topic: 'Test',
        structure: {
          sections: [
            { id: 's1', name: 'Section One', purpose: 'First section', required: true },
            { id: 's2', name: 'Section Two', purpose: 'Second section', required: false },
          ],
          totalDuration: { min: 300, max: 600 },
        },
      },
      includeVisualNotes: true,
      includeMetadata: true,
    });

    expect(prompt).toContain('Section One');
    expect(prompt).toContain('Section Two');
    expect(prompt).toContain('s1');
    expect(prompt).toContain('s2');
  });

  // Add more tests...
});

describe('parseScriptResponse', () => {
  const structure = {
    sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook', required: true }],
    totalDuration: { min: 300, max: 600 },
  };

  it('parses valid JSON response', () => {
    const response = JSON.stringify({
      title: 'Test Video',
      hook: { content: 'Welcome!', visualNotes: 'Show logo', durationEstimate: 15 },
      sections: [{ id: 'intro', name: 'Intro', content: 'Main content...', visualNotes: '', bRollSuggestions: [], durationEstimate: 60 }],
      outro: { content: 'Thanks for watching', cta: 'Subscribe!', visualNotes: '' },
      metadata: { description: 'A test video', tags: ['test'], chapters: [] },
      totalDurationEstimate: 75,
      wordCount: 50,
    });

    const parsed = parseScriptResponse(response, structure);
    expect(parsed.title).toBe('Test Video');
    expect(parsed.sections).toHaveLength(1);
  });

  it('handles JSON in code blocks', () => {
    const response = '```json\n{"title": "Test", "hook": {"content": "", "visualNotes": "", "durationEstimate": 10}, "sections": [], "outro": {"content": "", "cta": "", "visualNotes": ""}, "metadata": {"description": "", "tags": [], "chapters": []}, "totalDurationEstimate": 10, "wordCount": 0}\n```';
    
    const parsed = parseScriptResponse(response, structure);
    expect(parsed.title).toBe('Test');
  });

  it('throws on invalid JSON', () => {
    expect(() => parseScriptResponse('not json', structure)).toThrow();
  });

  // Add more tests...
});
```

---

## Integration Notes

### Register the Node

After implementing, register in the node registry:

```typescript
// src/lib/nodes/registry.ts
import { ScriptGeneratorNode } from './script';

// In initialization
registry.register(new ScriptGeneratorNode());
```

### Update Trigger Output Type

The trigger node needs to pass structure to script node:

```typescript
// In src/lib/nodes/context.ts, update TriggerOutput:
export interface TriggerOutput {
  topic: string;
  sourceType: 'manual' | 'scheduled' | 'webhook' | 'nicheradar';
  sourceData?: Record<string, unknown>;
  
  // Add these for script node
  structure?: Structure;
  rules?: Rules;
}
```

### UI Flow

The UI should:
1. Let user select an archetype (optional)
2. Pre-fill structure/rules from archetype
3. Allow user to customize structure/rules
4. Store final structure/rules in run overrides or trigger output
5. Script node receives and uses them

---

## Checklist

- [ ] Create `src/lib/nodes/script/types.ts`
- [ ] Create `src/lib/nodes/script/prompt.ts`
- [ ] Create `src/lib/nodes/script/parser.ts`
- [ ] Create `src/lib/nodes/script/index.ts`
- [ ] Create `src/lib/nodes/script/__tests__/script.test.ts`
- [ ] Register node in registry
- [ ] Update TriggerOutput type
- [ ] Implement LLM API call (placeholder exists)
- [ ] All tests passing

---

## Questions to Resolve During Implementation

1. **LLM API Integration**: Use Anthropic SDK or Vercel AI SDK?
2. **Streaming**: Should script generation stream progress, or return all at once?
3. **Partial Output**: If LLM returns invalid JSON, should we attempt recovery?
4. **Examples Storage**: Where do project-level example scripts live in the config?

Make decisions and document them.