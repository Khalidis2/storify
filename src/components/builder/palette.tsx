"use client";

import { BLOCK_DEFS, BLOCK_ORDER, type BlockType } from "@/lib/blocks";

export function Palette({ onAdd }: { onAdd: (type: BlockType) => void }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h3 className="font-semibold text-zinc-900">Add a section</h3>
      <div className="mt-3 grid grid-cols-1 gap-2">
        {BLOCK_ORDER.map((type) => {
          const def = BLOCK_DEFS[type];
          return (
            <button
              key={type}
              onClick={() => onAdd(type)}
              className="flex flex-col items-start rounded-lg border border-zinc-200 px-3 py-2 text-left hover:border-zinc-400 hover:bg-zinc-50"
            >
              <span className="text-sm font-medium text-zinc-900">
                {def.label}
              </span>
              <span className="text-xs text-zinc-500">{def.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
