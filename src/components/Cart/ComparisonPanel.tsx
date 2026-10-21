"use client";

import { useState } from "react";
import type { StoreAlternative } from "@/types/cost-benefit";

interface ComparisonPanelProps {
  alternatives: StoreAlternative[];
  cartTotal: number;
  loading: boolean;
  onClose: () => void;
}

function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  return miles < 0.1 ? `${Math.round(meters)}m` : `${miles.toFixed(1)} mi`;
}

export default function ComparisonPanel({
  alternatives,
  cartTotal,
  loading,
  onClose,
}: ComparisonPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-white dark:bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-semibold">Compare Stores</h2>
          <p className="text-sm text-zinc-500">
            Your cart: ${cartTotal.toFixed(2)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="space-y-3 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-green-accent" />
            <p className="text-sm text-zinc-500">
              Comparing prices across stores...
            </p>
          </div>
        )}

        {!loading && alternatives.length === 0 && (
          <div className="space-y-2 text-center">
            <p className="text-zinc-500">No alternative stores found.</p>
            <p className="text-sm text-zinc-400">
              Try adding more items to your cart for better comparisons.
            </p>
          </div>
        )}

        {!loading && alternatives.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">
              {alternatives.length} store{alternatives.length !== 1 ? "s" : ""}{" "}
              with matching items, ranked by savings
            </p>

            {alternatives.map((store) => {
              const isExpanded = expanded === store.storeId;
              const hasSavings = store.savings > 0;
              const netPositive = store.costBenefit?.isNetPositive ?? hasSavings;

              return (
                <div
                  key={store.storeId}
                  className={`rounded-xl border p-4 ${
                    netPositive
                      ? "border-green-200 dark:border-green-900"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2.5 w-2.5 rounded-full ${
                            netPositive ? "bg-green-500" : "bg-zinc-400"
                          }`}
                        />
                        <h3 className="font-semibold">{store.storeName}</h3>
                      </div>
                      {store.chainName &&
                        store.chainName !== store.storeName && (
                          <span className="ml-5 text-xs text-zinc-500">
                            {store.chainName}
                          </span>
                        )}
                      <p className="ml-5 text-xs text-zinc-400">
                        {store.address}
                      </p>
                    </div>
                    {store.distanceMeters != null && (
                      <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                        {formatDistance(store.distanceMeters)}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 ml-5 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-zinc-500">Their price</p>
                      <p className="font-semibold">
                        ${store.alternativeTotal.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-zinc-500">Items found</p>
                      <p className="font-semibold">
                        {store.matched.length}/{store.matched.length + store.missingItems.length}
                      </p>
                    </div>
                  </div>

                  {store.costBenefit && (
                    <div
                      className={`mt-3 ml-5 rounded-lg p-3 ${
                        netPositive
                          ? "bg-green-50 dark:bg-green-950"
                          : "bg-zinc-50 dark:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {store.costBenefit.isWalkable
                            ? `Walk ${store.costBenefit.walkingTimeMinutes} min`
                            : `$${store.costBenefit.transitCost.toFixed(2)} MTA fare`}
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            netPositive ? "text-green-accent" : "text-red-accent"
                          }`}
                        >
                          {store.costBenefit.netSavings >= 0 ? "+" : ""}$
                          {store.costBenefit.netSavings.toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        {store.costBenefit.recommendation === "walk"
                          ? "Walk to save — no transit cost!"
                          : store.costBenefit.recommendation === "transit-positive"
                            ? "Worth the trip — you save even after the fare."
                            : store.costBenefit.recommendation === "transit-negative"
                              ? `Close to breaking even. Need ~$${store.costBenefit.breakEvenSavingsNeeded.toFixed(2)} more in savings.`
                              : "Not worth the trip — shop closer to home."}
                      </p>
                    </div>
                  )}

                  {!store.costBenefit && hasSavings && (
                    <div className="mt-3 ml-5 flex items-center justify-between rounded-lg bg-green-50 p-3 dark:bg-green-950">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">
                        Price savings
                      </span>
                      <span className="text-lg font-bold text-green-accent">
                        +${store.savings.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() =>
                      setExpanded(isExpanded ? null : store.storeId)
                    }
                    className="mt-2 ml-5 text-xs font-medium text-green-accent hover:underline"
                  >
                    {isExpanded ? "Hide details" : "View item breakdown"}
                  </button>

                  {isExpanded && (
                    <div className="mt-2 ml-5 space-y-1.5">
                      {store.matched.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded border border-zinc-100 px-2.5 py-1.5 text-xs dark:border-zinc-800"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.matchedName}</p>
                            {item.matchedName !== item.cartItemName && (
                              <p className="text-zinc-400">
                                vs. {item.cartItemName}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-right">
                            <span>${item.matchedPrice.toFixed(2)}</span>
                            <span
                              className={
                                item.itemSavings > 0
                                  ? "font-medium text-green-accent"
                                  : item.itemSavings < 0
                                    ? "font-medium text-red-accent"
                                    : "text-zinc-400"
                              }
                            >
                              {item.itemSavings > 0
                                ? `-$${item.itemSavings.toFixed(2)}`
                                : item.itemSavings < 0
                                  ? `+$${Math.abs(item.itemSavings).toFixed(2)}`
                                  : "same"}
                            </span>
                          </div>
                        </div>
                      ))}
                      {store.missingItems.length > 0 && (
                        <div className="rounded border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs dark:border-amber-900 dark:bg-amber-950">
                          <p className="font-medium text-amber-700 dark:text-amber-400">
                            Not available ({store.missingItems.length}):
                          </p>
                          <p className="text-amber-600 dark:text-amber-500">
                            {store.missingItems.join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
