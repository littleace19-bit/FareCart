import type { CostBenefitResult } from '@/types/cost-benefit';
import {
  MTA_ROUND_TRIP_FARE,
  WALKING_DISTANCE_METERS,
  WALKING_SPEED_KMH,
} from './constants';

export function calculateCostBenefit(
  totalCartSavings: number,
  distanceMeters: number
): CostBenefitResult {
  const isWalkable = distanceMeters <= WALKING_DISTANCE_METERS;
  const transitCost = isWalkable ? 0 : MTA_ROUND_TRIP_FARE;
  const netSavings = Math.round((totalCartSavings - transitCost) * 100) / 100;
  const isNetPositive = netSavings > 0;

  const distanceKm = distanceMeters / 1000;
  const walkingTimeMinutes = Math.round((distanceKm / WALKING_SPEED_KMH) * 60);

  const breakEvenSavingsNeeded = isNetPositive
    ? 0
    : Math.round((transitCost - totalCartSavings) * 100) / 100;

  let recommendation: CostBenefitResult['recommendation'];
  if (isWalkable) {
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
    breakEvenSavingsNeeded,
    recommendation,
  };
}
