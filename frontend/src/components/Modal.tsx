"use client";

import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  children,
  className = "max-w-md",
  position = "center",
  fullscreenOnMobile = false,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  position?: "center" | "top";
  /** En pantallas pequeñas ocupa toda la pantalla (como una app nativa). */
  fullscreenOnMobile?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center bg-zinc-950/40 backdrop-blur-sm ${
        position === "top" ? "items-start sm:pt-[12vh]" : "items-center"
      } ${fullscreenOnMobile ? "sm:px-4" : "px-4"}`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full overflow-hidden bg-white shadow-2xl dark:bg-zinc-900 ${
          fullscreenOnMobile
            ? "h-dvh pt-[env(safe-area-inset-top)] sm:h-auto sm:rounded-2xl sm:border sm:border-zinc-200 sm:pt-0 sm:dark:border-zinc-800"
            : "rounded-2xl border border-zinc-200 dark:border-zinc-800"
        } ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
