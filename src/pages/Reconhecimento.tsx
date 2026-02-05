import { GoldHoverText } from "@/components/GoldHoverText";
import { RecognitionCard } from "@/components/reconhecimento/RecognitionCard";
import { recognitionLevels } from "@/components/reconhecimento/recognitionLevels";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";

export default function Reconhecimento() {
  // Mock: current level index (0 = Bronze, will be replaced with real data later)
  const currentLevelIndex = 0;
  const isMobileOrTablet = useIsMobileOrTablet();

  return (
    <div className={`flex flex-col gap-6 overflow-x-hidden ${isMobileOrTablet ? "pb-24" : "h-full"}`}>
      {/* Header */}
      <header className="space-y-1 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">
          <GoldHoverText>Reconhecimento</GoldHoverText>
        </h1>
        <p className="text-sm text-muted-foreground">
          Bora para o próximo nível!
        </p>
      </header>

      {/* Awards Section */}
      <section className={`space-y-4 ${isMobileOrTablet ? "" : "flex-1 min-h-0 flex flex-col"}`}>
        <h2 className="text-base font-semibold text-foreground shrink-0">Premiações</h2>

        {isMobileOrTablet ? (
          /* Mobile/Tablet: One card at a time, vertical scroll */
          <div className="flex flex-col gap-6">
            {recognitionLevels.map((level, index) => (
              <RecognitionCard
                key={level.id}
                level={level}
                isCurrentLevel={index === currentLevelIndex}
                isAchieved={index < currentLevelIndex}
                isFuture={index > currentLevelIndex}
                fullWidth
              />
            ))}
          </div>
        ) : (
          /* Desktop: Horizontal scroll container with larger cards - fills available height */
          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-3">
              <div className="flex gap-6 min-w-max pr-4">
                {recognitionLevels.map((level, index) => (
                  <RecognitionCard
                    key={level.id}
                    level={level}
                    isCurrentLevel={index === currentLevelIndex}
                    isAchieved={index < currentLevelIndex}
                    isFuture={index > currentLevelIndex}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
