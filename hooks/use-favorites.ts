"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "openclauses:favorites:v1";
const CHANGE_EVENT = "openclauses-favorites-change";

function readStored(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n) => typeof n === "number" && Number.isFinite(n));
  } catch {
    return [];
  }
}

function writeStored(ids: number[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    // Broadcast to other components in the same tab. The native `storage` event
    // only fires across tabs.
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
  } catch {
    /* quota exceeded or storage disabled — silently no-op */
  }
}

/**
 * localStorage-backed favorites. Returns:
 *   - ids: ordered list of favorited clause IDs (most-recently added LAST)
 *   - isFavorite(id): boolean lookup
 *   - toggle(id): add or remove
 *   - mounted: false during SSR/first paint, true after hydration
 *
 * Components should branch on `mounted` to avoid hydration mismatch.
 */
export function useFavorites() {
  const [ids, setIds] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setIds(readStored());
    setMounted(true);

    const onChange = () => setIds(readStored());
    window.addEventListener(CHANGE_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(CHANGE_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const toggle = useCallback((id: number) => {
    const current = readStored();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    writeStored(next);
    setIds(next);
  }, []);

  const isFavorite = useCallback(
    (id: number) => ids.includes(id),
    [ids]
  );

  return { ids, isFavorite, toggle, mounted, count: ids.length };
}
