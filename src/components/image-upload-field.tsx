"use client";

import { useRef, useState } from "react";

export function ImageUploadField({
  value,
  onChange,
  label,
  focalX = 50,
  focalY = 50,
  onFocalChange,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  focalX?: number;
  focalY?: number;
  onFocalChange?: (x: number, y: number) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Upload failed. Please try again.");
        return;
      }
      onChange(data.url);
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  function updateFocalFromEvent(e: { clientX: number; clientY: number }) {
    const rect = previewRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.round(Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100)));
    onFocalChange?.(x, y);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!onFocalChange) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    updateFocalFromEvent(e);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    updateFocalFromEvent(e);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
  }

  return (
    <div>
      {label && (
        <label className="mb-1 block text-xs font-medium text-zinc-700">{label}</label>
      )}

      {value ? (
        <div className="mb-2">
          <div
            ref={previewRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className={`relative aspect-video w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 ${
              onFocalChange ? "cursor-crosshair touch-none select-none" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt=""
              draggable={false}
              className="pointer-events-none h-full w-full object-cover"
              style={{ objectPosition: `${focalX}% ${focalY}%` }}
            />
            {onFocalChange && (
              <div
                className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-indigo-500/80 shadow"
                style={{ left: `${focalX}%`, top: `${focalY}%` }}
              />
            )}
          </div>
          {onFocalChange && (
            <p className="mt-1 text-xs text-zinc-500">
              Click or drag on the image to choose what stays in view when it&rsquo;s cropped.
            </p>
          )}
          <button
            type="button"
            onClick={() => onChange("")}
            className="mt-1 text-xs font-medium text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      <div className="mt-2">
        <label className="block text-xs text-zinc-500">
          or paste an image URL
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
