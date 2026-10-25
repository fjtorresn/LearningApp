"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AppProvider";
import { SearchView } from "@/components/SearchView";
import { TopicDialog } from "@/components/TopicDialog";
import { btn } from "@/components/ui";
import { api } from "@/lib/api";
import { colorClasses } from "@/lib/colors";

export default function TopicPage() {
  const { id } = useParams<{ id: string }>();
  const topicId = Number(id);
  const router = useRouter();
  const { topics, topicsLoaded, reloadTopics } = useApp();
  const [editing, setEditing] = useState(false);
  const topic = topics.find((t) => t.id === topicId);

  useEffect(() => {
    if (topicsLoaded && !topic) router.replace("/");
  }, [topicsLoaded, topic, router]);

  if (!topic) return null;

  async function remove() {
    if (!topic) return;
    const n = topic.card_count;
    const msg = n
      ? `¿Borrar el tema «${topic.name}» y sus ${n} ${n === 1 ? "tarjeta" : "tarjetas"}? No se puede deshacer.`
      : `¿Borrar el tema «${topic.name}»?`;
    if (!confirm(msg)) return;
    await api.deleteTopic(topic.id);
    await reloadTopics();
    router.push("/");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className={`size-3 rounded-full ${colorClasses[topic.color].dot}`} />
            <h1 className="truncate text-2xl font-semibold tracking-tight">{topic.name}</h1>
          </div>
          {topic.description && <p className="mt-1 text-zinc-500">{topic.description}</p>}
        </div>
        <div className="flex gap-1">
          <button type="button" className={btn.secondary} onClick={() => setEditing(true)}>
            Editar
          </button>
          <button type="button" className={btn.danger} onClick={remove}>
            Borrar
          </button>
          <Link href={`/cards/new?topic=${topic.id}`} className={btn.primary}>
            + Tarjeta
          </Link>
        </div>
      </div>

      {/* key: reinicia los filtros al cambiar de tema */}
      <SearchView key={topic.id} fixedTopicId={topic.id} />

      <TopicDialog open={editing} onClose={() => setEditing(false)} topic={topic} />
    </div>
  );
}
