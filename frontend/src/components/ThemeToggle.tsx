"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY as STORAGE_KEY } from "@/lib/theme";

export type ThemePreference = "light" | "dark" | "system";

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function applyTheme(pref: ThemePreference) {
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

// Pequeño "store" para que todos los componentes lean la misma preferencia.
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function setPreference(pref: ThemePreference) {
  try {
    if (pref === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch {}
  applyTheme(pref);
  listeners.forEach((l) => l());
}

export function useTheme() {
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as ThemePreference);

  // Con "Sistema", reacciona en vivo si cambias el tema del sistema operativo.
  useEffect(() => {
    if (preference !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  return { preference, setPreference };
}

const OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  {
    value: "light",
    label: "Claro",
    icon: (
      <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2Zm0 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm5.66-2.66a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0Zm-9.2 9.2a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06-1.06l1.06-1.06a.75.75 0 0 1 1.06 0ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10Zm10.66 5.66a.75.75 0 0 1-1.06 0l-1.06-1.06a.75.75 0 1 1 1.06-1.06l1.06 1.06a.75.75 0 0 1 0 1.06Zm-9.2-9.2a.75.75 0 0 1-1.06 0L4.34 5.4A.75.75 0 0 1 5.4 4.34l1.06 1.06a.75.75 0 0 1 0 1.06Z" />
    ),
  },
  {
    value: "dark",
    label: "Oscuro",
    icon: (
      <path
        fillRule="evenodd"
        d="M7.46 2.3a.75.75 0 0 1 .1.85 6 6 0 0 0 8.29 8.29.75.75 0 0 1 .97 1.07A7.5 7.5 0 1 1 6.6 2.21a.75.75 0 0 1 .86.09Z"
        clipRule="evenodd"
      />
    ),
  },
  {
    value: "system",
    label: "Sistema",
    icon: (
      <path
        fillRule="evenodd"
        d="M2 4.25A2.25 2.25 0 0 1 4.25 2h11.5A2.25 2.25 0 0 1 18 4.25v8.5A2.25 2.25 0 0 1 15.75 15h-3.1l.4 1.5h1.2a.75.75 0 0 1 0 1.5H5.75a.75.75 0 0 1 0-1.5h1.2l.4-1.5h-3.1A2.25 2.25 0 0 1 2 12.75v-8.5Zm2.25-.75a.75.75 0 0 0-.75.75v8.5c0 .41.34.75.75.75h11.5c.41 0 .75-.34.75-.75v-8.5a.75.75 0 0 0-.75-.75H4.25Z"
        clipRule="evenodd"
      />
    ),
  },
];

export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((o) => o.value === preference)!;

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Tema: ${current.label}`}
        title={`Tema: ${current.label}`}
        className="grid size-9 place-items-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          {current.icon}
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 w-36 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="menuitemradio"
              aria-checked={preference === o.value}
              onClick={() => {
                setPreference(o.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm ${
                preference === o.value
                  ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/60"
              }`}
            >
              <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                {o.icon}
              </svg>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
