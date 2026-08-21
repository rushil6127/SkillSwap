import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SwapsService } from '@/lib/services/swaps-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/swaps/[id]
 * Fetch single swap details (Participants only)
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = req.headers.get('authorization') || undefined;
    const supabase = createSupabaseServerClient(authHeader);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const { swap, error } = await SwapsService.getSwapById(params.id, user.id, supabase);

    if (error || !swap) {
      const status = error?.includes('Unauthorized') ? 403 : 404;
      return NextResponse.json({ error: error || 'Swap not found.' }, { status });
    }

    return NextResponse.json({ swap }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/swaps/[id]
 * Complete or Cancel a swap
 * Body: { action: 'complete' | 'cancel' }
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = req.headers.get('authorization') || undefined;
    const supabase = createSupabaseServerClient(authHeader);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const action = (body.action || body.status || '').toLowerCase();

    if (action === 'complete' || action === 'completed') {
      const result = await SwapsService.completeSwap(params.id, user.id, supabase);
      if (!result.success || result.error) {
        const status = result.error?.includes('Unauthorized') ? 403 : 400;
        return NextResponse.json({ error: result.error }, { status });
      }
      return NextResponse.json({ success: true, swap: result.swap }, { status: 200 });
    }

    if (action === 'cancel' || action === 'cancelled') {
      const result = await SwapsService.cancelSwap(params.id, user.id, supabase);
      if (!result.success || result.error) {
        const status = result.error?.includes('Unauthorized') ? 403 : 400;
        return NextResponse.json({ error: result.error }, { status });
      }
      return NextResponse.json({ success: true, swap: result.swap }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Invalid action. Supported actions are 'complete' or 'cancel'." },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
