import { Trophy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RecognitionLevel } from "./recognitionLevels";
import { cn } from "@/lib/utils";

interface RecognitionCardProps {
  level: RecognitionLevel;
  isCurrentLevel?: boolean;
  isAchieved?: boolean;
  isFuture?: boolean;
}

export function RecognitionCard({
  level,
  isCurrentLevel = false,
  isAchieved = false,
  isFuture = false,
}: RecognitionCardProps) {
  return (
    <article
      className={cn(
        "group flex-shrink-0 snap-start",
        "w-[clamp(140px,42vw,188px)]",
        "invictus-surface invictus-frame",
        "rounded-xl overflow-hidden",
        "transition-all duration-300",
        "md:hover:scale-[1.03] md:hover:shadow-[0_0_24px_hsl(var(--primary)/0.25)]",
        // Current level: gold ring highlight
        isCurrentLevel && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_20px_hsl(var(--primary)/0.4)]",
        // Future levels: reduced opacity
        isFuture && "opacity-60"
      )}
    >
      {/* Award Image / Placeholder */}
      <div
        className={cn(
          "relative aspect-[4/5] w-full",
          "flex items-center justify-center",
          // Gradient placeholder when no image
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
            {/* Trophy Icon Placeholder */}
            <Trophy
              className="h-14 w-14 text-white/80 drop-shadow-lg"
              strokeWidth={1.5}
            />
            {/* Metallic Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10 pointer-events-none" />
          </>
        )}

        {/* Achieved checkmark */}
        {isAchieved && (
          <div className="absolute top-2 right-2 bg-emerald-600 rounded-full p-1 shadow-lg">
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </div>
        )}

        {/* Current level badge */}
        {isCurrentLevel && (
          <div className="absolute top-2 left-2">
            <Badge
              variant="default"
              className="text-[9px] font-bold px-1.5 py-0.5 bg-primary text-primary-foreground shadow-lg"
            >
              SEU NÍVEL
            </Badge>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3 space-y-1.5">
        <h3 className="text-sm font-semibold text-foreground leading-tight truncate">
          {level.name}
        </h3>
        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">
          {level.description}
        </p>
        <div className="flex items-center justify-between pt-1">
          <Badge
            variant="secondary"
            className="text-[10px] font-medium px-2 py-0.5"
          >
            Ganha: {level.points.toLocaleString("pt-BR")} pts
          </Badge>
        </div>
      </div>
    </article>
  );
}
