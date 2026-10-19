import { NextResponse } from 'next/server';
import { fetchFlyers, fetchFlyerItems } from '@/lib/harvester/flipp-client';
import { resolveFlippMerchants } from '@/lib/harvester/merchant-resolver';
import { normalizeFlippItems } from '@/lib/harvester/normalizer';
import { fetchOsmStores } from '@/lib/harvester/osm-client';
import { matchChainName } from '@/lib/harvester/chain-matcher';
import { upsertStores, upsertDeals, getStoreIdMap } from '@/lib/supabase/queries';
import { BRONX_ZIP_CODES, RATE_LIMIT_MS, sleep } from '@/lib/harvester/constants';
import type { FlippFlyer } from '@/types/flipp';
import type { NormalizedDeal } from '@/types/deal';

export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sampled = BRONX_ZIP_CODES.filter((_, i) => i % 5 === 0);
  const allFlyers: FlippFlyer[] = [];
  const seenFlyerIds = new Set<number>();
  const errors: string[] = [];

  for (const zip of sampled) {
    try {
      const flyers = await fetchFlyers(zip);
      for (const f of flyers) {
        if (!seenFlyerIds.has(f.id)) {
          seenFlyerIds.add(f.id);
          allFlyers.push(f);
        }
      }
    } catch (err) {
      errors.push(`flyers/${zip}: ${err instanceof Error ? err.message : 'unknown'}`);
    }
    await sleep(RATE_LIMIT_MS);
  }

  const stores = resolveFlippMerchants(allFlyers);
  try {
    await upsertStores(stores);
  } catch (err) {
    return NextResponse.json({
      error: `Store upsert failed: ${err instanceof Error ? err.message : 'unknown'}`,
      flyersFound: allFlyers.length,
    }, { status: 500 });
  }

  const storeIdMap = await getStoreIdMap('flipp');

  let totalDeals = 0;
  const allDeals: NormalizedDeal[] = [];

  for (const flyer of allFlyers) {
    try {
      await sleep(RATE_LIMIT_MS);
      const items = await fetchFlyerItems(flyer.id);
      const normalized = normalizeFlippItems(flyer, items);
      allDeals.push(...normalized);
      totalDeals += normalized.length;
    } catch (err) {
      errors.push(`items/${flyer.id}: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  try {
    await upsertDeals(allDeals, storeIdMap);
  } catch (err) {
    errors.push(`deal upsert: ${err instanceof Error ? err.message : 'unknown'}`);
  }

  const flippChainNames = stores.map((s) => s.chainName ?? s.name);
  let osmCount = 0;

  try {
    const osmStores = await fetchOsmStores();
    const matched = osmStores.map((store) => {
      const chain = matchChainName(
        store.name,
        store.chainName ?? null,
        flippChainNames
      );
      return chain ? { ...store, chainName: chain } : store;
    });
    await upsertStores(matched);
    osmCount = matched.length;
  } catch (err) {
    errors.push(`osm: ${err instanceof Error ? err.message : 'unknown'}`);
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    zipsScanned: sampled.length,
    flyersFound: allFlyers.length,
    storesResolved: stores.length,
    osmStores: osmCount,
    dealsNormalized: totalDeals,
    errors: errors.length > 0 ? errors : undefined,
  });
}
