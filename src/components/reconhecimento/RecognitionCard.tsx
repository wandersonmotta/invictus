import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RecognitionLevel } from "./recognitionLevels";

interface RecognitionCardProps {
  level: RecognitionLevel;
}

export function RecognitionCard({ level }: RecognitionCardProps) {
  return (
    <article
      className="
        group flex-shrink-0 snap-start
        w-[clamp(140px,42vw,188px)]
        invictus-surface invictus-frame
        rounded-xl overflow-hidden
        transition-transform duration-200
        md:hover:scale-[1.03] md:hover:shadow-[0_0_24px_hsl(var(--primary)/0.25)]
      "
    >
      {/* Award Placeholder Image */}
      <div
        className={`
          relative aspect-[4/5] w-full
          bg-gradient-to-br ${level.gradient}
          flex items-center justify-center
        `}
      >
        {/* Trophy Icon */}
        <Trophy
          className="h-14 w-14 text-white/80 drop-shadow-lg"
          strokeWidth={1.5}
        />

        {/* Metallic Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
      </div>

      {/* Card Content */}
      <div className="p-3 space-y-1.5">
        <h3 className="text-sm font-semibold text-foreground leading-tight truncate">
          {level.name}
        </h3>
        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
          {level.description}
        </p>
        <Badge
          variant="secondary"
          className="mt-1 text-[10px] font-medium px-2 py-0.5"
        >
          {level.points.toLocaleString("pt-BR")} pts
        </Badge>
      </div>
    </article>
  );
}
