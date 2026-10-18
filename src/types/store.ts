export interface Store {
  id: string;
  platform_id: string;
  source: 'mercato' | 'shophero';
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string | null;
  lat: number;
  lng: number;
  chain_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreWithDistance extends Store {
  distance_meters: number;
}

export interface RawStore {
  platformId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  lat: number;
  lng: number;
  chainName?: string;
  source: 'mercato' | 'shophero';
}
