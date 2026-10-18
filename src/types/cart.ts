import type { Deal } from './deal';

export interface CartItem {
  deal: Deal;
  quantity: number;
}
