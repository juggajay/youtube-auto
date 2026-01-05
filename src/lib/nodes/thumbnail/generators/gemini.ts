import type { ThumbnailGenerator, GenerationParams, GenerationResult } from './index';

export class GeminiGenerator implements ThumbnailGenerator {
  name = 'gemini';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, options?: { model?: string }) {
    this.apiKey = apiKey;
    this.model = options?.model ?? 'imagen-3.0-generate-002';
  }

  async generate(params: GenerationParams): Promise<GenerationResult> {
    const { prompt } = params;

    // Gemini Imagen API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateImages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          prompt,
          config: {
            numberOfImages: 1,
            aspectRatio: '16:9',
            // Gemini may not support exact dimensions, uses aspect ratio
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini generation failed: ${response.status} - ${error}`);
    }

    const data = await response.json() as {
      generatedImages?: Array<{
        image?: {
          imageBytes?: string;
        };
      }>;
    };

    // Gemini returns base64 encoded images
    const imageData = data.generatedImages?.[0]?.image?.imageBytes;
    if (!imageData) {
      throw new Error('No image generated');
    }

    return {
      imageBuffer: Buffer.from(imageData, 'base64'),
      contentType: 'image/png',
    };
  }
}
