"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { createBlock, type Block, type BlockType } from "@/lib/blocks";
import type { RenderProduct } from "@/components/block-renderer";
import { SortableBlock } from "@/components/builder/sortable-block";
import { Palette } from "@/components/builder/palette";
import { SettingsPanel } from "@/components/builder/settings-panel";

export function Builder({
  initialBlocks,
  products,
  storeUrl,
}: {
  initialBlocks: Block[];
  products: RenderProduct[];
  storeUrl: string;
}) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialBlocks[0]?.id ?? null
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setBlocks((current) => {
      const oldIndex = current.findIndex((b) => b.id === active.id);
      const newIndex = current.findIndex((b) => b.id === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  function handleAdd(type: BlockType) {
    const block = createBlock(type);
    setBlocks((current) => [...current, block]);
    setSelectedId(block.id);
  }

  function handleRemove(id: string) {
    setBlocks((current) => current.filter((b) => b.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  }

  function handlePropsChange(props: Record<string, string | number>) {
    setBlocks((current) =>
      current.map((b) => (b.id === selectedId ? { ...b, props } : b))
    );
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/page", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocks }),
    });
    setSaving(false);
    setSavedAt(Date.now());
  }

  const selectedBlock = blocks.find((b) => b.id === selectedId) ?? null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr_300px]">
      <div className="space-y-6 lg:order-1">
        <Palette onAdd={handleAdd} />
      </div>

      <div className="lg:order-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Page builder</h1>
            <p className="text-sm text-zinc-500">
              Drag sections to reorder, click one to edit it.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {savedAt && !saving && (
              <span className="text-xs text-green-600">Saved</span>
            )}
            <a
              href={storeUrl}
              target="_blank"
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Preview
            </a>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={blocks.map((b) => b.id)}
              strategy={verticalListSortingStrategy}
            >
              {blocks.length === 0 ? (
                <p className="p-10 text-center text-sm text-zinc-400">
                  Your page is empty. Add a section from the left to get
                  started.
                </p>
              ) : (
                blocks.map((block) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    products={products}
                    selected={block.id === selectedId}
                    onSelect={() => setSelectedId(block.id)}
                    onRemove={() => handleRemove(block.id)}
                  />
                ))
              )}
            </SortableContext>
          </DndContext>
        </div>
      </div>

      <div className="lg:order-3">
        <SettingsPanel block={selectedBlock} onChange={handlePropsChange} />
      </div>
    </div>
  );
}
