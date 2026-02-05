import { Trophy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RecognitionLevel } from "./recognitionLevels";
import { cn } from "@/lib/utils";

interface RecognitionCardProps {
  level: RecognitionLevel;
  isCurrentLevel?: boolean;
  isAchieved?: boolean;
  isFuture?: boolean;
  /** Compact horizontal layout for mobile */
  compact?: boolean;
}

export function RecognitionCard({
  level,
  isCurrentLevel = false,
  isAchieved = false,
  isFuture = false,
  compact = false,
}: RecognitionCardProps) {
  // Compact horizontal layout for mobile/tablet
  if (compact) {
    return (
      <article
        className={cn(
          "flex gap-3 w-full h-[100px]",
          "invictus-surface invictus-frame",
          "rounded-xl overflow-visible",
          "transition-all duration-300",
          isCurrentLevel && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_16px_hsl(var(--primary)/0.4)]",
          isFuture && "opacity-60"
        )}
      >
        {/* Award Image - Left side */}
        <div
          className={cn(
            "w-20 h-full shrink-0 rounded-l-xl overflow-hidden",
            "flex items-center justify-center",
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
            <Trophy
              className="h-8 w-8 text-white/80 drop-shadow-lg"
              strokeWidth={1.5}
            />
          )}

          {/* Achieved checkmark */}
          {isAchieved && (
            <div className="absolute top-1 right-1 bg-emerald-600 rounded-full p-0.5 shadow-lg">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
          )}
        </div>

        {/* Content - Right side */}
        <div className="flex-1 flex flex-col justify-center py-2 pr-3 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {level.name}
            </h3>
            {isCurrentLevel && (
              <Badge
                variant="default"
                className="text-[9px] font-bold px-1.5 py-0 bg-primary text-primary-foreground shrink-0"
              >
                ATUAL
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-snug line-clamp-2 mb-1.5">
            {level.description}
          </p>
          <Badge
            variant="secondary"
            className="text-[10px] font-medium px-2 py-0.5 w-fit"
          >
            Ganha: {level.points.toLocaleString("pt-BR")} pts
          </Badge>
        </div>
      </article>
    );
  }

  // Full vertical layout for desktop
  return (
    <article
      className={cn(
        "group flex-shrink-0 snap-start",
        "w-[clamp(200px,50vw,280px)]",
        "invictus-surface invictus-frame",
        "rounded-xl",
        "overflow-visible",
        "transition-all duration-300",
        "md:hover:scale-[1.03] md:hover:shadow-[0_0_24px_hsl(var(--primary)/0.25)]",
        isCurrentLevel && "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_20px_hsl(var(--primary)/0.4)]",
        isFuture && "opacity-60"
      )}
    >
      {/* Award Image / Placeholder - overflow hidden only here */}
      <div
        className={cn(
          "relative aspect-[4/5] w-full",
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
            {/* Trophy Icon Placeholder */}
            <Trophy
              className="h-16 w-16 text-white/80 drop-shadow-lg"
              strokeWidth={1.5}
            />
            {/* Metallic Overlay */}
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
