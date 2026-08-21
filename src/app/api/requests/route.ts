import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { RequestsService } from '@/lib/services/requests-service';
import { RequestFilters } from '@/types/requests';

/**
 * GET /api/requests
 * List & filter requests with pagination
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization') || undefined;
    const supabase = createSupabaseServerClient(authHeader);

    const filters: RequestFilters = {
      status: searchParams.get('status') ? (searchParams.get('status')?.split(',') as any) : undefined,
      skill_id: searchParams.get('skill_id') || undefined,
      category: searchParams.get('category') || undefined,
      creator_id: searchParams.get('creator_id') || undefined,
      search: searchParams.get('search') || undefined,
      minCredits: searchParams.get('minCredits') ? Number(searchParams.get('minCredits')) : undefined,
      maxCredits: searchParams.get('maxCredits') ? Number(searchParams.get('maxCredits')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
      orderBy: (searchParams.get('orderBy') as any) || undefined,
      orderDirection: (searchParams.get('orderDirection') as any) || undefined,
    };

    const response = await RequestsService.getRequests(filters, supabase);

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
 * POST /api/requests
 * Create a new help request for the authenticated user
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

    const { request, error } = await RequestsService.createRequest(user.id, body, supabase);

    if (error || !request) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ request }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
