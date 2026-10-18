import { NextResponse } from 'next/server';

export const maxDuration = 300;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Phase 2: Implement harvester logic here after Phase 1 reconnaissance
  // 1. Loop through BRONX_ZIP_CODES
  // 2. For each zip: discover stores via mercato/shophero
  // 3. For each store: fetch catalog with pagination
  // 4. Normalize all results
  // 5. Upsert to Supabase

  return NextResponse.json({
    message: 'Harvest endpoint ready — awaiting Phase 1 API discovery',
    timestamp: new Date().toISOString(),
  });
}
