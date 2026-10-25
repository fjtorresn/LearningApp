"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { colorClasses } from "@/lib/colors";
import { useApp } from "./AppProvider";
import { CommandPalette } from "./CommandPalette";
import { clearOfflineApiCache } from "./ServiceWorker";
import { ThemeToggle } from "./ThemeToggle";
import { TopicDialog } from "./TopicDialog";
import { btn, Kbd } from "./ui";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { setPaletteOpen } = useApp();
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Al cerrar sesión, borra las tarjetas guardadas para uso sin conexión.
  useEffect(() => {
    if (isLoaded && !isSignedIn) clearOfflineApiCache();
  }, [isLoaded, isSignedIn]);

  // Pantallas de login/registro: sin barra lateral ni cabecera.
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    return <AuthLayout>{children}</AuthLayout>;
  }
  // Esperamos a que Clerk cargue la sesión antes de que las páginas llamen a la API.
  if (!isLoaded || !isSignedIn) return null;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b pt-[env(safe-area-inset-top)] border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-7 place-items-center rounded-lg bg-zinc-900 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
              L
            </span>
            <span className="md:hidden">LearningApp</span>
            <span className="hidden lg:inline">LearningApp</span>
          </Link>

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="ml-2 hidden h-9 flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-400 transition hover:border-zinc-300 sm:max-w-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 md:flex"
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

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <ThemeToggle />
            <Link href="/cards/new" className={`${btn.primary} max-md:hidden`}>
              <span aria-hidden>+</span>
              Nueva tarjeta
            </Link>
            <div className="ml-1.5 grid size-8 place-items-center">
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-4">
        <Sidebar open={menuOpen} onNavigate={() => setMenuOpen(false)} />
        {/* pb extra en móvil para que la barra inferior no tape el contenido */}
        <main className="min-w-0 flex-1 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:py-8">{children}</main>
      </div>

      <MobileTabBar
        topicsOpen={menuOpen}
        onTopics={() => setMenuOpen((o) => !o)}
        onSearch={() => {
          setMenuOpen(false);
          setPaletteOpen(true);
        }}
        onNavigate={() => setMenuOpen(false)}
      />
      <CommandPalette />
    </div>
  );
}

const ICONS = {
  home: "M9.29 2.29a1 1 0 0 1 1.42 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-3v-5H8v5H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.71-1.71l7-7Z",
  topics:
    "M3 4.75A1.75 1.75 0 0 1 4.75 3h3.5A1.75 1.75 0 0 1 10 4.75v3.5A1.75 1.75 0 0 1 8.25 10h-3.5A1.75 1.75 0 0 1 3 8.25v-3.5Zm7 7A1.75 1.75 0 0 1 11.75 10h3.5A1.75 1.75 0 0 1 17 11.75v3.5A1.75 1.75 0 0 1 15.25 17h-3.5A1.75 1.75 0 0 1 10 15.25v-3.5ZM3 11.75A1.75 1.75 0 0 1 4.75 10h3.5A1.75 1.75 0 0 1 10 11.75v3.5A1.75 1.75 0 0 1 8.25 17h-3.5A1.75 1.75 0 0 1 3 15.25v-3.5ZM10 4.75A1.75 1.75 0 0 1 11.75 3h3.5A1.75 1.75 0 0 1 17 4.75v3.5A1.75 1.75 0 0 1 15.25 10h-3.5A1.75 1.75 0 0 1 10 8.25v-3.5Z",
  search:
    "M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.39l3.08 3.08a.75.75 0 1 1-1.06 1.06l-3.08-3.08A7 7 0 0 1 2 9Z",
  plus: "M10 3a.75.75 0 0 1 .75.75v5.5h5.5a.75.75 0 0 1 0 1.5h-5.5v5.5a.75.75 0 0 1-1.5 0v-5.5h-5.5a.75.75 0 0 1 0-1.5h5.5v-5.5A.75.75 0 0 1 10 3Z",
};

/** Barra de navegación inferior: solo en pantallas pequeñas (como una app nativa). */
function MobileTabBar({
  topicsOpen,
  onTopics,
  onSearch,
  onNavigate,
}: {
  topicsOpen: boolean;
  onTopics: () => void;
  onSearch: () => void;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const item = (active: boolean) =>
    `flex flex-1 flex-col items-center gap-0.5 pt-2 pb-1.5 text-[11px] font-medium transition ${
      active ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400 dark:text-zinc-500"
    }`;
  const icon = (d: string) => (
    <svg className="size-6" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" clipRule="evenodd" d={d} />
    </svg>
  );

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-950/90"
      aria-label="Navegación principal"
    >
      <div className="flex items-stretch">
        <Link href="/" onClick={onNavigate} className={item(pathname === "/" && !topicsOpen)}>
          {icon(ICONS.home)}
          Inicio
        </Link>
        <button type="button" onClick={onTopics} className={item(topicsOpen || pathname.startsWith("/topics"))}>
          {icon(ICONS.topics)}
          Temas
        </button>
        <button type="button" onClick={onSearch} className={item(pathname === "/search")}>
          {icon(ICONS.search)}
          Buscar
        </button>
        <Link href="/cards/new" onClick={onNavigate} className={item(pathname === "/cards/new")}>
          <span className="grid size-6 place-items-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
            <svg className="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d={ICONS.plus} />
            </svg>
          </span>
          Nueva
        </Link>
      </div>
    </nav>
  );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="text-center">
        <span className="mx-auto mb-3 grid size-10 place-items-center rounded-xl bg-zinc-900 text-lg font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
          L
        </span>
        <h1 className="text-xl font-semibold tracking-tight">LearningApp</h1>
        <p className="mt-1 text-sm text-zinc-500">Tus conceptos y tecnologías, siempre a mano</p>
      </div>
      {children}
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
      className={`${open ? "fixed inset-x-0 top-14 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 block overflow-y-auto bg-white px-4 dark:bg-zinc-950" : "hidden"} md:static md:block md:w-56 md:shrink-0 md:bg-transparent md:px-0`}
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
