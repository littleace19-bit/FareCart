"use client";

import { useState, useEffect } from "react";

interface AdminStats {
  totalSaved: number;
  tripCount: number;
  averageSavings: number;
  admin: {
    avgPercentSaved: number;
    topStores: { name: string; count: number }[];
    walkablePercent: number | null;
    avgDistanceMeters: number | null;
    avgItemCoverage: number;
    totalOriginalSpend: number;
  };
}

interface AdminDashboardProps {
  onClose: () => void;
}

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/stats/admin");
        if (res.ok) {
          const data = await res.json();
          if (data.admin) setStats(data);
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
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Admin Dashboard</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-accent border-t-transparent" />
        </div>
      ) : !stats ? (
        <p className="px-4 py-8 text-center text-sm text-zinc-500">No data yet</p>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Total Saved" value={`$${stats.totalSaved.toFixed(2)}`} />
            <StatCard label="Total Trips" value={String(stats.tripCount)} />
            <StatCard label="Avg Savings/Trip" value={`$${stats.averageSavings.toFixed(2)}`} />
            <StatCard label="Avg % Saved" value={`${stats.admin.avgPercentSaved}%`} accent />
            <StatCard label="Avg Item Coverage" value={`${stats.admin.avgItemCoverage}%`} />
            <StatCard
              label="Walkable Trips"
              value={stats.admin.walkablePercent != null ? `${stats.admin.walkablePercent}%` : "N/A"}
            />
            <StatCard
              label="Avg Distance"
              value={stats.admin.avgDistanceMeters != null ? formatDistance(stats.admin.avgDistanceMeters) : "N/A"}
            />
            <StatCard label="Total Spend Tracked" value={`$${stats.admin.totalOriginalSpend.toFixed(2)}`} />
          </div>

          {stats.admin.topStores.length > 0 && (
            <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Top Stores Chosen</h3>
              <div className="space-y-2">
                {stats.admin.topStores.map((store, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-accent text-[10px] font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="text-sm text-zinc-900 dark:text-zinc-100">{store.name}</span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {store.count} time{store.count !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-0.5 text-lg font-bold ${accent ? "text-green-accent" : "text-zinc-900 dark:text-zinc-100"}`}>
        {value}
      </p>
    </div>
  );
}

function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  return miles < 0.1 ? `${Math.round(meters)}m` : `${miles.toFixed(1)} mi`;
}
