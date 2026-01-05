import { NextRequest, NextResponse } from 'next/server';

interface YouTubeThumbnailRequest {
  url: string;
}

interface YouTubeThumbnailResponse {
  success: boolean;
  thumbnailUrl?: string;
  videoId?: string;
  title?: string;
  error?: string;
}

// Extract video ID from various YouTube URL formats
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export async function POST(request: NextRequest): Promise<NextResponse<YouTubeThumbnailResponse>> {
  try {
    const body: YouTubeThumbnailRequest = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Option 1: Use SerpApi if configured
    const serpApiKey = process.env.SERP_API_KEY;
    if (serpApiKey) {
      const serpUrl = new URL('https://serpapi.com/search');
      serpUrl.searchParams.set('engine', 'youtube_video');
      serpUrl.searchParams.set('v', videoId);
      serpUrl.searchParams.set('api_key', serpApiKey);

      const serpResponse = await fetch(serpUrl.toString());
      if (serpResponse.ok) {
        const data = await serpResponse.json() as {
          video_results?: {
            thumbnail?: { static?: string };
            title?: string;
          };
        };

        const thumbnailUrl = data.video_results?.thumbnail?.static;
        if (thumbnailUrl) {
          return NextResponse.json({
            success: true,
            thumbnailUrl,
            videoId,
            title: data.video_results?.title,
          });
        }
      }
    }

    // Option 2: Direct YouTube thumbnail URL (maxresdefault is highest quality)
    // Try different quality levels
    const qualityLevels = ['maxresdefault', 'sddefault', 'hqdefault', 'mqdefault', 'default'];

    for (const quality of qualityLevels) {
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;

      // Check if this quality level exists
      const checkResponse = await fetch(thumbnailUrl, { method: 'HEAD' });
      if (checkResponse.ok) {
        // Verify it's not the placeholder (120x90 is the placeholder size for non-existent videos)
        const contentLength = checkResponse.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 1000) {
          return NextResponse.json({
            success: true,
            thumbnailUrl,
            videoId,
          });
        }
      }
    }

    return NextResponse.json(
      { success: false, error: 'Could not fetch thumbnail' },
      { status: 404 }
    );
  } catch (error) {
    console.error('YouTube thumbnail error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
