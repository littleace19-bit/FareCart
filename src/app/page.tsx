"use client";

import { useState, useEffect, useRef } from "react";
import MapContainer from "@/components/Map/MapContainer";
import DealPanel from "@/components/Map/DealPanel";
import CartDrawer from "@/components/Cart/CartDrawer";
import ComparisonPanel from "@/components/Cart/ComparisonPanel";
import SearchPanel from "@/components/Search/SearchPanel";
import Header from "@/components/Layout/Header";
import type { Store } from "@/types/store";
import type { Deal } from "@/types/deal";
import type { CartItem } from "@/types/cart";
import type { StoreAlternative } from "@/types/cost-benefit";
import InstallPrompt from "@/components/PWA/InstallPrompt";
import type { SearchResult } from "@/types/deal";

function loadCart(): CartItem[] {
  try {
    const saved = localStorage.getItem("farecart-cart");
    if (saved) return JSON.parse(saved);
  } catch {}
  return [];
}

export default function Home() {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [cart, setCart] = useState<CartItem[]>(loadCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [alternatives, setAlternatives] = useState<StoreAlternative[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const userCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userCoordsRef.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
      },
      () => {}
    );
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("farecart-cart", JSON.stringify(cart));
    } catch {}
  }, [cart]);

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

  function addSearchResultToCart(result: SearchResult) {
    const deal: Deal = {
      id: result.deal_id,
      store_id: result.store_id,
      external_id: result.deal_id,
      source: "flipp",
      name: result.deal_name,
      price: result.price,
      original_price: result.original_price,
      unit_of_measure: result.unit_of_measure,
      category: null,
      image_url: null,
      sale_story: result.sale_story,
      flyer_id: null,
      is_future_deal: false,
      deal_start_date: null,
      deal_end_date: null,
      created_at: "",
      updated_at: "",
    };
    addToCart(deal);
  }

  async function runComparison() {
    setCompareOpen(true);
    setCompareLoading(true);
    try {
      const coords = userCoordsRef.current;
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            name: item.deal.name,
            price: item.deal.price,
            quantity: item.quantity,
            storeId: item.deal.store_id,
          })),
          userLat: coords?.lat,
          userLng: coords?.lng,
        }),
      });
      if (res.ok) {
        const data: StoreAlternative[] = await res.json();
        setAlternatives(data);
      }
    } catch {}
    setCompareLoading(false);
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex h-full flex-col">
      <Header
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
        onSearchClick={() => setSearchOpen(true)}
      />
      <main className="relative flex-1">
        <MapContainer onStoreSelect={setSelectedStore} />
        {selectedStore && (
          <DealPanel
            key={selectedStore.id}
            store={selectedStore}
            onClose={() => setSelectedStore(null)}
            onAddToCart={addToCart}
          />
        )}
        {searchOpen && (
          <SearchPanel
            onClose={() => setSearchOpen(false)}
            onAddToCart={addSearchResultToCart}
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
            onCompare={runComparison}
          />
        )}
        {compareOpen && (
          <ComparisonPanel
            alternatives={alternatives}
            cartTotal={cart.reduce(
              (sum, item) => sum + item.deal.price * item.quantity,
              0
            )}
            loading={compareLoading}
            onClose={() => setCompareOpen(false)}
          />
        )}
      </main>
      <InstallPrompt />
    </div>
  );
}
