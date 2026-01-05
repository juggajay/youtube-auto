import type { PublishConfig } from '../types';

/**
 * Format description with template
 */
export function formatDescription(
  description: string,
  config: PublishConfig,
  chapters?: { timestamp: string; title: string }[]
): string {
  let formatted = description;

  // Add chapters if available
  if (chapters && chapters.length > 0) {
    const chapterText = chapters
      .map(ch => `${ch.timestamp} ${ch.title}`)
      .join('\n');

    formatted = `${formatted}\n\n📑 Chapters:\n${chapterText}`;
  }

  // Add footer from template
  if (config.metadataTemplate.descriptionFooter) {
    formatted = `${formatted}\n\n${config.metadataTemplate.descriptionFooter}`;
  }

  // Ensure under 5000 char limit
  if (formatted.length > 5000) {
    formatted = formatted.slice(0, 4997) + '...';
  }

  return formatted;
}

/**
 * Merge tags with defaults
 */
export function mergeTags(
  tags: string[],
  defaultTags: string[]
): string[] {
  const merged = [...new Set([...tags, ...defaultTags])];

  // YouTube has a 500 char total limit for tags
  let totalChars = 0;
  const validTags: string[] = [];

  for (const tag of merged) {
    if (totalChars + tag.length + 1 > 500) break;  // +1 for comma
    validTags.push(tag);
    totalChars += tag.length + 1;
  }

  return validTags;
}

/**
 * Sanitize title
 */
export function sanitizeTitle(title: string): string {
  // Remove characters YouTube doesn't allow
  let sanitized = title.replace(/[<>]/g, '');

  // Max 100 chars
  if (sanitized.length > 100) {
    sanitized = sanitized.slice(0, 97) + '...';
  }

  return sanitized;
}

/**
 * Get category ID from name
 */
export const YOUTUBE_CATEGORIES: Record<string, string> = {
  'Film & Animation': '1',
  'Autos & Vehicles': '2',
  'Music': '10',
  'Pets & Animals': '15',
  'Sports': '17',
  'Travel & Events': '19',
  'Gaming': '20',
  'People & Blogs': '22',
  'Comedy': '23',
  'Entertainment': '24',
  'News & Politics': '25',
  'Howto & Style': '26',
  'Education': '27',
  'Science & Technology': '28',
  'Nonprofits & Activism': '29',
};

/**
 * Calculate optimal publish time
 */
export function getOptimalPublishTime(
  preferredTimes: string[],
  timezone: string
): Date {
  // If no preferred times, publish now
  if (!preferredTimes || preferredTimes.length === 0) {
    return new Date();
  }

  const now = new Date();

  // Find next preferred time
  for (const timeStr of preferredTimes) {
    const [hours, minutes] = timeStr.split(':').map(Number);

    const candidate = new Date(now);
    candidate.setHours(hours, minutes, 0, 0);

    // If time has passed today, try tomorrow
    if (candidate <= now) {
      candidate.setDate(candidate.getDate() + 1);
    }

    return candidate;
  }

  return now;
}
