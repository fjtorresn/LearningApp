import type { TopicColor } from "./api";

export const TOPIC_COLORS: TopicColor[] = ["blue", "green", "purple", "orange", "pink", "teal", "red", "gray"];

// Clases completas escritas literalmente para que Tailwind las detecte al compilar.
export const colorClasses: Record<TopicColor, { dot: string; badge: string; border: string }> = {
  blue: {
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30",
    border: "border-t-blue-500 dark:border-t-blue-500",
  },
  green: {
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    border: "border-t-emerald-500 dark:border-t-emerald-500",
  },
  purple: {
    dot: "bg-violet-500",
    badge:
      "bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30",
    border: "border-t-violet-500 dark:border-t-violet-500",
  },
  orange: {
    dot: "bg-orange-500",
    badge:
      "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/30",
    border: "border-t-orange-500 dark:border-t-orange-500",
  },
  pink: {
    dot: "bg-pink-500",
    badge: "bg-pink-50 text-pink-700 ring-pink-200 dark:bg-pink-500/10 dark:text-pink-300 dark:ring-pink-500/30",
    border: "border-t-pink-500 dark:border-t-pink-500",
  },
  teal: {
    dot: "bg-teal-500",
    badge: "bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/30",
    border: "border-t-teal-500 dark:border-t-teal-500",
  },
  red: {
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30",
    border: "border-t-red-500 dark:border-t-red-500",
  },
  gray: {
    dot: "bg-zinc-400",
    badge: "bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-300 dark:ring-zinc-500/30",
    border: "border-t-zinc-400 dark:border-t-zinc-400",
  },
};

export const colorLabels: Record<TopicColor, string> = {
  blue: "Azul",
  green: "Verde",
  purple: "Morado",
  orange: "Naranja",
  pink: "Rosa",
  teal: "Turquesa",
  red: "Rojo",
  gray: "Gris",
};
