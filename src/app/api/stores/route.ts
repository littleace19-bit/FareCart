import { NextResponse } from 'next/server';
import { getStoresInViewport } from '@/lib/supabase/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

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

  const stores = await getStoresInViewport(swLng, swLat, neLng, neLat);
  return NextResponse.json(stores);
}
