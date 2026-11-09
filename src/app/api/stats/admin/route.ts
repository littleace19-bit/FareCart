import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from('savings_decisions')
    .select('price_savings, net_savings, original_total, original_store_name, chosen_store_name, is_walkable, distance_meters, items_matched, item_count, created_at');

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }

  if (data.length === 0) {
    return NextResponse.json({ totalSaved: 0, tripCount: 0, averageSavings: 0, admin: { avgPercentSaved: 0, topStores: [], walkablePercent: null, avgDistanceMeters: null, avgItemCoverage: 0, totalOriginalSpend: 0 } });
  }

  const totalSaved = data.reduce((sum, r) => sum + Number(r.net_savings ?? r.price_savings), 0);
  const tripCount = data.length;
  const averageSavings = Math.round((totalSaved / tripCount) * 100) / 100;

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
    totalSaved: Math.round(totalSaved * 100) / 100,
    tripCount,
    averageSavings,
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
