import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { calculateCostBenefit } from '@/lib/cost-benefit/calculator';
import { haversineDistance } from '@/lib/geo';
import type { StoreAlternative } from '@/types/cost-benefit';

interface CartItem {
  name: string;
  price: number;
  quantity: number;
  storeId: string;
}

const NOISE_WORDS = new Set([
  'oz', 'lb', 'lbs', 'ct', 'pk', 'gal', 'ml', 'fl', 'qt', 'pt',
  'each', 'bag', 'box', 'can', 'jar', 'btl', 'roll', 'rolls',
  'count', 'piece', 'pieces', 'pack', 'package', 'of', 'the', 'and',
  'or', 'in', 'with', 'for', 'to', 'a', 'an',
]);

function extractKeywords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !NOISE_WORDS.has(w));
}

async function findMatchesForItem(item: CartItem) {
  const keywords = extractKeywords(item.name);
  if (keywords.length === 0) return [];

  const today = new Date().toISOString().split('T')[0];
  const searchTerms = keywords.slice(0, 2);

  let query = getSupabaseAdmin()
    .from('grocery_items')
    .select(`
      id, name, price, store_id,
      stores!inner (name, chain_name, address, lat, lng, is_active)
    `)
    .neq('store_id', item.storeId)
    .eq('stores.is_active', true)
    .or(`deal_end_date.gte.${today},deal_end_date.is.null`)
    .order('price', { ascending: true })
    .limit(100);

  for (const term of searchTerms) {
    query = query.filter('name', 'ilike', `%${term}%`);
  }

  const { data } = await query;

  const perStore = new Map<string, Record<string, unknown>>();
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    const storeId = row.store_id as string;
    if (!perStore.has(storeId)) {
      perStore.set(storeId, row);
    }
  }

  return [...perStore.values()];
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { items, userLat, userLng } = body as {
    items: CartItem[];
    userLat?: number;
    userLng?: number;
  };

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart items required' }, { status: 400 });
  }

  const allMatches = await Promise.all(items.map(findMatchesForItem));

  const stores = new Map<string, StoreAlternative>();

  for (let i = 0; i < items.length; i++) {
    const cartItem = items[i];
    const matches = allMatches[i];

    for (const match of matches) {
      const storeId = match.store_id as string;
      const storeData = match.stores as Record<string, unknown>;

      if (!stores.has(storeId)) {
        stores.set(storeId, {
          storeId,
          storeName: storeData.name as string,
          chainName: storeData.chain_name as string | null,
          address: storeData.address as string,
          lat: storeData.lat as number,
          lng: storeData.lng as number,
          matched: [],
          missingItems: [],
          alternativeTotal: 0,
          currentTotal: 0,
          savings: 0,
          itemCoverage: 0,
          distanceMeters: null,
          costBenefit: null,
        });
      }

      const storeAlt = stores.get(storeId)!;
      const matchedPrice = match.price as number;

      storeAlt.matched.push({
        cartItemName: cartItem.name,
        cartItemPrice: cartItem.price,
        matchedName: match.name as string,
        matchedPrice,
        quantity: cartItem.quantity,
        itemSavings: Math.round((cartItem.price - matchedPrice) * cartItem.quantity * 100) / 100,
      });
    }
  }

  for (const store of stores.values()) {
    const matchedNames = new Set(store.matched.map(m => m.cartItemName));
    store.missingItems = items
      .filter(item => !matchedNames.has(item.name))
      .map(item => item.name);

    store.alternativeTotal = Math.round(
      store.matched.reduce((sum, m) => sum + m.matchedPrice * m.quantity, 0) * 100
    ) / 100;
    store.currentTotal = Math.round(
      store.matched.reduce((sum, m) => sum + m.cartItemPrice * m.quantity, 0) * 100
    ) / 100;
    store.savings = Math.round((store.currentTotal - store.alternativeTotal) * 100) / 100;
    store.itemCoverage = store.matched.length / items.length;

    if (userLat != null && userLng != null) {
      const distance = haversineDistance(userLat, userLng, store.lat, store.lng);
      store.distanceMeters = Math.round(distance);
      store.costBenefit = calculateCostBenefit(store.savings, distance);
    }
  }

  const sorted = [...stores.values()]
    .filter(s => s.matched.length > 0)
    .sort((a, b) => {
      const aNet = a.costBenefit?.netSavings ?? a.savings;
      const bNet = b.costBenefit?.netSavings ?? b.savings;
      if (Math.abs(aNet - bNet) < 0.5) {
        return b.itemCoverage - a.itemCoverage;
      }
      return bNet - aNet;
    })
    .slice(0, 10);

  return NextResponse.json(sorted);
}
