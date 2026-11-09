"use client";

import { useState, useEffect } from "react";
import type { Store } from "@/types/store";

interface LocationsListProps {
  onClose: () => void;
  onSelectStore: (store: Store) => void;
}

export default function LocationsList({ onClose, onSelectStore }: LocationsListProps) {
  const [stores, setStores] = useState<(Store & { distance_meters?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/stores");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data.stores ?? [];

          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const sorted = list.map((s: Store) => ({
                ...s,
                distance_meters: haversine(pos.coords.latitude, pos.coords.longitude, s.lat, s.lng),
              })).sort((a: { distance_meters: number }, b: { distance_meters: number }) => a.distance_meters - b.distance_meters);
              setStores(sorted);
              setLoading(false);
            },
            () => {
              setStores(list.sort((a: Store, b: Store) => a.name.localeCompare(b.name)));
              setLoading(false);
            }
          );
        }
      } catch {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = stores.filter((s) => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q) || (s.chain_name?.toLowerCase().includes(q) ?? false);
  });

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-white dark:bg-zinc-950">
      <div className="flex h-12 items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-800">
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">All Locations</h2>
      </div>

      <div className="border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <input
          type="text"
          placeholder="Search stores..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-accent focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-accent border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-zinc-500">No stores found</p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
            {filtered.map((store) => (
              <button
                key={store.id}
                onClick={() => onSelectStore(store)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${store.has_deals ? "bg-green-accent" : "bg-zinc-400"}`}>
                  {store.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{store.name}</p>
                  <p className="truncate text-xs text-zinc-500">{store.address}</p>
                </div>
                <div className="shrink-0 text-right">
                  {store.distance_meters != null && (
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {formatDistance(store.distance_meters)}
                    </p>
                  )}
                  {store.has_deals && (
                    <p className="text-xs text-green-accent">Deals</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  return miles < 0.1 ? `${Math.round(meters)}m` : `${miles.toFixed(1)} mi`;
}
