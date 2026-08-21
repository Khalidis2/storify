import type { Block } from "@/lib/blocks";

export interface RenderProduct {
  id: string;
  title: string;
  priceCents: number;
  imageUrl: string | null;
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}

export function BlockRenderer({
  block,
  products,
}: {
  block: Block;
  products: RenderProduct[];
}) {
  const p = block.props;

  switch (block.type) {
    case "hero":
      return (
        <section
          className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center"
          style={{
            backgroundColor: String(p.backgroundColor || "#111827"),
            color: String(p.textColor || "#ffffff"),
            backgroundImage: p.imageUrl
              ? `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${p.imageUrl})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight">
            {String(p.heading || "")}
          </h1>
          {p.subheading && (
            <p className="max-w-xl text-lg opacity-90">{String(p.subheading)}</p>
          )}
          {p.buttonLabel && (
            <span className="mt-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-zinc-900">
              {String(p.buttonLabel)}
            </span>
          )}
        </section>
      );

    case "banner":
      return (
        <div
          className="px-6 py-3 text-center text-sm font-medium"
          style={{
            backgroundColor: String(p.backgroundColor || "#facc15"),
            color: String(p.textColor || "#111827"),
          }}
        >
          {String(p.message || "")}
        </div>
      );

    case "text":
      return (
        <section
          className="mx-auto max-w-3xl px-6 py-16"
          style={{
            textAlign: (p.align as string as "left" | "center" | "right") || "left",
          }}
        >
          {p.heading && (
            <h2 className="text-2xl font-semibold text-zinc-900">
              {String(p.heading)}
            </h2>
          )}
          {p.body && (
            <p className="mt-3 whitespace-pre-line text-zinc-600">
              {String(p.body)}
            </p>
          )}
        </section>
      );

    case "image":
      return (
        <figure className="mx-auto max-w-4xl px-6 py-10">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={String(p.imageUrl)}
              alt={String(p.caption || "")}
              className="w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-zinc-100 text-sm text-zinc-400">
              No image set
            </div>
          )}
          {p.caption && (
            <figcaption className="mt-2 text-center text-sm text-zinc-500">
              {String(p.caption)}
            </figcaption>
          )}
        </figure>
      );

    case "productGrid": {
      const columns = Number(p.columns) || 3;
      const colsClass =
        columns === 2
          ? "sm:grid-cols-2"
          : columns === 4
          ? "sm:grid-cols-4"
          : "sm:grid-cols-3";
      return (
        <section className="mx-auto max-w-6xl px-6 py-16">
          {p.heading && (
            <h2 className="mb-8 text-center text-2xl font-semibold text-zinc-900">
              {String(p.heading)}
            </h2>
          )}
          {products.length === 0 ? (
            <p className="text-center text-sm text-zinc-400">
              No products yet.
            </p>
          ) : (
            <div className={`grid grid-cols-1 gap-6 ${colsClass}`}>
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
                      />
                    ) : null}
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-zinc-900">{product.title}</p>
                    <p className="mt-1 text-sm text-zinc-600">
                      {formatPrice(product.priceCents)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }

    case "footer":
      return (
        <footer
          className="px-6 py-8 text-center text-sm"
          style={{
            backgroundColor: String(p.backgroundColor || "#f4f4f5"),
            color: String(p.textColor || "#52525b"),
          }}
        >
          {String(p.text || "")}
        </footer>
      );

    case "spacer":
      return <div style={{ height: `${Number(p.height) || 48}px` }} />;

    default:
      return null;
  }
}
