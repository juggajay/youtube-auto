import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { YouTubeClient } from '@/lib/nodes/publish/youtube/client';

// GET /api/youtube/channels - Get user's YouTube channels
export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokensCookie = cookieStore.get('youtube_tokens');

    if (!tokensCookie?.value) {
      return NextResponse.json(
        { error: 'YouTube not connected', connected: false },
        { status: 401 }
      );
    }

    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'YouTube OAuth not configured' },
        { status: 500 }
      );
    }

    const tokens = JSON.parse(tokensCookie.value);

    const client = new YouTubeClient({
      clientId,
      clientSecret,
      tokens,
      onTokenRefresh: async (newTokens) => {
        // Update the cookie with new tokens
        // Note: This won't work in a GET handler since we can't set cookies
        // In production, use a database to store tokens
        console.log('Tokens refreshed, need to update storage');
      },
    });

    const channels = await client.getChannels();

    return NextResponse.json({
      connected: true,
      channels,
    });

  } catch (error) {
    console.error('Failed to get YouTube channels:', error);

    // Check if it's an auth error
    if (String(error).includes('401') || String(error).includes('invalid_grant')) {
      return NextResponse.json(
        { error: 'YouTube session expired. Please reconnect.', connected: false },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get channels' },
      { status: 500 }
    );
  }
}
