"use client";

import { useState, useRef } from "react";
import type { SearchResult } from "@/lib/supabase/queries";

interface SearchPanelProps {
  onClose: () => void;
  onAddToCart: (result: SearchResult) => void;
}

export default function SearchPanel({ onClose, onAddToCart }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  function handleSearch(value: string) {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(value.trim())}`
        );
        if (!res.ok) return;
        const data: SearchResult[] = await res.json();
        setResults(data);
        setSearched(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  const grouped = results.reduce<Record<string, SearchResult[]>>(
    (acc, result) => {
      const key = result.store_name;
      if (!acc[key]) acc[key] = [];
      acc[key].push(result);
      return acc;
    },
    {}
  );

  const sortedStores = Object.entries(grouped).sort(
    ([, a], [, b]) => Math.min(...a.map((r) => r.price)) - Math.min(...b.map((r) => r.price))
  );

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-200 p-4 dark:border-zinc-800">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for a product (e.g. eggs, milk)..."
          autoFocus
          className="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-green-accent focus:ring-1 focus:ring-green-accent dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <p className="text-center text-sm text-zinc-500">Searching...</p>
        )}

        {!loading && searched && results.length === 0 && (
          <p className="text-center text-sm text-zinc-500">
            No results found for &quot;{query}&quot;
          </p>
        )}

        {!loading && sortedStores.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-500">
              {results.length} result{results.length !== 1 ? "s" : ""} across{" "}
              {sortedStores.length} store{sortedStores.length !== 1 ? "s" : ""},
              sorted by lowest price
            </p>
            {sortedStores.map(([storeName, items]) => (
              <div key={storeName}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-600" />
                  <h3 className="text-sm font-semibold">{storeName}</h3>
                  {items[0].chain_name && items[0].chain_name !== storeName && (
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800">
                      {items[0].chain_name}
                    </span>
                  )}
                </div>
                <div className="space-y-2 pl-5">
                  {items.map((item) => (
                    <div
                      key={item.deal_id}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 p-2.5 dark:border-zinc-800"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.deal_name}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-bold text-green-accent">
                            ${item.price.toFixed(2)}
                          </span>
                          {item.original_price && (
                            <span className="text-zinc-400 line-through">
                              ${item.original_price.toFixed(2)}
                            </span>
                          )}
                          {item.unit_of_measure && (
                            <span className="text-zinc-400">
                              / {item.unit_of_measure}
                            </span>
                          )}
                        </div>
                        {item.sale_story && (
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {item.sale_story}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onAddToCart(item)}
                        className="rounded-lg bg-green-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !searched && (
          <div className="space-y-2 text-center text-sm text-zinc-500">
            <p>Compare prices across all Bronx stores</p>
            <p className="text-xs text-zinc-400">
              Try: eggs, milk, chicken, bread, rice
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
