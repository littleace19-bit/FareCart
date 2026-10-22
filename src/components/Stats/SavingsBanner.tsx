"use client";

interface SavingsBannerProps {
  totalSaved: number;
  tripCount: number;
  averageSavings: number;
}

export default function SavingsBanner({
  totalSaved,
  tripCount,
  averageSavings,
}: SavingsBannerProps) {
  return (
    <div className="border-b border-green-200 bg-green-50 px-4 py-2.5 dark:border-green-900 dark:bg-green-950/50">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-accent text-xs font-bold text-white">
            $
          </span>
          <span className="font-semibold text-green-accent">
            ${totalSaved.toFixed(2)}
          </span>
          <span className="text-zinc-600 dark:text-zinc-400">
            saved across{" "}
            <span className="font-medium">{tripCount}</span> trip
            {tripCount !== 1 ? "s" : ""}
          </span>
        </div>
        <span className="text-xs text-zinc-500">
          avg ${averageSavings.toFixed(2)}/trip
        </span>
      </div>
    </div>
  );
}
