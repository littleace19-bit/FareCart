"use client";

import { useState } from "react";
import MapContainer from "@/components/Map/MapContainer";
import DealPanel from "@/components/Map/DealPanel";
import CartDrawer from "@/components/Cart/CartDrawer";
import Header from "@/components/Layout/Header";
import type { Store } from "@/types/store";
import type { Deal } from "@/types/deal";
import type { CartItem } from "@/types/cart";

export default function Home() {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  function addToCart(deal: Deal) {
    setCart((prev) => {
      const existing = prev.find((item) => item.deal.id === deal.id);
      if (existing) {
        return prev.map((item) =>
          item.deal.id === deal.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { deal, quantity: 1 }];
    });
  }

  function removeFromCart(dealId: string) {
    setCart((prev) => prev.filter((item) => item.deal.id !== dealId));
  }

  function updateQuantity(dealId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(dealId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.deal.id === dealId ? { ...item, quantity } : item
      )
    );
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex h-full flex-col">
      <Header cartCount={cartCount} onCartClick={() => setCartOpen(true)} />
      <main className="relative flex-1">
        <MapContainer
          onStoreSelect={setSelectedStore}
          selectedStore={selectedStore}
        />
        {selectedStore && (
          <DealPanel
            store={selectedStore}
            onClose={() => setSelectedStore(null)}
            onAddToCart={addToCart}
          />
        )}
        {cartOpen && (
          <CartDrawer
            items={cart}
            selectedStore={selectedStore}
            onClose={() => setCartOpen(false)}
            onRemove={removeFromCart}
            onUpdateQuantity={updateQuantity}
            onClear={() => setCart([])}
          />
        )}
      </main>
    </div>
  );
}
