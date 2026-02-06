import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ServiceCategoryCardProps {
  name: string;
  description?: string | null;
  onClick: () => void;
}

export function ServiceCategoryCard({ name, description, onClick }: ServiceCategoryCardProps) {
  return (
    <Card
      className="cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/30"
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">{name}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground ml-3" />
      </CardContent>
    </Card>
  );
}
