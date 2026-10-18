"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_CONFIG } from "@/lib/mapbox/config";
import type { Store } from "@/types/store";

interface MapContainerProps {
  onStoreSelect: (store: Store) => void;
  selectedStore: Store | null;
}

export default function MapContainer({
  onStoreSelect,
  selectedStore,
}: MapContainerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAPBOX_CONFIG.style,
      center: MAPBOX_CONFIG.center,
      zoom: MAPBOX_CONFIG.zoom,
      minZoom: MAPBOX_CONFIG.minZoom,
      maxZoom: MAPBOX_CONFIG.maxZoom,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      "top-right"
    );

    map.current.on("moveend", fetchStoresInViewport);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [
          pos.coords.longitude,
          pos.coords.latitude,
        ];
        setUserLocation(coords);
        map.current?.flyTo({ center: coords, zoom: 14 });
      },
      () => {
        setUserLocation(MAPBOX_CONFIG.center);
      }
    );

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  async function fetchStoresInViewport() {
    if (!map.current) return;
    const bounds = map.current.getBounds();
    if (!bounds) return;

    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    try {
      const res = await fetch(
        `/api/stores?sw_lng=${sw.lng}&sw_lat=${sw.lat}&ne_lng=${ne.lng}&ne_lat=${ne.lat}`
      );
      if (res.ok) {
        const data: Store[] = await res.json();
        setStores(data);
        updateMarkers(data);
      }
    } catch {
      // silently fail — map still usable without store data
    }
  }

  function updateMarkers(newStores: Store[]) {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    newStores.forEach((store) => {
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
        .addTo(map.current!);

      el.addEventListener("click", () => onStoreSelect(store));
      markersRef.current.push(marker);
    });
  }

  return (
    <div ref={mapContainer} className="absolute inset-0" />
  );
}
