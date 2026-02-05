import { GoldHoverText } from "@/components/GoldHoverText";
import { RecognitionCard } from "@/components/reconhecimento/RecognitionCard";
import { recognitionLevels } from "@/components/reconhecimento/recognitionLevels";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";

export default function Reconhecimento() {
  // Mock: current level index (0 = Bronze, will be replaced with real data later)
  const currentLevelIndex = 0;
  const isMobileOrTablet = useIsMobileOrTablet();

  return (
    <div className={`flex flex-col h-full overflow-x-hidden ${isMobileOrTablet ? "gap-6 pb-24" : "gap-3"}`}>
      {/* Header - compact on desktop */}
      <header className={isMobileOrTablet ? "space-y-1" : "space-y-0.5"}>
        <h1 className={`font-bold tracking-tight ${isMobileOrTablet ? "text-2xl" : "text-xl"}`}>
          <GoldHoverText>Reconhecimento</GoldHoverText>
        </h1>
        <p className="text-sm text-muted-foreground">
          Bora para o próximo nível!
        </p>
      </header>

      {/* Awards Section */}
      <section className={`flex-1 flex flex-col min-h-0 ${isMobileOrTablet ? "space-y-4" : "space-y-2"}`}>
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
          /* Desktop: Horizontal scroll container with compact cards - fit in viewport */
          <div className="flex-1 min-h-0 flex items-start">
            <div className="overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 w-full">
              <div className="flex gap-4 min-w-max pr-4">
                {recognitionLevels.map((level, index) => (
                  <RecognitionCard
                    key={level.id}
                    level={level}
                    isCurrentLevel={index === currentLevelIndex}
                    isAchieved={index < currentLevelIndex}
                    isFuture={index > currentLevelIndex}
                    compact
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
