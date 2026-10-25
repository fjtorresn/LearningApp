import type { NextConfig } from "next";

// 127.0.0.1 y no "localhost": en este sistema localhost resuelve a IPv6 (::1) y uvicorn escucha en IPv4.
const API_URL = process.env.API_URL ?? "http://127.0.0.1:8765";

const nextConfig: NextConfig = {
  // En Docker (NEXT_OUTPUT=standalone) genera un servidor mínimo autocontenido; con `npm start` no hace falta.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  // No usamos next/image: sin optimización de imágenes no hace falta sharp (binario nativo por arquitectura).
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Permite abrir el servidor de desarrollo desde el móvil en tu red local (p. ej. http://192.168.1.30:3000).
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
  // El service worker no debe cachearse: así el navegador siempre detecta versiones nuevas.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  // Proxy: el navegador llama a /api/* en el mismo origen y Next lo reenvía a FastAPI (sin CORS).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
