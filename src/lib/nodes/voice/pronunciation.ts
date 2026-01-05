import type { PronunciationEntry } from './types';

/**
 * Apply pronunciation guide to text.
 * Replaces words with their phonetic versions using ElevenLabs pronunciation tags.
 */
export function applyPronunciationGuide(
  text: string,
  guide: PronunciationEntry[]
): string {
  if (guide.length === 0) return text;

  let result = text;

  for (const entry of guide) {
    // Build regex based on case sensitivity
    const flags = entry.caseSensitive ? 'g' : 'gi';
    const pattern = new RegExp(`\\b${escapeRegex(entry.word)}\\b`, flags);

    // ElevenLabs uses <phoneme> tags for pronunciation
    // Alternative: just replace with the pronunciation spelling
    const replacement = entry.pronunciation;

    result = result.replace(pattern, replacement);
  }

  return result;
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Preprocess text for TTS
 * - Apply pronunciation guide
 * - Normalize whitespace
 * - Handle special characters
 */
export function preprocessTextForTTS(
  text: string,
  pronunciationGuide: PronunciationEntry[]
): string {
  let processed = text;

  // Normalize whitespace
  processed = processed.replace(/\s+/g, ' ').trim();

  // Apply pronunciation guide
  processed = applyPronunciationGuide(processed, pronunciationGuide);

  // Convert common abbreviations (optional)
  const abbreviations: Record<string, string> = {
    'API': 'A.P.I.',
    'URL': 'U.R.L.',
    'SQL': 'sequel',
    'AI': 'A.I.',
    'UI': 'U.I.',
    'UX': 'U.X.',
  };

  for (const [abbr, expanded] of Object.entries(abbreviations)) {
    const pattern = new RegExp(`\\b${abbr}\\b`, 'g');
    processed = processed.replace(pattern, expanded);
  }

  return processed;
}

/**
 * Split long text into chunks suitable for TTS
 * ElevenLabs has a ~5000 character limit per request
 */
export function splitTextForTTS(text: string, maxLength: number = 4500): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
