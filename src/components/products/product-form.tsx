"use client";

import { useState } from "react";
import { ImageUploadField } from "@/components/image-upload-field";

export interface ProductInput {
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  imageFocalX: number;
  imageFocalY: number;
  stock: string;
}

export function ProductForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial?: Partial<ProductInput>;
  onCancel: () => void;
  onSubmit: (input: ProductInput) => Promise<string | null>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [imageFocalX, setImageFocalX] = useState(initial?.imageFocalX ?? 50);
  const [imageFocalY, setImageFocalY] = useState(initial?.imageFocalY ?? 50);
  const [stock, setStock] = useState(initial?.stock ?? "0");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const err = await onSubmit({
      title,
      description,
      price,
      imageUrl,
      imageFocalX,
      imageFocalY,
      stock,
    });
    setLoading(false);
    if (err) setError(err);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6"
    >
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-zinc-700">Title</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Price (USD)
          </label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Stock
          </label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      <ImageUploadField
        label="Product image"
        value={imageUrl}
        onChange={setImageUrl}
        focalX={imageFocalX}
        focalY={imageFocalY}
        onFocalChange={(x, y) => {
          setImageFocalX(x);
          setImageFocalY(y);
        }}
      />

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save product"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
