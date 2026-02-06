import { ChevronRight, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  "shield-check": ShieldCheck,
};

interface ServiceCategoryCardProps {
  name: string;
  description?: string | null;
  iconName?: string | null;
  onClick: () => void;
}

export function ServiceCategoryCard({ name, description, iconName, onClick }: ServiceCategoryCardProps) {
  const Icon = iconName ? iconMap[iconName] ?? null : null;

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
