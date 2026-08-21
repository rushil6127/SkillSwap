import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TransactionService } from '@/lib/services/transaction-service';
import { TransactionFilters } from '@/types/transactions';

/**
 * GET /api/transactions
 * Retrieve transaction history for the authenticated user
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

    const filters: TransactionFilters = {
      type: (searchParams.get('type') as any) || 'all',
      swap_id: searchParams.get('swap_id') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
    };

    const response = await TransactionService.getUserTransactions(user.id, filters, supabase);

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 400 });
    }

    return NextResponse.json(response, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
