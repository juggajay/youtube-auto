import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/server';
import { getUsageSummary } from '@/lib/billing/usage';

interface UsageResponse {
  success: boolean;
  usage?: any;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<UsageResponse>> {
  try {
    // Get authenticated user
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get usage summary
    const usage = await getUsageSummary(user.id);

    if (!usage) {
      return NextResponse.json(
        { success: false, error: 'No active subscription' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      usage,
    });
  } catch (error) {
    console.error('Usage fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
