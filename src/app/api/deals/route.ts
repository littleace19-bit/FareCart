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

  const deals = await getDealsForStore(storeId);
  return NextResponse.json(deals);
}
