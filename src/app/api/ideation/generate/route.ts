import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { withUsageTracking } from '@/lib/billing/middleware';
import {
  GenerateRequestSchema,
  GenerateResponse,
  GeneratedOption,
  HookStyle,
} from '@/lib/ideation/types';
import {
  generateHooksPrompt,
  generateTitlesPrompt,
  generateDescriptionPrompt,
  getSystemPrompt,
} from '@/lib/ideation/prompts';

// Default hook styles if none specified
const DEFAULT_HOOK_STYLES: HookStyle[] = [
  'question',
  'bold_claim',
  'story',
  'statistic',
  'controversy',
];

/**
 * POST /api/ideation/generate
 * Generate content options (hooks, titles, descriptions) using Claude AI
 */
// Context type from billing middleware
interface UsageContext {
  user: { id: string; email: string };
  subscription: { id: string; plan_id: string; status: string };
}

export const POST = withUsageTracking(
  'script_generation',
  async (
    request: NextRequest,
    _context: UsageContext
  ): Promise<NextResponse<GenerateResponse | { error: string }>> => {
    try {
      // Parse and validate request body
      const body = await request.json();
      const parseResult = GenerateRequestSchema.safeParse(body);

      if (!parseResult.success) {
        const firstIssue = parseResult.error.issues[0];
        return NextResponse.json(
          { error: `Invalid request: ${firstIssue?.message || 'Validation failed'}` },
          { status: 400 }
        );
      }

      const {
        type,
        topic,
        count = 5,
        style,
        archetype,
        channelBible,
        title,
      } = parseResult.data;

      // Get API key
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: 'Anthropic API key not configured' },
          { status: 500 }
        );
      }

      // Build the appropriate prompt based on type
      let userPrompt: string;

      switch (type) {
        case 'hook':
          userPrompt = generateHooksPrompt(
            topic,
            archetype,
            style || DEFAULT_HOOK_STYLES,
            count,
            channelBible
          );
          break;

        case 'title':
          userPrompt = generateTitlesPrompt(topic, archetype, count, channelBible);
          break;

        case 'description':
          if (!title) {
            return NextResponse.json(
              { error: 'Title is required for description generation' },
              { status: 400 }
            );
          }
          userPrompt = generateDescriptionPrompt(topic, title, channelBible);
          break;

        default:
          return NextResponse.json(
            { error: `Unknown generation type: ${type}` },
            { status: 400 }
          );
      }

      // Call Claude API
      const anthropic = new Anthropic({ apiKey });

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: getSystemPrompt(),
        messages: [{ role: 'user', content: userPrompt }],
      });

      // Extract text content from response
      const textContent = message.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        return NextResponse.json(
          { error: 'No text content in AI response' },
          { status: 500 }
        );
      }

      const responseText = textContent.text.trim();

      // Parse response based on type
      let options: GeneratedOption[];

      if (type === 'description') {
        // Description is returned as plain text
        options = [{ content: responseText }];
      } else {
        // Hooks and titles are returned as JSON arrays
        try {
          // Extract JSON array from response (handle potential markdown code blocks)
          let jsonStr = responseText;

          // Remove markdown code block if present
          const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
          }

          // Try to find array in the response
          const arrayMatch = jsonStr.match(/\[[\s\S]*\]/);
          if (arrayMatch) {
            jsonStr = arrayMatch[0];
          }

          const parsed = JSON.parse(jsonStr);

          if (!Array.isArray(parsed)) {
            throw new Error('Response is not an array');
          }

          options = parsed.map((item: Record<string, unknown>) => ({
            content: String(item.content || item.text || ''),
            style: item.style as HookStyle | undefined,
            charCount: typeof item.charCount === 'number' ? item.charCount : undefined,
            hasNumber: typeof item.hasNumber === 'boolean' ? item.hasNumber : undefined,
            hasPowerWord: typeof item.hasPowerWord === 'boolean' ? item.hasPowerWord : undefined,
          }));
        } catch {
          console.error('Failed to parse AI response:', responseText);
          return NextResponse.json(
            { error: 'Failed to parse AI response as JSON' },
            { status: 500 }
          );
        }
      }

      // Filter out any empty options
      options = options.filter((opt) => opt.content && opt.content.trim().length > 0);

      if (options.length === 0) {
        return NextResponse.json(
          { error: 'No valid options generated' },
          { status: 500 }
        );
      }

      // Check if response has overage warning
      const isOverage = request.headers.get('X-VidFlow-Overage') === 'true';

      const response: GenerateResponse & { usageWarning?: string } = {
        options,
        ...(isOverage && {
          usageWarning:
            "You have exceeded your plan's included credits. Additional charges will apply.",
        }),
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('Ideation generation error:', error);

      // Handle specific Anthropic API errors
      if (error instanceof Anthropic.APIError) {
        if (error.status === 429) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please try again later.' },
            { status: 429 }
          );
        }
        if (error.status === 401) {
          return NextResponse.json(
            { error: 'Invalid API key configuration' },
            { status: 500 }
          );
        }
      }

      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        },
        { status: 500 }
      );
    }
  }
);
