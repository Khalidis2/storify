"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_FULFILLMENT_STATUSES } from "@/lib/order-fulfillment";

const LABELS: Record<string, string> = {
  UNFULFILLED: "Unfulfilled",
  PROCESSING: "Processing",
  FULFILLED: "Fulfilled",
};

export function OrderFulfillmentControl({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateStatus(nextStatus: string) {
    const previous = status;
    setStatus(nextStatus);
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/orders/${orderId}/fulfillment`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    setSaving(false);
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setStatus(previous);
      setError(data.error || "Could not update fulfilment.");
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <label className="text-xs font-medium text-zinc-500">
        Fulfilment status
      </label>
      <select
        value={status}
        onChange={(event) => updateStatus(event.target.value)}
        disabled={saving}
        className="ml-2 rounded-lg border border-zinc-300 px-2 py-1 text-sm disabled:opacity-50"
      >
        {ORDER_FULFILLMENT_STATUSES.map((value) => (
          <option key={value} value={value}>
            {LABELS[value]}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
