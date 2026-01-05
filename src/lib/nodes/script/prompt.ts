import { ScriptInput, Rules } from './types';
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
