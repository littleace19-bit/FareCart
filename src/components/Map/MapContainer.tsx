"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_CONFIG } from "@/lib/mapbox/config";
import type { Store } from "@/types/store";

interface MapContainerProps {
  onStoreSelect: (store: Store) => void;
}

export default function MapContainer({ onStoreSelect }: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const onStoreSelectRef = useRef(onStoreSelect);

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
      el.style.border = "3px solid white";
      el.style.cursor = "pointer";
      el.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";

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

    const instance = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_CONFIG.style,
      center: MAPBOX_CONFIG.center,
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
        updateMarkers(data);
      } catch {
        // map still usable without store data
      }
    }

    instance.on("moveend", fetchStoresInViewport);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        instance.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 14,
        });
      },
      () => {}
    );

    return () => {
      instance.remove();
      map.current = null;
    };
  }, [updateMarkers]);

  return <div ref={mapContainer} className="absolute inset-0" />;
}
