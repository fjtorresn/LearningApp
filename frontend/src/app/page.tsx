"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { CardList } from "@/components/CardList";
import { TopicDialog } from "@/components/TopicDialog";
import { btn, Kbd } from "@/components/ui";
import { api, type SearchHit } from "@/lib/api";
import { colorClasses } from "@/lib/colors";

export default function Home() {
  const { topics, topicsLoaded, topicsError, setPaletteOpen } = useApp();
  const [recent, setRecent] = useState<SearchHit[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    api.search({ limit: 5 }).then(setRecent).catch(() => {});
  }, [topics]);

  if (topicsError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
        <p className="font-medium">No se pudo conectar con el backend.</p>
        <p className="mt-1">
          Arráncalo con <code className="font-mono">./dev.sh</code> (o{" "}
          <code className="font-mono">uv run uvicorn app.main:app --reload</code> dentro de <code>backend/</code>).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Tu base de conocimiento</h1>
        <p className="mt-1 hidden text-zinc-500 md:block">
          Pulsa <Kbd>Ctrl K</Kbd> en cualquier momento para{" "}
          <button type="button" onClick={() => setPaletteOpen(true)} className="underline underline-offset-2">
            buscar un concepto
          </button>
          .
        </p>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Temas</h2>
          <button type="button" className={btn.secondary} onClick={() => setDialogOpen(true)}>
            + Nuevo tema
          </button>
        </div>
        {topicsLoaded && topics.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700">
            <p className="font-medium">Empieza creando un tema</p>
            <p className="mt-1 text-sm text-zinc-500">Por ejemplo: Backend-Python, GitHub, Frontend-NextJS…</p>
            <button type="button" className={`${btn.primary} mt-4`} onClick={() => setDialogOpen(true)}>
              Crear tema
            </button>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topics.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/topics/${t.id}`}
                  className={`flex h-full flex-col rounded-xl border border-t-4 border-zinc-200 bg-white p-4 transition hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${colorClasses[t.color].border}`}
                >
                  <span className="font-semibold">{t.name}</span>
                  {t.description && (
                    <span className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">{t.description}</span>
                  )}
                  <span className="mt-auto pt-3 text-xs text-zinc-400">
                    {t.card_count} {t.card_count === 1 ? "tarjeta" : "tarjetas"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {recent.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Editadas recientemente</h2>
            <Link href="/search" className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
              Ver todas →
            </Link>
          </div>
          <CardList hits={recent} />
        </section>
      )}

      <TopicDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  );
}
