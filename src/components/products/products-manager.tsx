"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductForm, type ProductInput } from "@/components/products/product-form";

export interface ProductRow {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  imageFocalX: number;
  imageFocalY: number;
  stock: number;
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

function toPayload(input: ProductInput) {
  const priceFloat = Number.parseFloat(input.price);
  return {
    title: input.title,
    description: input.description,
    priceCents: Number.isFinite(priceFloat) ? Math.round(priceFloat * 100) : 0,
    imageUrl: input.imageUrl,
    imageFocalX: input.imageFocalX,
    imageFocalY: input.imageFocalY,
    stock: Number.parseInt(input.stock, 10) || 0,
  };
}

export function ProductsManager({ initialProducts }: { initialProducts: ProductRow[] }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [mode, setMode] = useState<"list" | "new" | string>("list");

  async function handleCreate(input: ProductInput): Promise<string | null> {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(input)),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.error || "Could not save product.";
    }
    const product = await res.json();
    setProducts((current) => [product, ...current]);
    setMode("list");
    router.refresh();
    return null;
  }

  async function handleUpdate(id: string, input: ProductInput): Promise<string | null> {
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toPayload(input)),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return data.error || "Could not save product.";
    }
    const product = await res.json();
    setProducts((current) => current.map((p) => (p.id === id ? product : p)));
    setMode("list");
    router.refresh();
    return null;
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((current) => current.filter((p) => p.id !== id));
      router.refresh();
    }
  }

  if (mode === "new") {
    return (
      <ProductForm onCancel={() => setMode("list")} onSubmit={handleCreate} />
    );
  }

  const editing = products.find((p) => p.id === mode);
  if (editing) {
    return (
      <ProductForm
        initial={{
          title: editing.title,
          description: editing.description ?? "",
          price: (editing.priceCents / 100).toString(),
          imageUrl: editing.imageUrl ?? "",
          imageFocalX: editing.imageFocalX,
          imageFocalY: editing.imageFocalY,
          stock: editing.stock.toString(),
        }}
        onCancel={() => setMode("list")}
        onSubmit={(input) => handleUpdate(editing.id, input)}
      />
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Products</h1>
        <button
          onClick={() => setMode("new")}
          className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          + Add product
        </button>
      </div>

      {products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
          No products yet. Add your first one to show it in your storefront&rsquo;s
          product grid.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
            >
              <div className="aspect-square w-full bg-zinc-100">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="h-full w-full object-cover"
                    style={{
                      objectPosition: `${product.imageFocalX}% ${product.imageFocalY}%`,
                    }}
                  />
                ) : null}
              </div>
              <div className="p-4">
                <p className="font-medium text-zinc-900">{product.title}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {formatPrice(product.priceCents)} · {product.stock} in stock
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => setMode(product.id)}
                    className="text-sm font-medium text-zinc-900 underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="text-sm font-medium text-red-600 underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
