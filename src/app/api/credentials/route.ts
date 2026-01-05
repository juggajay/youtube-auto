import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedUser } from '@/lib/auth/middleware';
import { credentialManager, CredentialProvider } from '@/lib/credentials';

// GET /api/credentials - List all credentials (without keys)
async function handleGet(
  request: NextRequest,
  user: AuthenticatedUser,
  _context: { params: Promise<Record<string, string>> }
) {
  const credentials = await credentialManager.listCredentials(user.id);
  return NextResponse.json({ credentials });
}

// POST /api/credentials - Add or update a credential
async function handlePost(
  request: NextRequest,
  user: AuthenticatedUser,
  _context: { params: Promise<Record<string, string>> }
) {
  const body = await request.json();
  const { provider, key } = body;

  if (!provider || !key) {
    return NextResponse.json(
      { error: 'Provider and key are required' },
      { status: 400 }
    );
  }

  const validProviders: CredentialProvider[] = ['elevenlabs', 'youtube', 'pexels', 'openai'];
  if (!validProviders.includes(provider)) {
    return NextResponse.json(
      { error: 'Invalid provider' },
      { status: 400 }
    );
  }

  const success = await credentialManager.setCredential(user.id, provider, key);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to save credential' },
      { status: 500 }
    );
  }

  // Validate the credential
  const isValid = await credentialManager.validateCredential(user.id, provider);

  return NextResponse.json({
    success: true,
    provider,
    isValid,
  });
}

// DELETE /api/credentials - Delete a credential
async function handleDelete(
  request: NextRequest,
  user: AuthenticatedUser,
  _context: { params: Promise<Record<string, string>> }
) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider') as CredentialProvider;

  if (!provider) {
    return NextResponse.json(
      { error: 'Provider is required' },
      { status: 400 }
    );
  }

  const success = await credentialManager.deleteCredential(user.id, provider);

  if (!success) {
    return NextResponse.json(
      { error: 'Failed to delete credential' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
export const DELETE = withAuth(handleDelete);
