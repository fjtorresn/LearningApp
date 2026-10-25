import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

// remark-gfm: tablas, listas de tareas, ~~tachado~~.
// remark-math + rehype-katex: fórmulas LaTeX, $en línea$ y $$en bloque$$.
// rehype-highlight: colorea bloques ```lenguaje. Va después de KaTeX para no tocar las fórmulas.
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        // throwOnError: false → una fórmula mal escrita se muestra en rojo en vez de romper la tarjeta.
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false }], rehypeHighlight]}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
