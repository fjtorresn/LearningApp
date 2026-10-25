"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, type SearchHit } from "@/lib/api";
import { useDebounced } from "@/lib/hooks";
import { useApp } from "./AppProvider";
import { TopicBadge } from "./Badges";
import { Highlight } from "./Highlight";
import { Modal } from "./Modal";
import { Kbd } from "./ui";

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useApp();
  const close = () => setPaletteOpen(false);
  return (
    <Modal open={paletteOpen} onClose={close} position="top" className="max-w-xl">
      {paletteOpen && <Palette onClose={close} />}
    </Modal>
  );
}

function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const debounced = useDebounced(query, 120);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    api
      .search({ q: debounced, limit: 8 }, ctrl.signal)
      .then((res) => {
        setHits(res);
        setActive(0);
        setLoading(false);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [debounced]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  // La última opción (si hay texto) es "ver todos los resultados".
  const showAll = query.trim().length > 0;
  const total = hits.length + (showAll ? 1 : 0);

  function go(index: number) {
    if (index < hits.length) router.push(`/cards/${hits[index].id}`);
    else router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    onClose();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (total ? (a + 1) % total : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (total ? (a - 1 + total) % total : 0));
    } else if (e.key === "Enter" && total) {
      e.preventDefault();
      go(active);
    }
  }

  return (
    <div onKeyDown={onKeyDown}>
      <div className="flex items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-800">
        <svg className="size-5 shrink-0 text-zinc-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.39l3.08 3.08a.75.75 0 1 1-1.06 1.06l-3.08-3.08A7 7 0 0 1 2 9Z"
            clipRule="evenodd"
          />
        </svg>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar conceptos, descripciones o #tags…"
          className="h-14 w-full bg-transparent text-base outline-none placeholder:text-zinc-400"
          aria-label="Buscar"
        />
        <Kbd>Esc</Kbd>
      </div>

      <ul ref={listRef} className="max-h-[50vh] overflow-y-auto p-2" role="listbox">
        {!loading && hits.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-zinc-500">
            {query ? "Sin resultados" : "Aún no tienes tarjetas"}
          </li>
        )}
        {!query && hits.length > 0 && (
          <li className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-zinc-400">Recientes</li>
        )}
        {hits.map((hit, i) => (
          <li key={hit.id} role="option" aria-selected={i === active} data-active={i === active}>
            <button
              type="button"
              onMouseMove={() => setActive(i)}
              onClick={() => go(i)}
              className={`w-full rounded-lg px-3 py-2.5 text-left ${i === active ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
            >
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">
                  <Highlight text={hit.title_highlighted} />
                </span>
                <span className="ml-auto shrink-0">
                  <TopicBadge topic={hit.topic} link={false} />
                </span>
              </div>
              {hit.snippet && (
                <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
                  <Highlight text={hit.snippet} plain />
                </p>
              )}
            </button>
          </li>
        ))}
        {showAll && (
          <li role="option" aria-selected={active === hits.length} data-active={active === hits.length}>
            <button
              type="button"
              onMouseMove={() => setActive(hits.length)}
              onClick={() => go(hits.length)}
              className={`w-full rounded-lg px-3 py-2.5 text-left text-sm text-zinc-600 dark:text-zinc-300 ${
                active === hits.length ? "bg-zinc-100 dark:bg-zinc-800" : ""
              }`}
            >
              Ver todos los resultados para <span className="font-medium">«{query.trim()}»</span> con filtros →
            </button>
          </li>
        )}
      </ul>

      <div className="flex gap-4 border-t border-zinc-200 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800">
        <span>
          <Kbd>↑</Kbd> <Kbd>↓</Kbd> navegar
        </span>
        <span>
          <Kbd>Enter</Kbd> abrir
        </span>
      </div>
    </div>
  );
}
