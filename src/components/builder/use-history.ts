"use client";

import { useCallback, useState } from "react";

const MAX_HISTORY = 50;

export function useHistory<T>(initial: T) {
  const [history, setHistory] = useState<{ entries: T[]; index: number }>({
    entries: [initial],
    index: 0,
  });

  const state = history.entries[history.index];

  const set = useCallback((updater: T | ((prev: T) => T)) => {
    setHistory((h) => {
      const prev = h.entries[h.index];
      const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
      if (next === prev) return h;

      let entries = [...h.entries.slice(0, h.index + 1), next];
      let index = entries.length - 1;
      if (entries.length > MAX_HISTORY) {
        entries = entries.slice(entries.length - MAX_HISTORY);
        index = entries.length - 1;
      }
      return { entries, index };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => ({ ...h, index: Math.max(0, h.index - 1) }));
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => ({ ...h, index: Math.min(h.entries.length - 1, h.index + 1) }));
  }, []);

  return {
    state,
    set,
    undo,
    redo,
    canUndo: history.index > 0,
    canRedo: history.index < history.entries.length - 1,
  };
}
