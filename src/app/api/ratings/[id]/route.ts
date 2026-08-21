import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { RatingsService } from '@/lib/services/ratings-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/ratings/[id]
 * Fetch single rating details
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

    const { rating, error } = await RatingsService.getRatingById(params.id, supabase);

    if (error || !rating) {
      return NextResponse.json({ error: error || 'Rating not found.' }, { status: 404 });
    }

    return NextResponse.json({ rating }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
