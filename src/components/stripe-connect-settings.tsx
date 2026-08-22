"use client";

import { useEffect, useState } from "react";

interface ConnectStatus {
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}

export function StripeConnectSettings() {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/connect/status")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Status check failed.");
        setStatus(data);
      })
      .catch((value) => setError(value.message))
      .finally(() => setLoading(false));
  }, []);

  async function redirectTo(endpoint: string) {
    setAction(true);
    setError(null);
    const response = await fetch(endpoint, { method: "POST" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.url) {
      setError(data.error || "Could not open Stripe.");
      setAction(false);
      return;
    }
    window.location.href = data.url;
  }

  const ready = status?.chargesEnabled && status?.payoutsEnabled;

  return (
    <section className="max-w-lg rounded-2xl border border-zinc-200 bg-white p-6">
      <h2 className="font-semibold text-zinc-900">Payments and payouts</h2>
      {loading ? (
        <p className="mt-2 text-sm text-zinc-500">Checking Stripe…</p>
      ) : (
        <>
          <p className={`mt-2 text-sm ${ready ? "text-green-700" : "text-amber-700"}`}>
            {ready
              ? "Stripe is ready for customer payments and payouts."
              : status?.connected
                ? "Stripe needs more information before payments can start."
                : "Connect Stripe before publishing and accepting payments."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {!ready && (
              <button
                type="button"
                disabled={action}
                onClick={() => redirectTo("/api/connect/onboard")}
                className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {status?.connected ? "Continue Stripe setup" : "Connect Stripe"}
              </button>
            )}
            {ready && (
              <button
                type="button"
                disabled={action}
                onClick={() => redirectTo("/api/connect/dashboard")}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-50"
              >
                Open Stripe Express
              </button>
            )}
          </div>
        </>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}
