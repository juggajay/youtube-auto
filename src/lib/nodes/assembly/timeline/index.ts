import type {
  AssemblyInput,
  AssemblyConfig,
  TimelineSegment,
  VisualSource,
} from '../types';

export interface TimelineBuilderParams {
  input: AssemblyInput;
  config: AssemblyConfig;
}

export interface Timeline {
  segments: TimelineSegment[];
  totalDuration: number;
}

/**
 * Build a video timeline from script and audio segments.
 * Maps each script section to audio and generates visual sources.
 */
export async function buildTimeline(params: TimelineBuilderParams): Promise<Timeline> {
  const { input, config } = params;
  const segments: TimelineSegment[] = [];
  let currentTime = 0;

  // === Intro (if configured) ===
  if (config.assets.introVideo) {
    const introDuration = await getVideoDuration(config.assets.introVideo);
    segments.push({
      id: 'intro',
      type: 'intro',
      startTime: currentTime,
      duration: introDuration,
      visuals: [{
        source: { type: 'video', url: config.assets.introVideo },
        layer: 0,
        startOffset: 0,
      }],
    });
    currentTime += introDuration;
  }

  // === Hook ===
  const hookAudio = input.audioSegments.find(s => s.id === 'hook');
  if (hookAudio) {
    segments.push({
      id: 'hook',
      type: 'content',
      startTime: currentTime,
      duration: hookAudio.duration,
      audio: {
        url: hookAudio.file,
        volume: 1.0,
        fadeIn: 0.3,
        fadeOut: 0,
      },
      visuals: generateVisuals(
        input.script.hook.visualNotes,
        [],
        hookAudio.duration,
        config
      ),
      caption: input.script.hook.text,
    });
    currentTime += hookAudio.duration;
  }

  // === Main Sections ===
  for (const section of input.script.sections) {
    const sectionAudio = input.audioSegments.find(s => s.id === section.id);
    if (!sectionAudio) continue;

    segments.push({
      id: section.id,
      type: 'content',
      startTime: currentTime,
      duration: sectionAudio.duration,
      audio: {
        url: sectionAudio.file,
        volume: 1.0,
        fadeIn: 0,
        fadeOut: 0,
      },
      visuals: generateVisuals(
        section.visualNotes,
        section.bRollSuggestions,
        sectionAudio.duration,
        config
      ),
      caption: section.script,
    });
    currentTime += sectionAudio.duration;
  }

  // === Outro ===
  const outroAudio = input.audioSegments.find(s => s.id === 'outro');
  if (outroAudio) {
    const outroVisuals = generateVisuals(
      '',
      [],
      outroAudio.duration,
      config
    );

    // Add thumbnail as end screen if available
    if (input.thumbnail) {
      outroVisuals.push({
        source: {
          type: 'image',
          url: input.thumbnail.imageUrl,
          animation: 'zoom_in',
        },
        layer: 1,
        startOffset: Math.max(0, outroAudio.duration - 5),
        duration: 5,
      });
    }

    segments.push({
      id: 'outro',
      type: 'content',
      startTime: currentTime,
      duration: outroAudio.duration,
      audio: {
        url: outroAudio.file,
        volume: 1.0,
        fadeIn: 0,
        fadeOut: 0.5,
      },
      visuals: outroVisuals,
      caption: `${input.script.outro.text} ${input.script.outro.cta}`,
    });
    currentTime += outroAudio.duration;
  }

  // === Outro Video (if configured) ===
  if (config.assets.outroVideo) {
    const outroDuration = await getVideoDuration(config.assets.outroVideo);
    segments.push({
      id: 'outro_video',
      type: 'outro',
      startTime: currentTime,
      duration: outroDuration,
      visuals: [{
        source: { type: 'video', url: config.assets.outroVideo },
        layer: 0,
        startOffset: 0,
      }],
    });
    currentTime += outroDuration;
  }

  return {
    segments,
    totalDuration: currentTime,
  };
}

/**
 * Generate visual sources for a segment based on visual notes and B-roll suggestions.
 */
function generateVisuals(
  visualNotes: string,
  bRollSuggestions: string[],
  duration: number,
  config: AssemblyConfig
): TimelineSegment['visuals'] {
  const visuals: TimelineSegment['visuals'] = [];

  // Determine how many visuals we need (roughly one every 5-10 seconds)
  const visualCount = Math.max(1, Math.ceil(duration / 7));
  const visualDuration = duration / visualCount;

  for (let i = 0; i < visualCount; i++) {
    const query = bRollSuggestions[i % Math.max(1, bRollSuggestions.length)] || visualNotes || 'abstract background';

    let source: VisualSource;

    switch (config.visualSource) {
      case 'stock':
        source = {
          type: 'stock',
          provider: config.stockProvider,
          query,
        };
        break;

      case 'ai_generated':
        source = {
          type: 'ai_generated',
          prompt: `${query}, cinematic, high quality, ${config.aspectRatio === '16:9' ? 'landscape' : 'portrait'}`,
        };
        break;

      case 'text_cards':
        source = {
          type: 'text_card',
          text: query,
          style: 'quote',
        };
        break;

      case 'mixed':
      default:
        // Alternate between stock and text cards
        if (i % 3 === 0) {
          source = {
            type: 'text_card',
            text: bRollSuggestions[i] || query.slice(0, 100),
            style: 'quote',
          };
        } else {
          source = {
            type: 'stock',
            provider: config.stockProvider,
            query,
          };
        }
        break;
    }

    visuals.push({
      source,
      layer: 0,
      startOffset: i * visualDuration,
      duration: visualDuration,
    });
  }

  return visuals;
}

/**
 * Get video duration using FFprobe (placeholder - actual implementation uses ffprobe)
 */
async function getVideoDuration(_url: string): Promise<number> {
  // In production, this would use ffprobe to get actual duration
  // For now, return a reasonable default for intro/outro videos
  return 5;
}

export { generateVisuals };
