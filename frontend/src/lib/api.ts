// Cliente de la API de FastAPI. Las rutas /api/* se reenvían al backend (ver next.config.ts).

export type TopicColor = "blue" | "green" | "purple" | "orange" | "pink" | "teal" | "red" | "gray";

export interface TopicBrief {
  id: number;
  name: string;
  color: TopicColor;
}

export interface Topic extends TopicBrief {
  description: string;
  card_count: number;
  created_at: string;
}

export interface Card {
  id: number;
  title: string;
  content: string;
  topic: TopicBrief;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SearchHit {
  id: number;
  title: string;
  /** Coincidencias envueltas en \x02 … \x03 (ver <Highlight>). */
  title_highlighted: string;
  snippet: string;
  topic: TopicBrief;
  tags: string[];
  updated_at: string;
}

export interface TagCount {
  name: string;
  count: number;
}

export interface TopicInput {
  name: string;
  description: string;
  color: TopicColor;
}

export interface CardInput {
  title: string;
  content: string;
  topic_id: number;
  tags: string[];
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
      else if (Array.isArray(body.detail)) message = body.detail.map((d: { msg: string }) => d.msg).join(", ");
    } catch {
      // respuesta sin JSON (p. ej. el backend no está corriendo)
      if (res.status >= 500) message = "No se pudo conectar con el backend. ¿Está corriendo en el puerto 8765?";
    }
    throw new ApiError(res.status, message);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export interface SearchParams {
  q?: string;
  topicId?: number | null;
  tags?: string[];
  limit?: number;
}

export const api = {
  listTopics: () => request<Topic[]>("/topics"),
  getTopic: (id: number) => request<Topic>(`/topics/${id}`),
  createTopic: (data: TopicInput) => request<Topic>("/topics", { method: "POST", body: JSON.stringify(data) }),
  updateTopic: (id: number, data: Partial<TopicInput>) =>
    request<Topic>(`/topics/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTopic: (id: number) => request<void>(`/topics/${id}`, { method: "DELETE" }),

  getCard: (id: number) => request<Card>(`/cards/${id}`),
  createCard: (data: CardInput) => request<Card>("/cards", { method: "POST", body: JSON.stringify(data) }),
  updateCard: (id: number, data: Partial<CardInput>) =>
    request<Card>(`/cards/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteCard: (id: number) => request<void>(`/cards/${id}`, { method: "DELETE" }),

  listTags: (topicId?: number | null) => request<TagCount[]>(`/tags${topicId ? `?topic_id=${topicId}` : ""}`),

  search: ({ q = "", topicId, tags = [], limit }: SearchParams, signal?: AbortSignal) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (topicId) params.set("topic_id", String(topicId));
    tags.forEach((t) => params.append("tags", t));
    if (limit) params.set("limit", String(limit));
    return request<SearchHit[]>(`/search?${params}`, { signal });
  },
};
