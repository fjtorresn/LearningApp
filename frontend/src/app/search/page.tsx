"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SearchView } from "@/components/SearchView";

export default function SearchPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Buscar y filtrar</h1>
      {/* useSearchParams necesita un límite de Suspense en páginas cliente */}
      <Suspense>
        <SearchFromUrl />
      </Suspense>
    </div>
  );
}

function SearchFromUrl() {
  const params = useSearchParams();
  const topic = params.get("topic");
  const tags = params.get("tags");
  return (
    <SearchView
      syncUrl
      autoFocus
      initialQuery={params.get("q") ?? ""}
      initialTopicId={topic ? Number(topic) : null}
      initialTags={tags ? tags.split(",") : []}
    />
  );
}
