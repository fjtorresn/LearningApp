"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, type SearchHit, type TagCount } from "@/lib/api";
import { colorClasses } from "@/lib/colors";
import { useDebounced } from "@/lib/hooks";
import { useApp } from "./AppProvider";
import { TagChip } from "./Badges";
import { CardList } from "./CardList";
import { ErrorBox, input } from "./ui";

interface Props {
  /** Si se pasa, la búsqueda queda limitada a ese tema (página del tema). */
  fixedTopicId?: number;
  initialQuery?: string;
  initialTopicId?: number | null;
  initialTags?: string[];
  /** Refleja los filtros en la URL (?q=&topic=&tags=) para poder compartir/recargar. */
  syncUrl?: boolean;
  autoFocus?: boolean;
}

export function SearchView({
  fixedTopicId,
  initialQuery = "",
  initialTopicId = null,
  initialTags = [],
  syncUrl = false,
  autoFocus = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { topics } = useApp();
  const [query, setQuery] = useState(initialQuery);
  const [topicId, setTopicId] = useState<number | null>(fixedTopicId ?? initialTopicId);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags);
  const [availableTags, setAvailableTags] = useState<TagCount[]>([]);
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounced(query, 200);
  const tagsKey = selectedTags.join(",");

  useEffect(() => {
    api.listTags(topicId).then(setAvailableTags).catch(() => {});
  }, [topicId, topics]);

  useEffect(() => {
    const ctrl = new AbortController();
    api
      .search({ q: debouncedQuery, topicId, tags: tagsKey ? tagsKey.split(",") : [] }, ctrl.signal)
      .then((res) => {
        setHits(res);
        setError(null);
      })
      .catch((e) => {
        if ((e as Error).name !== "AbortError") setError((e as Error).message);
      });
    return () => ctrl.abort();
  }, [debouncedQuery, topicId, tagsKey]);

  useEffect(() => {
    if (!syncUrl) return;
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (topicId) params.set("topic", String(topicId));
    if (tagsKey) params.set("tags", tagsKey);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [syncUrl, debouncedQuery, topicId, tagsKey, pathname, router]);

  function toggleTag(name: string) {
    setSelectedTags((tags) => (tags.includes(name) ? tags.filter((t) => t !== name) : [...tags, name]));
  }

  // Los tags seleccionados se muestran aunque ya no existan en el tema filtrado.
  const tagOptions = [
    ...availableTags,
    ...selectedTags.filter((t) => !availableTags.some((a) => a.name === t)).map((name) => ({ name, count: 0 })),
  ];
  const hasFilters = !!query || selectedTags.length > 0 || (!fixedTopicId && topicId !== null);

  return (
    <div className="space-y-5">
      <div className="relative">
        <svg
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.39l3.08 3.08a.75.75 0 1 1-1.06 1.06l-3.08-3.08A7 7 0 0 1 2 9Z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={fixedTopicId ? "Buscar en este tema…" : "Buscar en todas tus tarjetas…"}
          className={`${input} h-11 pl-9 text-base`}
          autoFocus={autoFocus}
          aria-label="Buscar"
        />
      </div>

      {!fixedTopicId && topics.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-zinc-500">Tema:</span>
          <FilterPill active={topicId === null} onClick={() => setTopicId(null)}>
            Todos
          </FilterPill>
          {topics.map((t) => (
            <FilterPill key={t.id} active={topicId === t.id} onClick={() => setTopicId(topicId === t.id ? null : t.id)}>
              <span className={`size-1.5 rounded-full ${colorClasses[t.color].dot}`} />
              {t.name}
            </FilterPill>
          ))}
        </div>
      )}

      {tagOptions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-medium text-zinc-500">Tags:</span>
          {tagOptions.map((t) => (
            <TagChip
              key={t.name}
              name={t.name}
              count={t.count}
              active={selectedTags.includes(t.name)}
              onClick={() => toggleTag(t.name)}
            />
          ))}
        </div>
      )}

      <ErrorBox message={error} />

      {hits && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>
              {hits.length} {hits.length === 1 ? "tarjeta" : "tarjetas"}
              {!query && " · más recientes primero"}
            </span>
            {hasFilters && (
              <button
                type="button"
                className="hover:text-zinc-900 dark:hover:text-zinc-100"
                onClick={() => {
                  setQuery("");
                  setSelectedTags([]);
                  if (!fixedTopicId) setTopicId(null);
                }}
              >
                Limpiar filtros
              </button>
            )}
          </div>
          {hits.length > 0 ? (
            <CardList hits={hits} showTopic={!fixedTopicId} />
          ) : (
            <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
              {hasFilters ? "Ninguna tarjeta coincide con la búsqueda." : "Aún no hay tarjetas aquí."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "bg-white text-zinc-600 ring-1 ring-zinc-200 ring-inset hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700 dark:hover:bg-zinc-800"
      }`}
    >
      {children}
    </button>
  );
}
