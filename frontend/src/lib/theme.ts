// Sin "use client": el layout (Server Component) importa este script como texto.

export const THEME_STORAGE_KEY = "theme";

/**
 * Script que se ejecuta en <head> antes de pintar la página: aplica la clase .dark
 * de inmediato para evitar el "parpadeo" de tema claro al cargar.
 */
export const themeInitScript = `(() => {
  try {
    const pref = localStorage.getItem("${THEME_STORAGE_KEY}") || "system";
    const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  } catch {}
})();`;
