export interface CostBenefitInput {
  cartSavings: number;
  distanceMeters: number;
}

export interface CostBenefitResult {
  totalCartSavings: number;
  transitCost: number;
  netSavings: number;
  isNetPositive: boolean;
  isWalkable: boolean;
  walkingTimeMinutes: number;
  breakEvenSavingsNeeded: number;
  recommendation: 'walk' | 'transit-positive' | 'transit-negative' | 'not-worth-it';
}
