import type { Deal } from './deal';

export interface CartItem {
  deal: Deal;
  quantity: number;
}

export type CartAction =
  | { type: 'ADD_ITEM'; deal: Deal }
  | { type: 'REMOVE_ITEM'; dealId: string }
  | { type: 'UPDATE_QUANTITY'; dealId: string; quantity: number }
  | { type: 'CLEAR_CART' };
