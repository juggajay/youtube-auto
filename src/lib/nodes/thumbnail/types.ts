import { z } from 'zod';

// === Style Guide ===

export const ThumbnailColorsSchema = z.object({
  primary: z.string().default('#2563EB'),      // Main brand color
  secondary: z.string().default('#1E293B'),    // Background/accent
  text: z.string().default('#FFFFFF'),         // Text color
  accent: z.string().default('#F59E0B'),       // Highlight color
});

export const ThumbnailTypographySchema = z.object({
  fontFamily: z.string().default('Inter'),
  maxWords: z.number().default(4),             // Max words in thumbnail text
  textPosition: z.enum(['top', 'bottom', 'left', 'right', 'center', 'dynamic']).default('dynamic'),
  textStyle: z.enum(['bold', 'outline', 'shadow', 'gradient']).default('bold'),
});

export const ThumbnailStyleSchema = z.object({
  backgroundType: z.enum(['generated', 'solid', 'gradient', 'image']).default('generated'),
  mood: z.enum(['professional', 'energetic', 'dramatic', 'minimal', 'playful']).default('professional'),
  includeFace: z.boolean().default(false),     // Include human face
  faceExpression: z.enum(['surprised', 'excited', 'serious', 'curious', 'none']).default('none'),
});

export const ThumbnailElementsSchema = z.object({
  useArrows: z.boolean().default(false),
  useCircles: z.boolean().default(false),
  useIcons: z.boolean().default(true),
  useBorder: z.boolean().default(false),
  useEmoji: z.boolean().default(false),
});

export const ThumbnailStyleGuideSchema = z.object({
  dimensions: z.object({
    width: z.number().default(1280),
    height: z.number().default(720),
  }).default({ width: 1280, height: 720 }),
  colors: ThumbnailColorsSchema.default({
    primary: '#2563EB',
    secondary: '#1E293B',
    text: '#FFFFFF',
    accent: '#F59E0B',
  }),
  typography: ThumbnailTypographySchema.default({
    fontFamily: 'Inter',
    maxWords: 4,
    textPosition: 'dynamic',
    textStyle: 'bold',
  }),
  style: ThumbnailStyleSchema.default({
    backgroundType: 'generated',
    mood: 'professional',
    includeFace: false,
    faceExpression: 'none',
  }),
  elements: ThumbnailElementsSchema.default({
    useArrows: false,
    useCircles: false,
    useIcons: true,
    useBorder: false,
    useEmoji: false,
  }),
});

// === Input Schema ===

export const ThumbnailInputSchema = z.object({
  // From Script Node
  title: z.string(),
  topic: z.string(),

  // Optional context
  keyPoints: z.array(z.string()).optional(),   // Key points from script for visual ideas
  targetEmotion: z.string().optional(),        // "curiosity", "excitement", "shock"

  // Generation options
  count: z.number().min(1).max(5).default(3),  // Number of options to generate

  // Text overlay (optional - can be different from title)
  overlayText: z.string().optional(),

  // Style override for this run
  styleOverride: ThumbnailStyleGuideSchema.partial().optional(),
});

// === Output Schema ===

export const ThumbnailOptionSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),                        // Supabase storage URL
  imagePath: z.string(),                       // Storage path
  prompt: z.string(),                          // Prompt used to generate
  metadata: z.object({
    generator: z.enum(['gemini', 'dalle', 'flux']),
    dimensions: z.object({ width: z.number(), height: z.number() }),
    hasTextOverlay: z.boolean(),
  }),
});

export const ThumbnailOutputSchema = z.object({
  options: z.array(ThumbnailOptionSchema),
  selectedId: z.string().optional(),           // If auto-selected
  styleGuideUsed: ThumbnailStyleGuideSchema,
});

// === Config Schema ===

export const ThumbnailConfigSchema = z.object({
  generator: z.enum(['gemini', 'dalle', 'flux']).default('gemini'),

  // Model-specific settings
  geminiModel: z.string().default('imagen-4.0-generate-001'),
  dalleModel: z.enum(['dall-e-3', 'dall-e-2']).default('dall-e-3'),
  dalleQuality: z.enum(['standard', 'hd']).default('hd'),

  // Style guide (from project settings)
  styleGuide: ThumbnailStyleGuideSchema.default({}),

  // Generation settings
  defaultCount: z.number().default(3),

  // Text overlay
  addTextOverlay: z.boolean().default(true),   // Add text to generated image
  textOverlayMethod: z.enum(['ai', 'composite']).default('ai'),  // AI generates with text vs post-process

  // Retry settings
  maxRetries: z.number().default(2),
});

export type ThumbnailInput = z.infer<typeof ThumbnailInputSchema>;
export type ThumbnailOutput = z.infer<typeof ThumbnailOutputSchema>;
export type ThumbnailConfig = z.infer<typeof ThumbnailConfigSchema>;
export type ThumbnailStyleGuide = z.infer<typeof ThumbnailStyleGuideSchema>;
export type ThumbnailOption = z.infer<typeof ThumbnailOptionSchema>;
export type ThumbnailColors = z.infer<typeof ThumbnailColorsSchema>;
export type ThumbnailTypography = z.infer<typeof ThumbnailTypographySchema>;
export type ThumbnailStyle = z.infer<typeof ThumbnailStyleSchema>;
export type ThumbnailElements = z.infer<typeof ThumbnailElementsSchema>;
