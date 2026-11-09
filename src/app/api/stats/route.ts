import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

interface DecisionPayload {
  originalStoreId: string | null;
  originalStoreName: string;
  chosenStoreId: string;
  chosenStoreName: string;
  originalTotal: number;
  alternativeTotal: number;
  priceSavings: number;
  netSavings: number | null;
  transitCost: number | null;
  isWalkable: boolean | null;
  distanceMeters: number | null;
  itemCount: number;
  itemsMatched: number;
  itemsMissing: number;
  recommendation: string | null;
  deviceId: string | null;
}

export async function POST(request: Request) {
  let body: DecisionPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.originalStoreName || !body.chosenStoreName || body.priceSavings == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { error } = await getSupabaseAdmin()
    .from('savings_decisions')
    .insert({
      device_id: body.deviceId,
      original_store_id: body.originalStoreId,
      original_store_name: body.originalStoreName,
      chosen_store_id: body.chosenStoreId,
      chosen_store_name: body.chosenStoreName,
      original_total: body.originalTotal,
      alternative_total: body.alternativeTotal,
      price_savings: body.priceSavings,
      net_savings: body.netSavings,
      transit_cost: body.transitCost,
      is_walkable: body.isWalkable,
      distance_meters: body.distanceMeters,
      item_count: body.itemCount,
      items_matched: body.itemsMatched,
      items_missing: body.itemsMissing,
      recommendation: body.recommendation,
    });

  if (error) {
    return NextResponse.json({ error: 'Failed to log decision' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const admin = searchParams.get('admin');
  const secret = searchParams.get('key');
  const deviceId = searchParams.get('device');

  if (deviceId) {
    const { data, error } = await getSupabaseAdmin()
      .from('savings_decisions')
      .select('original_store_name, chosen_store_name, price_savings, net_savings, items_matched, item_count, created_at')
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch device stats' }, { status: 500 });
    }

    const rows = data ?? [];
    const deviceTotalSaved = rows.reduce((sum, r) => sum + Number(r.net_savings ?? r.price_savings), 0);

    return NextResponse.json({
      deviceTotalSaved: Math.round(deviceTotalSaved * 100) / 100,
      decisions: rows.map(r => ({
        originalStoreName: r.original_store_name,
        chosenStoreName: r.chosen_store_name,
        priceSavings: Number(r.price_savings),
        netSavings: r.net_savings != null ? Number(r.net_savings) : null,
        itemsMatched: Number(r.items_matched),
        itemCount: Number(r.item_count),
        date: new Date(r.created_at as string).toLocaleDateString(),
      })),
    });
  }

  const { data, error } = await getSupabaseAdmin()
    .from('savings_decisions')
    .select('price_savings, net_savings, original_total, original_store_name, chosen_store_name, is_walkable, distance_meters, items_matched, item_count, created_at');

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }

  if (data.length === 0) {
    return NextResponse.json({ totalSaved: 0, tripCount: 0, averageSavings: 0 });
  }

  const totalSaved = data.reduce((sum, r) => sum + Number(r.net_savings ?? r.price_savings), 0);
  const tripCount = data.length;
  const averageSavings = Math.round((totalSaved / tripCount) * 100) / 100;

  const base = {
    totalSaved: Math.round(totalSaved * 100) / 100,
    tripCount,
    averageSavings,
  };

  if (admin === 'true' && secret === process.env.CRON_SECRET) {
    const totalOriginal = data.reduce((sum, r) => sum + Number(r.original_total), 0);
    const avgPercentSaved = totalOriginal > 0
      ? Math.round((totalSaved / totalOriginal) * 10000) / 100
      : 0;

    const storeChoices: Record<string, number> = {};
    for (const r of data) {
      const name = r.chosen_store_name as string;
      storeChoices[name] = (storeChoices[name] ?? 0) + 1;
    }
    const topStores = Object.entries(storeChoices)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const walkable = data.filter(r => r.is_walkable === true).length;
    const withLocation = data.filter(r => r.is_walkable !== null).length;
    const walkablePercent = withLocation > 0
      ? Math.round((walkable / withLocation) * 10000) / 100
      : null;

    const distances = data.filter(r => r.distance_meters != null).map(r => Number(r.distance_meters));
    const avgDistance = distances.length > 0
      ? Math.round(distances.reduce((a, b) => a + b, 0) / distances.length)
      : null;

    const coverages = data.map(r => Number(r.items_matched) / Number(r.item_count));
    const avgCoverage = Math.round((coverages.reduce((a, b) => a + b, 0) / coverages.length) * 10000) / 100;

    return NextResponse.json({
      ...base,
      admin: {
        avgPercentSaved,
        topStores,
        walkablePercent,
        avgDistanceMeters: avgDistance,
        avgItemCoverage: avgCoverage,
        totalOriginalSpend: Math.round(totalOriginal * 100) / 100,
      },
    });
  }

  return NextResponse.json(base);
}
