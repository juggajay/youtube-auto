import type { TimelineSegment } from '../types';

export interface Caption {
  index: number;
  startTime: number;
  endTime: number;
  text: string;
}

export interface GenerateCaptionsOptions {
  maxCharsPerCaption?: number;
  maxDurationPerCaption?: number;
}

/**
 * Generate captions from timeline segments.
 * Splits long captions into readable chunks.
 */
export function generateCaptions(
  segments: TimelineSegment[],
  options?: GenerateCaptionsOptions
): Caption[] {
  const maxChars = options?.maxCharsPerCaption ?? 80;
  const maxDuration = options?.maxDurationPerCaption ?? 4;

  const captions: Caption[] = [];
  let index = 1;

  for (const segment of segments) {
    if (!segment.caption) continue;

    const words = segment.caption.split(/\s+/).filter(Boolean);
    if (words.length === 0) continue;

    const wordsPerSecond = words.length / segment.duration;

    let currentCaption = '';
    let captionStart = segment.startTime;
    let wordCount = 0;

    for (const word of words) {
      const wouldExceedLength = (currentCaption + ' ' + word).trim().length > maxChars;
      const currentDuration = wordCount / wordsPerSecond;
      const wouldExceedDuration = currentDuration > maxDuration;

      if (currentCaption && (wouldExceedLength || wouldExceedDuration)) {
        // Save current caption
        const duration = wordCount / wordsPerSecond;
        captions.push({
          index: index++,
          startTime: captionStart,
          endTime: captionStart + duration,
          text: currentCaption.trim(),
        });

        captionStart += duration;
        currentCaption = word;
        wordCount = 1;
      } else {
        currentCaption = currentCaption ? `${currentCaption} ${word}` : word;
        wordCount++;
      }
    }

    // Add remaining caption
    if (currentCaption.trim()) {
      captions.push({
        index: index++,
        startTime: captionStart,
        endTime: segment.startTime + segment.duration,
        text: currentCaption.trim(),
      });
    }
  }

  return captions;
}

/**
 * Format time for SRT format (00:00:00,000)
 */
export function formatSrtTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${pad(ms, 3)}`;
}

/**
 * Format time for VTT format (00:00:00.000)
 */
export function formatVttTime(seconds: number): string {
  return formatSrtTime(seconds).replace(',', '.');
}

function pad(n: number, width: number = 2): string {
  return n.toString().padStart(width, '0');
}

/**
 * Generate SRT subtitle file content
 */
export function generateSrt(captions: Caption[]): string {
  return captions.map(caption =>
    `${caption.index}\n${formatSrtTime(caption.startTime)} --> ${formatSrtTime(caption.endTime)}\n${caption.text}\n`
  ).join('\n');
}

/**
 * Generate VTT subtitle file content
 */
export function generateVtt(captions: Caption[]): string {
  const lines = ['WEBVTT', ''];

  for (const caption of captions) {
    lines.push(`${formatVttTime(caption.startTime)} --> ${formatVttTime(caption.endTime)}`);
    lines.push(caption.text);
    lines.push('');
  }

  return lines.join('\n');
}
