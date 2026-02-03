import { cn } from "@/lib/utils";

interface Keyword {
  keyword: string;
  cliques: number;
  conversoes: number;
}

interface KeywordsTableProps {
  keywords: Keyword[];
  className?: string;
}

export function KeywordsTable({ keywords, className }: KeywordsTableProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wide px-2">
        <span>Palavras-chave</span>
        <div className="flex gap-6">
          <span>Cliques</span>
          <span>Conversões</span>
        </div>
      </div>
      <div className="space-y-1">
        {keywords.map((kw, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/20 hover:bg-muted/30 transition-colors"
          >
            <span className="text-xs text-foreground truncate max-w-[140px]">
              {kw.keyword}
            </span>
            <div className="flex gap-6 text-xs">
              <span className="text-muted-foreground w-10 text-right">{kw.cliques}</span>
              <span className="text-foreground font-medium w-10 text-right">
                {kw.conversoes.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
