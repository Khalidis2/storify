"use client";

import { useEffect, useRef } from "react";

/**
 * A contentEditable span/div that only writes the `value` prop into the DOM
 * when it changes from something other than what we last committed —
 * otherwise every keystroke's re-render would reset the cursor position.
 */
export function EditableText({
  value,
  onCommit,
  as: Tag = "span",
  className,
  multiline = false,
  placeholder,
}: {
  value: string;
  onCommit: (value: string) => void;
  as?: "span" | "div" | "h1" | "h2" | "h3" | "p";
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    if (ref.current && lastSynced.current !== value) {
      ref.current.textContent = value;
      lastSynced.current = value;
    }
  }, [value]);

  function handleBlur(e: React.FocusEvent<HTMLElement>) {
    const text = e.currentTarget.textContent ?? "";
    lastSynced.current = text;
    if (text !== value) onCommit(text);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLElement>) {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
    if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  }

  return (
    <Tag
      ref={ref as never}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={`${className ?? ""} rounded outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 empty:before:content-[attr(data-placeholder)] empty:before:opacity-50`}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    />
  );
}
