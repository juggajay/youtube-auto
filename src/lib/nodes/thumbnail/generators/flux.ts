import type { ThumbnailGenerator, GenerationParams, GenerationResult } from './index';

export class FluxGenerator implements ThumbnailGenerator {
  name = 'flux';
  private apiKey: string;

  constructor(apiKey: string, _options?: Record<string, unknown>) {
    this.apiKey = apiKey;
  }

  async generate(params: GenerationParams): Promise<GenerationResult> {
    const { prompt, width, height } = params;

    // Start prediction
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.apiKey}`,
      },
      body: JSON.stringify({
        version: 'black-forest-labs/flux-schnell',  // or flux-dev for higher quality
        input: {
          prompt,
          width,
          height,
          num_outputs: 1,
        },
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`Flux prediction failed: ${createResponse.status}`);
    }

    interface PredictionResult {
      status: string;
      urls: { get: string };
      output?: string[];
      error?: string;
    }

    let result = await createResponse.json() as PredictionResult;

    // Poll for completion
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const pollResponse = await fetch(result.urls.get, {
        headers: { 'Authorization': `Token ${this.apiKey}` },
      });
      result = await pollResponse.json() as PredictionResult;
    }

    if (result.status === 'failed') {
      throw new Error(`Flux generation failed: ${result.error}`);
    }

    // Download the image
    const imageUrl = result.output?.[0];
    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();

    return {
      imageBuffer: Buffer.from(arrayBuffer),
      contentType: 'image/webp',
    };
  }
}
