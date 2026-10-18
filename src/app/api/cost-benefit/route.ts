import { NextResponse } from 'next/server';
import { calculateCostBenefit } from '@/lib/cost-benefit/calculator';

export async function POST(request: Request) {
  const body = await request.json();
  const { cartSavings, distanceMeters } = body;

  if (typeof cartSavings !== 'number' || typeof distanceMeters !== 'number') {
    return NextResponse.json(
      { error: 'cartSavings and distanceMeters are required numbers' },
      { status: 400 }
    );
  }

  const result = calculateCostBenefit(cartSavings, distanceMeters);
  return NextResponse.json(result);
}
