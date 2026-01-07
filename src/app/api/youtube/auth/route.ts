import { NextResponse } from 'next/server';
import { createOAuth2Client, SCOPES } from '@/lib/nodes/publish/youtube/auth';

// GET /api/youtube/auth?action=connect - Redirect to Google OAuth
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action !== 'connect') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/auth/callback';

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'YouTube OAuth not configured' },
      { status: 500 }
    );
  }

  const oauth2Client = createOAuth2Client({
    clientId,
    clientSecret,
    redirectUri,
  });

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });

  return NextResponse.redirect(authUrl);
}
