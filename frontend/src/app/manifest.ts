import type { MetadataRoute } from "next";

// Next sirve esto en /manifest.webmanifest: lo que el móvil necesita para instalar la app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LearningApp",
    short_name: "Learning",
    description: "Tus conceptos y tecnologías, organizados y a mano",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Nueva tarjeta", url: "/cards/new", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Buscar", url: "/search", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
