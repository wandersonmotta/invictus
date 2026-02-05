import { Trophy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RecognitionLevel } from "./recognitionLevels";
import { cn } from "@/lib/utils";

interface RecognitionCardProps {
  level: RecognitionLevel;
  isCurrentLevel?: boolean;
  isAchieved?: boolean;
  isFuture?: boolean;
  /** Full width card for mobile (one per row) */
  fullWidth?: boolean;
}

export function RecognitionCard({
  level,
  isCurrentLevel = false,
  isAchieved = false,
  isFuture = false,
  fullWidth = false,
}: RecognitionCardProps) {
  return (
    <article
      className={cn(
        "group flex-shrink-0 snap-start",
        "invictus-surface invictus-frame",
        "rounded-xl",
        "overflow-visible",
        "transition-all duration-300",
        fullWidth ? "w-full max-w-[320px] mx-auto" : "w-[clamp(200px,50vw,280px)]",
        !fullWidth && "md:hover:scale-[1.03] md:hover:shadow-[0_0_24px_hsl(var(--primary)/0.25)]",
        // Always-on gold contour for the current level
        isCurrentLevel && "invictus-active-frame",
        isFuture && "opacity-60"
      )}
    >
      {/* Award Image / Placeholder */}
      <div
        className={cn(
          "relative w-full aspect-[4/5]",
          "flex items-center justify-center",
          "overflow-hidden rounded-t-xl",
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
              className="h-16 w-16 text-white/80 drop-shadow-lg"
              strokeWidth={1.5}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
          </>
        )}

        {/* Achieved checkmark */}
        {isAchieved && (
          <div className="absolute top-2 right-2 bg-emerald-600 rounded-full p-1 shadow-lg">
            <Check className="h-4 w-4 text-white" strokeWidth={3} />
          </div>
        )}

        {/* Current level badge */}
        {isCurrentLevel && (
          <div className="absolute top-2 left-2">
            <Badge
              variant="default"
              className="text-[10px] font-bold px-2 py-0.5 bg-primary text-primary-foreground shadow-lg"
            >
              SEU NÍVEL
            </Badge>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-2 rounded-b-xl bg-background/80">
        <h3 className="text-base font-semibold text-foreground leading-tight truncate">
          {level.name}
        </h3>
        <p className="text-sm text-muted-foreground leading-snug line-clamp-2">
          {level.description}
        </p>
        <div className="flex items-center justify-between pt-1">
          <Badge
            variant="secondary"
            className="text-xs font-medium px-2.5 py-0.5"
          >
            Ganha: {level.points.toLocaleString("pt-BR")} pts
          </Badge>
        </div>
      </div>
    </article>
  );
}
