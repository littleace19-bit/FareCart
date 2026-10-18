"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    setLoading(true);
    fetch(`/api/deals?store_id=${store.id}`)
      .then((res) => res.json())
      .then((data) => setDeals(data))
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, [store.id]);

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

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <p className="text-center text-zinc-500">Loading deals...</p>
        ) : deals.length === 0 ? (
          <p className="text-center text-zinc-500">
            No current deals at this store.
          </p>
        ) : (
          <div className="space-y-3">
            {deals.map((deal) => (
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
