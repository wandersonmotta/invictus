import { Trophy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RecognitionLevel } from "./recognitionLevels";
import { cn } from "@/lib/utils";

interface RecognitionCardProps {
  level: RecognitionLevel;
  isCurrentLevel?: boolean;
  isAchieved?: boolean;
  isFuture?: boolean;
  /** Compact vertical layout for mobile (smaller dimensions, same structure) */
  compact?: boolean;
}

export function RecognitionCard({
  level,
  isCurrentLevel = false,
  isAchieved = false,
  isFuture = false,
  compact = false,
}: RecognitionCardProps) {
  return (
    <article
      className={cn(
        "group flex-shrink-0 snap-start",
        "invictus-surface invictus-frame",
        "rounded-xl",
        "overflow-visible",
        "transition-all duration-300",
        // Compact: smaller fixed width for mobile grid
        // Full: larger cards for desktop horizontal scroll
        compact ? "w-[140px]" : "w-[clamp(200px,50vw,280px)]",
        !compact && "md:hover:scale-[1.03] md:hover:shadow-[0_0_24px_hsl(var(--primary)/0.25)]",
        isCurrentLevel && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_20px_hsl(var(--primary)/0.4)]",
        isFuture && "opacity-60"
      )}
    >
      {/* Award Image / Placeholder */}
      <div
        className={cn(
          "relative w-full",
          "flex items-center justify-center",
          "overflow-hidden rounded-t-xl",
          compact ? "aspect-[4/5]" : "aspect-[4/5]",
          !level.imageUrl && `bg-gradient-to-br ${level.gradient}`
        )}
      >
        {level.imageUrl ? (
          <img
            src={level.imageUrl}
            alt={`Placa ${level.name}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <>
            <Trophy
              className={cn(
                "text-white/80 drop-shadow-lg",
                compact ? "h-10 w-10" : "h-16 w-16"
              )}
              strokeWidth={1.5}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
          </>
        )}

        {/* Achieved checkmark */}
        {isAchieved && (
          <div className={cn(
            "absolute bg-emerald-600 rounded-full shadow-lg",
            compact ? "top-1 right-1 p-0.5" : "top-2 right-2 p-1"
          )}>
            <Check className={cn("text-white", compact ? "h-3 w-3" : "h-4 w-4")} strokeWidth={3} />
          </div>
        )}

        {/* Current level badge */}
        {isCurrentLevel && (
          <div className={cn("absolute", compact ? "top-1 left-1" : "top-2 left-2")}>
            <Badge
              variant="default"
              className={cn(
                "font-bold bg-primary text-primary-foreground shadow-lg",
                compact ? "text-[8px] px-1.5 py-0" : "text-[10px] px-2 py-0.5"
              )}
            >
              {compact ? "ATUAL" : "SEU NÍVEL"}
            </Badge>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className={cn(
        "rounded-b-xl bg-background/80",
        compact ? "p-2 space-y-1" : "p-4 space-y-2"
      )}>
        <h3 className={cn(
          "font-semibold text-foreground leading-tight truncate",
          compact ? "text-xs" : "text-base"
        )}>
          {level.name}
        </h3>
        <p className={cn(
          "text-muted-foreground leading-snug",
          compact ? "text-[10px] line-clamp-2" : "text-sm line-clamp-2"
        )}>
          {level.description}
        </p>
        <div className="flex items-center justify-between pt-1">
          <Badge
            variant="secondary"
            className={cn(
              "font-medium",
              compact ? "text-[9px] px-1.5 py-0" : "text-xs px-2.5 py-0.5"
            )}
          >
            Ganha: {level.points.toLocaleString("pt-BR")} pts
          </Badge>
        </div>
      </div>
    </article>
  );
}
