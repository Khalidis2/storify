"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { BLOCK_DEFS, createBlock, type Block, type BlockType } from "@/lib/blocks";
import type { RenderProduct } from "@/components/block-renderer";
import { SortableBlock } from "@/components/builder/sortable-block";
import { Palette } from "@/components/builder/palette";
import { SettingsPanel } from "@/components/builder/settings-panel";
import { useHistory } from "@/components/builder/use-history";

export function Builder({
  initialBlocks,
  products,
  storeUrl,
  currency,
}: {
  initialBlocks: Block[];
  products: RenderProduct[];
  storeUrl: string;
  currency: string;
}) {
  const { state: blocks, set: setBlocks, undo, redo, canUndo, canRedo } =
    useHistory<Block[]>(initialBlocks);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialBlocks[0]?.id ?? null
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
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

  function handleDuplicate(id: string) {
    setBlocks((current) => {
      const index = current.findIndex((b) => b.id === id);
      if (index === -1) return current;
      const copy: Block = {
        ...current[index],
        id: `${current[index].type}-${Math.random().toString(36).slice(2, 10)}`,
        props: { ...current[index].props },
      };
      const next = [...current];
      next.splice(index + 1, 0, copy);
      setSelectedId(copy.id);
      return next;
    });
  }

  function handlePropsChange(props: Record<string, string | number>) {
    setBlocks((current) =>
      current.map((b) => (b.id === selectedId ? { ...b, props } : b))
    );
  }

  function handleTextChange(blockId: string, key: string, value: string) {
    setBlocks((current) =>
      current.map((b) =>
        b.id === blockId ? { ...b, props: { ...b.props, [key]: value } } : b
      )
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
  const activeBlock = blocks.find((b) => b.id === activeId) ?? null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr_300px]">
      <div className="space-y-6 lg:order-1">
        <Palette onAdd={handleAdd} />
      </div>

      <div className="lg:order-2">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Page builder</h1>
            <p className="text-sm text-zinc-500">
              Drag the grip to reorder, click any text to edit it.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="rounded-full border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-30"
            >
              ↺
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
              className="rounded-full border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-30"
            >
              ↻
            </button>
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
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
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
                    currency={currency}
                    selected={block.id === selectedId}
                    onSelect={() => setSelectedId(block.id)}
                    onRemove={() => handleRemove(block.id)}
                    onDuplicate={() => handleDuplicate(block.id)}
                    onTextChange={(key, value) =>
                      handleTextChange(block.id, key, value)
                    }
                  />
                ))
              )}
            </SortableContext>
            <DragOverlay>
              {activeBlock ? (
                <div className="rounded-lg border border-indigo-400 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-lg">
                  {BLOCK_DEFS[activeBlock.type].label}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      <div className="lg:order-3">
        <SettingsPanel block={selectedBlock} onChange={handlePropsChange} />
      </div>
    </div>
  );
}
