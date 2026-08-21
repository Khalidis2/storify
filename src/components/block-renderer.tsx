import type { Block } from "@/lib/blocks";
import { EditableText } from "@/components/builder/editable-text";

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

function videoEmbedUrl(url: string): { kind: "iframe" | "video"; src: string } | null {
  if (!url) return null;
  const youtube = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/);
  if (youtube) return { kind: "iframe", src: `https://www.youtube.com/embed/${youtube[1]}` };
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  return { kind: "video", src: url };
}

type TextProps = {
  as: "span" | "div" | "h1" | "h2" | "h3" | "p";
  value: string;
  className?: string;
  placeholder?: string;
  editable: boolean;
  onCommit?: (value: string) => void;
};

function Text({ as: Tag, value, className, placeholder, editable, onCommit }: TextProps) {
  if (editable) {
    return (
      <EditableText
        as={Tag}
        value={value}
        onCommit={(v) => onCommit?.(v)}
        className={className}
        multiline={Tag === "p" || Tag === "div"}
        placeholder={placeholder}
      />
    );
  }
  if (!value) return null;
  return <Tag className={className}>{value}</Tag>;
}

export function BlockRenderer({
  block,
  products,
  editable = false,
  onTextChange,
}: {
  block: Block;
  products: RenderProduct[];
  editable?: boolean;
  onTextChange?: (key: string, value: string) => void;
}) {
  const p = block.props;
  const commit = (key: string) => (value: string) => onTextChange?.(key, value);
  const str = (key: string) => String(p[key] ?? "");

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
          <Text
            as="h1"
            value={str("heading")}
            className="max-w-2xl text-4xl font-bold tracking-tight"
            placeholder="Heading"
            editable={editable}
            onCommit={commit("heading")}
          />
          <Text
            as="p"
            value={str("subheading")}
            className="max-w-xl text-lg opacity-90"
            placeholder="Subheading"
            editable={editable}
            onCommit={commit("subheading")}
          />
          <Text
            as="span"
            value={str("buttonLabel")}
            className="mt-2 inline-block rounded-full bg-white px-6 py-3 text-sm font-medium text-zinc-900"
            placeholder="Button label"
            editable={editable}
            onCommit={commit("buttonLabel")}
          />
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
          <Text
            as="span"
            value={str("message")}
            placeholder="Announcement message"
            editable={editable}
            onCommit={commit("message")}
          />
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
          <Text
            as="h2"
            value={str("heading")}
            className="text-2xl font-semibold text-zinc-900"
            placeholder="Heading"
            editable={editable}
            onCommit={commit("heading")}
          />
          <Text
            as="p"
            value={str("body")}
            className="mt-3 whitespace-pre-line text-zinc-600"
            placeholder="Body text"
            editable={editable}
            onCommit={commit("body")}
          />
        </section>
      );

    case "image":
      return (
        <figure className="mx-auto max-w-4xl px-6 py-10">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={String(p.imageUrl)}
              alt={str("caption")}
              className="w-full rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-zinc-100 text-sm text-zinc-400">
              No image set
            </div>
          )}
          <Text
            as="p"
            value={str("caption")}
            className="mt-2 text-center text-sm text-zinc-500"
            placeholder="Caption"
            editable={editable}
            onCommit={commit("caption")}
          />
        </figure>
      );

    case "imageText": {
      const reversed = p.imagePosition === "right";
      return (
        <section className="mx-auto max-w-5xl px-6 py-16">
          <div
            className={`flex flex-col items-center gap-8 md:flex-row ${
              reversed ? "md:flex-row-reverse" : ""
            }`}
          >
            <div className="w-full md:w-1/2">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={String(p.imageUrl)}
                  alt=""
                  className="aspect-square w-full rounded-2xl object-cover"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-zinc-100 text-sm text-zinc-400">
                  No image set
                </div>
              )}
            </div>
            <div className="w-full md:w-1/2">
              <Text
                as="h2"
                value={str("heading")}
                className="text-2xl font-semibold text-zinc-900"
                placeholder="Heading"
                editable={editable}
                onCommit={commit("heading")}
              />
              <Text
                as="p"
                value={str("body")}
                className="mt-3 whitespace-pre-line text-zinc-600"
                placeholder="Body text"
                editable={editable}
                onCommit={commit("body")}
              />
              <Text
                as="span"
                value={str("buttonLabel")}
                className="mt-4 inline-block rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white"
                placeholder="Button label"
                editable={editable}
                onCommit={commit("buttonLabel")}
              />
            </div>
          </div>
        </section>
      );
    }

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
          <Text
            as="h2"
            value={str("heading")}
            className="mb-8 text-center text-2xl font-semibold text-zinc-900"
            placeholder="Heading"
            editable={editable}
            onCommit={commit("heading")}
          />
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

    case "testimonial":
      return (
        <section className="mx-auto max-w-2xl px-6 py-16 text-center">
          <Text
            as="p"
            value={str("quote")}
            className="text-xl font-medium text-zinc-900"
            placeholder="Customer quote"
            editable={editable}
            onCommit={commit("quote")}
          />
          <div className="mt-5 flex items-center justify-center gap-3">
            {p.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={String(p.avatarUrl)}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : null}
            <div className="text-left">
              <Text
                as="p"
                value={str("authorName")}
                className="text-sm font-semibold text-zinc-900"
                placeholder="Name"
                editable={editable}
                onCommit={commit("authorName")}
              />
              <Text
                as="p"
                value={str("authorRole")}
                className="text-xs text-zinc-500"
                placeholder="Role / subtitle"
                editable={editable}
                onCommit={commit("authorRole")}
              />
            </div>
          </div>
        </section>
      );

    case "faq":
      return (
        <section className="mx-auto max-w-3xl px-6 py-16">
          <Text
            as="h2"
            value={str("heading")}
            className="mb-8 text-center text-2xl font-semibold text-zinc-900"
            placeholder="Heading"
            editable={editable}
            onCommit={commit("heading")}
          />
          <div className="space-y-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="border-b border-zinc-200 pb-6 last:border-0">
                <Text
                  as="p"
                  value={str(`question${n}`)}
                  className="font-medium text-zinc-900"
                  placeholder={`Question ${n}`}
                  editable={editable}
                  onCommit={commit(`question${n}`)}
                />
                <Text
                  as="p"
                  value={str(`answer${n}`)}
                  className="mt-2 text-sm text-zinc-600"
                  placeholder={`Answer ${n}`}
                  editable={editable}
                  onCommit={commit(`answer${n}`)}
                />
              </div>
            ))}
          </div>
        </section>
      );

    case "video": {
      const embed = videoEmbedUrl(str("videoUrl"));
      return (
        <section className="mx-auto max-w-3xl px-6 py-16">
          <Text
            as="h2"
            value={str("heading")}
            className="mb-6 text-center text-2xl font-semibold text-zinc-900"
            placeholder="Heading (optional)"
            editable={editable}
            onCommit={commit("heading")}
          />
          {embed ? (
            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
              {embed.kind === "iframe" ? (
                <iframe
                  src={embed.src}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={embed.src} controls className="h-full w-full" />
              )}
            </div>
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-zinc-100 text-sm text-zinc-400">
              No video URL set
            </div>
          )}
        </section>
      );
    }

    case "social": {
      const links = [
        { key: "instagramUrl", label: "Instagram" },
        { key: "facebookUrl", label: "Facebook" },
        { key: "twitterUrl", label: "Twitter / X" },
        { key: "tiktokUrl", label: "TikTok" },
      ].filter((l) => editable || p[l.key]);
      return (
        <section className="px-6 py-12 text-center">
          <Text
            as="h2"
            value={str("heading")}
            className="mb-4 text-xl font-semibold text-zinc-900"
            placeholder="Heading"
            editable={editable}
            onCommit={commit("heading")}
          />
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            {links.map((l) =>
              editable ? (
                <span
                  key={l.key}
                  className="rounded-full border border-zinc-300 px-4 py-1.5 text-zinc-500"
                >
                  {l.label}
                </span>
              ) : (
                <a
                  key={l.key}
                  href={String(p[l.key])}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-zinc-300 px-4 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  {l.label}
                </a>
              )
            )}
          </div>
          {editable && (
            <p className="mt-3 text-xs text-zinc-400">
              Set each URL in the panel on the right — links only appear once filled in.
            </p>
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
          <Text
            as="span"
            value={str("text")}
            placeholder="Footer text"
            editable={editable}
            onCommit={commit("text")}
          />
        </footer>
      );

    case "spacer":
      return editable ? (
        <div className="flex items-center justify-center bg-zinc-50 text-xs text-zinc-400" style={{ height: `${Number(p.height) || 48}px` }}>
          Spacer — {Number(p.height) || 48}px
        </div>
      ) : (
        <div style={{ height: `${Number(p.height) || 48}px` }} />
      );

    default:
      return null;
  }
}
