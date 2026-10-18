import { NextResponse } from 'next/server';
import { calculateCostBenefit } from '@/lib/cost-benefit/calculator';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { cartSavings, distanceMeters } = body as Record<string, unknown>;

  if (typeof cartSavings !== 'number' || typeof distanceMeters !== 'number') {
    return NextResponse.json(
      { error: 'cartSavings and distanceMeters are required numbers' },
      { status: 400 }
    );
  }

  const result = calculateCostBenefit(cartSavings, distanceMeters);
  return NextResponse.json(result);
}
