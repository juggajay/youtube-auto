import { z } from 'zod';

// === Visual Source Types ===

export const VisualSourceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('stock'),
    provider: z.enum(['pexels', 'storyblocks', 'pixabay']),
    query: z.string(),
  }),
  z.object({
    type: z.literal('ai_generated'),
    prompt: z.string(),
    style: z.string().optional(),
  }),
  z.object({
    type: z.literal('image'),
    url: z.string(),
    animation: z.enum(['none', 'ken_burns', 'zoom_in', 'zoom_out', 'pan']).default('ken_burns'),
  }),
  z.object({
    type: z.literal('text_card'),
    text: z.string(),
    style: z.enum(['quote', 'title', 'bullet_points', 'statistic']),
  }),
  z.object({
    type: z.literal('video'),
    url: z.string(),
    startTime: z.number().optional(),
    endTime: z.number().optional(),
  }),
]);

// === Timeline Segment ===

export const TimelineSegmentSchema = z.object({
  id: z.string(),
  type: z.enum(['intro', 'content', 'outro']),

  // Timing
  startTime: z.number(),
  duration: z.number(),

  // Audio
  audio: z.object({
    url: z.string(),
    volume: z.number().default(1.0),
    fadeIn: z.number().default(0),
    fadeOut: z.number().default(0),
  }).optional(),

  // Visuals (can have multiple layers)
  visuals: z.array(z.object({
    source: VisualSourceSchema,
    layer: z.number().default(0),
    startOffset: z.number().default(0),
    duration: z.number().optional(),
    position: z.object({
      x: z.number().default(0),
      y: z.number().default(0),
      width: z.number().default(100),
      height: z.number().default(100),
    }).optional(),
  })),

  // Text overlay for this segment
  caption: z.string().optional(),
});

// === Caption Style ===

export const CaptionStyleSchema = z.object({
  enabled: z.boolean().default(true),
  font: z.string().default('Inter'),
  fontSize: z.number().default(48),
  fontColor: z.string().default('#FFFFFF'),
  backgroundColor: z.string().default('#000000'),
  backgroundOpacity: z.number().default(0.7),
  position: z.enum(['bottom', 'top', 'center']).default('bottom'),
  style: z.enum(['standard', 'highlighted', 'word_by_word', 'karaoke']).default('standard'),
  maxWidth: z.number().default(80),
  marginBottom: z.number().default(50),
});

// === Input Schema ===

export const AssemblyInputSchema = z.object({
  // From Script Node (matching context.ts ScriptOutput)
  script: z.object({
    title: z.string(),
    hook: z.object({
      text: z.string(),
      visualNotes: z.string(),
      durationEstimate: z.number(),
    }),
    sections: z.array(z.object({
      id: z.string(),
      name: z.string(),
      script: z.string(),
      visualNotes: z.string(),
      bRollSuggestions: z.array(z.string()),
      durationEstimate: z.number(),
    })),
    outro: z.object({
      text: z.string(),
      cta: z.string(),
    }),
  }),

  // From Voice Node
  audioSegments: z.array(z.object({
    id: z.string(),
    file: z.string(),
    duration: z.number(),
    text: z.string(),
  })),

  // From Thumbnail Node (optional - for end screen)
  thumbnail: z.object({
    imageUrl: z.string(),
  }).optional(),

  // Style overrides for this run
  styleOverride: z.object({
    captionStyle: CaptionStyleSchema.partial(),
  }).optional(),
});

// === Output Schema ===

export const AssemblyOutputSchema = z.object({
  videoUrl: z.string(),
  videoPath: z.string(),

  subtitleUrl: z.string().optional(),
  subtitlePath: z.string().optional(),

  metadata: z.object({
    duration: z.number(),
    resolution: z.string(),
    fileSize: z.number(),
    format: z.string(),
  }),

  timeline: z.array(TimelineSegmentSchema),
});

// === Config Schema ===

export const AssemblyConfigSchema = z.object({
  // Output settings
  resolution: z.enum(['720p', '1080p', '4k']).default('1080p'),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).default('16:9'),
  frameRate: z.number().default(30),
  format: z.enum(['mp4', 'webm', 'mov']).default('mp4'),

  // Quality
  videoBitrate: z.string().default('8M'),
  audioBitrate: z.string().default('192k'),
  preset: z.enum(['ultrafast', 'fast', 'medium', 'slow']).default('medium'),

  // Assets
  assets: z.object({
    introVideo: z.string().optional(),
    outroVideo: z.string().optional(),
    backgroundMusic: z.string().optional(),
    backgroundMusicVolume: z.number().default(0.15),
    watermark: z.string().optional(),
  }).default({ backgroundMusicVolume: 0.15 }),

  // Captions
  captionStyle: CaptionStyleSchema.default({
    enabled: true,
    font: 'Inter',
    fontSize: 48,
    fontColor: '#FFFFFF',
    backgroundColor: '#000000',
    backgroundOpacity: 0.7,
    position: 'bottom',
    style: 'standard',
    maxWidth: 80,
    marginBottom: 50,
  }),
  generateSubtitleFile: z.boolean().default(true),

  // Visual generation
  visualSource: z.enum(['stock', 'ai_generated', 'text_cards', 'mixed']).default('mixed'),
  stockProvider: z.enum(['pexels', 'storyblocks']).default('pexels'),

  // Transitions
  transitionType: z.enum(['none', 'fade', 'crossfade', 'wipe']).default('crossfade'),
  transitionDuration: z.number().default(0.5),

  // Text animation
  textAnimation: z.enum(['none', 'fade', 'typewriter', 'slide']).default('fade'),
});

export type AssemblyInput = z.infer<typeof AssemblyInputSchema>;
export type AssemblyOutput = z.infer<typeof AssemblyOutputSchema>;
export type AssemblyConfig = z.infer<typeof AssemblyConfigSchema>;
export type TimelineSegment = z.infer<typeof TimelineSegmentSchema>;
export type CaptionStyle = z.infer<typeof CaptionStyleSchema>;
export type VisualSource = z.infer<typeof VisualSourceSchema>;
