import { NextResponse } from 'next/server';
import { getStoresInViewport, getFlippChainNames } from '@/lib/supabase/queries';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const storeId = searchParams.get('id');
  if (storeId) {
    const { data, error } = await getSupabaseAdmin()
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  const swLng = parseFloat(searchParams.get('sw_lng') ?? '');
  const swLat = parseFloat(searchParams.get('sw_lat') ?? '');
  const neLng = parseFloat(searchParams.get('ne_lng') ?? '');
  const neLat = parseFloat(searchParams.get('ne_lat') ?? '');

  if ([swLng, swLat, neLng, neLat].some(isNaN)) {
    return NextResponse.json(
      { error: 'Missing or invalid viewport bounds (sw_lng, sw_lat, ne_lng, ne_lat)' },
      { status: 400 }
    );
  }

  try {
    const [stores, flippChains] = await Promise.all([
      getStoresInViewport(swLng, swLat, neLng, neLat),
      getFlippChainNames(),
    ]);

    const enriched = stores.map((store) => ({
      ...store,
      has_deals:
        store.source === 'flipp' ||
        (store.chain_name !== null && flippChains.has(store.chain_name)),
    }));

    return NextResponse.json(enriched);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
