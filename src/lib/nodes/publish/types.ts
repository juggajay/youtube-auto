import { z } from 'zod';

// === Visibility ===

export const VisibilitySchema = z.enum(['public', 'unlisted', 'private']);

// === Schedule ===

export const ScheduleSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('immediate'),
  }),
  z.object({
    mode: z.literal('scheduled'),
    publishAt: z.string().datetime(),  // ISO 8601
  }),
  z.object({
    mode: z.literal('draft'),
  }),
]);

// === Metadata ===

export const VideoMetadataSchema = z.object({
  title: z.string().max(100),
  description: z.string().max(5000),
  tags: z.array(z.string()).max(500),  // Total chars limit

  category: z.string().default('22'),  // 22 = People & Blogs
  language: z.string().default('en'),

  // Content declarations
  madeForKids: z.boolean().default(false),
  ageRestricted: z.boolean().default(false),

  // Monetization (if enabled)
  enableMonetization: z.boolean().default(true),

  // Playlist
  playlistId: z.string().optional(),

  // End screen / Cards (future)
  endScreenTemplate: z.string().optional(),
});

// === Input Schema ===

export const PublishInputSchema = z.object({
  // From Assembly Node
  video: z.object({
    url: z.string(),
    path: z.string(),
    duration: z.number(),
    fileSize: z.number(),
  }),

  // From Thumbnail Node (selected option)
  thumbnail: z.object({
    url: z.string(),
    path: z.string(),
  }).optional(),

  // From Script Node (or override)
  metadata: VideoMetadataSchema,

  // Schedule override
  schedule: ScheduleSchema.optional(),

  // Visibility override
  visibility: VisibilitySchema.optional(),
});

// === Output Schema ===

export const PublishOutputSchema = z.object({
  videoId: z.string(),
  videoUrl: z.string(),

  status: z.enum(['published', 'scheduled', 'draft', 'processing']),

  // If scheduled
  scheduledPublishAt: z.string().datetime().optional(),

  // Processing status
  processingStatus: z.object({
    uploadStatus: z.enum(['uploaded', 'processed', 'failed']),
    processingProgress: z.number().optional(),  // 0-100
  }).optional(),

  // Thumbnail
  thumbnailUrl: z.string().optional(),

  // Channel info
  channel: z.object({
    id: z.string(),
    name: z.string(),
  }),
});

// === Config Schema ===

export const PublishConfigSchema = z.object({
  // Target channel
  channelId: z.string(),

  // Default settings
  defaults: z.object({
    visibility: VisibilitySchema.default('private'),
    category: z.string().default('22'),
    language: z.string().default('en'),
    madeForKids: z.boolean().default(false),
  }).default({
    visibility: 'private',
    category: '22',
    language: 'en',
    madeForKids: false,
  }),

  // Scheduling
  scheduling: z.object({
    mode: z.enum(['immediate', 'scheduled', 'draft']).default('draft'),
    preferredTimes: z.array(z.string()).optional(),  // ["09:00", "17:00"]
    timezone: z.string().default('UTC'),
  }).default({
    mode: 'draft',
    timezone: 'UTC',
  }),

  // Metadata template
  metadataTemplate: z.object({
    descriptionFooter: z.string().optional(),  // Added to all descriptions
    defaultTags: z.array(z.string()).default([]),
  }).default({
    defaultTags: [],
  }),

  // Safety
  requireReviewBeforePublic: z.boolean().default(true),

  // Notifications
  notifySubscribers: z.boolean().default(true),
});

export type PublishInput = z.infer<typeof PublishInputSchema>;
export type PublishOutput = z.infer<typeof PublishOutputSchema>;
export type PublishConfig = z.infer<typeof PublishConfigSchema>;
export type VideoMetadata = z.infer<typeof VideoMetadataSchema>;
export type Visibility = z.infer<typeof VisibilitySchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
