/** Quita la sintaxis Markdown más ruidosa para mostrar un extracto en texto plano. */
function stripMarkdown(text: string): string {
  return text
    .replace(/```[\w-]*/g, " ") // vallas de bloques de código
    .replace(/\*\*|__|`/g, "") // negrita y código en línea
    .replace(/(^|\s)(#{1,6}|>|[-*+]|\d+\.)\s+/g, "$1") // títulos, citas, listas
    .replace(/\|/g, " ") // tablas
    .replace(/\s+/g, " ")
    .trim();
}

// Convierte "texto \x02coincidencia\x03 texto" (marcadores del backend) en <mark>,
// sin usar dangerouslySetInnerHTML: el contenido del usuario nunca se interpreta como HTML.
export function Highlight({ text, plain = false }: { text: string; plain?: boolean }) {
  const parts = (plain ? stripMarkdown(text) : text).split(/(\x02[^\x03]*\x03)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("\x02") ? (
          <mark key={i} className="rounded-sm bg-amber-200/70 px-0.5 text-inherit dark:bg-amber-400/30">
            {part.slice(1, -1)}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}
