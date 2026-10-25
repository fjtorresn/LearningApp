"use client";

import { useEffect, useState } from "react";

export function useDebounced<T>(value: T, delayMs = 200): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
}
