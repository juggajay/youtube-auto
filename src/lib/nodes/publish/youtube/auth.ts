import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.readonly',
];

export interface YouTubeTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;  // Unix timestamp
}

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

/**
 * Create OAuth2 client
 */
export function createOAuth2Client(config: OAuthConfig) {
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );
}

/**
 * Generate authorization URL
 */
export function getAuthUrl(oauth2Client: ReturnType<typeof createOAuth2Client>): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',  // Force refresh token
  });
}

/**
 * Exchange code for tokens
 */
export async function exchangeCodeForTokens(
  oauth2Client: ReturnType<typeof createOAuth2Client>,
  code: string
): Promise<YouTubeTokens> {
  const { tokens } = await oauth2Client.getToken(code);

  return {
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token!,
    expiresAt: tokens.expiry_date!,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  oauth2Client: ReturnType<typeof createOAuth2Client>,
  refreshToken: string
): Promise<YouTubeTokens> {
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await oauth2Client.refreshAccessToken();

  return {
    accessToken: credentials.access_token!,
    refreshToken: refreshToken,  // Keep original refresh token
    expiresAt: credentials.expiry_date!,
  };
}

/**
 * Check if token needs refresh (5 min buffer)
 */
export function tokenNeedsRefresh(expiresAt: number): boolean {
  const bufferMs = 5 * 60 * 1000;  // 5 minutes
  return Date.now() > (expiresAt - bufferMs);
}

/**
 * Get valid tokens (refresh if needed)
 */
export async function getValidTokens(
  oauth2Client: ReturnType<typeof createOAuth2Client>,
  tokens: YouTubeTokens,
  onRefresh?: (newTokens: YouTubeTokens) => Promise<void>
): Promise<YouTubeTokens> {
  if (!tokenNeedsRefresh(tokens.expiresAt)) {
    return tokens;
  }

  const newTokens = await refreshAccessToken(oauth2Client, tokens.refreshToken);

  // Callback to persist new tokens
  await onRefresh?.(newTokens);

  return newTokens;
}

export { SCOPES };
