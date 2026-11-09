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
import SavingsBanner from "@/components/Stats/SavingsBanner";
import Sidebar from "@/components/Layout/Sidebar";
import LocationsList from "@/components/Locations/LocationsList";
import MySavings from "@/components/Stats/MySavings";
import AdminDashboard from "@/components/Stats/AdminDashboard";
import AboutPanel from "@/components/About/AboutPanel";
import LocationPicker from "@/components/Location/LocationPicker";
import type { UserLocation } from "@/components/Location/LocationPicker";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("map");
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<{
    totalSaved: number;
    tripCount: number;
    averageSavings: number;
  } | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const userCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const cart = selectedStore ? (allCarts[selectedStore.id] ?? []) : [];

  async function fetchStats() {
    try {
      const res = await fetch("/api/stats");
      if (res.ok) setStats(await res.json());
    } catch {}
  }

  useEffect(() => {
    fetchStats();
    try {
      if (localStorage.getItem("farecart-admin") === "true") setIsAdmin(true);
      const params = new URLSearchParams(window.location.search);
      if (params.get("key") === "farecart-harvest-secret-2026") {
        localStorage.setItem("farecart-admin", "true");
        setIsAdmin(true);
        window.history.replaceState({}, "", window.location.pathname);
      }
    } catch {}
  }, []);

  function handleNavigate(view: string) {
    setActiveView(view);
    if (view === "map") {
      goHome();
    }
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem("farecart-location");
      if (saved) {
        const loc: UserLocation = JSON.parse(saved);
        setUserLocation(loc);
        userCoordsRef.current = { lat: loc.lat, lng: loc.lng };
        return;
      }
    } catch {}
    setShowLocationPicker(true);
  }, []);

  function handleLocationSelect(loc: UserLocation) {
    setUserLocation(loc);
    userCoordsRef.current = { lat: loc.lat, lng: loc.lng };
    setShowLocationPicker(false);
    try {
      localStorage.setItem("farecart-location", JSON.stringify(loc));
    } catch {}
  }

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

  async function logSavingsDecision(store: StoreAlternative) {
    try {
      let deviceId: string | null = null;
      try {
        deviceId = localStorage.getItem("farecart-device-id");
        if (!deviceId) {
          deviceId = crypto.randomUUID();
          localStorage.setItem("farecart-device-id", deviceId);
        }
      } catch {}

      await fetch("/api/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalStoreId: selectedStore?.id ?? null,
          originalStoreName: selectedStore?.name ?? "Unknown",
          chosenStoreId: store.storeId,
          chosenStoreName: store.storeName,
          originalTotal: store.currentTotal,
          alternativeTotal: store.alternativeTotal,
          priceSavings: store.savings,
          netSavings: store.costBenefit?.netSavings ?? null,
          transitCost: store.costBenefit?.transitCost ?? null,
          isWalkable: store.costBenefit?.isWalkable ?? null,
          distanceMeters: store.distanceMeters,
          itemCount: store.matched.length + store.missingItems.length,
          itemsMatched: store.matched.length,
          itemsMissing: store.missingItems.length,
          recommendation: store.costBenefit?.recommendation ?? null,
          deviceId,
        }),
      });
      fetchStats();
    } catch {}
  }

  const goHome = useCallback(() => {
    setSelectedStore(null);
    setCartOpen(false);
    setSearchOpen(false);
    setCompareOpen(false);
    setViewingFromCompare(false);
    setActiveView("map");
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex h-full flex-col">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleNavigate}
        activeView={activeView}
        isAdmin={isAdmin}
      />
      <Header
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
        onSearchClick={() => setSearchOpen(true)}
        onLogoClick={goHome}
        onMenuClick={() => setSidebarOpen(true)}
      />
      {stats && stats.tripCount > 0 && !selectedStore && !searchOpen && !cartOpen && !compareOpen && (
        <SavingsBanner
          totalSaved={stats.totalSaved}
          tripCount={stats.tripCount}
          averageSavings={stats.averageSavings}
        />
      )}
      <main className="relative flex-1">
        <MapContainer onStoreSelect={setSelectedStore} userLocation={userLocation} />
        {userLocation && !selectedStore && !searchOpen && !cartOpen && !compareOpen && activeView === "map" && (
          <button
            onClick={() => setShowLocationPicker(true)}
            className="absolute top-3 left-14 z-20 flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-md transition-colors hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <circle cx="12" cy="11" r="3" />
            </svg>
            {userLocation.label}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
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
            onChooseStore={logSavingsDecision}
          />
        )}
        {activeView === "locations" && (
          <LocationsList
            onClose={() => setActiveView("map")}
            onSelectStore={(store) => {
              setSelectedStore(store);
              setActiveView("map");
            }}
          />
        )}
        {activeView === "my-savings" && (
          <MySavings onClose={() => setActiveView("map")} />
        )}
        {activeView === "about" && (
          <AboutPanel onClose={() => setActiveView("map")} />
        )}
        {activeView === "admin" && isAdmin && (
          <AdminDashboard onClose={() => setActiveView("map")} />
        )}
      </main>
      <InstallPrompt />
      {showLocationPicker && (
        <LocationPicker onSelect={handleLocationSelect} isModal />
      )}
    </div>
  );
}
