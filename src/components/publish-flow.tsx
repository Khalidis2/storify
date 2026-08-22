"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface PlanOption {
  id: string;
  name: string;
  priceCents: number;
  interval: string;
  features: string[];
}

function formatPrice(cents: number) {
  if (cents === 0) return "Free";
  return `${(cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  })}`;
}

export function PublishFlow({
  plans,
  shopSlug,
  published,
  currentPlanId,
}: {
  plans: PlanOption[];
  shopSlug: string;
  published: boolean;
  currentPlanId: string | null;
}) {
  const router = useRouter();
  const freePlan = plans.find((plan) => plan.priceCents === 0);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(
    currentPlanId && plans.find((plan) => plan.id === currentPlanId)?.priceCents === 0
      ? currentPlanId
      : freePlan?.id ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    if (!selectedPlan) return;
    setLoading(true);
    setError(null);

    const res = await fetch("/api/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: selectedPlan }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not publish your shop.");
      return;
    }

    router.refresh();
  }

  async function handleUnpublish() {
    setLoading(true);
    const res = await fetch("/api/publish", { method: "DELETE" });
    setLoading(false);
    if (!res.ok) {
      setError("Could not unpublish your shop.");
      return;
    }
    router.refresh();
  }

  if (published) {
    return (
      <div className="max-w-lg rounded-2xl border border-zinc-200 bg-white p-6">
        <p className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
          ● Live
        </p>
        <p className="mt-4 text-sm text-zinc-600">Your storefront is published at:</p>
        <a
          href={`/store/${shopSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block font-medium text-zinc-900 underline"
        >
          /store/{shopSlug}
        </a>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <button
          onClick={handleUnpublish}
          disabled={loading}
          className="mt-6 text-sm font-medium text-red-600 underline disabled:opacity-50"
        >
          {loading ? "Working…" : "Unpublish"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">Choose a plan to publish</h1>
      <p className="mt-1 max-w-md text-sm text-zinc-600">
        Publish free now. Paid plans will become available when subscription billing launches.
      </p>

      {error && (
        <p className="mt-4 max-w-md rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {plans.map((plan) => {
          const available = plan.priceCents === 0;
          return (
            <button
              key={plan.id}
              onClick={() => available && setSelectedPlan(plan.id)}
              disabled={!available}
              className={`rounded-2xl border-2 bg-white p-5 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                selectedPlan === plan.id
                  ? "border-zinc-900"
                  : "border-zinc-200 hover:border-zinc-400"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-zinc-900">{plan.name}</p>
                {!available && (
                  <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
                    Coming soon
                  </span>
                )}
              </div>
              <p className="mt-1 text-2xl font-bold text-zinc-900">
                {formatPrice(plan.priceCents)}
                {plan.priceCents > 0 && (
                  <span className="text-sm font-normal text-zinc-500">/{plan.interval}</span>
                )}
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-zinc-600">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>

      <button
        onClick={handlePublish}
        disabled={loading || !selectedPlan}
        className="mt-8 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {loading ? "Publishing…" : "Publish my shop"}
      </button>
    </div>
  );
}
