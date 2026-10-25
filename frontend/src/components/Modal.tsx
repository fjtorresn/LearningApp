"use client";

import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  children,
  className = "max-w-md",
  position = "center",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  position?: "center" | "top";
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
      className={`fixed inset-0 z-50 flex justify-center bg-zinc-950/40 px-4 backdrop-blur-sm ${
        position === "top" ? "items-start pt-[12vh]" : "items-center"
      }`}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
