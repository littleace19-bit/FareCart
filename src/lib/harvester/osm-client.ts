import type { RawStore } from '@/types/store';

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const BRONX_BBOX = '40.78,-73.95,40.92,-73.70';

const OVERPASS_QUERY = `[out:json][timeout:30];
(
  node["shop"="supermarket"](${BRONX_BBOX});
  way["shop"="supermarket"](${BRONX_BBOX});
  node["shop"="grocery"](${BRONX_BBOX});
  way["shop"="grocery"](${BRONX_BBOX});
);
out center;`;

export async function fetchOsmStores(): Promise<RawStore[]> {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'FareCart/1.0 (grocery-app)',
    },
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
  });

  if (!res.ok) {
    throw new Error(`Overpass failed (${res.status})`);
  }

  const data: { elements: OverpassElement[] } = await res.json();

  const stores: RawStore[] = [];

  for (const el of data.elements) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const name = el.tags?.name;
    if (!lat || !lon || !name) continue;

    const addr = [el.tags?.['addr:housenumber'], el.tags?.['addr:street']]
      .filter(Boolean)
      .join(' ');

    stores.push({
      platformId: `${el.type}-${el.id}`,
      name,
      address: addr || 'Bronx, NY',
      city: 'Bronx',
      state: 'NY',
      zipCode: el.tags?.['addr:postcode'] ?? '10451',
      lat,
      lng: lon,
      chainName: el.tags?.brand,
      source: 'osm',
    });
  }

  return stores;
}
