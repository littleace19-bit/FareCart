"use client";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  activeView: string;
  isAdmin: boolean;
}

const menuItems = [
  { id: "map", label: "Map", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
  { id: "locations", label: "Locations", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" },
  { id: "my-savings", label: "My Savings", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "about", label: "About", icon: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

const adminItem = {
  id: "admin",
  label: "Admin",
  icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
};

export default function Sidebar({ open, onClose, onNavigate, activeView, isAdmin }: SidebarProps) {
  const items = isAdmin ? [...menuItems, adminItem] : menuItems;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-200 ease-in-out dark:bg-zinc-950 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800">
          <span className="text-lg font-bold text-green-accent">FareCart</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col p-3 gap-1">
          {items.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-green-50 text-green-accent dark:bg-green-950/50"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                }`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.icon} />
                </svg>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-4">
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Bronx Grocery Savings
          </p>
        </div>
      </div>
    </>
  );
}
