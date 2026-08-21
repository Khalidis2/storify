"use client";

import type { Block } from "@/lib/blocks";
import { BLOCK_DEFS } from "@/lib/blocks";

export function SettingsPanel({
  block,
  onChange,
}: {
  block: Block | null;
  onChange: (props: Record<string, string | number>) => void;
}) {
  if (!block) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-500">
        Select a block on the left to edit its content.
      </div>
    );
  }

  const def = BLOCK_DEFS[block.type];

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h3 className="font-semibold text-zinc-900">{def.label}</h3>
      <p className="mt-1 text-xs text-zinc-500">{def.description}</p>

      <div className="mt-4 space-y-4">
        {def.fields.map((field) => {
          const value = block.props[field.key] ?? "";

          if (field.type === "textarea") {
            return (
              <div key={field.key}>
                <label className="block text-xs font-medium text-zinc-700">
                  {field.label}
                </label>
                <textarea
                  value={String(value)}
                  onChange={(e) =>
                    onChange({ ...block.props, [field.key]: e.target.value })
                  }
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                />
              </div>
            );
          }

          if (field.type === "select") {
            return (
              <div key={field.key}>
                <label className="block text-xs font-medium text-zinc-700">
                  {field.label}
                </label>
                <select
                  value={String(value)}
                  onChange={(e) =>
                    onChange({ ...block.props, [field.key]: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          if (field.type === "color") {
            return (
              <div key={field.key}>
                <label className="block text-xs font-medium text-zinc-700">
                  {field.label}
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={String(value || "#000000")}
                    onChange={(e) =>
                      onChange({ ...block.props, [field.key]: e.target.value })
                    }
                    className="h-9 w-9 rounded border border-zinc-300"
                  />
                  <input
                    type="text"
                    value={String(value)}
                    onChange={(e) =>
                      onChange({ ...block.props, [field.key]: e.target.value })
                    }
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                  />
                </div>
              </div>
            );
          }

          if (field.type === "number") {
            return (
              <div key={field.key}>
                <label className="block text-xs font-medium text-zinc-700">
                  {field.label}
                </label>
                <input
                  type="number"
                  value={Number(value)}
                  onChange={(e) =>
                    onChange({ ...block.props, [field.key]: Number(e.target.value) })
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
                />
              </div>
            );
          }

          return (
            <div key={field.key}>
              <label className="block text-xs font-medium text-zinc-700">
                {field.label}
              </label>
              <input
                type="text"
                value={String(value)}
                onChange={(e) =>
                  onChange({ ...block.props, [field.key]: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
