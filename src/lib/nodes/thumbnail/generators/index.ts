import { GeminiGenerator } from './gemini';
import { DalleGenerator } from './dalle';
import { FluxGenerator } from './flux';

export interface GenerationParams {
  prompt: string;
  width: number;
  height: number;
  style?: string;
}

export interface GenerationResult {
  imageBuffer: Buffer;
  contentType: string;
  revisedPrompt?: string;    // Some models revise the prompt
}

export interface ThumbnailGenerator {
  name: string;
  generate(params: GenerationParams): Promise<GenerationResult>;
}

export type GeneratorType = 'gemini' | 'dalle' | 'flux';

export function createGenerator(
  type: GeneratorType,
  apiKey: string,
  options?: Record<string, unknown>
): ThumbnailGenerator {
  switch (type) {
    case 'gemini':
      return new GeminiGenerator(apiKey, options as { model?: string });
    case 'dalle':
      return new DalleGenerator(apiKey, options as { model?: string; quality?: 'standard' | 'hd' });
    case 'flux':
      return new FluxGenerator(apiKey, options);
    default:
      throw new Error(`Unknown generator type: ${type}`);
  }
}

// Re-export generators for direct use
export { GeminiGenerator } from './gemini';
export { DalleGenerator } from './dalle';
export { FluxGenerator } from './flux';
