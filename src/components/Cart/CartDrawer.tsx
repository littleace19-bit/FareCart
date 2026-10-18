"use client";

import { useEffect, useRef, useState } from "react";
import type { CartItem } from "@/types/cart";
import type { Store } from "@/types/store";
import type { CostBenefitResult } from "@/types/cost-benefit";
import { haversineDistance } from "@/lib/geo";

interface CartDrawerProps {
  items: CartItem[];
  selectedStore: Store | null;
  onClose: () => void;
  onRemove: (dealId: string) => void;
  onUpdateQuantity: (dealId: string, quantity: number) => void;
  onClear: () => void;
}

export default function CartDrawer({
  items,
  selectedStore,
  onClose,
  onRemove,
  onUpdateQuantity,
  onClear,
}: CartDrawerProps) {
  const [costBenefitData, setCostBenefitData] = useState<{
    storeId: string;
    result: CostBenefitResult;
  } | null>(null);
  const userCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const totalSavings = items.reduce((sum, item) => {
    const original = item.deal.original_price ?? item.deal.price;
    return sum + (original - item.deal.price) * item.quantity;
  }, 0);

  const totalCost = items.reduce(
    (sum, item) => sum + item.deal.price * item.quantity,
    0
  );

  const costBenefit =
    selectedStore &&
    items.length > 0 &&
    costBenefitData?.storeId === selectedStore.id
      ? costBenefitData.result
      : null;

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userCoordsRef.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
      },
      () => {}
    );
  }, []);

  useEffect(() => {
    if (!selectedStore || items.length === 0) return;

    const coords = userCoordsRef.current;
    if (!coords) return;

    const savings = items.reduce((sum, item) => {
      const original = item.deal.original_price ?? item.deal.price;
      return sum + (original - item.deal.price) * item.quantity;
    }, 0);

    const distanceMeters = haversineDistance(
      coords.lat,
      coords.lng,
      selectedStore.lat,
      selectedStore.lng
    );

    const storeId = selectedStore.id;
    let cancelled = false;

    fetch("/api/cost-benefit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cartSavings: savings, distanceMeters }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setCostBenefitData({ storeId, result: data });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [selectedStore, items]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-white dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-semibold">Your Cart</h2>
        <div className="flex gap-2">
          {items.length > 0 && (
            <button
              onClick={onClear}
              className="rounded-lg px-3 py-1.5 text-sm text-red-accent transition-colors hover:bg-red-50 dark:hover:bg-red-950"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <p className="text-center text-zinc-500">
            Add items from a store to see savings.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.deal.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.deal.name}</p>
                  <p className="text-sm text-zinc-500">
                    ${item.deal.price.toFixed(2)}
                    {item.deal.original_price && (
                      <span className="ml-1 text-green-accent">
                        (save $
                        {(
                          (item.deal.original_price - item.deal.price) *
                          item.quantity
                        ).toFixed(2)}
                        )
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onUpdateQuantity(item.deal.id, item.quantity - 1)
                    }
                    className="flex h-7 w-7 items-center justify-center rounded bg-zinc-100 text-sm dark:bg-zinc-800"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-sm">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      onUpdateQuantity(item.deal.id, item.quantity + 1)
                    }
                    className="flex h-7 w-7 items-center justify-center rounded bg-zinc-100 text-sm dark:bg-zinc-800"
                  >
                    +
                  </button>
                  <button
                    onClick={() => onRemove(item.deal.id)}
                    className="ml-2 text-sm text-red-accent"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex justify-between text-sm">
            <span>Cart Total</span>
            <span className="font-semibold">${totalCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total Savings</span>
            <span className="font-semibold text-green-accent">
              ${totalSavings.toFixed(2)}
            </span>
          </div>

          {costBenefit && (
            <div
              className={`mt-3 rounded-lg p-3 ${
                costBenefit.isNetPositive
                  ? "bg-green-50 dark:bg-green-950"
                  : "bg-red-50 dark:bg-red-950"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {costBenefit.isWalkable
                    ? `Walking (${costBenefit.walkingTimeMinutes} min)`
                    : `Transit: -$${costBenefit.transitCost.toFixed(2)} MTA fare`}
                </span>
                <span
                  className={`text-lg font-bold ${
                    costBenefit.isNetPositive
                      ? "text-green-accent"
                      : "text-red-accent"
                  }`}
                >
                  {costBenefit.isNetPositive ? "+" : ""}$
                  {costBenefit.netSavings.toFixed(2)}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {costBenefit.recommendation === "walk"
                  ? "Walk to save — no transit cost!"
                  : costBenefit.recommendation === "transit-positive"
                    ? "Worth the trip — you save even after the fare."
                    : costBenefit.recommendation === "transit-negative"
                      ? `Close to breaking even. Add ~$${costBenefit.breakEvenSavingsNeeded.toFixed(2)} more in savings.`
                      : "Not worth the trip — shop closer to home."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
