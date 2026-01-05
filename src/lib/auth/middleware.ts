import { createServerClient } from '@/lib/db/server';
import { NextRequest, NextResponse } from 'next/server';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export type AuthenticatedHandler = (
  request: NextRequest,
  user: AuthenticatedUser,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ): Promise<Response> => {
    try {
      const supabase = await createServerClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        email: user.email || '',
      };

      return handler(request, authenticatedUser, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Helper to get current user from request (for use in non-middleware contexts)
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
    };
  } catch {
    return null;
  }
}
