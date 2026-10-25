import Link from "next/link";
import type { TopicBrief } from "@/lib/api";
import { colorClasses } from "@/lib/colors";

export function TopicBadge({ topic, link = true }: { topic: TopicBrief; link?: boolean }) {
  const cls = `inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${colorClasses[topic.color].badge}`;
  const inner = (
    <>
      <span className={`size-1.5 rounded-full ${colorClasses[topic.color].dot}`} />
      {topic.name}
    </>
  );
  return link ? (
    <Link href={`/topics/${topic.id}`} className={`${cls} hover:opacity-80`}>
      {inner}
    </Link>
  ) : (
    <span className={cls}>{inner}</span>
  );
}

export function TagChip({
  name,
  active,
  count,
  onClick,
}: {
  name: string;
  active?: boolean;
  count?: number;
  onClick?: () => void;
}) {
  const base = "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-mono transition-colors";
  const style = active
    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
    : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
  const content = (
    <>
      #{name}
      {count !== undefined && <span className="opacity-60">{count}</span>}
    </>
  );
  if (!onClick) return <span className={`${base} ${style}`}>{content}</span>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${base} ${style} ${active ? "" : "hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
    >
      {content}
    </button>
  );
}
