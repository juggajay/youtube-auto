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
      content: (response.hook as Record<string, unknown>).content as string ?? '',
      visualNotes: (response.hook as Record<string, unknown>).visualNotes as string ?? '',
      durationEstimate: (response.hook as Record<string, unknown>).durationEstimate as number ?? 20,
    },
    sections: (response.sections as Record<string, unknown>[]).map(s => ({
      id: s.id as string ?? 'unknown',
      name: s.name as string ?? 'Unnamed Section',
      content: s.content as string ?? '',
      visualNotes: s.visualNotes as string ?? '',
      bRollSuggestions: Array.isArray(s.bRollSuggestions) ? s.bRollSuggestions as string[] : [],
      durationEstimate: s.durationEstimate as number ?? 60,
    })),
    outro: {
      content: (response.outro as Record<string, unknown>).content as string ?? '',
      cta: (response.outro as Record<string, unknown>).cta as string ?? '',
      visualNotes: (response.outro as Record<string, unknown>).visualNotes as string ?? '',
    },
    metadata: {
      description: (response.metadata as Record<string, unknown>)?.description as string ?? '',
      tags: Array.isArray((response.metadata as Record<string, unknown>)?.tags)
        ? (response.metadata as Record<string, unknown>).tags as string[]
        : [],
      chapters: Array.isArray((response.metadata as Record<string, unknown>)?.chapters)
        ? ((response.metadata as Record<string, unknown>).chapters as Record<string, unknown>[]).map(c => ({
            timestamp: c.timestamp as string ?? '0:00',
            title: c.title as string ?? '',
          }))
        : [],
    },
    totalDurationEstimate,
    wordCount,
  };
}

function calculateWordCount(response: Record<string, unknown>): number {
  let text = '';

  const hook = response.hook as Record<string, unknown>;
  if (hook?.content) text += hook.content + ' ';

  const sections = response.sections as Record<string, unknown>[];
  for (const section of sections) {
    if (section.content) text += section.content + ' ';
  }

  const outro = response.outro as Record<string, unknown>;
  if (outro?.content) text += outro.content;

  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function calculateTotalDuration(response: Record<string, unknown>): number {
  let total = 0;

  const hook = response.hook as Record<string, unknown>;
  total += hook?.durationEstimate as number ?? 20;

  const sections = response.sections as Record<string, unknown>[];
  for (const section of sections) {
    total += section.durationEstimate as number ?? 60;
  }

  const outro = response.outro as Record<string, unknown>;
  total += outro?.durationEstimate as number ?? 30;

  return total;
}
