"use client";

import { useEffect, useState } from "react";
import { api, type TagCount } from "@/lib/api";

/** Igual que normalize_tag() del backend: "Base de Datos" -> "base-de-datos". */
export function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase().split(/\s+/).filter(Boolean).join("-");
}

export function TagInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const [allTags, setAllTags] = useState<TagCount[]>([]);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    api.listTags().then(setAllTags).catch(() => {});
  }, []);

  function add(raw: string) {
    const tag = normalizeTag(raw.replace(/^#/, ""));
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      if (draft.trim()) {
        e.preventDefault();
        add(draft);
      }
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  const q = normalizeTag(draft.replace(/^#/, ""));
  const suggestions = allTags
    .filter((t) => !value.includes(t.name) && (!q || t.name.includes(q)))
    .slice(0, 8);

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-within:border-zinc-500 dark:focus-within:ring-zinc-800">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-zinc-100 py-0.5 pl-1.5 pr-1 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            #{tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="rounded px-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-100"
              aria-label={`Quitar ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id="card-tags"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            if (draft.trim()) add(draft);
          }}
          placeholder={value.length ? "" : "orm, base-de-datos… (Enter para añadir)"}
          className="min-w-32 flex-1 bg-transparent py-0.5 text-base outline-none sm:text-sm placeholder:text-zinc-400"
        />
      </div>
      {focused && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 flex w-full flex-wrap gap-1.5 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          <span className="w-full text-xs text-zinc-400">Tags existentes</span>
          {suggestions.map((t) => (
            <button
              key={t.name}
              type="button"
              // onMouseDown (no onClick) para que se ejecute antes del blur del input
              onMouseDown={(e) => {
                e.preventDefault();
                add(t.name);
              }}
              className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              #{t.name} <span className="opacity-50">{t.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
