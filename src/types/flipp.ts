export interface FlippFlyer {
  id: number;
  merchant: string;
  merchant_id: number;
  merchant_logo: string;
  name: string;
  valid_from: string;
  valid_to: string;
  categories: string[];
}

export interface FlippFlyerItem {
  id: number;
  flyer_id: number;
  name: string;
  brand: string | null;
  price: string | null;
  cutout_image_url: string | null;
  valid_from: string;
  valid_to: string;
  available_to: string | null;
}

export interface FlippSearchItem {
  id: number;
  flyer_id: number;
  flyer_item_id: number;
  name: string;
  current_price: number | null;
  original_price: number | null;
  pre_price_text: string | null;
  post_price_text: string | null;
  sale_story: string | null;
  merchant_id: number;
  merchant_name: string;
  merchant_logo: string;
  clean_image_url: string | null;
  valid_from: string;
  valid_to: string;
  _L1: string | null;
  _L2: string | null;
}

export interface FlippFlyersResponse {
  flyers: FlippFlyer[];
  refreshed_at: string;
}

export interface FlippSearchResponse {
  items: FlippSearchItem[];
  flyers: FlippFlyer[];
  merchants: unknown[];
}
