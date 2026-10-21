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

export interface MatchedItem {
  cartItemName: string;
  cartItemPrice: number;
  cartItemUnit: string | null;
  matchedName: string;
  matchedPrice: number;
  matchedUnit: string | null;
  quantity: number;
  itemSavings: number;
  unitMismatch: boolean;
}

export interface StoreAlternative {
  storeId: string;
  storeName: string;
  chainName: string | null;
  address: string;
  lat: number;
  lng: number;
  matched: MatchedItem[];
  missingItems: string[];
  alternativeTotal: number;
  currentTotal: number;
  savings: number;
  itemCoverage: number;
  distanceMeters: number | null;
  costBenefit: CostBenefitResult | null;
}
