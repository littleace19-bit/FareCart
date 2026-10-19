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

  const rows = deals.flatMap((d) => {
    const storeId = storeIdMap.get(d.storePlatformId);
    if (!storeId) return [];
    return [{
      store_id: storeId,
      external_id: d.externalId,
      source: d.source,
      name: d.name,
      price: d.price,
      original_price: d.originalPrice ?? null,
      unit_of_measure: d.unitOfMeasurement,
      category: d.category ?? null,
      image_url: d.imageUrl ?? null,
      sale_story: d.saleStory ?? null,
      flyer_id: d.flyerId ?? null,
      is_future_deal: d.isFutureDeal,
      deal_start_date: d.dealStartDate,
      deal_end_date: d.dealEndDate,
    }];
  });

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

  if (data.length > 0) return data as Deal[];

  const { data: store } = await getSupabaseAdmin()
    .from('stores')
    .select('chain_name')
    .eq('id', storeId)
    .single();

  if (!store?.chain_name) return [];

  const { data: flippStore } = await getSupabaseAdmin()
    .from('stores')
    .select('id')
    .eq('source', 'flipp')
    .eq('chain_name', store.chain_name)
    .limit(1)
    .single();

  if (!flippStore) return [];

  const { data: chainDeals, error: chainErr } = await getSupabaseAdmin()
    .from('grocery_items')
    .select('*')
    .eq('store_id', flippStore.id)
    .or(`deal_end_date.gte.${today},deal_end_date.is.null`)
    .order('category')
    .order('name');

  if (chainErr) throw new Error(`getDealsForStore chain fallback failed: ${chainErr.message}`);
  return chainDeals as Deal[];
}

export async function getFlippChainNames(): Promise<Set<string>> {
  const { data, error } = await getSupabaseAdmin()
    .from('stores')
    .select('chain_name')
    .eq('source', 'flipp')
    .not('chain_name', 'is', null);

  if (error) throw new Error(`getFlippChainNames failed: ${error.message}`);

  return new Set(
    (data ?? []).map((row) => row.chain_name as string)
  );
}

export interface SearchResult {
  deal_id: string;
  deal_name: string;
  price: number;
  original_price: number | null;
  unit_of_measure: string | null;
  sale_story: string | null;
  store_id: string;
  store_name: string;
  chain_name: string | null;
  address: string;
}

export async function searchDeals(query: string): Promise<SearchResult[]> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await getSupabaseAdmin()
    .from('grocery_items')
    .select(`
      id,
      name,
      price,
      original_price,
      unit_of_measure,
      sale_story,
      store_id,
      stores!inner (
        name,
        chain_name,
        address,
        is_active
      )
    `)
    .ilike('name', `%${query}%`)
    .or(`deal_end_date.gte.${today},deal_end_date.is.null`)
    .eq('stores.is_active', true)
    .order('price', { ascending: true })
    .limit(50);

  if (error) throw new Error(`searchDeals failed: ${error.message}`);

  const mapped = (data ?? []).map((row: Record<string, unknown>) => {
    const store = row.stores as Record<string, unknown>;
    return {
      deal_id: row.id as string,
      deal_name: row.name as string,
      price: row.price as number,
      original_price: row.original_price as number | null,
      unit_of_measure: row.unit_of_measure as string | null,
      sale_story: row.sale_story as string | null,
      store_id: row.store_id as string,
      store_name: store.name as string,
      chain_name: store.chain_name as string | null,
      address: store.address as string,
    };
  });

  const seen = new Map<string, SearchResult>();
  for (const item of mapped) {
    const key = `${item.store_id}:${item.deal_name.toLowerCase()}`;
    const existing = seen.get(key);
    if (!existing || item.price < existing.price) {
      seen.set(key, item);
    }
  }
  return [...seen.values()].sort((a, b) => a.price - b.price);
}

export async function getCategories(): Promise<string[]> {
  const { data, error } = await getSupabaseAdmin()
    .from('grocery_items')
    .select('category')
    .not('category', 'is', null)
    .limit(1000);

  if (error) throw new Error(`getCategories failed: ${error.message}`);

  const unique = new Set(
    (data ?? [])
      .map((row) => row.category as string)
      .filter(Boolean)
  );
  return [...unique].sort();
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
