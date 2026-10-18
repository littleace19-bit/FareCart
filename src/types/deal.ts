import type { DataSource } from './store';

export interface Deal {
  id: string;
  store_id: string;
  external_id: string;
  source: DataSource;
  name: string;
  price: number;
  original_price: number | null;
  unit_of_measure: string | null;
  category: string | null;
  image_url: string | null;
  sale_story: string | null;
  flyer_id: string | null;
  is_future_deal: boolean;
  deal_start_date: string | null;
  deal_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface NormalizedDeal {
  externalId: string;
  storePlatformId: string;
  name: string;
  price: number;
  originalPrice?: number;
  unitOfMeasurement: string;
  isFutureDeal: boolean;
  dealStartDate: string;
  dealEndDate: string | null;
  category?: string;
  imageUrl?: string;
  saleStory?: string;
  flyerId?: string;
  source: DataSource;
}
