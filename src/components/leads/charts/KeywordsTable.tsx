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
      {/* Header row - responsive grid */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-2 sm:gap-4 text-[10px] text-muted-foreground uppercase tracking-wide px-2">
        <span className="truncate">Palavras-chave</span>
        <span className="text-right w-12 sm:w-14">Cliques</span>
        <span className="text-right w-14 sm:w-16">Conversões</span>
      </div>

      {/* Keyword rows */}
      <div className="space-y-1">
        {keywords.map((kw, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_auto_auto] gap-2 sm:gap-4 items-center px-2 py-1.5 rounded bg-muted/20 hover:bg-muted/30 transition-colors"
          >
            <span className="text-xs text-foreground truncate min-w-0">
              {kw.keyword}
            </span>
            <span className="text-xs text-muted-foreground w-12 sm:w-14 text-right flex-shrink-0">
              {kw.cliques}
            </span>
            <span className="text-xs text-foreground font-medium w-14 sm:w-16 text-right flex-shrink-0">
              {kw.conversoes.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
