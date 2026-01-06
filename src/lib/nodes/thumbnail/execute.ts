/**
 * Thumbnail Node Execution Logic
 *
 * Supports three source modes:
 * 1. 'existing' - Use an already uploaded element directly
 * 2. 'reference' - Generate with AI using reference images from @mentions
 * 3. 'fresh' - Generate with AI using prompt only (no references)
 */

import type { RunContext, StorageClient } from '../context';
import type { ExecutionOptions, NodeResult, ApiCallLog, CostEstimate } from '../base';
import type { ThumbnailOutput, ThumbnailOption, ThumbnailStyleGuide } from './types';
import type { ThumbnailNodeConfig, ThumbnailAspectRatio } from '@/types/nodes/thumbnail';
import type { ResolvedElement } from '@/types/database';
import { createGenerator, type GeneratorType } from './generators';

// ============================================================================
// Types
// ============================================================================

export interface ThumbnailExecuteInput {
  config: ThumbnailNodeConfig;
  context: RunContext;
  options?: ExecutionOptions;
}

export interface ThumbnailExecuteResult {
  imageUrl: string;
  imagePath: string;
  prompt?: string;
  sourceMode: ThumbnailNodeConfig['source'];
  referencesUsed?: string[];
  cost: CostEstimate;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse @mentions from a prompt string
 * @example parseAtMentions("Create with @logo and @mascot") => ["logo", "mascot"]
 */
export function parseAtMentions(prompt: string): string[] {
  if (!prompt) return [];

  const regex = /@([\w-]+)/g;
  const matches: string[] = [];
  let match;

  while ((match = regex.exec(prompt)) !== null) {
    matches.push(match[1]);
  }

  return [...new Set(matches)]; // Deduplicate
}

/**
 * Replace template variables in a prompt string
 * Supported variables: {title}, {topic}
 */
export function replaceVariables(
  prompt: string,
  context: { title?: string; topic?: string }
): string {
  if (!prompt) return '';

  let result = prompt;

  if (context.title) {
    result = result.replace(/\{title\}/gi, context.title);
  }

  if (context.topic) {
    result = result.replace(/\{topic\}/gi, context.topic);
  }

  return result;
}

/**
 * Resolve @mentions to element URLs by calling the resolve API
 */
export async function resolveReferences(
  tags: string[],
  userId: string,
  baseUrl?: string
): Promise<{ resolved: ResolvedElement[]; missing: string[] }> {
  if (tags.length === 0) {
    return { resolved: [], missing: [] };
  }

  // Use the internal API to resolve tags
  const url = baseUrl
    ? `${baseUrl}/api/elements/resolve`
    : '/api/elements/resolve';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // The auth middleware will handle user validation
      // In server-side context, we may need to pass auth differently
    },
    body: JSON.stringify({ tags }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to resolve references: ${response.status} - ${error}`);
  }

  const data = await response.json() as {
    resolved: ResolvedElement[];
    missing: string[];
  };

  return data;
}

/**
 * Fetch an existing element by ID
 */
export async function fetchExistingElement(
  elementId: string,
  userId: string,
  supabase: { from: (table: string) => unknown }
): Promise<{ url: string; path: string; name: string }> {
  // Type the supabase query chain properly
  const query = supabase.from('elements') as {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          single: () => Promise<{
            data: { id: string; name: string; storage_path: string } | null;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };

  const { data: element, error } = await query
    .select('id, name, storage_path')
    .eq('id', elementId)
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch element: ${error.message}`);
  }

  if (!element) {
    throw new Error(
      `Element not found: ${elementId}. Please check that the element exists and belongs to your account.`
    );
  }

  // Generate signed URL for the element
  const storage = supabase.from('elements') as unknown as {
    storage: {
      from: (bucket: string) => {
        createSignedUrl: (path: string, expiresIn: number) => Promise<{
          data: { signedUrl: string } | null;
          error: { message: string } | null;
        }>;
      };
    };
  };

  // Actually we need to use storage client properly
  // For now, construct a public URL path - the actual URL generation
  // will be handled by the caller who has access to the storage client
  return {
    url: element.storage_path, // Will be resolved to actual URL by caller
    path: element.storage_path,
    name: element.name,
  };
}

/**
 * Get aspect ratio dimensions
 */
export function getAspectRatioDimensions(
  aspectRatio: ThumbnailAspectRatio
): { width: number; height: number } {
  switch (aspectRatio) {
    case '16:9':
      return { width: 1280, height: 720 };
    case '1:1':
      return { width: 1080, height: 1080 };
    case '9:16':
      return { width: 720, height: 1280 };
    default:
      return { width: 1280, height: 720 };
  }
}

/**
 * Build mood-enhanced prompt
 */
export function buildMoodPrompt(
  basePrompt: string,
  mood?: ThumbnailNodeConfig['mood']
): string {
  if (!mood || mood === 'custom') {
    return basePrompt;
  }

  const moodEnhancements: Record<string, string> = {
    dramatic: 'cinematic lighting, bold contrast, high impact, intense atmosphere',
    playful: 'vibrant colors, fun and energetic, lighthearted mood',
    professional: 'clean, polished, corporate feel, trustworthy',
    minimalist: 'simple, clean, lots of whitespace, elegant',
  };

  const enhancement = moodEnhancements[mood];
  if (!enhancement) {
    return basePrompt;
  }

  return `${basePrompt}. Style: ${enhancement}`;
}

// ============================================================================
// Main Execution Logic
// ============================================================================

/**
 * Execute thumbnail generation based on source mode
 */
export async function executeThumbnail(
  input: ThumbnailExecuteInput
): Promise<NodeResult<ThumbnailExecuteResult>> {
  const { config, context, options } = input;
  const startedAt = new Date();
  const apiCalls: ApiCallLog[] = [];

  try {
    // Check for cancellation
    if (options?.signal?.aborted) {
      return {
        success: false,
        error: { code: 'CANCELLED', message: 'Cancelled by user', retryable: false },
      };
    }

    options?.onProgress?.({
      percent: 5,
      message: `Starting thumbnail generation (${config.source} mode)...`,
      stage: 'init',
    });

    let result: ThumbnailExecuteResult;

    switch (config.source) {
      case 'existing':
        result = await executeExistingMode(config, context, options);
        break;

      case 'reference':
        result = await executeReferenceMode(config, context, options, apiCalls);
        break;

      case 'fresh':
        result = await executeFreshMode(config, context, options, apiCalls);
        break;

      default:
        return {
          success: false,
          error: {
            code: 'INVALID_SOURCE',
            message: `Unknown source mode: ${config.source}`,
            retryable: false,
          },
        };
    }

    options?.onProgress?.({
      percent: 100,
      message: 'Thumbnail ready',
      stage: 'done',
    });

    const completedAt = new Date();

    return {
      success: true,
      output: result,
      metadata: {
        startedAt,
        completedAt,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        actualCost: result.cost,
        apiCalls,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: mapExecutionError(error),
    };
  }
}

// ============================================================================
// Source Mode Implementations
// ============================================================================

/**
 * Execute 'existing' mode - use an already uploaded element
 */
async function executeExistingMode(
  config: ThumbnailNodeConfig,
  context: RunContext,
  options?: ExecutionOptions
): Promise<ThumbnailExecuteResult> {
  if (!config.existingElementId) {
    throw new Error(
      'existingElementId is required when source is "existing". ' +
      'Please select an element from your library.'
    );
  }

  options?.onProgress?.({
    percent: 30,
    message: 'Fetching existing element...',
    stage: 'fetch',
  });

  // Fetch element from database
  const db = context.services.db as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          eq: (column: string, value: string) => {
            single: () => Promise<{
              data: { id: string; name: string; storage_path: string } | null;
              error: { message: string } | null;
            }>;
          };
        };
      };
    };
  };

  const { data: element, error } = await db
    .from('elements')
    .select('id, name, storage_path')
    .eq('id', config.existingElementId)
    .eq('user_id', context.userId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch element: ${error.message}`);
  }

  if (!element) {
    throw new Error(
      `Element not found: ${config.existingElementId}. ` +
      'The element may have been deleted or you may not have access to it. ' +
      'Please select a different element from your library.'
    );
  }

  options?.onProgress?.({
    percent: 60,
    message: 'Generating URL...',
    stage: 'url',
  });

  // Get public URL for the element
  const { data: urlData } = context.services.storage.getPublicUrl(element.storage_path);

  options?.onProgress?.({
    percent: 90,
    message: 'Element ready',
    stage: 'complete',
  });

  return {
    imageUrl: urlData.publicUrl,
    imagePath: element.storage_path,
    sourceMode: 'existing',
    cost: {
      estimated: false,
      breakdown: [],
      total: 0, // No API cost for existing elements
      confidence: 'high',
    },
  };
}

/**
 * Execute 'reference' mode - generate with AI using reference images
 */
async function executeReferenceMode(
  config: ThumbnailNodeConfig,
  context: RunContext,
  options: ExecutionOptions | undefined,
  apiCalls: ApiCallLog[]
): Promise<ThumbnailExecuteResult> {
  if (!config.prompt) {
    throw new Error(
      'prompt is required when source is "reference". ' +
      'Please provide a prompt with @mentions to reference elements.'
    );
  }

  options?.onProgress?.({
    percent: 10,
    message: 'Parsing @mentions...',
    stage: 'parse',
  });

  // Parse @mentions from prompt
  const tags = parseAtMentions(config.prompt);

  if (tags.length === 0) {
    throw new Error(
      'No @mentions found in prompt. For reference mode, include at least one ' +
      '@mention (e.g., "@logo", "@mascot") to use as a reference image. ' +
      'If you want to generate without references, use "fresh" mode instead.'
    );
  }

  options?.onProgress?.({
    percent: 20,
    message: `Resolving ${tags.length} reference(s)...`,
    stage: 'resolve',
  });

  // Resolve @mentions to element URLs
  const { resolved, missing } = await resolveReferences(tags, context.userId);

  if (missing.length > 0) {
    context.services.logger.warn(`Some @mentions could not be resolved: ${missing.join(', ')}`, {
      missing,
      resolved: resolved.map((r) => r.tag),
    });
  }

  if (resolved.length === 0) {
    throw new Error(
      `No referenced elements found. The following @mentions could not be resolved: ${missing.join(', ')}. ` +
      'Please check that these elements exist in your library with matching tags.'
    );
  }

  // Get reference image URLs
  const referenceUrls = resolved.map((r) => r.element.url);
  const referencesUsed = resolved.map((r) => r.tag);

  options?.onProgress?.({
    percent: 40,
    message: 'Preparing prompt...',
    stage: 'prompt',
  });

  // Get title and topic from context
  const scriptOutput = context.previousOutputs.script;
  const triggerOutput = context.previousOutputs.trigger;

  const title = scriptOutput?.title ?? '';
  const topic = triggerOutput?.topic ?? scriptOutput?.title ?? '';

  // Replace variables in prompt
  let processedPrompt = replaceVariables(config.prompt, { title, topic });

  // Remove @mentions from the prompt (they've been resolved to images)
  processedPrompt = processedPrompt.replace(/@[\w-]+/g, '').trim();

  // Add mood enhancement
  processedPrompt = buildMoodPrompt(processedPrompt, config.mood);

  // Add aspect ratio to prompt
  const dimensions = getAspectRatioDimensions(config.aspectRatio);
  processedPrompt = `${processedPrompt}. Aspect ratio: ${config.aspectRatio}, YouTube thumbnail style, high quality, eye-catching`;

  options?.onProgress?.({
    percent: 50,
    message: 'Generating with AI...',
    stage: 'generate',
  });

  // Generate with Gemini Imagen (with reference images)
  const result = await generateWithReferences(
    processedPrompt,
    referenceUrls,
    dimensions,
    context,
    apiCalls
  );

  options?.onProgress?.({
    percent: 80,
    message: 'Uploading result...',
    stage: 'upload',
  });

  // Upload generated image to storage
  const storagePath = `runs/${context.runId}/thumbnails/generated_${Date.now()}.png`;
  const imageUrl = await uploadImage(
    context.services.storage,
    storagePath,
    result.imageBuffer,
    result.contentType
  );

  return {
    imageUrl,
    imagePath: storagePath,
    prompt: processedPrompt,
    sourceMode: 'reference',
    referencesUsed,
    cost: {
      estimated: false,
      breakdown: [{
        service: 'gemini',
        units: 1,
        unitType: 'images',
        cost: 0.04,
      }],
      total: 0.04,
      confidence: 'high',
    },
  };
}

/**
 * Execute 'fresh' mode - generate with AI using prompt only
 */
async function executeFreshMode(
  config: ThumbnailNodeConfig,
  context: RunContext,
  options: ExecutionOptions | undefined,
  apiCalls: ApiCallLog[]
): Promise<ThumbnailExecuteResult> {
  if (!config.prompt) {
    throw new Error(
      'prompt is required when source is "fresh". ' +
      'Please provide a description of the thumbnail you want to generate.'
    );
  }

  options?.onProgress?.({
    percent: 20,
    message: 'Preparing prompt...',
    stage: 'prompt',
  });

  // Get title and topic from context
  const scriptOutput = context.previousOutputs.script;
  const triggerOutput = context.previousOutputs.trigger;

  const title = scriptOutput?.title ?? '';
  const topic = triggerOutput?.topic ?? scriptOutput?.title ?? '';

  // Replace variables in prompt
  let processedPrompt = replaceVariables(config.prompt, { title, topic });

  // Add mood enhancement
  processedPrompt = buildMoodPrompt(processedPrompt, config.mood);

  // Add aspect ratio to prompt
  const dimensions = getAspectRatioDimensions(config.aspectRatio);
  processedPrompt = `${processedPrompt}. Aspect ratio: ${config.aspectRatio}, YouTube thumbnail style, high quality, eye-catching`;

  options?.onProgress?.({
    percent: 40,
    message: 'Generating with AI...',
    stage: 'generate',
  });

  // Generate with Gemini Imagen (no references)
  const result = await generateFresh(
    processedPrompt,
    dimensions,
    context,
    apiCalls
  );

  options?.onProgress?.({
    percent: 80,
    message: 'Uploading result...',
    stage: 'upload',
  });

  // Upload generated image to storage
  const storagePath = `runs/${context.runId}/thumbnails/generated_${Date.now()}.png`;
  const imageUrl = await uploadImage(
    context.services.storage,
    storagePath,
    result.imageBuffer,
    result.contentType
  );

  return {
    imageUrl,
    imagePath: storagePath,
    prompt: processedPrompt,
    sourceMode: 'fresh',
    cost: {
      estimated: false,
      breakdown: [{
        service: 'gemini',
        units: 1,
        unitType: 'images',
        cost: 0.04,
      }],
      total: 0.04,
      confidence: 'high',
    },
  };
}

// ============================================================================
// Generation Helpers
// ============================================================================

interface GenerationResult {
  imageBuffer: Buffer;
  contentType: string;
  revisedPrompt?: string;
}

/**
 * Generate thumbnail with reference images using Gemini
 */
async function generateWithReferences(
  prompt: string,
  referenceUrls: string[],
  dimensions: { width: number; height: number },
  context: RunContext,
  apiCalls: ApiCallLog[]
): Promise<GenerationResult> {
  // Get Gemini API key
  const apiKey = await context.services.credentials.get('gemini');

  if (!apiKey) {
    throw new Error(
      'Gemini API key not configured. Please add your Gemini API key in settings.'
    );
  }

  const requestedAt = new Date();

  // For Gemini Imagen with references, we need to:
  // 1. Download reference images
  // 2. Convert to base64
  // 3. Include in the request

  // Download reference images
  const referenceImages: Array<{ mimeType: string; data: string }> = [];

  for (const url of referenceUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const contentType = response.headers.get('content-type') || 'image/png';
        referenceImages.push({
          mimeType: contentType,
          data: base64,
        });
      }
    } catch (error) {
      context.services.logger.warn(`Failed to download reference image: ${url}`, { error });
    }
  }

  // Use Gemini's multimodal model for image generation with references
  // The Imagen API supports reference images through the editImage endpoint
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        instances: [{
          prompt,
          // Include reference images if available
          referenceImages: referenceImages.map((img) => ({
            referenceImage: {
              bytesBase64Encoded: img.data,
            },
            referenceType: 1, // STYLE_IMAGE_REFERENCE
          })),
        }],
        parameters: {
          sampleCount: 1,
          aspectRatio: dimensions.width > dimensions.height ? '16:9' :
                       dimensions.width < dimensions.height ? '9:16' : '1:1',
        },
      }),
    }
  );

  const respondedAt = new Date();

  apiCalls.push({
    service: 'gemini',
    endpoint: '/predict',
    method: 'POST',
    requestedAt,
    respondedAt,
    durationMs: respondedAt.getTime() - requestedAt.getTime(),
    status: response.status,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini generation failed: ${response.status} - ${error}`);
  }

  const data = await response.json() as {
    predictions?: Array<{ bytesBase64Encoded?: string }>;
  };

  const imageData = data.predictions?.[0]?.bytesBase64Encoded;

  if (!imageData) {
    throw new Error('No image generated by Gemini');
  }

  return {
    imageBuffer: Buffer.from(imageData, 'base64'),
    contentType: 'image/png',
  };
}

/**
 * Generate thumbnail without references using Gemini
 */
async function generateFresh(
  prompt: string,
  dimensions: { width: number; height: number },
  context: RunContext,
  apiCalls: ApiCallLog[]
): Promise<GenerationResult> {
  // Get Gemini API key
  const apiKey = await context.services.credentials.get('gemini');

  if (!apiKey) {
    throw new Error(
      'Gemini API key not configured. Please add your Gemini API key in settings.'
    );
  }

  // Create generator
  const generator = createGenerator('gemini', apiKey, {
    model: 'imagen-4.0-generate-001',
  });

  const requestedAt = new Date();

  const result = await generator.generate({
    prompt,
    width: dimensions.width,
    height: dimensions.height,
  });

  const respondedAt = new Date();

  apiCalls.push({
    service: 'gemini',
    endpoint: '/predict',
    method: 'POST',
    requestedAt,
    respondedAt,
    durationMs: respondedAt.getTime() - requestedAt.getTime(),
    status: 200,
  });

  return result;
}

/**
 * Upload image to storage
 */
async function uploadImage(
  storage: StorageClient,
  path: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const { error } = await storage.upload(path, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data: urlData } = storage.getPublicUrl(path);
  return urlData.publicUrl;
}

/**
 * Map execution errors to structured format
 */
function mapExecutionError(error: unknown): {
  code: string;
  message: string;
  retryable: boolean;
} {
  const message = String(error);

  if (message.includes('INVALID_API_KEY') || message.includes('401')) {
    return { code: 'INVALID_CREDENTIALS', message: 'Invalid API key', retryable: false };
  }
  if (message.includes('content_policy') || message.includes('safety')) {
    return { code: 'CONTENT_POLICY', message: 'Content blocked by safety filter', retryable: false };
  }
  if (message.includes('rate') || message.includes('429')) {
    return { code: 'RATE_LIMIT', message: 'Rate limit exceeded', retryable: true };
  }
  if (message.includes('quota')) {
    return { code: 'QUOTA_EXCEEDED', message: 'API quota exceeded', retryable: false };
  }
  if (message.includes('Element not found')) {
    return { code: 'ELEMENT_NOT_FOUND', message: message, retryable: false };
  }
  if (message.includes('No @mentions found')) {
    return { code: 'NO_REFERENCES', message: message, retryable: false };
  }

  return { code: 'THUMBNAIL_ERROR', message: String(error), retryable: true };
}

// ============================================================================
// Legacy Adapter
// ============================================================================

/**
 * Convert legacy ThumbnailOutput format to new single-result format
 */
export function convertToLegacyOutput(
  result: ThumbnailExecuteResult,
  styleGuide: ThumbnailStyleGuide
): ThumbnailOutput {
  const option: ThumbnailOption = {
    id: 'generated_1',
    imageUrl: result.imageUrl,
    imagePath: result.imagePath,
    prompt: result.prompt ?? '',
    metadata: {
      generator: 'gemini' as const,
      dimensions: getAspectRatioDimensions(
        result.sourceMode === 'existing' ? '16:9' : '16:9'
      ),
      hasTextOverlay: false,
    },
  };

  return {
    options: [option],
    selectedId: option.id,
    styleGuideUsed: styleGuide,
  };
}
