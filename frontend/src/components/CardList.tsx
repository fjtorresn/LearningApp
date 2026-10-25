import Link from "next/link";
import type { SearchHit } from "@/lib/api";
import { formatDate } from "@/lib/hooks";
import { TagChip, TopicBadge } from "./Badges";
import { Highlight } from "./Highlight";

export function CardList({ hits, showTopic = true }: { hits: SearchHit[]; showTopic?: boolean }) {
  return (
    <ul className="grid gap-3">
      {hits.map((hit) => (
        <li key={hit.id}>
          <Link
            href={`/cards/${hit.id}`}
            className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                <Highlight text={hit.title_highlighted} />
              </h3>
              {showTopic && <TopicBadge topic={hit.topic} link={false} />}
              <span className="ml-auto text-xs text-zinc-400">{formatDate(hit.updated_at)}</span>
            </div>
            {hit.snippet && (
              <p className="mt-1.5 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                <Highlight text={hit.snippet} plain />
              </p>
            )}
            {hit.tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {hit.tags.map((t) => (
                  <TagChip key={t} name={t} />
                ))}
              </div>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
