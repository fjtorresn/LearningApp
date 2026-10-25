"use client";

import { useState } from "react";
import { api, type Topic, type TopicColor } from "@/lib/api";
import { colorClasses, colorLabels, TOPIC_COLORS } from "@/lib/colors";
import { useApp } from "./AppProvider";
import { Modal } from "./Modal";
import { btn, ErrorBox, input, label } from "./ui";

/** Crear (sin `topic`) o editar (con `topic`) un tema. */
export function TopicDialog({
  open,
  onClose,
  topic,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  topic?: Topic;
  onSaved?: (topic: Topic) => void;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      {/* key: reinicia el formulario cada vez que se abre */}
      {open && <TopicForm key={topic?.id ?? "new"} topic={topic} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function TopicForm({
  topic,
  onClose,
  onSaved,
}: {
  topic?: Topic;
  onClose: () => void;
  onSaved?: (topic: Topic) => void;
}) {
  const { reloadTopics } = useApp();
  const [name, setName] = useState(topic?.name ?? "");
  const [description, setDescription] = useState(topic?.description ?? "");
  const [color, setColor] = useState<TopicColor>(topic?.color ?? "blue");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = { name, description, color };
      const saved = topic ? await api.updateTopic(topic.id, data) : await api.createTopic(data);
      await reloadTopics();
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 p-6">
      <h2 className="text-lg font-semibold">{topic ? "Editar tema" : "Nuevo tema"}</h2>
      <div>
        <label htmlFor="topic-name" className={label}>
          Nombre
        </label>
        <input
          id="topic-name"
          className={input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="p. ej. Backend-Python"
          autoFocus
          required
          maxLength={100}
        />
      </div>
      <div>
        <label htmlFor="topic-desc" className={label}>
          Descripción <span className="font-normal text-zinc-400">(opcional)</span>
        </label>
        <input
          id="topic-desc"
          className={input}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="¿Qué agrupa este tema?"
        />
      </div>
      <fieldset>
        <legend className={label}>Color</legend>
        <div className="flex flex-wrap gap-2">
          {TOPIC_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              title={colorLabels[c]}
              aria-label={colorLabels[c]}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              className={`size-7 rounded-full ${colorClasses[c].dot} ring-offset-2 ring-offset-white transition dark:ring-offset-zinc-900 ${
                color === c ? "ring-2 ring-zinc-900 dark:ring-zinc-100" : "hover:scale-110"
              }`}
            />
          ))}
        </div>
      </fieldset>
      <ErrorBox message={error} />
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className={btn.secondary} onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className={btn.primary} disabled={saving || !name.trim()}>
          {saving ? "Guardando…" : topic ? "Guardar" : "Crear tema"}
        </button>
      </div>
    </form>
  );
}
