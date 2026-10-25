"use client";

import { useAuth } from "@clerk/nextjs";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, setAuthTokenGetter, type Topic } from "@/lib/api";

interface AppState {
  topics: Topic[];
  topicsLoaded: boolean;
  topicsError: string | null;
  reloadTopics: () => Promise<void>;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, getToken } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoaded, setTopicsLoaded] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const reloadTopics = useCallback(async () => {
    try {
      setTopics(await api.listTopics());
      setTopicsError(null);
    } catch (e) {
      setTopicsError((e as Error).message);
    } finally {
      setTopicsLoaded(true);
    }
  }, []);

  // getToken() devuelve un token vigente (Clerk lo renueva solo); se envía en cada llamada a la API.
  // Se registra durante el render para que esté listo antes de los efectos de los hijos.
  setAuthTokenGetter(getToken);

  useEffect(() => {
    if (!isSignedIn) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde la API
    reloadTopics();
  }, [isSignedIn, reloadTopics]);

  // Atajo global: Ctrl+K (o Cmd+K en Mac) abre el buscador.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AppContext.Provider value={{ topics, topicsLoaded, topicsError, reloadTopics, paletteOpen, setPaletteOpen }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de <AppProvider>");
  return ctx;
}
