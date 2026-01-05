import type { ThumbnailGenerator, GenerationParams, GenerationResult } from './index';

export class DalleGenerator implements ThumbnailGenerator {
  name = 'dalle';
  private apiKey: string;
  private model: string;
  private quality: 'standard' | 'hd';

  constructor(apiKey: string, options?: { model?: string; quality?: 'standard' | 'hd' }) {
    this.apiKey = apiKey;
    this.model = options?.model ?? 'dall-e-3';
    this.quality = options?.quality ?? 'hd';
  }

  async generate(params: GenerationParams): Promise<GenerationResult> {
    const { prompt } = params;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        prompt,
        n: 1,
        size: '1792x1024',  // Closest to 16:9 for DALL-E 3
        quality: this.quality,
        response_format: 'b64_json',
      }),
    });

    if (!response.ok) {
      const error = await response.json() as { error?: { message?: string } };
      throw new Error(`DALL-E generation failed: ${error.error?.message ?? response.status}`);
    }

    const data = await response.json() as {
      data?: Array<{
        b64_json?: string;
        revised_prompt?: string;
      }>;
    };
    const imageData = data.data?.[0]?.b64_json;

    if (!imageData) {
      throw new Error('No image generated');
    }

    return {
      imageBuffer: Buffer.from(imageData, 'base64'),
      contentType: 'image/png',
      revisedPrompt: data.data?.[0]?.revised_prompt,
    };
  }
}
