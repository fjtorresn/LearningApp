"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { colorClasses } from "@/lib/colors";
import { useApp } from "./AppProvider";
import { CommandPalette } from "./CommandPalette";
import { TopicDialog } from "./TopicDialog";
import { btn, Kbd } from "./ui";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { setPaletteOpen } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <button
            type="button"
            className="-ml-1 rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 md:hidden dark:hover:bg-zinc-800"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Mostrar temas"
          >
            <svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M3 5h14v1.5H3V5Zm0 4.25h14v1.5H3v-1.5Zm0 4.25h14V15H3v-1.5Z" />
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-7 place-items-center rounded-lg bg-zinc-900 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
              L
            </span>
            <span className="hidden sm:inline">LearningApp</span>
          </Link>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="ml-2 flex h-9 flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-400 transition hover:border-zinc-300 sm:max-w-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.39l3.08 3.08a.75.75 0 1 1-1.06 1.06l-3.08-3.08A7 7 0 0 1 2 9Z"
                clipRule="evenodd"
              />
            </svg>
            Buscar…
            <span className="ml-auto hidden sm:inline">
              <Kbd>Ctrl K</Kbd>
            </span>
          </button>

          <Link href="/cards/new" className={`${btn.primary} ml-auto shrink-0`}>
            <span aria-hidden>+</span>
            <span className="hidden sm:inline">Nueva tarjeta</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4">
        <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
        <main className="min-w-0 flex-1 py-8">{children}</main>
      </div>

      <CommandPalette />
    </div>
  );
}

function Sidebar({ open, onNavigate }: { open: boolean; onNavigate: () => void }) {
  const { topics, topicsError } = useApp();
  const pathname = usePathname();
  const [dialogOpen, setDialogOpen] = useState(false);

  const linkCls = (active: boolean) =>
    `flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition ${
      active
        ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
    }`;

  return (
    <aside
      className={`${open ? "fixed inset-x-0 top-14 bottom-0 z-20 block overflow-y-auto bg-white px-4 dark:bg-zinc-950" : "hidden"} md:static md:block md:w-56 md:shrink-0 md:bg-transparent md:px-0`}
    >
      <nav className="space-y-6 py-8 md:sticky md:top-14">
        <div className="space-y-0.5">
          <Link href="/" onClick={onNavigate} className={linkCls(pathname === "/")}>
            Inicio
          </Link>
          <Link href="/search" onClick={onNavigate} className={linkCls(pathname === "/search")}>
            Buscar y filtrar
          </Link>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between px-2.5">
            <h2 className="text-xs font-medium uppercase tracking-wide text-zinc-400">Temas</h2>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="rounded px-1 text-lg leading-none text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Nuevo tema"
              title="Nuevo tema"
            >
              +
            </button>
          </div>
          {topicsError && <p className="px-2.5 text-xs text-red-500">{topicsError}</p>}
          <ul className="space-y-0.5">
            {topics.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/topics/${t.id}`}
                  onClick={onNavigate}
                  className={linkCls(pathname === `/topics/${t.id}`)}
                >
                  <span className={`size-2 shrink-0 rounded-full ${colorClasses[t.color].dot}`} />
                  <span className="truncate">{t.name}</span>
                  <span className="ml-auto text-xs text-zinc-400">{t.card_count}</span>
                </Link>
              </li>
            ))}
          </ul>
          {topics.length === 0 && !topicsError && (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="px-2.5 text-sm text-zinc-500 underline-offset-2 hover:underline"
            >
              Crea tu primer tema
            </button>
          )}
        </div>
      </nav>
      <TopicDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </aside>
  );
}
