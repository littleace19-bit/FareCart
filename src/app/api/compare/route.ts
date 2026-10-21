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
  unitOfMeasure: string | null;
}

const NOISE_WORDS = new Set([
  'oz', 'lb', 'lbs', 'ct', 'pk', 'gal', 'ml', 'fl', 'qt', 'pt',
  'each', 'bag', 'box', 'can', 'jar', 'btl', 'roll', 'rolls',
  'count', 'piece', 'pieces', 'pack', 'package', 'of', 'the', 'and',
  'or', 'in', 'with', 'for', 'to', 'a', 'an', 'fresh', 'frozen',
  'organic', 'natural', 'premium', 'value', 'great', 'best', 'select',
  'choice', 'family', 'size', 'large', 'small', 'medium', 'jumbo',
  'original', 'classic', 'regular', 'lite', 'light', 'free', 'low',
]);

const BRAND_WORDS = new Set([
  'perdue', 'tyson', 'foster', 'farms', 'barilla', 'ronzoni', 'mueller',
  'delmonte', 'del', 'monte', 'goya', 'iberia', 'la', 'fe', 'badia',
  'kraft', 'heinz', 'hunts', 'ragu', 'prego', 'campbells', 'progresso',
  'bumble', 'bee', 'starkist', 'chicken', 'sea', 'dole', 'chiquita',
  'tropicana', 'minute', 'maid', 'simply', 'hood', 'farmland', 'hatfield',
  'oscar', 'mayer', 'boars', 'head', 'hebrew', 'national', 'ballpark',
  'kelloggs', 'general', 'mills', 'post', 'quaker', 'cheerios',
  'pepsi', 'coca', 'cola', 'coke', 'nestle', 'nabisco', 'frito', 'lay',
  'scotts', 'bounty', 'charmin', 'angel', 'soft', 'cottonelle',
  'tide', 'gain', 'downy', 'clorox', 'lysol', 'ajax', 'palmolive',
  'colgate', 'oral', 'dawn', 'dial', 'irish', 'spring', 'dove',
  'store', 'brand', 'generic', 'stop', 'shop', 'key', 'food',
  'ctown', 'associated', 'foodtown', 'bravo', 'compare', 'essential',
  'everyday', 'always', 'save', 'smart', 'way',
]);

function extractKeywords(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !NOISE_WORDS.has(w) && !BRAND_WORDS.has(w));
}

function scoreMatch(keywords: string[], candidateName: string): number {
  const candidate = candidateName.toLowerCase();
  let hits = 0;
  for (const kw of keywords) {
    const stem = kw.endsWith('s') ? kw.slice(0, -1) : kw;
    if (candidate.includes(kw) || candidate.includes(stem) || candidate.includes(kw + 's')) {
      hits++;
    }
  }
  return keywords.length > 0 ? hits / keywords.length : 0;
}

async function findMatchesForItem(item: CartItem) {
  const keywords = extractKeywords(item.name);
  if (keywords.length === 0) return [];

  const today = new Date().toISOString().split('T')[0];
  const searchTerms = keywords.slice(0, 3);

  const orFilter = searchTerms.map(t => `name.ilike.%${t}%`).join(',');

  const { data } = await getSupabaseAdmin()
    .from('grocery_items')
    .select(`
      id, name, price, unit_of_measure, store_id,
      stores!inner (name, chain_name, address, lat, lng, is_active)
    `)
    .neq('store_id', item.storeId)
    .eq('stores.is_active', true)
    .or(`deal_end_date.gte.${today},deal_end_date.is.null`)
    .or(orFilter)
    .order('price', { ascending: true })
    .limit(200);

  const rows = (data ?? []) as (Record<string, unknown>)[];

  const perStore = new Map<string, { row: Record<string, unknown>; score: number }>();
  for (const row of rows) {
    const storeId = row.store_id as string;
    const score = scoreMatch(keywords, row.name as string);
    const minScore = keywords.length <= 2 ? 1.0 : 0.6;
    if (score < minScore) continue;
    const existing = perStore.get(storeId);
    if (!existing || score > existing.score || (score === existing.score && (row.price as number) < (existing.row.price as number))) {
      perStore.set(storeId, { row, score });
    }
  }

  return [...perStore.values()].map(v => v.row);
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
      const cartUnit = cartItem.unitOfMeasure?.toLowerCase().trim() ?? null;
      const matchUnit = ((match.unit_of_measure as string | null) ?? null)?.toLowerCase().trim() ?? null;
      const unitMismatch = cartUnit !== null && matchUnit !== null && cartUnit !== matchUnit;

      storeAlt.matched.push({
        cartItemName: cartItem.name,
        cartItemPrice: cartItem.price,
        cartItemUnit: cartUnit,
        matchedName: match.name as string,
        matchedPrice,
        matchedUnit: matchUnit,
        quantity: cartItem.quantity,
        itemSavings: Math.round((cartItem.price - matchedPrice) * cartItem.quantity * 100) / 100,
        unitMismatch,
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
