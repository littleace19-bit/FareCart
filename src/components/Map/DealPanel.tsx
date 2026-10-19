"use client";

import { useEffect, useMemo, useState } from "react";
import type { Store } from "@/types/store";
import type { Deal } from "@/types/deal";

interface DealPanelProps {
  store: Store;
  onClose: () => void;
  onAddToCart: (deal: Deal) => void;
}

export default function DealPanel({
  store,
  onClose,
  onAddToCart,
}: DealPanelProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/deals?store_id=${store.id}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setDeals(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDeals([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [store.id]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    for (const deal of deals) {
      if (deal.category) cats.add(deal.category);
    }
    return [...cats].sort();
  }, [deals]);

  const filteredDeals = useMemo(() => {
    const term = search.toLowerCase();
    return deals.filter((d) => {
      if (activeCategory && d.category !== activeCategory) return false;
      if (term && !d.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [deals, activeCategory, search]);

  return (
    <div className="absolute right-0 top-0 z-10 flex h-full w-full flex-col bg-white shadow-xl dark:bg-zinc-950 sm:w-96">
      <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold">{store.name}</h2>
          <p className="text-sm text-zinc-500">{store.address}</p>
          {store.chain_name && (
            <span className="mt-1 inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              {store.chain_name}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
        >
          ✕
        </button>
      </div>

      {!loading && deals.length > 0 && (
        <div className="border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search this store..."
            className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm outline-none focus:border-green-accent focus:ring-1 focus:ring-green-accent dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-center text-zinc-500">Loading deals...</p>
        ) : deals.length === 0 ? (
          <div className="space-y-3 text-center">
            <p className="text-zinc-500">
              No pricing available for this store.
            </p>
            <p className="text-sm text-zinc-400">
              This store is nearby but doesn&apos;t publish digital circulars.
              Deals may still be available in-store.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.length > 1 && (
              <div className="flex flex-wrap gap-1.5 pb-2">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    activeCategory === null
                      ? "bg-green-accent text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  All ({deals.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() =>
                      setActiveCategory(activeCategory === cat ? null : cat)
                    }
                    className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      activeCategory === cat
                        ? "bg-green-accent text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
            {filteredDeals.map((deal) => (
              <div
                key={deal.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <div className="flex-1">
                  <p className="font-medium">{deal.name}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-green-accent">
                      ${deal.price.toFixed(2)}
                    </span>
                    {deal.original_price && (
                      <span className="text-zinc-400 line-through">
                        ${deal.original_price.toFixed(2)}
                      </span>
                    )}
                    {deal.unit_of_measure && (
                      <span className="text-zinc-400">
                        / {deal.unit_of_measure}
                      </span>
                    )}
                  </div>
                  {deal.sale_story && (
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {deal.sale_story}
                    </p>
                  )}
                  {deal.is_future_deal && (
                    <span className="mt-1 inline-block rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      Upcoming
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onAddToCart(deal)}
                  className="rounded-lg bg-green-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
