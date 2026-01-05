import type { ThumbnailStyleGuide, ThumbnailInput } from './types';

export interface ThumbnailPromptParams {
  input: ThumbnailInput;
  styleGuide: ThumbnailStyleGuide;
  variationIndex: number;           // 0, 1, 2 for different variations
  includeText: boolean;
}

/**
 * Build a prompt for thumbnail generation.
 * Creates variations by adjusting composition, angle, or emphasis.
 */
export function buildThumbnailPrompt(params: ThumbnailPromptParams): string {
  const { input, styleGuide, variationIndex, includeText } = params;

  const parts: string[] = [];

  // === Base Description ===
  parts.push('YouTube thumbnail image, 16:9 aspect ratio, high quality, eye-catching');

  // === Topic/Subject ===
  parts.push(`Topic: ${input.topic}`);

  // === Mood ===
  const moodDescriptions: Record<string, string> = {
    professional: 'clean, polished, corporate feel',
    energetic: 'dynamic, vibrant, high energy',
    dramatic: 'bold contrast, cinematic lighting, intense',
    minimal: 'simple, clean, lots of whitespace',
    playful: 'fun, colorful, lighthearted',
  };
  parts.push(`Style: ${moodDescriptions[styleGuide.style.mood]}`);

  // === Color Palette ===
  parts.push(`Color scheme: primary ${styleGuide.colors.primary}, accent ${styleGuide.colors.accent}`);

  // === Face/Character ===
  if (styleGuide.style.includeFace) {
    const expressions: Record<string, string> = {
      surprised: 'person with surprised/shocked expression, wide eyes, open mouth',
      excited: 'person with excited, happy expression, big smile',
      serious: 'person with serious, thoughtful expression',
      curious: 'person with curious, intrigued expression, raised eyebrow',
      none: '',
    };
    if (styleGuide.style.faceExpression !== 'none') {
      parts.push(expressions[styleGuide.style.faceExpression]);
    }
  }

  // === Background ===
  const bgDescriptions: Record<string, string> = {
    generated: 'contextually relevant background',
    solid: `solid ${styleGuide.colors.secondary} background`,
    gradient: `gradient background from ${styleGuide.colors.primary} to ${styleGuide.colors.secondary}`,
    image: 'relevant photo background',
  };
  parts.push(bgDescriptions[styleGuide.style.backgroundType]);

  // === Elements ===
  const elements: string[] = [];
  if (styleGuide.elements.useArrows) elements.push('attention-grabbing arrows');
  if (styleGuide.elements.useCircles) elements.push('highlight circles');
  if (styleGuide.elements.useIcons) elements.push('relevant icons');
  if (styleGuide.elements.useBorder) elements.push('bold border frame');
  if (styleGuide.elements.useEmoji) elements.push('relevant emoji');

  if (elements.length > 0) {
    parts.push(`Include: ${elements.join(', ')}`);
  }

  // === Text Overlay ===
  if (includeText && input.overlayText) {
    const textStyles: Record<string, string> = {
      bold: 'bold, thick',
      outline: 'outlined, stroke',
      shadow: 'drop shadow',
      gradient: 'gradient fill',
    };
    parts.push(`Text overlay: "${input.overlayText}" in large ${textStyles[styleGuide.typography.textStyle]} ${styleGuide.typography.fontFamily} font, ${styleGuide.colors.text} color`);
    parts.push(`Text position: ${styleGuide.typography.textPosition}`);
  }

  // === Variation ===
  const variations = [
    'centered composition, balanced layout',
    'dynamic angle, rule of thirds',
    'close-up focus, dramatic crop',
  ];
  parts.push(`Composition: ${variations[variationIndex % variations.length]}`);

  // === Target Emotion ===
  if (input.targetEmotion) {
    parts.push(`Evoke emotion: ${input.targetEmotion}`);
  }

  // === Negative Prompts (what to avoid) ===
  const negatives = [
    'blurry',
    'low quality',
    'watermark',
    'text errors',
    'distorted faces',
    'cluttered',
    'hard to read',
  ];
  parts.push(`Avoid: ${negatives.join(', ')}`);

  return parts.join('. ');
}

/**
 * Generate a shorter prompt for text overlay extraction
 */
export function extractOverlayText(title: string, maxWords: number): string {
  // Remove common filler words and extract key phrases
  const fillerWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'for', 'on', 'with'];

  const words = title
    .split(/\s+/)
    .filter(word => !fillerWords.includes(word.toLowerCase()));

  if (words.length <= maxWords) {
    return words.join(' ');
  }

  // Take first N words, prioritizing capitalized words
  const prioritized = [...words].sort((a, b) => {
    const aUpper = a[0] === a[0].toUpperCase() ? 1 : 0;
    const bUpper = b[0] === b[0].toUpperCase() ? 1 : 0;
    return bUpper - aUpper;
  });

  return prioritized.slice(0, maxWords).join(' ');
}
