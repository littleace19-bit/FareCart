"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_CONFIG } from "@/lib/mapbox/config";
import type { Store } from "@/types/store";

interface MapContainerProps {
  onStoreSelect: (store: Store) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export default function MapContainer({ onStoreSelect, userLocation }: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const allStoresRef = useRef<Store[]>([]);
  const hideNoPricingRef = useRef(false);
  const onStoreSelectRef = useRef(onStoreSelect);
  const [hideNoPricing, setHideNoPricing] = useState(false);

  useEffect(() => {
    onStoreSelectRef.current = onStoreSelect;
  }, [onStoreSelect]);

  const updateMarkers = useCallback((stores: Store[]) => {
    if (!map.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const store of stores) {
      const el = document.createElement("div");
      el.className = "store-marker";
      el.style.width = "24px";
      el.style.height = "24px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#16a34a";
      el.style.border = store.has_deals
        ? "3px solid white"
        : "3px solid #eab308";
      el.style.cursor = "pointer";
      el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
      if (!store.has_deals) {
        el.style.opacity = "0.75";
      }

      const marker = new mapboxgl.Marker(el)
        .setLngLat([store.lng, store.lat])
        .addTo(map.current);

      el.addEventListener("click", () => onStoreSelectRef.current(store));
      markersRef.current.push(marker);
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

    const center = userLocation
      ? [userLocation.lng, userLocation.lat] as [number, number]
      : MAPBOX_CONFIG.defaultCenter;

    const instance = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_CONFIG.style,
      center,
      zoom: MAPBOX_CONFIG.zoom,
      minZoom: MAPBOX_CONFIG.minZoom,
      maxZoom: MAPBOX_CONFIG.maxZoom,
    });

    map.current = instance;

    instance.addControl(new mapboxgl.NavigationControl(), "top-right");
    instance.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      "top-right"
    );

    async function fetchStoresInViewport() {
      const bounds = instance.getBounds();
      if (!bounds) return;

      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();

      try {
        const res = await fetch(
          `/api/stores?sw_lng=${sw.lng}&sw_lat=${sw.lat}&ne_lng=${ne.lng}&ne_lat=${ne.lat}`
        );
        if (!res.ok) return;
        const data: Store[] = await res.json();
        allStoresRef.current = data;
        const visible = hideNoPricingRef.current ? data.filter(s => s.has_deals) : data;
        updateMarkers(visible);
      } catch {
        // map still usable without store data
      }
    }

    instance.on("load", fetchStoresInViewport);
    instance.on("moveend", fetchStoresInViewport);

    return () => {
      instance.remove();
      map.current = null;
    };
  }, [updateMarkers, userLocation]);

  useEffect(() => {
    hideNoPricingRef.current = hideNoPricing;
    const stores = allStoresRef.current;
    if (stores.length > 0) {
      const visible = hideNoPricing ? stores.filter(s => s.has_deals) : stores;
      updateMarkers(visible);
    }
  }, [hideNoPricing, updateMarkers]);

  useEffect(() => {
    if (map.current && userLocation) {
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 14,
      });
    }
  }, [userLocation]);

  return (
    <>
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute bottom-6 left-4 z-10 rounded-lg bg-white/90 px-3 py-2 shadow-md backdrop-blur-sm dark:bg-zinc-900/90">
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-white bg-green-600 shadow-sm" />
            <span className="text-zinc-600 dark:text-zinc-400">Deals</span>
          </div>
          <button
            onClick={() => setHideNoPricing(h => !h)}
            className="flex items-center gap-1.5"
          >
            <span className={`inline-block h-3 w-3 rounded-full border-2 border-yellow-400 bg-green-600 shadow-sm transition-opacity ${hideNoPricing ? "opacity-25" : "opacity-75"}`} />
            <span className={`transition-colors ${hideNoPricing ? "text-zinc-400 line-through dark:text-zinc-600" : "text-zinc-600 dark:text-zinc-400"}`}>
              No pricing
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
