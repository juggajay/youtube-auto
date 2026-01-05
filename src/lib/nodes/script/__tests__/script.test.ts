import { describe, it, expect } from 'vitest';
import { ScriptGeneratorNode } from '../index';
import { ScriptInputSchema, ScriptOutputSchema, ScriptConfigSchema } from '../types';
import { buildScriptPrompt } from '../prompt';
import { parseScriptResponse } from '../parser';
import { createInitialRunContext } from '../../context';

describe('ScriptGeneratorNode', () => {
  const node = new ScriptGeneratorNode();

  describe('meta', () => {
    it('has correct id', () => {
      expect(node.meta.id).toBe('script');
    });

    it('has correct category', () => {
      expect(node.meta.category).toBe('content');
    });

    it('requires anthropic credentials', () => {
      expect(node.meta.requiredCredentials).toContain('anthropic');
    });

    it('has description', () => {
      expect(node.meta.description).toBeTruthy();
    });
  });

  describe('schemas', () => {
    describe('ScriptInputSchema', () => {
      it('accepts valid input', () => {
        const input = {
          topic: 'How to build a YouTube automation tool',
          structure: {
            sections: [
              { id: 'intro', name: 'Introduction', purpose: 'Hook the viewer', required: true },
              { id: 'main', name: 'Main Content', purpose: 'Deliver value', required: true },
            ],
            totalDuration: { min: 300, max: 600 },
          },
        };

        const result = ScriptInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('accepts input with all optional fields', () => {
        const input = {
          topic: 'Complete topic for testing',
          structure: {
            sections: [
              { id: 'intro', name: 'Intro', purpose: 'Hook', required: true, targetDuration: 30, notes: 'Make it punchy' },
            ],
            totalDuration: { min: 300, max: 600 },
            turnPlacement: 60,
          },
          rules: {
            alwaysInclude: ['call to action'],
            neverInclude: ['sponsor mentions'],
            tone: 'casual',
            vocabulary: {
              useJargon: false,
              bannedWords: ['actually', 'basically'],
              preferredPhrases: ['in this video'],
            },
            customInstructions: 'Keep it engaging',
          },
          research: {
            summary: 'Key findings about the topic',
            keyPoints: ['Point 1', 'Point 2'],
            sources: [{ title: 'Source 1', url: 'https://example.com', snippet: 'Relevant info' }],
          },
          examples: [
            { name: 'Example Script', topic: 'Similar topic', script: 'Script content here...', notes: 'Good flow' },
          ],
          instructions: 'Focus on practical tips',
        };

        const result = ScriptInputSchema.safeParse(input);
        expect(result.success).toBe(true);
      });

      it('rejects input without sections', () => {
        const input = {
          topic: 'Test topic here',
          structure: {
            sections: [],
            totalDuration: { min: 300, max: 600 },
          },
        };

        const result = ScriptInputSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('rejects topic that is too short', () => {
        const input = {
          topic: 'Hi',
          structure: {
            sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook', required: true }],
            totalDuration: { min: 300, max: 600 },
          },
        };

        const result = ScriptInputSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('rejects topic that is too long', () => {
        const input = {
          topic: 'x'.repeat(501),
          structure: {
            sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook', required: true }],
            totalDuration: { min: 300, max: 600 },
          },
        };

        const result = ScriptInputSchema.safeParse(input);
        expect(result.success).toBe(false);
      });

      it('rejects turnPlacement outside 0-100', () => {
        const input = {
          topic: 'Valid topic here',
          structure: {
            sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook', required: true }],
            totalDuration: { min: 300, max: 600 },
            turnPlacement: 150,
          },
        };

        const result = ScriptInputSchema.safeParse(input);
        expect(result.success).toBe(false);
      });
    });

    describe('ScriptConfigSchema', () => {
      it('accepts valid config', () => {
        const config = {
          model: 'claude-sonnet-4-20250514',
          temperature: 0.7,
          includeVisualNotes: true,
          includeMetadata: true,
        };

        const result = ScriptConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
      });

      it('uses default values', () => {
        const config = {};
        const result = ScriptConfigSchema.safeParse(config);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.model).toBe('claude-sonnet-4-20250514');
          expect(result.data.temperature).toBe(0.7);
          expect(result.data.includeVisualNotes).toBe(true);
          expect(result.data.includeMetadata).toBe(true);
        }
      });

      it('rejects invalid model', () => {
        const config = {
          model: 'gpt-3.5-turbo',
        };

        const result = ScriptConfigSchema.safeParse(config);
        expect(result.success).toBe(false);
      });

      it('rejects temperature out of range', () => {
        const config = {
          temperature: 1.5,
        };

        const result = ScriptConfigSchema.safeParse(config);
        expect(result.success).toBe(false);
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
        topic: 'A comprehensive topic about building automation tools',
        structure: {
          sections: [
            { id: 'intro', name: 'Introduction', purpose: 'Hook the viewer', required: true },
          ],
          totalDuration: { min: 300, max: 600 },
        },
      };
      const config = { model: 'claude-sonnet-4-20250514' as const, temperature: 0.7, includeVisualNotes: true, includeMetadata: true };

      const result = node.validate(input, config, context);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('warns on short topic', () => {
      const input = {
        topic: 'Short',
        structure: {
          sections: [
            { id: 'intro', name: 'Introduction', purpose: 'Hook the viewer', required: true },
          ],
          totalDuration: { min: 300, max: 600 },
        },
      };
      const config = { model: 'claude-sonnet-4-20250514' as const, temperature: 0.7, includeVisualNotes: true, includeMetadata: true };

      const result = node.validate(input, config, context);
      expect(result.warnings.some(w => w.field === 'topic')).toBe(true);
    });

    it('errors on empty sections', () => {
      const input = {
        topic: 'A valid topic that is long enough',
        structure: {
          sections: [],
          totalDuration: { min: 300, max: 600 },
        },
      };
      const config = { model: 'claude-sonnet-4-20250514' as const, temperature: 0.7, includeVisualNotes: true, includeMetadata: true };

      const result = node.validate(input, config, context);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'structure.sections')).toBe(true);
    });

    it('errors on min > max duration', () => {
      const input = {
        topic: 'A valid topic that is long enough',
        structure: {
          sections: [
            { id: 'intro', name: 'Introduction', purpose: 'Hook the viewer', required: true },
          ],
          totalDuration: { min: 600, max: 300 },
        },
      };
      const config = { model: 'claude-sonnet-4-20250514' as const, temperature: 0.7, includeVisualNotes: true, includeMetadata: true };

      const result = node.validate(input, config, context);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'structure.totalDuration')).toBe(true);
    });

    it('warns on very long duration', () => {
      const input = {
        topic: 'A valid topic that is long enough',
        structure: {
          sections: [
            { id: 'intro', name: 'Introduction', purpose: 'Hook the viewer', required: true },
          ],
          totalDuration: { min: 3000, max: 4000 },
        },
      };
      const config = { model: 'claude-sonnet-4-20250514' as const, temperature: 0.7, includeVisualNotes: true, includeMetadata: true };

      const result = node.validate(input, config, context);
      expect(result.warnings.some(w => w.field === 'structure.totalDuration')).toBe(true);
    });
  });

  describe('estimateCost', () => {
    it('estimates higher cost for more sections', () => {
      const inputSimple = {
        topic: 'Simple topic for testing',
        structure: {
          sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook', required: true }],
          totalDuration: { min: 300, max: 600 },
        },
      };

      const inputComplex = {
        topic: 'Complex topic for testing',
        structure: {
          sections: [
            { id: 's1', name: 'Section 1', purpose: 'Purpose 1', required: true },
            { id: 's2', name: 'Section 2', purpose: 'Purpose 2', required: true },
            { id: 's3', name: 'Section 3', purpose: 'Purpose 3', required: true },
            { id: 's4', name: 'Section 4', purpose: 'Purpose 4', required: true },
            { id: 's5', name: 'Section 5', purpose: 'Purpose 5', required: true },
          ],
          totalDuration: { min: 300, max: 600 },
        },
      };

      const config = { model: 'claude-sonnet-4-20250514' as const, temperature: 0.7, includeVisualNotes: true, includeMetadata: true };

      const costSimple = node.estimateCost(inputSimple, config);
      const costComplex = node.estimateCost(inputComplex, config);

      expect(costComplex.total).toBeGreaterThan(costSimple.total);
    });

    it('estimates higher cost for Opus model', () => {
      const input = {
        topic: 'Topic for cost estimation',
        structure: {
          sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook', required: true }],
          totalDuration: { min: 300, max: 600 },
        },
      };

      const sonnetConfig = { model: 'claude-sonnet-4-20250514' as const, temperature: 0.7, includeVisualNotes: true, includeMetadata: true };
      const opusConfig = { model: 'claude-opus-4-20250514' as const, temperature: 0.7, includeVisualNotes: true, includeMetadata: true };

      const costSonnet = node.estimateCost(input, sonnetConfig);
      const costOpus = node.estimateCost(input, opusConfig);

      expect(costOpus.total).toBeGreaterThan(costSonnet.total);
    });

    it('includes research tokens when research provided', () => {
      const inputWithout = {
        topic: 'Topic without research',
        structure: {
          sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook', required: true }],
          totalDuration: { min: 300, max: 600 },
        },
      };

      const inputWith = {
        ...inputWithout,
        research: {
          summary: 'Research summary here',
          keyPoints: ['Point 1', 'Point 2'],
          sources: [{ title: 'Source', url: 'https://example.com', snippet: 'Info' }],
        },
      };

      const config = { model: 'claude-sonnet-4-20250514' as const, temperature: 0.7, includeVisualNotes: true, includeMetadata: true };

      const costWithout = node.estimateCost(inputWithout, config);
      const costWith = node.estimateCost(inputWith, config);

      expect(costWith.total).toBeGreaterThan(costWithout.total);
    });
  });
});

describe('buildScriptPrompt', () => {
  it('includes topic', () => {
    const prompt = buildScriptPrompt({
      input: {
        topic: 'Test Topic for YouTube Video',
        structure: {
          sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook viewers', required: true }],
          totalDuration: { min: 300, max: 600 },
        },
      },
      includeVisualNotes: true,
      includeMetadata: true,
    });

    expect(prompt).toContain('Test Topic for YouTube Video');
  });

  it('includes all sections', () => {
    const prompt = buildScriptPrompt({
      input: {
        topic: 'Multi-section test',
        structure: {
          sections: [
            { id: 's1', name: 'Section One', purpose: 'First section', required: true },
            { id: 's2', name: 'Section Two', purpose: 'Second section', required: false },
          ],
          totalDuration: { min: 300, max: 600 },
        },
      },
      includeVisualNotes: true,
      includeMetadata: true,
    });

    expect(prompt).toContain('Section One');
    expect(prompt).toContain('Section Two');
    expect(prompt).toContain('s1');
    expect(prompt).toContain('s2');
    expect(prompt).toContain('REQUIRED');
    expect(prompt).toContain('Optional');
  });

  it('includes target audience from channel bible', () => {
    const prompt = buildScriptPrompt({
      input: {
        topic: 'Test topic here',
        structure: {
          sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook', required: true }],
          totalDuration: { min: 300, max: 600 },
        },
      },
      channelBible: {
        channel_name: 'Test Channel',
        target_audience: {
          demographics: 'Tech professionals 25-45',
          knowledge_level: 'Intermediate',
          why_they_watch: 'To learn automation',
        },
        tone: { overall: 'professional', humor: 'subtle', formality: 'casual' },
        vocabulary: { use_jargon: true, explain_threshold: '', banned_words: [], preferred_phrases: [] },
        structure: { typical_length: '', hook_style: '', cta_style: '', intro_length: '' },
        rules: { always_include: [], never_include: [], fact_check: '' },
      },
      includeVisualNotes: true,
      includeMetadata: true,
    });

    expect(prompt).toContain('Tech professionals 25-45');
    expect(prompt).toContain('Intermediate');
    expect(prompt).toContain('To learn automation');
  });

  it('includes retry context when provided', () => {
    const prompt = buildScriptPrompt({
      input: {
        topic: 'Retry test topic',
        structure: {
          sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook', required: true }],
          totalDuration: { min: 300, max: 600 },
        },
      },
      includeVisualNotes: true,
      includeMetadata: true,
      retryContext: {
        attemptNumber: 2,
        lastError: { code: 'PARSE_ERROR', message: 'Invalid JSON returned' },
      },
    });

    expect(prompt).toContain('attempt 2');
    expect(prompt).toContain('Invalid JSON returned');
  });

  it('merges rules from channel bible and user', () => {
    const prompt = buildScriptPrompt({
      input: {
        topic: 'Rules merge test',
        structure: {
          sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook', required: true }],
          totalDuration: { min: 300, max: 600 },
        },
        rules: {
          alwaysInclude: ['user rule 1'],
          neverInclude: ['user exclude'],
          customInstructions: 'User custom instructions',
        },
      },
      channelBible: {
        channel_name: 'Test',
        target_audience: { demographics: '', knowledge_level: '', why_they_watch: '' },
        tone: { overall: '', humor: '', formality: '' },
        vocabulary: { use_jargon: false, explain_threshold: '', banned_words: ['channel banned'], preferred_phrases: ['channel phrase'] },
        structure: { typical_length: '', hook_style: '', cta_style: '', intro_length: '' },
        rules: { always_include: ['channel rule'], never_include: ['channel exclude'], fact_check: '' },
      },
      includeVisualNotes: true,
      includeMetadata: true,
    });

    expect(prompt).toContain('user rule 1');
    expect(prompt).toContain('channel rule');
    expect(prompt).toContain('user exclude');
    expect(prompt).toContain('channel exclude');
    expect(prompt).toContain('channel banned');
    expect(prompt).toContain('channel phrase');
    expect(prompt).toContain('User custom instructions');
  });

  it('includes research when provided', () => {
    const prompt = buildScriptPrompt({
      input: {
        topic: 'Research test',
        structure: {
          sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook', required: true }],
          totalDuration: { min: 300, max: 600 },
        },
        research: {
          summary: 'This is the research summary',
          keyPoints: ['Key point 1', 'Key point 2'],
          sources: [{ title: 'Source Title', url: 'https://example.com', snippet: 'Relevant snippet' }],
        },
      },
      includeVisualNotes: true,
      includeMetadata: true,
    });

    expect(prompt).toContain('This is the research summary');
    expect(prompt).toContain('Key point 1');
    expect(prompt).toContain('Key point 2');
    expect(prompt).toContain('Source Title');
    expect(prompt).toContain('https://example.com');
  });

  it('includes examples when provided', () => {
    const prompt = buildScriptPrompt({
      input: {
        topic: 'Examples test',
        structure: {
          sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook', required: true }],
          totalDuration: { min: 300, max: 600 },
        },
        examples: [
          { name: 'Example Script 1', topic: 'Similar Topic', script: 'Example script content...', notes: 'Good pacing' },
        ],
      },
      includeVisualNotes: true,
      includeMetadata: true,
    });

    expect(prompt).toContain('Example Script 1');
    expect(prompt).toContain('Similar Topic');
    expect(prompt).toContain('Example script content...');
    expect(prompt).toContain('Good pacing');
  });

  it('includes duration targets', () => {
    const prompt = buildScriptPrompt({
      input: {
        topic: 'Duration test',
        structure: {
          sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook', required: true }],
          totalDuration: { min: 300, max: 600 },
        },
      },
      includeVisualNotes: true,
      includeMetadata: true,
    });

    expect(prompt).toContain('5-10 minutes');
  });

  it('includes turn placement when specified', () => {
    const prompt = buildScriptPrompt({
      input: {
        topic: 'Turn placement test',
        structure: {
          sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook', required: true }],
          totalDuration: { min: 300, max: 600 },
          turnPlacement: 70,
        },
      },
      includeVisualNotes: true,
      includeMetadata: true,
    });

    expect(prompt).toContain('70%');
    expect(prompt).toContain('narrative');
  });
});

describe('parseScriptResponse', () => {
  const structure = {
    sections: [{ id: 'intro', name: 'Intro', purpose: 'Hook', required: true }],
    totalDuration: { min: 300, max: 600 },
  };

  it('parses valid JSON response', () => {
    const response = JSON.stringify({
      title: 'Test Video Title',
      hook: { content: 'Welcome to the video!', visualNotes: 'Show logo', durationEstimate: 15 },
      sections: [{ id: 'intro', name: 'Introduction', content: 'Main content here...', visualNotes: 'B-roll of office', bRollSuggestions: ['desk shot'], durationEstimate: 60 }],
      outro: { content: 'Thanks for watching', cta: 'Subscribe!', visualNotes: 'End screen' },
      metadata: { description: 'A test video description', tags: ['test', 'video'], chapters: [{ timestamp: '0:00', title: 'Intro' }] },
      totalDurationEstimate: 75,
      wordCount: 50,
    });

    const parsed = parseScriptResponse(response, structure);
    expect(parsed.title).toBe('Test Video Title');
    expect(parsed.hook.content).toBe('Welcome to the video!');
    expect(parsed.sections).toHaveLength(1);
    expect(parsed.outro.cta).toBe('Subscribe!');
    expect(parsed.metadata.tags).toContain('test');
    expect(parsed.totalDurationEstimate).toBe(75);
    expect(parsed.wordCount).toBe(50);
  });

  it('handles JSON in markdown code blocks', () => {
    const response = '```json\n{"title": "Code Block Test", "hook": {"content": "Hook content", "visualNotes": "", "durationEstimate": 10}, "sections": [], "outro": {"content": "Outro", "cta": "CTA", "visualNotes": ""}, "metadata": {"description": "", "tags": [], "chapters": []}, "totalDurationEstimate": 10, "wordCount": 5}\n```';

    const parsed = parseScriptResponse(response, structure);
    expect(parsed.title).toBe('Code Block Test');
  });

  it('handles JSON in generic code blocks', () => {
    const response = '```\n{"title": "Generic Block", "hook": {"content": "", "visualNotes": "", "durationEstimate": 10}, "sections": [], "outro": {"content": "", "cta": "", "visualNotes": ""}, "metadata": {"description": "", "tags": [], "chapters": []}, "totalDurationEstimate": 10, "wordCount": 0}\n```';

    const parsed = parseScriptResponse(response, structure);
    expect(parsed.title).toBe('Generic Block');
  });

  it('calculates word count if not provided', () => {
    const response = JSON.stringify({
      title: 'Test',
      hook: { content: 'One two three', visualNotes: '', durationEstimate: 10 },
      sections: [{ id: 'intro', name: 'Intro', content: 'Four five six seven', visualNotes: '', bRollSuggestions: [], durationEstimate: 60 }],
      outro: { content: 'Eight nine ten', cta: '', visualNotes: '' },
      metadata: { description: '', tags: [], chapters: [] },
      totalDurationEstimate: 70,
    });

    const parsed = parseScriptResponse(response, structure);
    expect(parsed.wordCount).toBe(10);
  });

  it('calculates total duration if not provided', () => {
    const response = JSON.stringify({
      title: 'Test',
      hook: { content: '', visualNotes: '', durationEstimate: 20 },
      sections: [
        { id: 's1', name: 'S1', content: '', visualNotes: '', bRollSuggestions: [], durationEstimate: 100 },
        { id: 's2', name: 'S2', content: '', visualNotes: '', bRollSuggestions: [], durationEstimate: 150 },
      ],
      outro: { content: '', cta: '', visualNotes: '', durationEstimate: 30 },
      metadata: { description: '', tags: [], chapters: [] },
      wordCount: 0,
    });

    const parsed = parseScriptResponse(response, structure);
    expect(parsed.totalDurationEstimate).toBe(300); // 20 + 100 + 150 + 30
  });

  it('throws on invalid JSON', () => {
    expect(() => parseScriptResponse('not valid json', structure)).toThrow();
  });

  it('throws on missing title', () => {
    const response = JSON.stringify({
      hook: { content: '', visualNotes: '', durationEstimate: 10 },
      sections: [],
      outro: { content: '', cta: '', visualNotes: '' },
      metadata: { description: '', tags: [], chapters: [] },
    });

    expect(() => parseScriptResponse(response, structure)).toThrow('Missing or invalid title');
  });

  it('throws on missing hook', () => {
    const response = JSON.stringify({
      title: 'Test',
      sections: [],
      outro: { content: '', cta: '', visualNotes: '' },
      metadata: { description: '', tags: [], chapters: [] },
    });

    expect(() => parseScriptResponse(response, structure)).toThrow('Missing or invalid hook');
  });

  it('throws on missing sections array', () => {
    const response = JSON.stringify({
      title: 'Test',
      hook: { content: '', visualNotes: '', durationEstimate: 10 },
      outro: { content: '', cta: '', visualNotes: '' },
      metadata: { description: '', tags: [], chapters: [] },
    });

    expect(() => parseScriptResponse(response, structure)).toThrow('Missing or invalid sections');
  });

  it('throws on missing outro', () => {
    const response = JSON.stringify({
      title: 'Test',
      hook: { content: '', visualNotes: '', durationEstimate: 10 },
      sections: [],
      metadata: { description: '', tags: [], chapters: [] },
    });

    expect(() => parseScriptResponse(response, structure)).toThrow('Missing or invalid outro');
  });

  it('provides defaults for missing optional fields', () => {
    const response = JSON.stringify({
      title: 'Minimal Response',
      hook: { content: 'Hook' },
      sections: [{ id: 'intro', content: 'Content' }],
      outro: { content: 'Outro' },
    });

    const parsed = parseScriptResponse(response, structure);
    expect(parsed.hook.visualNotes).toBe('');
    expect(parsed.hook.durationEstimate).toBe(20);
    expect(parsed.sections[0].name).toBe('Unnamed Section');
    expect(parsed.sections[0].bRollSuggestions).toEqual([]);
    expect(parsed.outro.cta).toBe('');
    expect(parsed.metadata.description).toBe('');
    expect(parsed.metadata.tags).toEqual([]);
    expect(parsed.metadata.chapters).toEqual([]);
  });
});
