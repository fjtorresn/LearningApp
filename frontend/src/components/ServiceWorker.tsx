"use client";

import { useEffect } from "react";

/** Registra /sw.js. Solo en producción: en desarrollo la caché interferiría con la recarga en caliente. */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}

/** Borra los datos de la API guardados para uso sin conexión (al cerrar sesión). */
export function clearOfflineApiCache() {
  if ("caches" in window) caches.delete("api").catch(() => {});
}
