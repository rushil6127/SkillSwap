import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { RequestsService } from '@/lib/services/requests-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/requests/[id]
 * Fetch single request by ID
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = req.headers.get('authorization') || undefined;
    const supabase = createSupabaseServerClient(authHeader);

    const { request, error } = await RequestsService.getRequestById(params.id, supabase);

    if (error || !request) {
      return NextResponse.json({ error: error || 'Request not found.' }, { status: 404 });
    }

    return NextResponse.json({ request }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PATCH /api/requests/[id]
 * Update own request
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
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const { request, error } = await RequestsService.updateRequest(params.id, user.id, body, supabase);

    if (error || !request) {
      const status = error?.includes('Unauthorized') ? 403 : 400;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ request }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/requests/[id]
 * Cancel or Delete own request
 * Query parameter ?action=cancel (default: delete)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const authHeader = req.headers.get('authorization') || undefined;
    const supabase = createSupabaseServerClient(authHeader);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    if (action === 'cancel') {
      const { success, request, error } = await RequestsService.cancelRequest(params.id, user.id, supabase);
      if (!success || error) {
        const status = error?.includes('Unauthorized') ? 403 : 400;
        return NextResponse.json({ error }, { status });
      }
      return NextResponse.json({ success: true, request }, { status: 200 });
    }

    // Default: delete
    const { success, error } = await RequestsService.deleteRequest(params.id, user.id, supabase);
    if (!success || error) {
      const status = error?.includes('Unauthorized') ? 403 : 400;
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json({ success: true, message: 'Request deleted successfully.' }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
