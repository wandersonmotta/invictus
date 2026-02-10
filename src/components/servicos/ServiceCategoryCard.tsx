import { ChevronRight, ShieldCheck, icons } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
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

interface ServiceCategoryCardProps {
  name: string;
  description?: string | null;
  iconName?: string | null;
  onClick: () => void;
  variant?: "list" | "grid";
}

export function ServiceCategoryCard({ 
  name, 
  description, 
  iconName, 
  onClick, 
  variant = "list" 
}: ServiceCategoryCardProps) {
  const Icon = resolveIcon(iconName);

  if (variant === "grid") {
    return (
      <Card
        className="flex flex-col items-center justify-center p-6 text-center hover:shadow-lg transition-all cursor-pointer aspect-square border-2 hover:border-primary/50 group"
        onClick={onClick}
      >
        {Icon && (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-8 w-8 text-primary" />
          </div>
        )}
        <h3 className="font-bold text-lg text-foreground mb-2">{name}</h3>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>
        )}
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/30"
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && <Icon className="h-5 w-5 shrink-0 text-primary" />}
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{name}</h3>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground ml-3" />
      </CardContent>
    </Card>
  );
}
