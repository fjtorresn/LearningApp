import { esES } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProvider } from "@/components/AppProvider";
import { AppShell } from "@/components/AppShell";
import { ServiceWorker } from "@/components/ServiceWorker";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const clerkAppearance = {
  variables: {
    colorBackground: "var(--surface)",
    colorForeground: "var(--foreground)",
    colorMutedForeground: "var(--muted)",
    colorInput: "var(--surface)",
    colorInputForeground: "var(--foreground)",
    colorPrimary: "var(--foreground)",
    colorPrimaryForeground: "var(--background)",
    colorNeutral: "var(--foreground)",
    colorBorder: "var(--border)",
    fontFamily: "var(--font-geist-sans)",
    borderRadius: "0.625rem",
  },
};

export const metadata: Metadata = {
  title: "LearningApp",
  description: "Tus conceptos y tecnologías, organizados y a un Ctrl+K de distancia",
  // iOS: al añadirla a la pantalla de inicio se abre como app, sin la barra de Safari.
  appleWebApp: { capable: true, title: "Learning", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  // Color de la barra de estado del móvil, según el tema del sistema.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  // Permite pintar bajo el "notch"; usamos env(safe-area-inset-*) para no tapar contenido.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: el script de tema añade la clase .dark antes de que React hidrate.
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        {/* Los colores de Clerk usan las mismas variables CSS que la app, así siguen el tema claro/oscuro. */}
        <ClerkProvider appearance={clerkAppearance} localization={esES}>
          <AppProvider>
            <AppShell>{children}</AppShell>
          </AppProvider>
          <ServiceWorker />
        </ClerkProvider>
      </body>
    </html>
  );
}