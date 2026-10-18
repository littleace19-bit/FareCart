import type {
  FlippFlyer,
  FlippFlyerItem,
  FlippFlyersResponse,
  FlippSearchItem,
  FlippSearchResponse,
} from '@/types/flipp';

const FLIPP_BASE = 'https://backflipp.wishabi.com/flipp';

const GROCERY_CATEGORIES = new Set([
  'Groceries',
  'Specialty',
]);

export async function fetchFlyers(
  postalCode: string
): Promise<FlippFlyer[]> {
  const res = await fetch(
    `${FLIPP_BASE}/flyers?locale=en-us&postal_code=${postalCode}`,
    { headers: { 'User-Agent': 'FareCart/1.0' } }
  );

  if (!res.ok) {
    throw new Error(`Flipp flyers failed (${res.status}): ${postalCode}`);
  }

  const data: FlippFlyersResponse = await res.json();
  return data.flyers.filter((f) =>
    f.categories?.some((c) => GROCERY_CATEGORIES.has(c))
  );
}

export async function fetchFlyerItems(
  flyerId: number
): Promise<FlippFlyerItem[]> {
  const res = await fetch(
    `${FLIPP_BASE}/flyers/${flyerId}?locale=en-us`,
    { headers: { 'User-Agent': 'FareCart/1.0' } }
  );

  if (!res.ok) {
    throw new Error(`Flipp flyer items failed (${res.status}): ${flyerId}`);
  }

  const data: { items: FlippFlyerItem[] } = await res.json();
  return data.items;
}

export async function searchItems(
  postalCode: string,
  query: string
): Promise<FlippSearchItem[]> {
  const res = await fetch(
    `${FLIPP_BASE}/items/search?locale=en-us&postal_code=${postalCode}&q=${encodeURIComponent(query)}`,
    { headers: { 'User-Agent': 'FareCart/1.0' } }
  );

  if (!res.ok) {
    throw new Error(`Flipp search failed (${res.status}): ${query}`);
  }

  const data: FlippSearchResponse = await res.json();
  return data.items;
}
