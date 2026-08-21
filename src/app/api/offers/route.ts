import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { OffersService } from '@/lib/services/offers-service';

/**
 * GET /api/offers
 * List offers by request_id (for creators/providers) or user's own submitted offers
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization') || undefined;
    const supabase = createSupabaseServerClient(authHeader);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const requestId = searchParams.get('request_id');
    const providerId = searchParams.get('provider_id');
    const status = searchParams.get('status') as any;

    if (requestId) {
      const response = await OffersService.getOffersByRequestId(requestId, user.id, supabase);
      if (response.error) {
        return NextResponse.json({ error: response.error }, { status: 400 });
      }
      return NextResponse.json(response, { status: 200 });
    }

    // Default to viewing user's own offers
    const targetProviderId = providerId || user.id;
    const response = await OffersService.getUserOffers(
      targetProviderId,
      {
        status,
        limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
        offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
      },
      supabase
    );

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 400 });
    }

    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/offers
 * Submit a new offer on an open request
 */
export async function POST(req: NextRequest) {
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
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const { offer, error } = await OffersService.createOffer(user.id, body, supabase);

    if (error || !offer) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ offer }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
