import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:8765";

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Proxy: el navegador llama a /api/* en el mismo origen y Next lo reenvía a FastAPI (sin CORS).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
