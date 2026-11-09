"use client";

import { useState, useEffect } from "react";

interface SavingsRecord {
  originalStoreName: string;
  chosenStoreName: string;
  priceSavings: number;
  netSavings: number | null;
  itemsMatched: number;
  itemCount: number;
  date: string;
}

interface MySavingsProps {
  onClose: () => void;
}

export default function MySavings({ onClose }: MySavingsProps) {
  const [records, setRecords] = useState<SavingsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSaved, setTotalSaved] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        let deviceId: string | null = null;
        try {
          deviceId = localStorage.getItem("farecart-device-id");
        } catch {}

        if (!deviceId) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/stats?device=${deviceId}`);
        if (res.ok) {
          const data = await res.json();
          setRecords(data.decisions ?? []);
          setTotalSaved(data.deviceTotalSaved ?? 0);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-white dark:bg-zinc-950">
      <div className="flex h-12 items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-800">
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">My Savings</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-accent border-t-transparent" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No savings yet</p>
          <p className="text-center text-xs text-zinc-500">
            Compare your cart to other stores and click &quot;Shop here instead&quot; to start tracking your savings.
          </p>
        </div>
      ) : (
        <>
          <div className="border-b border-green-200 bg-green-50 px-4 py-4 dark:border-green-900 dark:bg-green-950/50">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Your total savings</p>
            <p className="text-2xl font-bold text-green-accent">${totalSaved.toFixed(2)}</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              across {records.length} trip{records.length !== 1 ? "s" : ""}
              {records.length > 0 && ` · avg $${(totalSaved / records.length).toFixed(2)}/trip`}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {records.map((r, i) => {
                const savings = r.netSavings ?? r.priceSavings;
                return (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-zinc-900 dark:text-zinc-100">
                          <span className="text-zinc-500">Switched from</span>{" "}
                          <span className="font-medium">{r.originalStoreName}</span>{" "}
                          <span className="text-zinc-500">to</span>{" "}
                          <span className="font-medium">{r.chosenStoreName}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {r.itemsMatched}/{r.itemCount} items matched · {r.date}
                        </p>
                      </div>
                      <span className={`ml-3 shrink-0 text-sm font-semibold ${savings > 0 ? "text-green-accent" : "text-red-500"}`}>
                        {savings > 0 ? "+" : ""}${savings.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
