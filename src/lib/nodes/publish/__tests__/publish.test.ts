import { describe, it, expect } from 'vitest';
import { PublishNode } from '../index';
import {
  PublishInputSchema,
  PublishConfigSchema,
  PublishOutputSchema,
  VideoMetadataSchema,
  VisibilitySchema,
  ScheduleSchema,
} from '../types';
import {
  formatDescription,
  mergeTags,
  sanitizeTitle,
  getOptimalPublishTime,
  YOUTUBE_CATEGORIES,
} from '../youtube/metadata';
import { tokenNeedsRefresh } from '../youtube/auth';

describe('PublishNode', () => {
  const node = new PublishNode();

  describe('meta', () => {
    it('has correct id', () => {
      expect(node.meta.id).toBe('publish');
    });

    it('has correct category', () => {
      expect(node.meta.category).toBe('publish');
    });

    it('requires youtube credentials', () => {
      expect(node.meta.requiredCredentials).toContain('youtube');
    });

    it('has description', () => {
      expect(node.meta.description).toBeTruthy();
    });

    it('has Upload icon', () => {
      expect(node.meta.icon).toBe('Upload');
    });
  });

  describe('schemas', () => {
    describe('VisibilitySchema', () => {
      it('accepts valid visibilities', () => {
        expect(VisibilitySchema.parse('public')).toBe('public');
        expect(VisibilitySchema.parse('unlisted')).toBe('unlisted');
        expect(VisibilitySchema.parse('private')).toBe('private');
      });

      it('rejects invalid visibility', () => {
        expect(() => VisibilitySchema.parse('invalid')).toThrow();
      });
    });

    describe('ScheduleSchema', () => {
      it('accepts immediate mode', () => {
        const schedule = { mode: 'immediate' };
        const result = ScheduleSchema.safeParse(schedule);
        expect(result.success).toBe(true);
      });

      it('accepts scheduled mode with publishAt', () => {
        const schedule = {
          mode: 'scheduled',
          publishAt: '2024-12-25T09:00:00Z',
        };
        const result = ScheduleSchema.safeParse(schedule);
        expect(result.success).toBe(true);
      });

      it('accepts draft mode', () => {
        const schedule = { mode: 'draft' };
        const result = ScheduleSchema.safeParse(schedule);
        expect(result.success).toBe(true);
      });

      it('requires publishAt for scheduled mode', () => {
        const schedule = { mode: 'scheduled' };
        const result = ScheduleSchema.safeParse(schedule);
        expect(result.success).toBe(false);
      });
    });

    describe('VideoMetadataSchema', () => {
      it('validates correct metadata', () => {
        const metadata = {
          title: 'Test Video',
          description: 'Test description',
          tags: ['test', 'video'],
        };

        const result = VideoMetadataSchema.safeParse(metadata);
        expect(result.success).toBe(true);
      });

      it('applies default values', () => {
        const metadata = {
          title: 'Test',
          description: 'Test',
          tags: [],
        };

        const result = VideoMetadataSchema.parse(metadata);
        expect(result.category).toBe('22');
        expect(result.language).toBe('en');
        expect(result.madeForKids).toBe(false);
        expect(result.enableMonetization).toBe(true);
      });

      it('enforces title max length', () => {
        const metadata = {
          title: 'a'.repeat(101),
          description: 'Test',
          tags: [],
        };

        const result = VideoMetadataSchema.safeParse(metadata);
        expect(result.success).toBe(false);
      });

      it('enforces description max length', () => {
        const metadata = {
          title: 'Test',
          description: 'a'.repeat(5001),
          tags: [],
        };

        const result = VideoMetadataSchema.safeParse(metadata);
        expect(result.success).toBe(false);
      });

      it('accepts optional playlist ID', () => {
        const metadata = {
          title: 'Test',
          description: 'Test',
          tags: [],
          playlistId: 'PLxyz123',
        };

        const result = VideoMetadataSchema.safeParse(metadata);
        expect(result.success).toBe(true);
      });
    });

    describe('PublishInputSchema', () => {
      const validInput = {
        video: {
          url: 'https://storage.example.com/video.mp4',
          path: 'runs/123/video.mp4',
          duration: 600,
          fileSize: 100000000,
        },
        metadata: {
          title: 'Test Video',
          description: 'Test description',
          tags: ['test', 'video'],
        },
      };

      it('accepts valid input', () => {
        const result = PublishInputSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });

      it('accepts input with thumbnail', () => {
        const input = {
          ...validInput,
          thumbnail: {
            url: 'https://storage.example.com/thumb.jpg',
            path: 'runs/123/thumb.jpg',
          },
        };
        const result = PublishInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('accepts input with schedule override', () => {
        const input = {
          ...validInput,
          schedule: { mode: 'draft' },
        };
        const result = PublishInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('accepts input with visibility override', () => {
        const input = {
          ...validInput,
          visibility: 'unlisted',
        };
        const result = PublishInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });
    });

    describe('PublishConfigSchema', () => {
      it('requires channel ID', () => {
        const config = {};
        const result = PublishConfigSchema.safeParse(config);
        expect(result.success).toBe(false);
      });

      it('accepts valid config with channel ID', () => {
        const config = { channelId: 'UC123456' };
        const result = PublishConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      });

      it('applies default values', () => {
        const config = PublishConfigSchema.parse({ channelId: 'UC123' });

        expect(config.defaults.visibility).toBe('private');
        expect(config.defaults.category).toBe('22');
        expect(config.scheduling.mode).toBe('draft');
        expect(config.requireReviewBeforePublic).toBe(true);
        expect(config.notifySubscribers).toBe(true);
      });

      it('accepts scheduling preferences', () => {
        const config = {
          channelId: 'UC123',
          scheduling: {
            mode: 'scheduled',
            preferredTimes: ['09:00', '17:00'],
            timezone: 'America/New_York',
          },
        };

        const result = PublishConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      });

      it('accepts metadata template', () => {
        const config = {
          channelId: 'UC123',
          metadataTemplate: {
            descriptionFooter: 'Follow us on Twitter!',
            defaultTags: ['channel', 'brand'],
          },
        };

        const result = PublishConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      });
    });

    describe('PublishOutputSchema', () => {
      it('validates complete output', () => {
        const output = {
          videoId: 'dQw4w9WgXcQ',
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          status: 'published',
          channel: {
            id: 'UC123',
            name: 'Test Channel',
          },
        };

        const result = PublishOutputSchema.safeParse(output);
        expect(result.success).toBe(true);
      });

      it('accepts all status values', () => {
        const statuses = ['published', 'scheduled', 'draft', 'processing'] as const;
        for (const status of statuses) {
          const output = {
            videoId: 'abc123',
            videoUrl: 'https://youtube.com/watch?v=abc123',
            status,
            channel: { id: 'UC123', name: 'Test' },
          };
          const result = PublishOutputSchema.safeParse(output);
          expect(result.success).toBe(true);
        }
      });

      it('accepts scheduled output with publishAt', () => {
        const output = {
          videoId: 'abc123',
          videoUrl: 'https://youtube.com/watch?v=abc123',
          status: 'scheduled',
          scheduledPublishAt: '2024-12-25T09:00:00Z',
          channel: { id: 'UC123', name: 'Test' },
        };

        const result = PublishOutputSchema.safeParse(output);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('validation', () => {
    const validInput = {
      video: {
        url: 'https://storage.example.com/video.mp4',
        path: 'runs/123/video.mp4',
        duration: 600,
        fileSize: 100000000,
      },
      metadata: {
        title: 'Test Video',
        description: 'Test description',
        tags: ['test', 'video'],
        category: '22',
        language: 'en',
        madeForKids: false,
        ageRestricted: false,
        enableMonetization: true,
      },
    };

    const validConfig = {
      channelId: 'UC123456',
      defaults: {
        visibility: 'private' as const,
        category: '22',
        language: 'en',
        madeForKids: false,
      },
      scheduling: {
        mode: 'draft' as const,
        timezone: 'UTC',
      },
      metadataTemplate: {
        defaultTags: [],
      },
      requireReviewBeforePublic: true,
      notifySubscribers: true,
    };

    it('validates correct input', () => {
      const result = node.validate(validInput as any, validConfig as any, {} as any);
      expect(result.valid).toBe(true);
    });

    it('requires channel ID', () => {
      const config = { ...validConfig, channelId: '' };
      const result = node.validate(validInput as any, config as any, {} as any);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('config.channelId');
    });

    it('requires video', () => {
      const input = { ...validInput, video: { url: '', path: '', duration: 0, fileSize: 0 } };
      const result = node.validate(input as any, validConfig as any, {} as any);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('video');
    });

    it('requires title', () => {
      const input = { ...validInput, metadata: { ...validInput.metadata, title: '' } };
      const result = node.validate(input as any, validConfig as any, {} as any);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('metadata.title');
    });

    it('warns on long title', () => {
      const input = { ...validInput, metadata: { ...validInput.metadata, title: 'a'.repeat(101) } };
      const result = node.validate(input as any, validConfig as any, {} as any);
      expect(result.warnings.some(w => w.field === 'metadata.title')).toBe(true);
    });

    it('warns on long description', () => {
      const input = { ...validInput, metadata: { ...validInput.metadata, description: 'a'.repeat(5001) } };
      const result = node.validate(input as any, validConfig as any, {} as any);
      expect(result.warnings.some(w => w.field === 'metadata.description')).toBe(true);
    });

    it('warns on public visibility with review required', () => {
      const input = { ...validInput, visibility: 'public' as const };
      const result = node.validate(input as any, validConfig as any, {} as any);
      expect(result.warnings.some(w => w.field === 'visibility')).toBe(true);
    });

    it('warns when no thumbnail provided', () => {
      const result = node.validate(validInput as any, validConfig as any, {} as any);
      expect(result.warnings.some(w => w.field === 'thumbnail')).toBe(true);
    });

    it('does not warn about thumbnail when provided', () => {
      const input = {
        ...validInput,
        thumbnail: { url: 'https://example.com/thumb.jpg', path: 'thumb.jpg' },
      };
      const result = node.validate(input as any, validConfig as any, {} as any);
      expect(result.warnings.some(w => w.field === 'thumbnail')).toBe(false);
    });
  });

  describe('cost estimation', () => {
    it('estimates zero cost (YouTube API is free)', () => {
      const cost = node.estimateCost({} as any, {} as any);
      expect(cost.total).toBe(0);
      expect(cost.estimated).toBe(true);
      expect(cost.confidence).toBe('high');
    });

    it('includes youtube service in breakdown', () => {
      const cost = node.estimateCost({} as any, {} as any);
      expect(cost.breakdown[0].service).toBe('youtube');
    });
  });
});

describe('formatDescription', () => {
  const config = {
    metadataTemplate: {
      descriptionFooter: '---\nFollow us on Twitter!',
      defaultTags: [],
    },
  } as any;

  it('returns original description when no additions', () => {
    const result = formatDescription('Main content', { metadataTemplate: { defaultTags: [] } } as any);
    expect(result).toBe('Main content');
  });

  it('adds footer from config', () => {
    const result = formatDescription('Main content', config);
    expect(result).toContain('Main content');
    expect(result).toContain('Follow us on Twitter');
  });

  it('adds chapters if provided', () => {
    const chapters = [
      { timestamp: '0:00', title: 'Intro' },
      { timestamp: '2:00', title: 'Main Content' },
      { timestamp: '10:00', title: 'Conclusion' },
    ];
    const result = formatDescription('Main content', config, chapters);
    expect(result).toContain('📑 Chapters');
    expect(result).toContain('0:00 Intro');
    expect(result).toContain('2:00 Main Content');
    expect(result).toContain('10:00 Conclusion');
  });

  it('truncates to 5000 chars', () => {
    const longDescription = 'a'.repeat(6000);
    const result = formatDescription(longDescription, { metadataTemplate: { defaultTags: [] } } as any);
    expect(result.length).toBeLessThanOrEqual(5000);
    expect(result.endsWith('...')).toBe(true);
  });

  it('orders content correctly: description, chapters, footer', () => {
    const chapters = [{ timestamp: '0:00', title: 'Intro' }];
    const result = formatDescription('Description here', config, chapters);

    const descIndex = result.indexOf('Description here');
    const chaptersIndex = result.indexOf('📑 Chapters');
    const footerIndex = result.indexOf('Follow us');

    expect(descIndex).toBeLessThan(chaptersIndex);
    expect(chaptersIndex).toBeLessThan(footerIndex);
  });
});

describe('mergeTags', () => {
  it('combines tags without duplicates', () => {
    const result = mergeTags(['a', 'b'], ['b', 'c']);
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('preserves order with input tags first', () => {
    const result = mergeTags(['first', 'second'], ['third']);
    expect(result[0]).toBe('first');
    expect(result[1]).toBe('second');
  });

  it('respects 500 char limit', () => {
    const longTags = Array(100).fill('verylongtag');
    const result = mergeTags(longTags, []);
    const totalChars = result.join(',').length;
    expect(totalChars).toBeLessThanOrEqual(500);
  });

  it('handles empty arrays', () => {
    expect(mergeTags([], [])).toEqual([]);
    expect(mergeTags(['tag'], [])).toEqual(['tag']);
    expect(mergeTags([], ['tag'])).toEqual(['tag']);
  });
});

describe('sanitizeTitle', () => {
  it('removes < and > characters', () => {
    const result = sanitizeTitle('Test <script> Title');
    expect(result).toBe('Test script Title');
  });

  it('keeps allowed characters', () => {
    const result = sanitizeTitle('Test: Title! (2024) - Episode #1');
    expect(result).toBe('Test: Title! (2024) - Episode #1');
  });

  it('truncates to 100 chars with ellipsis', () => {
    const longTitle = 'a'.repeat(150);
    const result = sanitizeTitle(longTitle);
    expect(result.length).toBe(100);
    expect(result.endsWith('...')).toBe(true);
  });

  it('does not add ellipsis if exactly 100 chars', () => {
    const exactTitle = 'a'.repeat(100);
    const result = sanitizeTitle(exactTitle);
    expect(result.length).toBe(100);
    expect(result.endsWith('...')).toBe(false);
  });

  it('handles empty string', () => {
    const result = sanitizeTitle('');
    expect(result).toBe('');
  });
});

describe('getOptimalPublishTime', () => {
  it('returns now if no preferred times', () => {
    const before = Date.now();
    const result = getOptimalPublishTime([], 'UTC');
    const after = Date.now();

    expect(result.getTime()).toBeGreaterThanOrEqual(before);
    expect(result.getTime()).toBeLessThanOrEqual(after + 1000);
  });

  it('returns a date with preferred time', () => {
    const result = getOptimalPublishTime(['09:00', '17:00'], 'UTC');
    const hours = result.getHours();
    expect([9, 17]).toContain(hours);
    expect(result.getMinutes()).toBe(0);
  });

  it('returns future date if preferred time passed today', () => {
    const now = new Date();
    const pastHour = now.getHours() - 1;
    if (pastHour >= 0) {
      const timeStr = `${pastHour.toString().padStart(2, '0')}:00`;
      const result = getOptimalPublishTime([timeStr], 'UTC');
      expect(result.getTime()).toBeGreaterThan(now.getTime());
    }
  });
});

describe('YOUTUBE_CATEGORIES', () => {
  it('has common categories', () => {
    expect(YOUTUBE_CATEGORIES['People & Blogs']).toBe('22');
    expect(YOUTUBE_CATEGORIES['Education']).toBe('27');
    expect(YOUTUBE_CATEGORIES['Science & Technology']).toBe('28');
    expect(YOUTUBE_CATEGORIES['Entertainment']).toBe('24');
    expect(YOUTUBE_CATEGORIES['Gaming']).toBe('20');
  });

  it('has all standard YouTube categories', () => {
    expect(Object.keys(YOUTUBE_CATEGORIES).length).toBeGreaterThanOrEqual(15);
  });
});

describe('tokenNeedsRefresh', () => {
  it('returns false for future expiry', () => {
    const futureExpiry = Date.now() + (60 * 60 * 1000); // 1 hour from now
    expect(tokenNeedsRefresh(futureExpiry)).toBe(false);
  });

  it('returns true for past expiry', () => {
    const pastExpiry = Date.now() - (60 * 1000); // 1 minute ago
    expect(tokenNeedsRefresh(pastExpiry)).toBe(true);
  });

  it('returns true when within 5 minute buffer', () => {
    const soonExpiry = Date.now() + (3 * 60 * 1000); // 3 minutes from now
    expect(tokenNeedsRefresh(soonExpiry)).toBe(true);
  });

  it('returns false when just outside 5 minute buffer', () => {
    const laterExpiry = Date.now() + (6 * 60 * 1000); // 6 minutes from now
    expect(tokenNeedsRefresh(laterExpiry)).toBe(false);
  });
});
