"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SUPPORTED_SHOP_CURRENCIES } from "@/lib/currency";

export function ShopSettingsForm({
  initial,
}: {
  initial: {
    name: string;
    tagline: string;
    primaryColor: string;
    logoUrl: string;
    currency: string;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [tagline, setTagline] = useState(initial.tagline);
  const [primaryColor, setPrimaryColor] = useState(initial.primaryColor);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [currency, setCurrency] = useState(initial.currency);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/shop", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, tagline, primaryColor, logoUrl, currency }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not save settings.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-lg space-y-4 rounded-2xl border border-zinc-200 bg-white p-6"
    >
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Settings saved.
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Shop name
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Tagline
        </label>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="e.g. Handmade goods since 2020"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Brand color
        </label>
        <div className="mt-1 flex items-center gap-2">
          <input
            type="color"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="h-9 w-9 rounded border border-zinc-300"
          />
          <input
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Logo URL
        </label>
        <input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://…"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Store currency
        </label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        >
          {SUPPORTED_SHOP_CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-zinc-500">
          Changing currency does not convert existing product prices.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
