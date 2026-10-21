"use client";

import { useState } from "react";
import type { StoreAlternative } from "@/types/cost-benefit";

interface ComparisonPanelProps {
  alternatives: StoreAlternative[];
  cartTotal: number;
  loading: boolean;
  onClose: () => void;
  onViewStore: (storeId: string) => void;
}

function formatDistance(meters: number): string {
  const miles = meters / 1609.34;
  return miles < 0.1 ? `${Math.round(meters)}m` : `${miles.toFixed(1)} mi`;
}

function formatWalkingTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min walk`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m walk` : `${hrs}h walk`;
}

export default function ComparisonPanel({
  alternatives,
  cartTotal,
  loading,
  onClose,
  onViewStore,
}: ComparisonPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [chosenStore, setChosenStore] = useState<StoreAlternative | null>(null);

  if (chosenStore) {
    const cb = chosenStore.costBenefit;
    const netSavings = cb?.netSavings ?? chosenStore.savings;
    const netPositive = cb?.isNetPositive ?? chosenStore.savings > 0;

    return (
      <div className="absolute inset-0 z-30 flex flex-col bg-white dark:bg-zinc-950">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <button
            onClick={() => setChosenStore(null)}
            className="mb-2 flex items-center gap-1 text-xs font-medium text-green-accent hover:underline"
          >
            <span>&larr;</span> Back to comparison
          </button>
          <h2 className="text-lg font-semibold">Shopping Summary</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="rounded-xl border border-green-200 bg-green-50/50 p-5 dark:border-green-900 dark:bg-green-950/50">
            <h3 className="text-xl font-bold">{chosenStore.storeName}</h3>
            {chosenStore.chainName && chosenStore.chainName !== chosenStore.storeName && (
              <p className="text-sm text-zinc-500">{chosenStore.chainName}</p>
            )}
            <p className="text-sm text-zinc-500">{chosenStore.address}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
              <p className="text-xs text-zinc-500">Your current cart</p>
              <p className="text-lg font-bold">${chosenStore.currentTotal.toFixed(2)}</p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
              <p className="text-xs text-zinc-500">At {chosenStore.storeName}</p>
              <p className="text-lg font-bold">${chosenStore.alternativeTotal.toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
            <p className="text-xs text-zinc-500">Price difference</p>
            <p className={`text-lg font-bold ${chosenStore.savings > 0 ? "text-green-accent" : chosenStore.savings < 0 ? "text-red-accent" : ""}`}>
              {chosenStore.savings > 0 ? "You save " : chosenStore.savings < 0 ? "You spend " : ""}
              ${Math.abs(chosenStore.savings).toFixed(2)}
              {chosenStore.savings === 0 && " — same price"}
            </p>
          </div>

          {chosenStore.distanceMeters != null && (
            <div className="mt-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h4 className="mb-2 text-sm font-semibold">Getting there</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Distance</span>
                  <span className="font-medium">{formatDistance(chosenStore.distanceMeters)}</span>
                </div>
                {cb && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-500">Travel</span>
                      <span className="font-medium">
                        {cb.isWalkable
                          ? formatWalkingTime(cb.walkingTimeMinutes)
                          : `MTA — $${cb.transitCost.toFixed(2)} round trip`}
                      </span>
                    </div>
                    {!cb.isWalkable && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-zinc-500">Transit cost</span>
                        <span className="font-medium text-red-accent">-${cb.transitCost.toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <div className={`mt-4 rounded-xl p-5 text-center ${netPositive ? "bg-green-50 dark:bg-green-950" : "bg-red-50 dark:bg-red-950"}`}>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {cb ? "Net savings after travel" : "Total savings"}
            </p>
            <p className={`text-3xl font-bold ${netPositive ? "text-green-accent" : "text-red-accent"}`}>
              {netSavings >= 0 ? "+" : ""}${netSavings.toFixed(2)}
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {cb?.recommendation === "walk"
                ? "Walk there and pocket the savings!"
                : cb?.recommendation === "transit-positive"
                  ? "Worth the trip — you come out ahead even after the fare."
                  : cb?.recommendation === "transit-negative"
                    ? "You'd spend more getting there than you'd save."
                    : cb?.recommendation === "not-worth-it"
                      ? "Not worth the trip — stick with your current store."
                      : netPositive
                        ? "You save by shopping here instead."
                        : "This store is more expensive for your cart."}
            </p>
          </div>

          {chosenStore.matched.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-semibold">Item breakdown</h4>
              <div className="space-y-1.5">
                {chosenStore.matched.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded border px-3 py-2 text-sm ${item.unitMismatch ? "border-amber-200 dark:border-amber-900" : "border-zinc-100 dark:border-zinc-800"}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {item.matchedName}
                        {item.matchedUnit && (
                          <span className="ml-1 text-xs text-zinc-400">/ {item.matchedUnit}</span>
                        )}
                      </p>
                      {item.matchedName !== item.cartItemName && (
                        <p className="text-xs text-zinc-400">
                          vs. {item.cartItemName}
                          {item.cartItemUnit && (
                            <span> / {item.cartItemUnit}</span>
                          )}
                        </p>
                      )}
                      {item.unitMismatch && (
                        <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          Different unit — compare carefully
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p>${item.matchedPrice.toFixed(2)}</p>
                      <p className={`text-xs ${item.unitMismatch ? "text-amber-600 dark:text-amber-400" : item.itemSavings > 0 ? "text-green-accent" : item.itemSavings < 0 ? "text-red-accent" : "text-zinc-400"}`}>
                        {item.unitMismatch
                          ? "diff. unit"
                          : item.itemSavings > 0 ? `save $${item.itemSavings.toFixed(2)}` : item.itemSavings < 0 ? `+$${Math.abs(item.itemSavings).toFixed(2)} more` : "same"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chosenStore.missingItems.length > 0 && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950">
              <p className="font-medium text-amber-700 dark:text-amber-400">
                Not available here ({chosenStore.missingItems.length}):
              </p>
              <p className="mt-1 text-amber-600 dark:text-amber-500">
                {chosenStore.missingItems.join(", ")}
              </p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${chosenStore.lat},${chosenStore.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
              Get Directions
            </a>
            <button
              onClick={() => onViewStore(chosenStore.storeId)}
              className="flex-1 rounded-lg border border-green-accent py-3 text-sm font-semibold text-green-accent transition-colors hover:bg-green-50 dark:hover:bg-green-950"
            >
              Browse Deals
            </button>
          </div>
        </div>
      </div>
    );
  }

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
                        <button
                          onClick={() => onViewStore(store.storeId)}
                          className="font-semibold text-green-accent underline decoration-green-accent/30 underline-offset-2 transition-colors hover:decoration-green-accent"
                        >
                          {store.storeName}
                        </button>
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

                  <div className="mt-3 ml-5 flex gap-2">
                    <button
                      onClick={() =>
                        setExpanded(isExpanded ? null : store.storeId)
                      }
                      className="text-xs font-medium text-green-accent hover:underline"
                    >
                      {isExpanded ? "Hide details" : "View item breakdown"}
                    </button>
                    <span className="text-zinc-300 dark:text-zinc-700">|</span>
                    <button
                      onClick={() => setChosenStore(store)}
                      className="text-xs font-medium text-green-accent hover:underline"
                    >
                      Shop here instead
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 ml-5 space-y-1.5">
                      {store.matched.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between rounded border px-2.5 py-1.5 text-xs ${item.unitMismatch ? "border-amber-200 dark:border-amber-900" : "border-zinc-100 dark:border-zinc-800"}`}
                        >
                          <div className="flex-1">
                            <p className="font-medium">
                              {item.matchedName}
                              {item.matchedUnit && (
                                <span className="ml-1 text-zinc-400">/ {item.matchedUnit}</span>
                              )}
                            </p>
                            {item.matchedName !== item.cartItemName && (
                              <p className="text-zinc-400">
                                vs. {item.cartItemName}
                                {item.cartItemUnit && (
                                  <span> / {item.cartItemUnit}</span>
                                )}
                              </p>
                            )}
                            {item.unitMismatch && (
                              <p className="font-medium text-amber-600 dark:text-amber-400">
                                Different unit — compare carefully
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-right">
                            <span>${item.matchedPrice.toFixed(2)}</span>
                            <span
                              className={
                                item.unitMismatch
                                  ? "font-medium text-amber-600 dark:text-amber-400"
                                  : item.itemSavings > 0
                                    ? "font-medium text-green-accent"
                                    : item.itemSavings < 0
                                      ? "font-medium text-red-accent"
                                      : "text-zinc-400"
                              }
                            >
                              {item.unitMismatch
                                ? "diff. unit"
                                : item.itemSavings > 0
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
