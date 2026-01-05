import { NextRequest, NextResponse } from 'next/server';
import { withUsageTracking } from '@/lib/billing/middleware';

// Types for request/response
interface GenerateRequest {
  prompt: string;
  aspectRatio: '16:9' | '1:1' | '4:3' | '9:16';
  references?: string[]; // Base64 image data for reference images
}

interface GenerateResponse {
  success: boolean;
  imageBase64?: string;
  error?: string;
  usageWarning?: string;
}

// Aspect ratio to Imagen format
const aspectRatioMap: Record<string, string> = {
  '16:9': '16:9',
  '1:1': '1:1',
  '4:3': '4:3',
  '9:16': '9:16',
};

// Wrap handler with usage tracking middleware
export const POST = withUsageTracking('thumbnail_generation', async (
  request: NextRequest,
  context: { user: any; subscription: any }
): Promise<NextResponse<GenerateResponse>> => {
  try {
    const body: GenerateRequest = await request.json();
    const { prompt, aspectRatio, references } = body;

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Build the full prompt with reference context
    let fullPrompt = prompt;
    if (references && references.length > 0) {
      fullPrompt = `Using the provided reference images as style/composition guidance: ${prompt}`;
    }

    // Call Imagen 4.0 API
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          instances: [{ prompt: fullPrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: aspectRatioMap[aspectRatio] || '16:9',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Imagen API error:', errorText);
      return NextResponse.json(
        { success: false, error: `Generation failed: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json() as {
      predictions?: Array<{ bytesBase64Encoded?: string }>;
      generatedImages?: Array<{ image?: { imageBytes?: string } }>;
    };

    // Handle both response formats
    const imageData =
      data.predictions?.[0]?.bytesBase64Encoded ??
      data.generatedImages?.[0]?.image?.imageBytes;

    if (!imageData) {
      return NextResponse.json(
        { success: false, error: 'No image generated' },
        { status: 500 }
      );
    }

    // Check if response has overage warning
    const isOverage = request.headers.get('X-VidFlow-Overage') === 'true';

    return NextResponse.json({
      success: true,
      imageBase64: imageData,
      ...(isOverage && {
        usageWarning: 'You have exceeded your plan\'s included credits. Additional charges will apply.'
      }),
    });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
