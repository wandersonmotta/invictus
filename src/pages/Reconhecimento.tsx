import { GoldHoverText } from "@/components/GoldHoverText";
import { RecognitionCard } from "@/components/reconhecimento/RecognitionCard";
import { recognitionLevels } from "@/components/reconhecimento/recognitionLevels";
import { useIsMobileOrTablet } from "@/hooks/use-mobile";

export default function Reconhecimento() {
  // Mock: current level index (0 = Bronze, will be replaced with real data later)
  const currentLevelIndex = 0;
  const isMobileOrTablet = useIsMobileOrTablet();

  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          <GoldHoverText>Reconhecimento</GoldHoverText>
        </h1>
        <p className="text-sm text-muted-foreground">
          Bora para o próximo nível!
        </p>
      </header>

      {/* Awards Section */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Premiações</h2>

        {isMobileOrTablet ? (
          /* Mobile/Tablet: Grid of compact vertical cards */
          <div className="grid grid-cols-2 gap-3">
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
        ) : (
          /* Desktop: Horizontal scroll container with larger cards */
          <div className="-mx-4 px-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 scrollbar-hide">
            <div className="flex gap-6 min-w-max pb-3">
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
        )}
      </section>
    </div>
  );
}
