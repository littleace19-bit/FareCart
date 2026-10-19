interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
  onSearchClick: () => void;
}

export default function Header({
  cartCount,
  onCartClick,
  onSearchClick,
}: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-green-accent">FareCart</span>
        <span className="hidden text-sm text-zinc-500 sm:inline">
          Bronx Grocery Savings
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSearchClick}
          className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          Search
        </button>
        <button
          onClick={onCartClick}
          className="relative flex items-center gap-1 rounded-lg bg-green-accent px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          Cart
          {cartCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-green-accent">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
