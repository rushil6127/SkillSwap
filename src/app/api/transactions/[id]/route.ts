import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { TransactionService } from '@/lib/services/transaction-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/transactions/[id]
 * Fetch single transaction details (Participants only)
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

    const { transaction, error } = await TransactionService.getTransactionById(
      params.id,
      user.id,
      supabase
    );

    if (error || !transaction) {
      const status = error?.includes('Unauthorized') ? 403 : 404;
      return NextResponse.json({ error: error || 'Transaction not found.' }, { status });
    }

    return NextResponse.json({ transaction }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
