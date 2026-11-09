import type { CostBenefitResult } from '@/types/cost-benefit';
import {
  WALKING_SPEED_KMH,
  TRANSPORT_MODES,
  type TransportMode,
} from './constants';

export function calculateCostBenefit(
  totalCartSavings: number,
  distanceMeters: number,
  mode: TransportMode = 'walk'
): CostBenefitResult {
  const modeConfig = TRANSPORT_MODES.find(m => m.id === mode) ?? TRANSPORT_MODES[0];
  const transitCost = modeConfig.roundTripCost;
  const netSavings = Math.round((totalCartSavings - transitCost) * 100) / 100;
  const isNetPositive = netSavings > 0;

  const distanceKm = distanceMeters / 1000;
  const walkingTimeMinutes = Math.round((distanceKm / WALKING_SPEED_KMH) * 60);
  const travelTimeMinutes = Math.round((distanceKm / modeConfig.speedKmh) * 60);
  const isWalkable = walkingTimeMinutes <= 20;

  const breakEvenSavingsNeeded = isNetPositive
    ? 0
    : Math.round((transitCost - totalCartSavings) * 100) / 100;

  let recommendation: CostBenefitResult['recommendation'];
  if (transitCost === 0) {
    recommendation = 'walk';
  } else if (isNetPositive) {
    recommendation = 'transit-positive';
  } else if (breakEvenSavingsNeeded <= 3) {
    recommendation = 'transit-negative';
  } else {
    recommendation = 'not-worth-it';
  }

  return {
    totalCartSavings: Math.round(totalCartSavings * 100) / 100,
    transitCost,
    netSavings,
    isNetPositive,
    isWalkable,
    walkingTimeMinutes,
    travelTimeMinutes,
    travelMode: mode,
    breakEvenSavingsNeeded,
    recommendation,
  };
}
