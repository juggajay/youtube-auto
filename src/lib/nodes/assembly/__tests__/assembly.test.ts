import { describe, it, expect, vi } from 'vitest';
import { AssemblyNode } from '../index';
import {
  AssemblyInputSchema,
  AssemblyConfigSchema,
  AssemblyOutputSchema,
  TimelineSegmentSchema,
  VisualSourceSchema,
  CaptionStyleSchema,
} from '../types';
import { buildTimeline, generateVisuals } from '../timeline';
import { generateCaptions, generateSrt, generateVtt, formatSrtTime, formatVttTime } from '../captions';
import { createInitialRunContext } from '../../context';

describe('AssemblyNode', () => {
  const node = new AssemblyNode();

  describe('meta', () => {
    it('has correct id', () => {
      expect(node.meta.id).toBe('assembly');
    });

    it('has correct category', () => {
      expect(node.meta.category).toBe('production');
    });

    it('has description', () => {
      expect(node.meta.description).toBeTruthy();
    });

    it('has Film icon', () => {
      expect(node.meta.icon).toBe('Film');
    });
  });

  describe('schemas', () => {
    describe('VisualSourceSchema', () => {
      it('accepts stock source', () => {
        const source = {
          type: 'stock',
          provider: 'pexels',
          query: 'technology background',
        };
        const result = VisualSourceSchema.safeParse(source);
        expect(result.success).toBe(true);
      });

      it('accepts ai_generated source', () => {
        const source = {
          type: 'ai_generated',
          prompt: 'A futuristic cityscape',
          style: 'cinematic',
        };
        const result = VisualSourceSchema.safeParse(source);
        expect(result.success).toBe(true);
      });

      it('accepts image source', () => {
        const source = {
          type: 'image',
          url: 'https://example.com/image.jpg',
          animation: 'ken_burns',
        };
        const result = VisualSourceSchema.safeParse(source);
        expect(result.success).toBe(true);
      });

      it('accepts text_card source', () => {
        const source = {
          type: 'text_card',
          text: 'Key Point',
          style: 'quote',
        };
        const result = VisualSourceSchema.safeParse(source);
        expect(result.success).toBe(true);
      });

      it('accepts video source', () => {
        const source = {
          type: 'video',
          url: 'https://example.com/video.mp4',
          startTime: 0,
          endTime: 10,
        };
        const result = VisualSourceSchema.safeParse(source);
        expect(result.success).toBe(true);
      });

      it('applies default animation for images', () => {
        const source = {
          type: 'image',
          url: 'https://example.com/image.jpg',
        };
        const result = VisualSourceSchema.parse(source);
        if (result.type === 'image') {
          expect(result.animation).toBe('ken_burns');
        }
      });

      it('rejects invalid text_card style', () => {
        const source = {
          type: 'text_card',
          text: 'Test',
          style: 'invalid_style',
        };
        const result = VisualSourceSchema.safeParse(source);
        expect(result.success).toBe(false);
      });
    });

    describe('TimelineSegmentSchema', () => {
      it('accepts valid segment', () => {
        const segment = {
          id: 'seg_1',
          type: 'content',
          startTime: 0,
          duration: 10,
          visuals: [{
            source: { type: 'stock', provider: 'pexels', query: 'nature' },
            layer: 0,
            startOffset: 0,
          }],
          caption: 'Test caption',
        };

        const result = TimelineSegmentSchema.safeParse(segment);
        expect(result.success).toBe(true);
      });

      it('accepts segment with audio', () => {
        const segment = {
          id: 'seg_1',
          type: 'content',
          startTime: 0,
          duration: 10,
          audio: {
            url: 'https://example.com/audio.mp3',
            volume: 1.0,
            fadeIn: 0.3,
            fadeOut: 0.5,
          },
          visuals: [],
        };

        const result = TimelineSegmentSchema.safeParse(segment);
        expect(result.success).toBe(true);
      });

      it('applies default audio values', () => {
        const segment = {
          id: 'seg_1',
          type: 'content',
          startTime: 0,
          duration: 10,
          audio: { url: 'https://example.com/audio.mp3' },
          visuals: [],
        };

        const result = TimelineSegmentSchema.parse(segment);
        expect(result.audio?.volume).toBe(1.0);
        expect(result.audio?.fadeIn).toBe(0);
        expect(result.audio?.fadeOut).toBe(0);
      });

      it('accepts all segment types', () => {
        const types = ['intro', 'content', 'outro'] as const;
        for (const type of types) {
          const segment = {
            id: `seg_${type}`,
            type,
            startTime: 0,
            duration: 5,
            visuals: [],
          };
          const result = TimelineSegmentSchema.safeParse(segment);
          expect(result.success).toBe(true);
        }
      });
    });

    describe('CaptionStyleSchema', () => {
      it('has correct defaults', () => {
        const style = CaptionStyleSchema.parse({});
        expect(style.enabled).toBe(true);
        expect(style.font).toBe('Inter');
        expect(style.fontSize).toBe(48);
        expect(style.fontColor).toBe('#FFFFFF');
        expect(style.backgroundColor).toBe('#000000');
        expect(style.backgroundOpacity).toBe(0.7);
        expect(style.position).toBe('bottom');
        expect(style.style).toBe('standard');
      });

      it('allows all position options', () => {
        const positions = ['bottom', 'top', 'center'] as const;
        for (const position of positions) {
          const result = CaptionStyleSchema.safeParse({ position });
          expect(result.success).toBe(true);
        }
      });

      it('allows all style options', () => {
        const styles = ['standard', 'highlighted', 'word_by_word', 'karaoke'] as const;
        for (const style of styles) {
          const result = CaptionStyleSchema.safeParse({ style });
          expect(result.success).toBe(true);
        }
      });
    });

    describe('AssemblyInputSchema', () => {
      const validInput = {
        script: {
          title: 'Test Video',
          hook: {
            text: 'This is the hook',
            visualNotes: 'Dramatic opening',
            durationEstimate: 5,
          },
          sections: [
            {
              id: 'section_1',
              name: 'First Section',
              script: 'Content of section 1',
              visualNotes: 'Show diagrams',
              bRollSuggestions: ['technology', 'coding'],
              durationEstimate: 30,
            },
          ],
          outro: {
            text: 'Thanks for watching',
            cta: 'Subscribe for more',
          },
        },
        audioSegments: [
          {
            id: 'hook',
            file: '/audio/hook.mp3',
            duration: 5,
            text: 'This is the hook',
          },
          {
            id: 'section_1',
            file: '/audio/section_1.mp3',
            duration: 30,
            text: 'Content of section 1',
          },
        ],
      };

      it('accepts valid input', () => {
        const result = AssemblyInputSchema.safeParse(validInput);
        expect(result.success).toBe(true);
      });

      it('accepts input with thumbnail', () => {
        const input = {
          ...validInput,
          thumbnail: {
            imageUrl: 'https://example.com/thumbnail.png',
          },
        };
        const result = AssemblyInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('accepts input with style override', () => {
        const input = {
          ...validInput,
          styleOverride: {
            captionStyle: {
              fontSize: 64,
              fontColor: '#FFFF00',
            },
          },
        };
        const result = AssemblyInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('rejects missing script', () => {
        const input = { audioSegments: validInput.audioSegments };
        const result = AssemblyInputSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('rejects missing audio segments', () => {
        const input = { script: validInput.script };
        const result = AssemblyInputSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });

    describe('AssemblyConfigSchema', () => {
      it('has correct defaults', () => {
        const config = AssemblyConfigSchema.parse({});
        expect(config.resolution).toBe('1080p');
        expect(config.aspectRatio).toBe('16:9');
        expect(config.frameRate).toBe(30);
        expect(config.format).toBe('mp4');
        expect(config.videoBitrate).toBe('8M');
        expect(config.audioBitrate).toBe('192k');
        expect(config.preset).toBe('medium');
      });

      it('allows all resolution options', () => {
        const resolutions = ['720p', '1080p', '4k'] as const;
        for (const resolution of resolutions) {
          const result = AssemblyConfigSchema.safeParse({ resolution });
          expect(result.success).toBe(true);
        }
      });

      it('allows all aspect ratio options', () => {
        const ratios = ['16:9', '9:16', '1:1'] as const;
        for (const aspectRatio of ratios) {
          const result = AssemblyConfigSchema.safeParse({ aspectRatio });
          expect(result.success).toBe(true);
        }
      });

      it('allows all format options', () => {
        const formats = ['mp4', 'webm', 'mov'] as const;
        for (const format of formats) {
          const result = AssemblyConfigSchema.safeParse({ format });
          expect(result.success).toBe(true);
        }
      });

      it('allows all preset options', () => {
        const presets = ['ultrafast', 'fast', 'medium', 'slow'] as const;
        for (const preset of presets) {
          const result = AssemblyConfigSchema.safeParse({ preset });
          expect(result.success).toBe(true);
        }
      });

      it('allows all visual source options', () => {
        const sources = ['stock', 'ai_generated', 'text_cards', 'mixed'] as const;
        for (const visualSource of sources) {
          const result = AssemblyConfigSchema.safeParse({ visualSource });
          expect(result.success).toBe(true);
        }
      });

      it('allows assets configuration', () => {
        const config = AssemblyConfigSchema.parse({
          assets: {
            introVideo: '/videos/intro.mp4',
            outroVideo: '/videos/outro.mp4',
            backgroundMusic: '/music/bg.mp3',
            backgroundMusicVolume: 0.1,
            watermark: '/images/watermark.png',
          },
        });
        expect(config.assets.introVideo).toBe('/videos/intro.mp4');
        expect(config.assets.backgroundMusicVolume).toBe(0.1);
      });
    });

    describe('AssemblyOutputSchema', () => {
      it('validates complete output', () => {
        const output = {
          videoUrl: 'https://example.com/video.mp4',
          videoPath: 'runs/123/video/output.mp4',
          subtitleUrl: 'https://example.com/subtitles.vtt',
          subtitlePath: 'runs/123/video/subtitles.vtt',
          metadata: {
            duration: 120,
            resolution: '1080p',
            fileSize: 50000000,
            format: 'mp4',
          },
          timeline: [],
        };

        const result = AssemblyOutputSchema.safeParse(output);
        expect(result.success).toBe(true);
      });

      it('allows output without subtitles', () => {
        const output = {
          videoUrl: 'https://example.com/video.mp4',
          videoPath: 'runs/123/video/output.mp4',
          metadata: {
            duration: 120,
            resolution: '1080p',
            fileSize: 50000000,
            format: 'mp4',
          },
          timeline: [],
        };

        const result = AssemblyOutputSchema.safeParse(output);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('getInputFromContext', () => {
    it('extracts input from context with script and voice', () => {
      const context = createInitialRunContext({
        userId: 'test-user',
        projectId: 'test-project',
      });

      context.previousOutputs.script = {
        title: 'Test Video',
        hook: { text: 'Hook text', visualNotes: 'Visuals', durationEstimate: 5 },
        sections: [
          { id: 'sec_1', name: 'Section 1', script: 'Content', visualNotes: '', bRollSuggestions: [], durationEstimate: 20 },
        ],
        outro: { text: 'Outro', cta: 'Subscribe' },
        metadata: { descriptionDraft: '', tags: [], chapters: [] },
        totalDurationEstimate: 25,
        wordCount: 50,
      };

      context.previousOutputs.voice = {
        segments: [
          { id: 'hook', file: '/audio/hook.mp3', duration: 5, text: 'Hook text' },
          { id: 'sec_1', file: '/audio/sec_1.mp3', duration: 20, text: 'Content' },
        ],
        totalDuration: 25,
      };

      const input = node.getInputFromContext(context);

      expect(input.script.title).toBe('Test Video');
      expect(input.audioSegments).toHaveLength(2);
      expect(input.audioSegments[0].id).toBe('hook');
    });

    it('includes thumbnail if available', () => {
      const context = createInitialRunContext({
        userId: 'test-user',
        projectId: 'test-project',
      });

      context.previousOutputs.script = {
        title: 'Test',
        hook: { text: '', visualNotes: '', durationEstimate: 5 },
        sections: [],
        outro: { text: '', cta: '' },
        metadata: { descriptionDraft: '', tags: [], chapters: [] },
        totalDurationEstimate: 5,
        wordCount: 0,
      };
      context.previousOutputs.voice = { segments: [], totalDuration: 0 };
      context.previousOutputs.thumbnail = {
        selected: 'https://example.com/thumb.png',
        options: [{ file: 'https://example.com/thumb.png' }],
      };

      const input = node.getInputFromContext(context);
      expect(input.thumbnail?.imageUrl).toBe('https://example.com/thumb.png');
    });

    it('throws if script is missing', () => {
      const context = createInitialRunContext({
        userId: 'test-user',
        projectId: 'test-project',
      });

      expect(() => node.getInputFromContext(context)).toThrow('Script output not found');
    });

    it('throws if voice is missing', () => {
      const context = createInitialRunContext({
        userId: 'test-user',
        projectId: 'test-project',
      });

      context.previousOutputs.script = {
        title: 'Test',
        hook: { text: '', visualNotes: '', durationEstimate: 5 },
        sections: [],
        outro: { text: '', cta: '' },
        metadata: { descriptionDraft: '', tags: [], chapters: [] },
        totalDurationEstimate: 5,
        wordCount: 0,
      };

      expect(() => node.getInputFromContext(context)).toThrow('Voice output not found');
    });
  });

  describe('estimateCost', () => {
    const validInput = {
      script: {
        title: 'Test',
        hook: { text: '', visualNotes: '', durationEstimate: 5 },
        sections: [],
        outro: { text: '', cta: '' },
      },
      audioSegments: [
        { id: '1', file: '/a.mp3', duration: 60, text: '' },
      ],
    };

    it('estimates zero cost for local processing', () => {
      const config = AssemblyConfigSchema.parse({ visualSource: 'text_cards' });
      const cost = node.estimateCost(validInput, config);

      expect(cost.total).toBe(0);
      expect(cost.estimated).toBe(true);
    });

    it('estimates zero cost for stock footage (Pexels is free)', () => {
      const config = AssemblyConfigSchema.parse({ visualSource: 'stock' });
      const cost = node.estimateCost(validInput, config);

      expect(cost.total).toBe(0);
    });

    it('estimates cost for AI-generated visuals', () => {
      const config = AssemblyConfigSchema.parse({ visualSource: 'ai_generated' });
      const cost = node.estimateCost(validInput, config);

      expect(cost.total).toBeGreaterThan(0);
      expect(cost.breakdown.some(b => b.service === 'gemini-imagen')).toBe(true);
    });

    it('has medium confidence', () => {
      const config = AssemblyConfigSchema.parse({});
      const cost = node.estimateCost(validInput, config);

      expect(cost.confidence).toBe('medium');
    });
  });
});

describe('Timeline Builder', () => {
  const mockInput = {
    script: {
      title: 'Test Video',
      hook: {
        text: 'Welcome to the video',
        visualNotes: 'Energetic intro',
        durationEstimate: 5,
      },
      sections: [
        {
          id: 'section_1',
          name: 'First Point',
          script: 'This is the first section content',
          visualNotes: 'Show diagram',
          bRollSuggestions: ['technology', 'innovation'],
          durationEstimate: 20,
        },
        {
          id: 'section_2',
          name: 'Second Point',
          script: 'This is the second section',
          visualNotes: 'Show examples',
          bRollSuggestions: ['business', 'growth'],
          durationEstimate: 15,
        },
      ],
      outro: {
        text: 'Thanks for watching',
        cta: 'Subscribe for more',
      },
    },
    audioSegments: [
      { id: 'hook', file: '/audio/hook.mp3', duration: 5, text: 'Welcome' },
      { id: 'section_1', file: '/audio/s1.mp3', duration: 20, text: 'First' },
      { id: 'section_2', file: '/audio/s2.mp3', duration: 15, text: 'Second' },
      { id: 'outro', file: '/audio/outro.mp3', duration: 8, text: 'Thanks' },
    ],
  };

  const mockConfig = AssemblyConfigSchema.parse({});

  it('builds timeline with correct segment count', async () => {
    const timeline = await buildTimeline({ input: mockInput, config: mockConfig });

    // hook + 2 sections + outro = 4 segments
    expect(timeline.segments.length).toBe(4);
  });

  it('calculates correct total duration', async () => {
    const timeline = await buildTimeline({ input: mockInput, config: mockConfig });

    // 5 + 20 + 15 + 8 = 48
    expect(timeline.totalDuration).toBe(48);
  });

  it('assigns correct start times', async () => {
    const timeline = await buildTimeline({ input: mockInput, config: mockConfig });

    expect(timeline.segments[0].startTime).toBe(0);
    expect(timeline.segments[1].startTime).toBe(5);
    expect(timeline.segments[2].startTime).toBe(25);
    expect(timeline.segments[3].startTime).toBe(40);
  });

  it('includes audio for each segment', async () => {
    const timeline = await buildTimeline({ input: mockInput, config: mockConfig });

    for (const segment of timeline.segments) {
      expect(segment.audio).toBeDefined();
      expect(segment.audio?.url).toBeTruthy();
    }
  });

  it('generates visuals for each segment', async () => {
    const timeline = await buildTimeline({ input: mockInput, config: mockConfig });

    for (const segment of timeline.segments) {
      expect(segment.visuals.length).toBeGreaterThan(0);
    }
  });

  it('includes captions from script', async () => {
    const timeline = await buildTimeline({ input: mockInput, config: mockConfig });

    expect(timeline.segments[0].caption).toBe('Welcome to the video');
    expect(timeline.segments[1].caption).toBe('This is the first section content');
  });

  it('adds intro video segment if configured', async () => {
    const configWithIntro = AssemblyConfigSchema.parse({
      assets: { introVideo: '/videos/intro.mp4' },
    });

    const timeline = await buildTimeline({ input: mockInput, config: configWithIntro });

    expect(timeline.segments[0].id).toBe('intro');
    expect(timeline.segments[0].type).toBe('intro');
  });

  it('adds outro video segment if configured', async () => {
    const configWithOutro = AssemblyConfigSchema.parse({
      assets: { outroVideo: '/videos/outro.mp4' },
    });

    const timeline = await buildTimeline({ input: mockInput, config: configWithOutro });

    const lastSegment = timeline.segments[timeline.segments.length - 1];
    expect(lastSegment.id).toBe('outro_video');
    expect(lastSegment.type).toBe('outro');
  });
});

describe('Visual Generation', () => {
  const config = AssemblyConfigSchema.parse({});

  it('generates stock visuals when configured', () => {
    const stockConfig = { ...config, visualSource: 'stock' as const };
    const visuals = generateVisuals('technology', ['coding', 'software'], 14, stockConfig);

    expect(visuals.length).toBe(2); // 14s / 7s per visual
    expect(visuals[0].source.type).toBe('stock');
  });

  it('generates AI visuals when configured', () => {
    const aiConfig = { ...config, visualSource: 'ai_generated' as const };
    const visuals = generateVisuals('space', [], 7, aiConfig);

    expect(visuals.length).toBe(1);
    expect(visuals[0].source.type).toBe('ai_generated');
  });

  it('generates text cards when configured', () => {
    const textConfig = { ...config, visualSource: 'text_cards' as const };
    const visuals = generateVisuals('quote here', [], 7, textConfig);

    expect(visuals.length).toBe(1);
    expect(visuals[0].source.type).toBe('text_card');
  });

  it('generates mixed visuals by default', () => {
    const visuals = generateVisuals('test', ['b-roll'], 21, config);

    expect(visuals.length).toBe(3);
    // First should be text card (index 0 % 3 === 0)
    expect(visuals[0].source.type).toBe('text_card');
    // Others should be stock
    expect(visuals[1].source.type).toBe('stock');
    expect(visuals[2].source.type).toBe('stock');
  });

  it('uses b-roll suggestions as queries', () => {
    const visuals = generateVisuals('', ['technology', 'coding'], 14, config);

    // Check that b-roll suggestions are used
    const stockVisual = visuals.find(v => v.source.type === 'stock');
    if (stockVisual && stockVisual.source.type === 'stock') {
      expect(['technology', 'coding']).toContain(stockVisual.source.query);
    }
  });

  it('sets correct visual durations', () => {
    const visuals = generateVisuals('test', [], 21, config);

    expect(visuals[0].duration).toBe(7);
    expect(visuals[1].duration).toBe(7);
    expect(visuals[2].duration).toBe(7);
  });

  it('sets correct start offsets', () => {
    const visuals = generateVisuals('test', [], 21, config);

    expect(visuals[0].startOffset).toBe(0);
    expect(visuals[1].startOffset).toBe(7);
    expect(visuals[2].startOffset).toBe(14);
  });
});

describe('Caption Generator', () => {
  const mockSegments = [
    {
      id: 'seg_1',
      type: 'content' as const,
      startTime: 0,
      duration: 10,
      visuals: [],
      caption: 'This is the first sentence. And here is a second one.',
    },
    {
      id: 'seg_2',
      type: 'content' as const,
      startTime: 10,
      duration: 5,
      visuals: [],
      caption: 'Short caption.',
    },
  ];

  it('generates captions from segments', () => {
    const captions = generateCaptions(mockSegments);

    expect(captions.length).toBeGreaterThan(0);
    expect(captions[0].index).toBe(1);
  });

  it('assigns correct timing', () => {
    const captions = generateCaptions(mockSegments);

    expect(captions[0].startTime).toBe(0);
    expect(captions[0].endTime).toBeGreaterThan(0);
  });

  it('splits long captions', () => {
    const longText = 'Word '.repeat(30).trim();
    const segments = [{
      id: 'seg_1',
      type: 'content' as const,
      startTime: 0,
      duration: 30,
      visuals: [],
      caption: longText,
    }];

    const captions = generateCaptions(segments, { maxCharsPerCaption: 50 });

    expect(captions.length).toBeGreaterThan(1);
  });

  it('respects max duration per caption', () => {
    const longText = 'Word '.repeat(50).trim();
    const segments = [{
      id: 'seg_1',
      type: 'content' as const,
      startTime: 0,
      duration: 60,
      visuals: [],
      caption: longText,
    }];

    const captions = generateCaptions(segments, { maxDurationPerCaption: 3 });

    for (const caption of captions) {
      expect(caption.endTime - caption.startTime).toBeLessThanOrEqual(5);
    }
  });

  it('skips segments without captions', () => {
    const segments = [
      { id: '1', type: 'content' as const, startTime: 0, duration: 5, visuals: [] },
      { id: '2', type: 'content' as const, startTime: 5, duration: 5, visuals: [], caption: 'Test' },
    ];

    const captions = generateCaptions(segments);

    expect(captions.length).toBe(1);
    expect(captions[0].text).toBe('Test');
  });

  it('maintains sequential indices', () => {
    const captions = generateCaptions(mockSegments);

    for (let i = 0; i < captions.length; i++) {
      expect(captions[i].index).toBe(i + 1);
    }
  });
});

describe('SRT/VTT Generation', () => {
  const captions = [
    { index: 1, startTime: 0, endTime: 2.5, text: 'First caption' },
    { index: 2, startTime: 2.5, endTime: 5, text: 'Second caption' },
  ];

  describe('formatSrtTime', () => {
    it('formats zero correctly', () => {
      expect(formatSrtTime(0)).toBe('00:00:00,000');
    });

    it('formats seconds correctly', () => {
      expect(formatSrtTime(5.5)).toBe('00:00:05,500');
    });

    it('formats minutes correctly', () => {
      expect(formatSrtTime(125)).toBe('00:02:05,000');
    });

    it('formats hours correctly', () => {
      expect(formatSrtTime(3661)).toBe('01:01:01,000');
    });

    it('handles fractional seconds', () => {
      expect(formatSrtTime(1.234)).toBe('00:00:01,234');
    });
  });

  describe('formatVttTime', () => {
    it('uses period instead of comma', () => {
      expect(formatVttTime(5.5)).toBe('00:00:05.500');
    });

    it('formats correctly otherwise', () => {
      expect(formatVttTime(3661.123)).toBe('01:01:01.123');
    });
  });

  describe('generateSrt', () => {
    it('generates valid SRT format', () => {
      const srt = generateSrt(captions);

      expect(srt).toContain('1\n');
      expect(srt).toContain('00:00:00,000 --> 00:00:02,500');
      expect(srt).toContain('First caption');
      expect(srt).toContain('2\n');
      expect(srt).toContain('00:00:02,500 --> 00:00:05,000');
      expect(srt).toContain('Second caption');
    });

    it('separates captions with blank lines', () => {
      const srt = generateSrt(captions);
      const blocks = srt.split('\n\n');

      expect(blocks.length).toBe(2);
    });
  });

  describe('generateVtt', () => {
    it('starts with WEBVTT header', () => {
      const vtt = generateVtt(captions);

      expect(vtt.startsWith('WEBVTT')).toBe(true);
    });

    it('uses period for time separator', () => {
      const vtt = generateVtt(captions);

      expect(vtt).toContain('00:00:00.000 --> 00:00:02.500');
    });

    it('includes all captions', () => {
      const vtt = generateVtt(captions);

      expect(vtt).toContain('First caption');
      expect(vtt).toContain('Second caption');
    });
  });
});

describe('Validation', () => {
  const node = new AssemblyNode();

  const validInput = {
    script: {
      title: 'Test',
      hook: { text: 'Hook', visualNotes: '', durationEstimate: 5 },
      sections: [{ id: 's1', name: 'S1', script: '', visualNotes: '', bRollSuggestions: [], durationEstimate: 20 }],
      outro: { text: '', cta: '' },
    },
    audioSegments: [
      { id: 'hook', file: '/a.mp3', duration: 5, text: '' },
      { id: 's1', file: '/b.mp3', duration: 20, text: '' },
      { id: 'outro', file: '/c.mp3', duration: 5, text: '' },
    ],
  };

  it('validates correct input', async () => {
    const context = createInitialRunContext({
      userId: 'test-user',
      projectId: 'test-project',
    });

    const config = AssemblyConfigSchema.parse({});

    // Mock checkFfmpegAvailable
    vi.mock('../ffmpeg', async (importOriginal) => {
      const mod = await importOriginal<typeof import('../ffmpeg')>();
      return {
        ...mod,
        checkFfmpegAvailable: vi.fn().mockResolvedValue(true),
      };
    });

    const result = await node.validate(validInput, config, context);

    // May have warnings but should be valid if FFmpeg is available
    expect(result.errors.length).toBe(0);
  });

  it('warns about missing audio segments', async () => {
    const context = createInitialRunContext({
      userId: 'test-user',
      projectId: 'test-project',
    });

    const config = AssemblyConfigSchema.parse({});
    const input = {
      ...validInput,
      audioSegments: [{ id: 'hook', file: '/a.mp3', duration: 5, text: '' }],
    };

    const result = await node.validate(input, config, context);

    expect(result.warnings.some(w => w.message.includes('No audio segment'))).toBe(true);
  });

  it('warns about 4K resolution', async () => {
    const context = createInitialRunContext({
      userId: 'test-user',
      projectId: 'test-project',
    });

    const config = AssemblyConfigSchema.parse({ resolution: '4k' });

    const result = await node.validate(validInput, config, context);

    expect(result.warnings.some(w => w.message.includes('4K'))).toBe(true);
  });

  it('warns about stock footage API requirement', async () => {
    const context = createInitialRunContext({
      userId: 'test-user',
      projectId: 'test-project',
    });

    const config = AssemblyConfigSchema.parse({ visualSource: 'stock' });

    const result = await node.validate(validInput, config, context);

    expect(result.warnings.some(w => w.message.includes('Pexels'))).toBe(true);
  });
});
