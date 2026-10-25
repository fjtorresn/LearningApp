"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, type Card } from "@/lib/api";
import { useApp } from "./AppProvider";
import { Markdown } from "./Markdown";
import { TagInput } from "./TagInput";
import { btn, ErrorBox, input, label } from "./ui";

export function CardForm({ card, defaultTopicId }: { card?: Card; defaultTopicId?: number }) {
  const router = useRouter();
  const { topics, topicsLoaded, reloadTopics } = useApp();
  const [title, setTitle] = useState(card?.title ?? "");
  const [content, setContent] = useState(card?.content ?? "");
  const [topicId, setTopicId] = useState<number | "">(card?.topic.id ?? defaultTopicId ?? "");
  const [tags, setTags] = useState<string[]>(card?.tags ?? []);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Si solo hay un tema, lo preseleccionamos.
  const effectiveTopicId = topicId === "" && topics.length === 1 ? topics[0].id : topicId;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (effectiveTopicId === "") {
      setError("Elige un tema");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const data = { title, content, topic_id: effectiveTopicId, tags };
      const saved = card ? await api.updateCard(card.id, data) : await api.createCard(data);
      await reloadTopics(); // actualiza los contadores del sidebar
      router.push(`/cards/${saved.id}`);
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  }

  // Ctrl+Enter guarda desde cualquier campo.
  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      (e.currentTarget as HTMLFormElement).requestSubmit();
    }
  }

  if (topicsLoaded && topics.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
        Primero crea un tema con el botón <strong>+</strong> junto a «Temas».
      </p>
    );
  }

  return (
    <form onSubmit={submit} onKeyDown={onKeyDown} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-[1fr_14rem]">
        <div>
          <label htmlFor="card-title" className={label}>
            Concepto
          </label>
          <input
            id="card-title"
            className={`${input} text-base font-medium`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="p. ej. Alembic"
            autoFocus={!card}
            required
            maxLength={200}
          />
        </div>
        <div>
          <label htmlFor="card-topic" className={label}>
            Tema
          </label>
          <select
            id="card-topic"
            className={input}
            value={effectiveTopicId}
            onChange={(e) => setTopicId(e.target.value ? Number(e.target.value) : "")}
            required
          >
            <option value="">Elige un tema…</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-end justify-between">
          <label htmlFor="card-content" className={`${label} mb-0`}>
            Qué es y cómo se usa
          </label>
          <div className="flex rounded-lg bg-zinc-100 p-0.5 text-xs dark:bg-zinc-800" role="tablist">
            {(["write", "preview"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-md px-2.5 py-1 font-medium ${
                  tab === t ? "bg-white shadow-sm dark:bg-zinc-700" : "text-zinc-500"
                }`}
              >
                {t === "write" ? "Escribir" : "Vista previa"}
              </button>
            ))}
          </div>
        </div>
        {tab === "write" ? (
          <textarea
            id="card-content"
            className={`${input} min-h-72 font-mono leading-6 sm:text-[13px]`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"Soporta **Markdown**.\n\nEjemplo de código:\n```bash\nuv run alembic upgrade head\n```"}
          />
        ) : (
          <div className="min-h-72 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
            {content.trim() ? <Markdown>{content}</Markdown> : <p className="text-sm text-zinc-400">Nada que mostrar aún.</p>}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="card-tags" className={label}>
          Tags
        </label>
        <TagInput value={tags} onChange={setTags} />
      </div>

      <ErrorBox message={error} />

      <div className="flex items-center justify-end gap-2">
        <span className="mr-auto hidden text-xs text-zinc-400 sm:inline">Ctrl+Enter para guardar</span>
        <Link href={card ? `/cards/${card.id}` : "/"} className={btn.secondary}>
          Cancelar
        </Link>
        <button type="submit" className={btn.primary} disabled={saving || !title.trim()}>
          {saving ? "Guardando…" : card ? "Guardar cambios" : "Crear tarjeta"}
        </button>
      </div>
    </form>
  );
}
