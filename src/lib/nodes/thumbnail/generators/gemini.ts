import type { ThumbnailGenerator, GenerationParams, GenerationResult } from './index';

export class GeminiGenerator implements ThumbnailGenerator {
  name = 'gemini';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, options?: { model?: string }) {
    this.apiKey = apiKey;
    // Use Imagen 4.0 for high-quality image generation
    this.model = options?.model ?? 'imagen-4.0-generate-001';
  }

  async generate(params: GenerationParams): Promise<GenerationResult> {
    const { prompt } = params;

    // Gemini Imagen API - using the predict endpoint for Imagen models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:predict`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '16:9',
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini generation failed: ${response.status} - ${error}`);
    }

    const data = await response.json() as {
      predictions?: Array<{
        bytesBase64Encoded?: string;
      }>;
      // Alternative response format
      generatedImages?: Array<{
        image?: {
          imageBytes?: string;
        };
      }>;
    };

    // Try both response formats (predict vs generateImages)
    const imageData = data.predictions?.[0]?.bytesBase64Encoded
      ?? data.generatedImages?.[0]?.image?.imageBytes;

    if (!imageData) {
      throw new Error('No image generated');
    }

    return {
      imageBuffer: Buffer.from(imageData, 'base64'),
      contentType: 'image/png',
    };
  }
}
