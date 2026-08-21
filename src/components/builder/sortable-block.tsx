"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Block } from "@/lib/blocks";
import { BLOCK_DEFS } from "@/lib/blocks";
import { BlockRenderer, type RenderProduct } from "@/components/block-renderer";

export function SortableBlock({
  block,
  products,
  selected,
  onSelect,
  onRemove,
  onDuplicate,
  onTextChange,
}: {
  block: Block;
  products: RenderProduct[];
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onTextChange: (key: string, value: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative border-2 transition ${
        selected ? "border-indigo-500" : "border-transparent hover:border-indigo-200"
      }`}
    >
      {/* Drag handle: a generous strip along the left edge, easier to grab than a tiny icon */}
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        title="Drag to reorder"
        className="absolute left-0 top-0 z-10 flex h-full w-7 cursor-grab touch-none items-center justify-center bg-indigo-500/0 text-white opacity-0 transition group-hover:bg-indigo-500/80 group-hover:opacity-100 active:cursor-grabbing"
      >
        <span className="text-lg leading-none tracking-tighter">⠿</span>
      </button>

      <BlockRenderer
        block={block}
        products={products}
        editable
        onTextChange={onTextChange}
      />

      <div className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <span className="rounded bg-zinc-900/80 px-2 py-1 text-xs font-medium text-white">
          {BLOCK_DEFS[block.type].label}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="pointer-events-auto rounded bg-zinc-900/80 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-900"
          title="Duplicate block"
        >
          ⧉
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="pointer-events-auto rounded bg-red-600/90 px-2 py-1 text-xs font-medium text-white hover:bg-red-600"
          title="Remove block"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
