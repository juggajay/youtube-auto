import { describe, it, expect } from 'vitest';
import { ThumbnailGeneratorNode } from '../index';
import {
  ThumbnailInputSchema,
  ThumbnailConfigSchema,
  ThumbnailStyleGuideSchema,
  ThumbnailColorsSchema,
  ThumbnailTypographySchema,
  ThumbnailStyleSchema,
  ThumbnailElementsSchema,
  ThumbnailOptionSchema,
  ThumbnailOutputSchema,
} from '../types';
import { buildThumbnailPrompt, extractOverlayText } from '../prompt-builder';
import { createInitialRunContext } from '../../context';

describe('ThumbnailGeneratorNode', () => {
  const node = new ThumbnailGeneratorNode();

  describe('meta', () => {
    it('has correct id', () => {
      expect(node.meta.id).toBe('thumbnail');
    });

    it('has correct category', () => {
      expect(node.meta.category).toBe('production');
    });

    it('requires gemini credentials', () => {
      expect(node.meta.requiredCredentials).toContain('gemini');
    });

    it('has description', () => {
      expect(node.meta.description).toBeTruthy();
    });
  });

  describe('schemas', () => {
    describe('ThumbnailInputSchema', () => {
      it('accepts valid input', () => {
        const input = {
          title: 'How to Build a YouTube Automation Tool',
          topic: 'YouTube automation',
          count: 3,
        };

        const result = ThumbnailInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('applies default count', () => {
        const input = {
          title: 'Test Title',
          topic: 'Test topic',
        };

        const result = ThumbnailInputSchema.parse(input);
        expect(result.count).toBe(3);
      });

      it('accepts optional fields', () => {
        const input = {
          title: 'Test',
          topic: 'Test',
          keyPoints: ['Point 1', 'Point 2'],
          targetEmotion: 'excitement',
          overlayText: 'AMAZING',
        };

        const result = ThumbnailInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('rejects count > 5', () => {
        const input = {
          title: 'Test',
          topic: 'Test',
          count: 10,
        };

        const result = ThumbnailInputSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('rejects count < 1', () => {
        const input = {
          title: 'Test',
          topic: 'Test',
          count: 0,
        };

        const result = ThumbnailInputSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });

    describe('ThumbnailStyleGuideSchema', () => {
      it('has correct default dimensions', () => {
        const styleGuide = ThumbnailStyleGuideSchema.parse({});
        expect(styleGuide.dimensions.width).toBe(1280);
        expect(styleGuide.dimensions.height).toBe(720);
      });

      it('has correct default colors', () => {
        const styleGuide = ThumbnailStyleGuideSchema.parse({});
        expect(styleGuide.colors.primary).toBe('#2563EB');
        expect(styleGuide.colors.secondary).toBe('#1E293B');
        expect(styleGuide.colors.text).toBe('#FFFFFF');
        expect(styleGuide.colors.accent).toBe('#F59E0B');
      });

      it('has correct default typography', () => {
        const styleGuide = ThumbnailStyleGuideSchema.parse({});
        expect(styleGuide.typography.fontFamily).toBe('Inter');
        expect(styleGuide.typography.maxWords).toBe(4);
        expect(styleGuide.typography.textPosition).toBe('dynamic');
        expect(styleGuide.typography.textStyle).toBe('bold');
      });

      it('has correct default style', () => {
        const styleGuide = ThumbnailStyleGuideSchema.parse({});
        expect(styleGuide.style.backgroundType).toBe('generated');
        expect(styleGuide.style.mood).toBe('professional');
        expect(styleGuide.style.includeFace).toBe(false);
        expect(styleGuide.style.faceExpression).toBe('none');
      });

      it('allows mood override', () => {
        const styleGuide = ThumbnailStyleGuideSchema.parse({
          style: { mood: 'dramatic' },
        });
        expect(styleGuide.style.mood).toBe('dramatic');
      });

      it('allows all mood options', () => {
        const moods = ['professional', 'energetic', 'dramatic', 'minimal', 'playful'] as const;
        for (const mood of moods) {
          const result = ThumbnailStyleSchema.safeParse({ mood });
          expect(result.success).toBe(true);
        }
      });

      it('allows all text position options', () => {
        const positions = ['top', 'bottom', 'left', 'right', 'center', 'dynamic'] as const;
        for (const position of positions) {
          const result = ThumbnailTypographySchema.safeParse({ textPosition: position });
          expect(result.success).toBe(true);
        }
      });
    });

    describe('ThumbnailConfigSchema', () => {
      it('uses default generator', () => {
        const config = ThumbnailConfigSchema.parse({});
        expect(config.generator).toBe('gemini');
      });

      it('uses default models', () => {
        const config = ThumbnailConfigSchema.parse({});
        expect(config.geminiModel).toBe('imagen-4.0-generate-001');
        expect(config.dalleModel).toBe('dall-e-3');
        expect(config.dalleQuality).toBe('hd');
      });

      it('uses default text overlay settings', () => {
        const config = ThumbnailConfigSchema.parse({});
        expect(config.addTextOverlay).toBe(true);
        expect(config.textOverlayMethod).toBe('ai');
      });

      it('allows generator override', () => {
        const config = ThumbnailConfigSchema.parse({ generator: 'dalle' });
        expect(config.generator).toBe('dalle');
      });

      it('allows flux generator', () => {
        const config = ThumbnailConfigSchema.parse({ generator: 'flux' });
        expect(config.generator).toBe('flux');
      });
    });

    describe('ThumbnailOptionSchema', () => {
      it('validates complete option', () => {
        const option = {
          id: 'option_1',
          imageUrl: 'https://example.com/image.png',
          imagePath: 'runs/123/thumbnails/option_1.png',
          prompt: 'A thumbnail prompt',
          metadata: {
            generator: 'gemini' as const,
            dimensions: { width: 1280, height: 720 },
            hasTextOverlay: true,
          },
        };

        const result = ThumbnailOptionSchema.safeParse(option);
        expect(result.success).toBe(true);
      });
    });

    describe('ThumbnailOutputSchema', () => {
      it('validates complete output', () => {
        const output = {
          options: [{
            id: 'option_1',
            imageUrl: 'https://example.com/image.png',
            imagePath: 'runs/123/thumbnails/option_1.png',
            prompt: 'A thumbnail prompt',
            metadata: {
              generator: 'gemini' as const,
              dimensions: { width: 1280, height: 720 },
              hasTextOverlay: true,
            },
          }],
          styleGuideUsed: ThumbnailStyleGuideSchema.parse({}),
        };

        const result = ThumbnailOutputSchema.safeParse(output);
        expect(result.success).toBe(true);
      });

      it('allows optional selectedId', () => {
        const output = {
          options: [],
          selectedId: 'option_1',
          styleGuideUsed: ThumbnailStyleGuideSchema.parse({}),
        };

        const result = ThumbnailOutputSchema.safeParse(output);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('validate', () => {
    const context = createInitialRunContext({
      userId: 'test-user',
      projectId: 'test-project',
    });

    it('returns valid for correct input', () => {
      const input = {
        title: 'How to Build a YouTube Automation Tool',
        topic: 'YouTube automation',
        count: 3,
      };
      const config = ThumbnailConfigSchema.parse({});

      const result = node.validate(input, config, context);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('errors on missing title', () => {
      const input = {
        title: '',
        topic: 'Test',
        count: 3,
      };
      const config = ThumbnailConfigSchema.parse({});

      const result = node.validate(input, config, context);
      expect(result.valid).toBe(false);
      expect(result.errors[0].field).toBe('title');
    });

    it('warns on long overlay text', () => {
      const input = {
        title: 'Test',
        topic: 'Test',
        overlayText: 'This is a very long overlay text with many words',
        count: 3,
      };
      const config = ThumbnailConfigSchema.parse({});

      const result = node.validate(input, config, context);
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].field).toBe('overlayText');
    });

    it('does not warn on short overlay text', () => {
      const input = {
        title: 'Test',
        topic: 'Test',
        overlayText: 'SHORT TEXT',
        count: 3,
      };
      const config = ThumbnailConfigSchema.parse({});

      const result = node.validate(input, config, context);
      expect(result.warnings.filter(w => w.field === 'overlayText')).toHaveLength(0);
    });
  });

  describe('estimateCost', () => {
    it('estimates cost based on count and generator', () => {
      const input = { title: 'Test', topic: 'Test', count: 3 };
      const config = ThumbnailConfigSchema.parse({ generator: 'dalle' });

      const estimate = node.estimateCost(input, config);

      expect(estimate.total).toBeCloseTo(0.24, 2);  // 3 * $0.08
      expect(estimate.breakdown[0].service).toBe('dalle');
      expect(estimate.breakdown[0].units).toBe(3);
      expect(estimate.breakdown[0].unitType).toBe('images');
    });

    it('gemini is cheaper than dalle', () => {
      const input = { title: 'Test', topic: 'Test', count: 3 };

      const geminiCost = node.estimateCost(input, ThumbnailConfigSchema.parse({ generator: 'gemini' }));
      const dalleCost = node.estimateCost(input, ThumbnailConfigSchema.parse({ generator: 'dalle' }));

      expect(geminiCost.total).toBeLessThan(dalleCost.total);
    });

    it('flux is cheapest', () => {
      const input = { title: 'Test', topic: 'Test', count: 3 };

      const geminiCost = node.estimateCost(input, ThumbnailConfigSchema.parse({ generator: 'gemini' }));
      const fluxCost = node.estimateCost(input, ThumbnailConfigSchema.parse({ generator: 'flux' }));

      expect(fluxCost.total).toBeLessThan(geminiCost.total);
    });

    it('uses config default count when not in input', () => {
      // Testing runtime behavior where count is intentionally omitted to use config default
      const input = { title: 'Test', topic: 'Test' } as Parameters<typeof node.estimateCost>[0];
      const config = ThumbnailConfigSchema.parse({ defaultCount: 5 });

      const estimate = node.estimateCost(input, config);

      expect(estimate.breakdown[0].units).toBe(5);
    });
  });
});

describe('buildThumbnailPrompt', () => {
  const defaultStyleGuide = ThumbnailStyleGuideSchema.parse({});

  it('includes base description', () => {
    const prompt = buildThumbnailPrompt({
      input: { title: 'Test', topic: 'AI', count: 1 },
      styleGuide: defaultStyleGuide,
      variationIndex: 0,
      includeText: false,
    });

    expect(prompt).toContain('YouTube thumbnail');
    expect(prompt).toContain('16:9');
    expect(prompt).toContain('eye-catching');
  });

  it('includes topic in prompt', () => {
    const prompt = buildThumbnailPrompt({
      input: { title: 'Test', topic: 'AI automation', count: 1 },
      styleGuide: defaultStyleGuide,
      variationIndex: 0,
      includeText: false,
    });

    expect(prompt).toContain('AI automation');
  });

  it('includes mood description', () => {
    const prompt = buildThumbnailPrompt({
      input: { title: 'Test', topic: 'Test', count: 1 },
      styleGuide: { ...defaultStyleGuide, style: { ...defaultStyleGuide.style, mood: 'dramatic' } },
      variationIndex: 0,
      includeText: false,
    });

    // Dramatic mood produces "bold contrast, cinematic lighting, intense"
    expect(prompt).toContain('bold contrast');
    expect(prompt).toContain('cinematic');
  });

  it('includes all mood types correctly', () => {
    const moods = {
      professional: 'clean, polished',
      energetic: 'dynamic, vibrant',
      dramatic: 'bold contrast',
      minimal: 'simple, clean',
      playful: 'fun, colorful',
    } as const;

    for (const [mood, expectedText] of Object.entries(moods)) {
      const prompt = buildThumbnailPrompt({
        input: { title: 'Test', topic: 'Test', count: 1 },
        styleGuide: { ...defaultStyleGuide, style: { ...defaultStyleGuide.style, mood: mood as keyof typeof moods } },
        variationIndex: 0,
        includeText: false,
      });

      expect(prompt).toContain(expectedText);
    }
  });

  it('includes color palette', () => {
    const prompt = buildThumbnailPrompt({
      input: { title: 'Test', topic: 'Test', count: 1 },
      styleGuide: defaultStyleGuide,
      variationIndex: 0,
      includeText: false,
    });

    expect(prompt).toContain('#2563EB');  // primary
    expect(prompt).toContain('#F59E0B');  // accent
  });

  it('includes face expression when enabled', () => {
    const prompt = buildThumbnailPrompt({
      input: { title: 'Test', topic: 'Test', count: 1 },
      styleGuide: {
        ...defaultStyleGuide,
        style: { ...defaultStyleGuide.style, includeFace: true, faceExpression: 'surprised' },
      },
      variationIndex: 0,
      includeText: false,
    });

    expect(prompt).toContain('surprised');
    expect(prompt).toContain('wide eyes');
  });

  it('does not include face when disabled', () => {
    const prompt = buildThumbnailPrompt({
      input: { title: 'Test', topic: 'Test', count: 1 },
      styleGuide: defaultStyleGuide,
      variationIndex: 0,
      includeText: false,
    });

    expect(prompt).not.toContain('surprised');
    expect(prompt).not.toContain('expression');
  });

  it('includes text overlay when enabled', () => {
    const prompt = buildThumbnailPrompt({
      input: { title: 'Test', topic: 'Test', overlayText: 'AMAZING', count: 1 },
      styleGuide: defaultStyleGuide,
      variationIndex: 0,
      includeText: true,
    });

    expect(prompt).toContain('AMAZING');
    expect(prompt).toContain('Text overlay');
  });

  it('excludes text overlay when disabled', () => {
    const prompt = buildThumbnailPrompt({
      input: { title: 'Test', topic: 'Test', overlayText: 'AMAZING', count: 1 },
      styleGuide: defaultStyleGuide,
      variationIndex: 0,
      includeText: false,
    });

    expect(prompt).not.toContain('AMAZING');
    expect(prompt).not.toContain('Text overlay');
  });

  it('includes elements when enabled', () => {
    const prompt = buildThumbnailPrompt({
      input: { title: 'Test', topic: 'Test', count: 1 },
      styleGuide: {
        ...defaultStyleGuide,
        elements: { useArrows: true, useCircles: true, useIcons: true, useBorder: true, useEmoji: true },
      },
      variationIndex: 0,
      includeText: false,
    });

    expect(prompt).toContain('arrows');
    expect(prompt).toContain('circles');
    expect(prompt).toContain('icons');
    expect(prompt).toContain('border');
    expect(prompt).toContain('emoji');
  });

  it('creates different variations', () => {
    const baseParams = {
      input: { title: 'Test', topic: 'Test', count: 3 },
      styleGuide: defaultStyleGuide,
      includeText: false,
    };

    const prompt0 = buildThumbnailPrompt({ ...baseParams, variationIndex: 0 });
    const prompt1 = buildThumbnailPrompt({ ...baseParams, variationIndex: 1 });
    const prompt2 = buildThumbnailPrompt({ ...baseParams, variationIndex: 2 });

    // Prompts should differ in composition
    expect(prompt0).toContain('centered');
    expect(prompt1).toContain('rule of thirds');
    expect(prompt2).toContain('close-up');
  });

  it('includes target emotion when provided', () => {
    const prompt = buildThumbnailPrompt({
      input: { title: 'Test', topic: 'Test', targetEmotion: 'curiosity', count: 1 },
      styleGuide: defaultStyleGuide,
      variationIndex: 0,
      includeText: false,
    });

    expect(prompt).toContain('curiosity');
    expect(prompt).toContain('emotion');
  });

  it('includes negative prompts', () => {
    const prompt = buildThumbnailPrompt({
      input: { title: 'Test', topic: 'Test', count: 1 },
      styleGuide: defaultStyleGuide,
      variationIndex: 0,
      includeText: false,
    });

    expect(prompt).toContain('Avoid');
    expect(prompt).toContain('blurry');
    expect(prompt).toContain('watermark');
  });
});

describe('extractOverlayText', () => {
  it('returns short titles unchanged', () => {
    const result = extractOverlayText('AI Tools', 4);
    expect(result).toBe('AI Tools');
  });

  it('truncates long titles', () => {
    const result = extractOverlayText('The Ultimate Guide to Building YouTube Automation Tools', 4);
    const words = result.split(' ');
    expect(words.length).toBeLessThanOrEqual(4);
  });

  it('removes filler words', () => {
    const result = extractOverlayText('The Best of the AI Tools', 4);
    expect(result).not.toContain('The');
    expect(result).not.toContain('of');
    expect(result).not.toContain('the');
  });

  it('removes common prepositions', () => {
    const result = extractOverlayText('Guide to go with AI for fun', 4);
    // "to", "with", "for" should be removed as filler words
    const words = result.split(' ');
    expect(words).not.toContain('to');
    expect(words).not.toContain('with');
    expect(words).not.toContain('for');
  });

  it('prioritizes capitalized words', () => {
    const result = extractOverlayText('how to use AI and ML for automation', 3);
    // AI and ML should be prioritized
    expect(result).toContain('AI');
    expect(result).toContain('ML');
  });

  it('handles empty string', () => {
    const result = extractOverlayText('', 4);
    expect(result).toBe('');
  });

  it('handles single word', () => {
    const result = extractOverlayText('Amazing', 4);
    expect(result).toBe('Amazing');
  });

  it('handles all filler words', () => {
    const result = extractOverlayText('the a an is', 4);
    expect(result).toBe('');
  });
});
