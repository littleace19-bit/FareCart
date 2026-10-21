"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

type CartMap = Record<string, CartItem[]>;

function loadCarts(): CartMap {
  try {
    const saved = localStorage.getItem("farecart-carts");
    if (saved) return JSON.parse(saved);
  } catch {}
  return {};
}

export default function Home() {
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [allCarts, setAllCarts] = useState<CartMap>(loadCarts);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [alternatives, setAlternatives] = useState<StoreAlternative[]>([]);
  const [compareLoading, setCompareLoading] = useState(false);
  const [viewingFromCompare, setViewingFromCompare] = useState(false);
  const userCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const cart = selectedStore ? (allCarts[selectedStore.id] ?? []) : [];

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
      localStorage.setItem("farecart-carts", JSON.stringify(allCarts));
    } catch {}
  }, [allCarts]);

  function updateStoreCart(storeId: string, updater: (prev: CartItem[]) => CartItem[]) {
    setAllCarts((prev) => ({
      ...prev,
      [storeId]: updater(prev[storeId] ?? []),
    }));
  }

  function addToCart(deal: Deal) {
    const storeId = selectedStore?.id ?? deal.store_id;
    updateStoreCart(storeId, (prev) => {
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
    if (!selectedStore) return;
    updateStoreCart(selectedStore.id, (prev) =>
      prev.filter((item) => item.deal.id !== dealId)
    );
  }

  function updateQuantity(dealId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(dealId);
      return;
    }
    if (!selectedStore) return;
    updateStoreCart(selectedStore.id, (prev) =>
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
            storeId: selectedStore?.id ?? item.deal.store_id,
            unitOfMeasure: item.deal.unit_of_measure,
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

  async function viewStoreFromComparison(storeId: string) {
    const res = await fetch(`/api/stores?id=${storeId}`);
    if (res.ok) {
      const store: Store = await res.json();
      setSelectedStore(store);
      setCompareOpen(false);
      setViewingFromCompare(true);
    }
  }

  const goHome = useCallback(() => {
    setSelectedStore(null);
    setCartOpen(false);
    setSearchOpen(false);
    setCompareOpen(false);
    setViewingFromCompare(false);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex h-full flex-col">
      <Header
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
        onSearchClick={() => setSearchOpen(true)}
        onLogoClick={goHome}
      />
      <main className="relative flex-1">
        <MapContainer onStoreSelect={setSelectedStore} />
        {selectedStore && (
          <DealPanel
            key={selectedStore.id}
            store={selectedStore}
            onClose={() => {
              setSelectedStore(null);
              if (viewingFromCompare) {
                setViewingFromCompare(false);
                setCompareOpen(true);
              }
            }}
            onAddToCart={addToCart}
            backLabel={viewingFromCompare ? "Back to comparison" : undefined}
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
            onClear={() => {
              if (selectedStore) {
                setAllCarts((prev) => {
                  const next = { ...prev };
                  delete next[selectedStore.id];
                  return next;
                });
              }
            }}
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
            onViewStore={viewStoreFromComparison}
          />
        )}
      </main>
      <InstallPrompt />
    </div>
  );
}
