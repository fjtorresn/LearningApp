"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { TagChip, TopicBadge } from "@/components/Badges";
import { Markdown } from "@/components/Markdown";
import { btn, ErrorBox } from "@/components/ui";
import { api, type Card } from "@/lib/api";
import { formatDate } from "@/lib/hooks";

export default function CardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { reloadTopics } = useApp();
  const [card, setCard] = useState<Card | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getCard(Number(id))
      .then(setCard)
      .catch((e) => setError((e as Error).message));
  }, [id]);

  // "e" para editar rápidamente (si no se está escribiendo en un campo).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (e.key === "e" && !e.ctrlKey && !e.metaKey && !el.closest("input, textarea, select, [role=dialog]")) {
        router.push(`/cards/${id}/edit`);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, router]);

  async function remove() {
    if (!card || !confirm(`¿Borrar la tarjeta «${card.title}»?`)) return;
    await api.deleteCard(card.id);
    await reloadTopics();
    router.push(`/topics/${card.topic.id}`);
  }

  if (error) return <ErrorBox message={error} />;
  if (!card) return null;

  return (
    <article className="space-y-6">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
          <TopicBadge topic={card.topic} />
          <span>·</span>
          <span>Actualizada {formatDate(card.updated_at)}</span>
        </div>
        <div className="flex flex-wrap items-start gap-4">
          <h1 className="min-w-0 flex-1 text-3xl font-semibold tracking-tight break-words">{card.title}</h1>
          <div className="flex gap-1">
            <Link href={`/cards/${card.id}/edit`} className={btn.secondary} title="Atajo: e">
              Editar
            </Link>
            <button type="button" className={btn.danger} onClick={remove}>
              Borrar
            </button>
          </div>
        </div>
        {card.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {card.tags.map((t) => (
              <Link key={t} href={`/search?tags=${encodeURIComponent(t)}`} className="hover:opacity-75">
                <TagChip name={t} />
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {card.content.trim() ? (
          <Markdown>{card.content}</Markdown>
        ) : (
          <p className="text-sm text-zinc-400">Sin descripción todavía.</p>
        )}
      </div>
    </article>
  );
}
