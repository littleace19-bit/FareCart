import type { FlippFlyer } from '@/types/flipp';
import type { RawStore } from '@/types/store';

const BRONX_CENTER = { lat: 40.8448, lng: -73.8648 };

interface KnownLocation {
  address: string;
  lat: number;
  lng: number;
  zip: string;
}

const KNOWN_LOCATIONS: Record<number, KnownLocation> = {
  2697: { address: '378 E Fordham Rd', lat: 40.8616, lng: -73.8883, zip: '10458' },
  2675: { address: '2912 3rd Ave', lat: 40.8093, lng: -73.9199, zip: '10455' },
  2806: { address: '424 E 147th St', lat: 40.8153, lng: -73.9189, zip: '10455' },
  2838: { address: '536 E 170th St', lat: 40.8371, lng: -73.9118, zip: '10456' },
  2353: { address: '610 Exterior St', lat: 40.8265, lng: -73.9282, zip: '10451' },
  2393: { address: '2975 Westchester Ave', lat: 40.8377, lng: -73.8420, zip: '10461' },
  2040: { address: '610 Exterior St', lat: 40.8258, lng: -73.9275, zip: '10451' },
  5114: { address: '700 Exterior St', lat: 40.8260, lng: -73.9278, zip: '10451' },
  2679: { address: '1041 Prospect Ave', lat: 40.8210, lng: -73.8915, zip: '10459' },
  2383: { address: '423 Grand Concourse', lat: 40.8195, lng: -73.9230, zip: '10451' },
  2638: { address: '15 E Kingsbridge Rd', lat: 40.8627, lng: -73.8968, zip: '10468' },
  4440: { address: '100 Oak Point Ave', lat: 40.8120, lng: -73.8860, zip: '10474' },
  2063: { address: '528 Jackson Ave', lat: 40.8132, lng: -73.9175, zip: '10455' },
  2150: { address: '2301 Jerome Ave', lat: 40.8574, lng: -73.8988, zip: '10468' },
  2783: { address: '30-08 30th Ave, Queens', lat: 40.7678, lng: -73.9180, zip: '11102' },
  2782: { address: '38 W 32nd St, Manhattan', lat: 40.7479, lng: -73.9876, zip: '10001' },
};

export function resolveFlippMerchants(flyers: FlippFlyer[]): RawStore[] {
  const seen = new Set<number>();
  const stores: RawStore[] = [];

  for (const flyer of flyers) {
    if (seen.has(flyer.merchant_id)) continue;
    seen.add(flyer.merchant_id);

    const loc = KNOWN_LOCATIONS[flyer.merchant_id];

    stores.push({
      platformId: String(flyer.merchant_id),
      name: flyer.merchant,
      address: loc?.address ?? 'Bronx, NY',
      city: 'Bronx',
      state: 'NY',
      zipCode: loc?.zip ?? '10451',
      lat: loc?.lat ?? BRONX_CENTER.lat,
      lng: loc?.lng ?? BRONX_CENTER.lng,
      chainName: flyer.merchant,
      source: 'flipp',
    });
  }

  return stores;
}
