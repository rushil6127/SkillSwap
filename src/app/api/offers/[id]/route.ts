import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { OffersService } from '@/lib/services/offers-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/offers/[id]
 * Fetch single offer details
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

    const { offer, error } = await OffersService.getOfferById(params.id, user.id, supabase);

    if (error || !offer) {
      const status = error?.includes('Unauthorized') ? 403 : 404;
      return NextResponse.json({ error: error || 'Offer not found.' }, { status });
    }

    return NextResponse.json({ offer }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/offers/[id]
 * Accept or Reject an offer (Request Creator only)
 * Body: { action: 'accept' | 'reject' } OR { status: 'ACCEPTED' | 'REJECTED' }
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

    if (action === 'accept' || action === 'accepted') {
      const result = await OffersService.acceptOffer(params.id, user.id, supabase);
      if (!result.success || result.error) {
        const status = result.error?.includes('Unauthorized') ? 403 : 400;
        return NextResponse.json({ error: result.error }, { status });
      }
      return NextResponse.json({ success: true, offer: result.offer }, { status: 200 });
    }

    if (action === 'reject' || action === 'rejected') {
      const result = await OffersService.rejectOffer(params.id, user.id, supabase);
      if (!result.success || result.error) {
        const status = result.error?.includes('Unauthorized') ? 403 : 400;
        return NextResponse.json({ error: result.error }, { status });
      }
      return NextResponse.json({ success: true, offer: result.offer }, { status: 200 });
    }

    return NextResponse.json(
      { error: "Invalid action. Supported actions are 'accept' or 'reject'." },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
