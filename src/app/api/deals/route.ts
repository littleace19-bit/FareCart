import { NextResponse } from 'next/server';
import { getDealsForStore } from '@/lib/supabase/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get('store_id');

  if (!storeId) {
    return NextResponse.json(
      { error: 'Missing store_id parameter' },
      { status: 400 }
    );
  }

  try {
    const deals = await getDealsForStore(storeId);
    return NextResponse.json(deals);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
