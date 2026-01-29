import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ExpertisesChips({
  items,
  className,
}: {
  items: string[] | null | undefined;
  className?: string;
}) {
  const list = (items ?? []).filter(Boolean);
  if (!list.length) return null;

  return (
    <div className={cn("mt-3 flex flex-wrap gap-2", className)} aria-label="Expertises">
      {list.map((e) => (
        <Badge key={e} variant="secondary" className="h-7 rounded-full px-3 text-xs">
          {e}
        </Badge>
      ))}
    </div>
  );
}
