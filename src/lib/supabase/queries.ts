import { getSupabaseAdmin } from './server';
import type { Store, StoreWithDistance, RawStore } from '@/types/store';
import type { Deal, NormalizedDeal } from '@/types/deal';

export async function upsertStores(stores: RawStore[]): Promise<void> {
  if (stores.length === 0) return;

  const rows = stores.map((s) => ({
    platform_id: s.platformId,
    source: s.source,
    name: s.name,
    address: s.address,
    city: s.city,
    state: s.state,
    zip_code: s.zipCode,
    phone: s.phone ?? null,
    chain_name: s.chainName ?? null,
    location: `SRID=4326;POINT(${s.lng} ${s.lat})`,
  }));

  const { error } = await getSupabaseAdmin()
    .from('stores')
    .upsert(rows, { onConflict: 'source,platform_id' });

  if (error) throw new Error(`upsertStores failed: ${error.message}`);
}

export async function upsertDeals(
  deals: NormalizedDeal[],
  storeIdMap: Map<string, string>
): Promise<void> {
  if (deals.length === 0) return;

  const rows = deals
    .filter((d) => storeIdMap.has(d.storePlatformId))
    .map((d) => ({
      store_id: storeIdMap.get(d.storePlatformId)!,
      external_id: d.externalId,
      source: d.source,
      name: d.name,
      price: d.price,
      original_price: d.originalPrice ?? null,
      unit_of_measure: d.unitOfMeasurement,
      category: d.category ?? null,
      image_url: d.imageUrl ?? null,
      is_future_deal: d.isFutureDeal,
      deal_start_date: d.dealStartDate,
      deal_end_date: d.dealEndDate,
    }));

  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await getSupabaseAdmin()
      .from('grocery_items')
      .upsert(batch, { onConflict: 'store_id,external_id,source' });

    if (error) throw new Error(`upsertDeals failed: ${error.message}`);
  }
}

export async function getStoresInViewport(
  swLng: number,
  swLat: number,
  neLng: number,
  neLat: number
): Promise<Store[]> {
  const { data, error } = await getSupabaseAdmin().rpc('stores_in_viewport', {
    sw_lng: swLng,
    sw_lat: swLat,
    ne_lng: neLng,
    ne_lat: neLat,
  });

  if (error) throw new Error(`stores_in_viewport failed: ${error.message}`);
  return data as Store[];
}

export async function getStoresWithinRadius(
  userLng: number,
  userLat: number,
  radiusMeters: number = 1609
): Promise<StoreWithDistance[]> {
  const { data, error } = await getSupabaseAdmin().rpc('stores_within_radius', {
    user_lng: userLng,
    user_lat: userLat,
    radius_meters: radiusMeters,
  });

  if (error) throw new Error(`stores_within_radius failed: ${error.message}`);
  return data as StoreWithDistance[];
}

export async function getNearestStores(
  userLng: number,
  userLat: number,
  maxResults: number = 10
): Promise<StoreWithDistance[]> {
  const { data, error } = await getSupabaseAdmin().rpc('nearest_stores', {
    user_lng: userLng,
    user_lat: userLat,
    max_results: maxResults,
  });

  if (error) throw new Error(`nearest_stores failed: ${error.message}`);
  return data as StoreWithDistance[];
}

export async function getDealsForStore(storeId: string): Promise<Deal[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await getSupabaseAdmin()
    .from('grocery_items')
    .select('*')
    .eq('store_id', storeId)
    .or(`deal_end_date.gte.${today},deal_end_date.is.null`)
    .order('category')
    .order('name');

  if (error) throw new Error(`getDealsForStore failed: ${error.message}`);
  return data as Deal[];
}

export async function getStoreIdMap(
  source: string
): Promise<Map<string, string>> {
  const { data, error } = await getSupabaseAdmin()
    .from('stores')
    .select('id, platform_id')
    .eq('source', source);

  if (error) throw new Error(`getStoreIdMap failed: ${error.message}`);

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    map.set(row.platform_id, row.id);
  }
  return map;
}
