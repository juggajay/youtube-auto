import type { ChannelBible, HookStyle } from './types';

/**
 * Generate prompt for YouTube video hooks
 */
export function generateHooksPrompt(
  topic: string,
  archetype: string | undefined,
  styles: HookStyle[],
  count: number,
  channelBible?: ChannelBible
): string {
  const styleDescriptions: Record<HookStyle, string> = {
    question: 'Ask a provocative or curiosity-inducing question',
    bold_claim: 'Make a bold, attention-grabbing statement',
    story: 'Start with a mini-story or anecdote',
    statistic: 'Lead with a surprising statistic or number',
    controversy: 'Present a contrarian or controversial take',
  };

  const styleInstructions = styles
    .map((s) => `- ${s}: ${styleDescriptions[s]}`)
    .join('\n');

  return `Generate ${count} compelling YouTube video hooks for:

Topic: ${topic}
Video Format: ${archetype || 'general'}
${channelBible ? `Channel Voice:
- Tone: ${channelBible.tone || 'engaging and conversational'}
- Audience: ${channelBible.audience || 'general audience'}
- Style: ${channelBible.style || 'informative'}` : ''}

Generate hooks in these styles:
${styleInstructions}

Each hook should:
- Be 1-3 sentences maximum
- Immediately grab attention in the first 3 seconds
- Create curiosity, urgency, or emotional resonance
- Feel natural when spoken aloud
- Avoid clickbait that doesn't deliver

Return ONLY a valid JSON array with no additional text:
[{ "content": "hook text here...", "style": "question" }]

Generate exactly ${count} hooks, distributing across the requested styles.`;
}

/**
 * Generate prompt for YouTube video titles
 */
export function generateTitlesPrompt(
  topic: string,
  archetype: string | undefined,
  count: number,
  channelBible?: ChannelBible
): string {
  return `Generate ${count} YouTube video titles for:

Topic: ${topic}
Video Format: ${archetype || 'general'}
${channelBible ? `Channel Voice:
- Tone: ${channelBible.tone || 'engaging'}
- Audience: ${channelBible.audience || 'general audience'}` : ''}

Requirements for effective YouTube titles:
- 40-70 characters is ideal (max 100)
- Include numbers where appropriate (e.g., "5 Ways...", "The #1...")
- Use power words (Ultimate, Secret, Proven, Revolutionary, etc.)
- Create a curiosity gap without being misleading
- Front-load important keywords
- Avoid ALL CAPS (except for emphasis on 1-2 words max)

Return ONLY a valid JSON array with no additional text:
[{ "content": "title text here...", "hasNumber": true, "hasPowerWord": true, "charCount": 52 }]

Generate exactly ${count} titles with varied approaches.`;
}

/**
 * Generate prompt for YouTube video description
 */
export function generateDescriptionPrompt(
  topic: string,
  title: string,
  channelBible?: ChannelBible
): string {
  return `Generate a YouTube video description for:

Title: ${title}
Topic: ${topic}
${channelBible ? `Channel Voice:
- Tone: ${channelBible.tone || 'engaging and helpful'}
- Audience: ${channelBible.audience || 'general audience'}` : ''}

Create a comprehensive description that includes:

1. **Opening paragraph** (2-3 sentences) - Hook readers and summarize the video's value
2. **What viewers will learn** - 3-5 bullet points with key takeaways
3. **Timestamps section** - Use [00:00] placeholders for chapter markers
4. **Links section** - Placeholder for relevant resources
5. **Call-to-action** - Subscribe, like, comment prompt
6. **Hashtags** - 5-7 relevant hashtags at the end

Format guidelines:
- Use appropriate emojis for visual separation (but don't overdo it)
- Include line breaks for readability
- Keep total length under 5000 characters
- First 150 characters are crucial (shown in search results)

Return the description as a plain string (not JSON).`;
}

/**
 * Build the system prompt for ideation generation
 */
export function getSystemPrompt(): string {
  return `You are an expert YouTube content strategist and copywriter. Your specialty is creating compelling hooks, titles, and descriptions that:

1. Maximize click-through rates while maintaining viewer trust
2. Align with YouTube's algorithm preferences (watch time, engagement)
3. Resonate with target audiences emotionally and intellectually
4. Avoid clickbait that disappoints viewers

When generating content:
- Prioritize authenticity over sensationalism
- Consider the viewer's journey and expectations
- Use proven copywriting frameworks (AIDA, PAS, etc.)
- Optimize for both search and browse discovery

Always return responses in the exact format requested.`;
}
