"use client";

interface AboutPanelProps {
  onClose: () => void;
}

export default function AboutPanel({ onClose }: AboutPanelProps) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-white dark:bg-zinc-950">
      <div className="flex h-12 items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-800">
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">About FareCart</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-green-accent">FareCart</h1>
            <p className="mt-1 text-sm text-zinc-500">Bronx Grocery Savings</p>
          </div>

          <div className="space-y-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            <p>
              FareCart is a hyperlocal grocery inflation tracker and budget-navigation app
              built for the Bronx — one of the most food-insecure boroughs in New York City.
            </p>
            <p>
              We aggregate weekly circular deals from local supermarkets and let you compare
              prices across stores, factoring in travel costs so you can make truly informed
              shopping decisions.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Features</h3>
            <ul className="mt-2 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-accent">&#10003;</span>
                Real-time deal tracking from local circulars
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-accent">&#10003;</span>
                Cross-store price comparison with smart matching
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-accent">&#10003;</span>
                Transit cost-benefit analysis (MTA fare factored in)
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-accent">&#10003;</span>
                Walking directions to nearby stores
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 text-green-accent">&#10003;</span>
                Per-store shopping carts with savings tracking
              </li>
            </ul>
          </div>

          <div className="text-center text-xs text-zinc-400 dark:text-zinc-600">
            <p>Built with Next.js, Supabase, and Mapbox</p>
            <p className="mt-1">Version 1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
