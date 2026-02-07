import { Card } from "@/components/ui/card";
import { Eraser, ShieldCheck, icons } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  eraser: Eraser,
  "shield-check": ShieldCheck,
};

function resolveIcon(name?: string | null): LucideIcon | null {
  if (!name) return null;
  if (iconMap[name]) return iconMap[name];
  // fallback: try pascal-case lookup in lucide full set
  const pascal = name
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
  return (icons as Record<string, LucideIcon>)[pascal] ?? null;
}

interface ServiceItemCardProps {
  name: string;
  iconName?: string | null;
  /** true = compact list row (mobile) */
  compact?: boolean;
}

export function ServiceItemCard({
  name,
  iconName,
  compact = false,
}: ServiceItemCardProps) {
  const Icon = resolveIcon(iconName);

  if (compact) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        )}
        <p className="font-medium text-foreground text-sm">{name}</p>
      </div>
    );
  }

  return (
    <Card className="flex flex-col items-center justify-center aspect-square rounded-2xl p-4 text-center hover:shadow-md transition-shadow">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-3">
          <Icon className="h-7 w-7 text-primary" />
        </div>
      )}
      <h4 className="font-semibold text-foreground text-sm leading-tight">{name}</h4>
    </Card>
  );
}
