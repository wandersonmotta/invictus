import { GoldHoverText } from "@/components/GoldHoverText";
import { RecognitionCard } from "@/components/reconhecimento/RecognitionCard";
import { recognitionLevels } from "@/components/reconhecimento/recognitionLevels";

export default function Reconhecimento() {
  return (
    <div className="flex flex-col gap-8 pb-24">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          <GoldHoverText>Reconhecimento</GoldHoverText>
        </h1>
        <p className="text-sm text-muted-foreground">
          O sucesso é construído passo a passo.
        </p>
      </header>

      {/* Awards Carousel */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Premiações</h2>

        {/* Horizontal scroll container */}
        <div className="-mx-4 px-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 scrollbar-hide">
          <div className="flex gap-4 min-w-max pb-3">
            {recognitionLevels.map((level) => (
              <RecognitionCard key={level.id} level={level} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
