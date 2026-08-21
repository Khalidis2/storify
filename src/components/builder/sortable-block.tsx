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
}: {
  block: Block;
  products: RenderProduct[];
  selected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`group relative cursor-pointer border-2 transition ${
        selected ? "border-indigo-500" : "border-transparent hover:border-indigo-200"
      }`}
    >
      <div className="pointer-events-none">
        <BlockRenderer block={block} products={products} />
      </div>

      <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 group-hover:opacity-100">
        <span className="rounded bg-zinc-900/80 px-2 py-1 text-xs font-medium text-white">
          {BLOCK_DEFS[block.type].label}
        </span>
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="cursor-grab rounded bg-zinc-900/80 px-2 py-1 text-xs font-medium text-white active:cursor-grabbing"
          title="Drag to reorder"
        >
          ⠿
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="rounded bg-red-600/90 px-2 py-1 text-xs font-medium text-white"
          title="Remove block"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
