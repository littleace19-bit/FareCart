"use client";

import { useState, useRef, useEffect } from "react";

export interface UserLocation {
  lat: number;
  lng: number;
  label: string;
}

interface LocationPickerProps {
  onSelect: (location: UserLocation) => void;
  isModal?: boolean;
}

interface GeocodingResult {
  place_name: string;
  center: [number, number];
}

export default function LocationPicker({ onSelect, isModal }: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [detecting, setDetecting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=us&types=place,neighborhood,address,locality,poi&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.features ?? []);
        }
      } catch {}
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function useCurrentLocation() {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSelect({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Current Location",
        });
        setDetecting(false);
      },
      () => {
        setDetecting(false);
        alert("Could not detect your location. Please type an address instead.");
      }
    );
  }

  function selectResult(result: GeocodingResult) {
    const parts = result.place_name.split(",");
    const label = parts.length > 2 ? `${parts[0].trim()}, ${parts[1].trim()}` : result.place_name;
    onSelect({
      lat: result.center[1],
      lng: result.center[0],
      label,
    });
  }

  return (
    <div className={isModal ? "fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" : ""}>
      <div className={`w-full max-w-sm ${isModal ? "rounded-xl bg-white p-6 shadow-2xl dark:bg-zinc-900" : ""}`}>
        {isModal && (
          <div className="mb-4 text-center">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Set Your Location</h2>
            <p className="mt-1 text-sm text-zinc-500">Choose where you want to shop</p>
          </div>
        )}

        <button
          onClick={useCurrentLocation}
          disabled={detecting}
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-green-accent px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-60"
        >
          {detecting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          )}
          {detecting ? "Detecting..." : "Use my current location"}
        </button>

        <div className="relative mb-1 flex items-center gap-2">
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
          <span className="text-xs text-zinc-400">or search</span>
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        </div>

        <input
          type="text"
          placeholder="Type an address or neighborhood..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-accent focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          autoFocus={!isModal}
        />

        {results.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => selectResult(r)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-400">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <circle cx="12" cy="11" r="3" />
                </svg>
                <span className="truncate">{r.place_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
