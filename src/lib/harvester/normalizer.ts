import type { NormalizedDeal } from '@/types/deal';
import type { DataSource } from '@/types/store';
import type { FlippFlyerItem, FlippFlyer } from '@/types/flipp';

interface RawDealInput {
  id: string;
  storeId: string;
  name: string;
  price: string | number;
  originalPrice?: string | number;
  unit?: string;
  category?: string;
  imageUrl?: string;
  saleStory?: string;
  flyerId?: string;
  dealStartDate?: string;
  dealEndDate?: string;
  source: DataSource;
}

const UNIT_MAP: Record<string, string> = {
  pound: 'lb',
  pounds: 'lb',
  lb: 'lb',
  lbs: 'lb',
  '/lb': 'lb',
  '/lb.': 'lb',
  'lb/cs': 'lb',
  ounce: 'oz',
  ounces: 'oz',
  oz: 'oz',
  each: 'each',
  ea: 'each',
  pack: 'pack',
  pk: 'pack',
  gallon: 'gal',
  gal: 'gal',
  quart: 'qt',
  qt: 'qt',
  pint: 'pt',
  pt: 'pt',
  dozen: 'doz',
  doz: 'doz',
};

function cleanName(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsePrice(raw: string | number): number {
  if (typeof raw === 'number') return Math.round(raw * 100) / 100;
  const cleaned = raw.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

function normalizeUnit(raw?: string): string {
  if (!raw) return 'each';
  const lower = raw.toLowerCase().trim().replace(/^\//, '');
  return UNIT_MAP[lower] ?? UNIT_MAP[`/${lower}`] ?? lower;
}

function isFutureDeal(startDate?: string): boolean {
  if (!startDate) return false;
  return new Date(startDate) > new Date();
}

export function normalizeDeal(raw: RawDealInput): NormalizedDeal {
  return {
    externalId: raw.id,
    storePlatformId: raw.storeId,
    name: cleanName(raw.name),
    price: parsePrice(raw.price),
    originalPrice: raw.originalPrice ? parsePrice(raw.originalPrice) : undefined,
    unitOfMeasurement: normalizeUnit(raw.unit),
    isFutureDeal: isFutureDeal(raw.dealStartDate),
    dealStartDate: raw.dealStartDate ?? new Date().toISOString().split('T')[0],
    dealEndDate: raw.dealEndDate ?? null,
    category: raw.category,
    imageUrl: raw.imageUrl,
    saleStory: raw.saleStory,
    flyerId: raw.flyerId,
    source: raw.source,
  };
}

export function normalizeDeals(raws: RawDealInput[]): NormalizedDeal[] {
  return raws.map(normalizeDeal);
}

export function normalizeFlippItems(
  flyer: FlippFlyer,
  items: FlippFlyerItem[]
): NormalizedDeal[] {
  return items
    .filter((item) => item.name && item.price)
    .map((item) => {
      const price = parsePrice(item.price!);
      if (price === 0) return null;

      return normalizeDeal({
        id: String(item.id),
        storeId: String(flyer.merchant_id),
        name: item.name,
        price,
        saleStory: item.discount ?? undefined,
        imageUrl: item.cutout_image_url ?? undefined,
        flyerId: String(flyer.id),
        dealStartDate: item.valid_from?.split('T')[0],
        dealEndDate: item.valid_to?.split('T')[0] ?? item.available_to?.split('T')[0],
        source: 'flipp',
      });
    })
    .filter((d): d is NormalizedDeal => d !== null);
}
