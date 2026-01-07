import { NextResponse } from 'next/server';
import { createOAuth2Client, exchangeCodeForTokens } from '@/lib/nodes/publish/youtube/auth';

// GET /api/youtube/auth/callback - OAuth callback from Google
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) {
    console.error('YouTube OAuth error:', error);
    return NextResponse.redirect(`${appUrl}/settings?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${appUrl}/settings?error=no_code`);
  }

  try {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/auth/callback';

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(`${appUrl}/settings?error=oauth_not_configured`);
    }

    const oauth2Client = createOAuth2Client({
      clientId,
      clientSecret,
      redirectUri,
    });

    const tokens = await exchangeCodeForTokens(oauth2Client, code);

    // In production, store tokens in database (encrypted)
    // For now, we'll store in a cookie or return to client
    // The actual storage implementation depends on your auth setup

    // Create a response that stores the tokens
    // This should be adapted to your authentication system
    const response = NextResponse.redirect(`${appUrl}/settings?youtube=connected`);

    // Set tokens in a secure HTTP-only cookie (for demo purposes)
    // In production, encrypt and store in database with user association
    response.cookies.set('youtube_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;

  } catch (err) {
    console.error('YouTube OAuth callback error:', err);
    return NextResponse.redirect(`${appUrl}/settings?error=oauth_failed`);
  }
}
