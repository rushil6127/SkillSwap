import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { RatingsService } from '@/lib/services/ratings-service';
import { RatingFilters } from '@/types/ratings';

/**
 * GET /api/ratings
 * Retrieve ratings for a user or a specific swap
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

    const swapId = searchParams.get('swap_id');
    const targetUserId = searchParams.get('user_id') || (!swapId ? user.id : undefined);

    if (swapId) {
      const response = await RatingsService.getSwapRatings(swapId, supabase);
      if (response.error) {
        return NextResponse.json({ error: response.error }, { status: 400 });
      }
      return NextResponse.json(response, { status: 200 });
    }

    if (targetUserId) {
      const filters: RatingFilters = {
        limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
        offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
      };

      const response = await RatingsService.getUserRatings(targetUserId, filters, supabase);
      if (response.error) {
        return NextResponse.json({ error: response.error }, { status: 400 });
      }
      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Please specify user_id or swap_id parameter.' },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/ratings
 * Submit a rating for a completed swap (Reviewer must be authenticated participant)
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
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    // Reviewer ID is strictly derived from the authenticated server session
    const response = await RatingsService.createRating(user.id, body, supabase);

    if (response.error || !response.rating) {
      let status = 400;
      if (response.error?.includes('Unauthorized')) {
        status = 403;
      } else if (response.error?.includes('not found')) {
        status = 404;
      }
      return NextResponse.json({ error: response.error }, { status });
    }

    return NextResponse.json({ success: true, rating: response.rating }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
