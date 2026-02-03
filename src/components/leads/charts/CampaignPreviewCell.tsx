import { cn } from "@/lib/utils";
import { Image as ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CampaignPreviewCellProps {
  name: string;
  thumbnailUrl: string | null;
  status: string;
  className?: string;
}

export function CampaignPreviewCell({
  name,
  thumbnailUrl,
  status,
  className,
}: CampaignPreviewCellProps) {
  const isActive = status === "ACTIVE";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Thumbnail */}
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted/30 flex-shrink-0 border border-border/30">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted/50">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Name + Status */}
      <div className="flex flex-col min-w-0">
        <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
          {name}
        </p>
        <Badge
          variant={isActive ? "default" : "secondary"}
          className={cn(
            "w-fit text-[10px] px-1.5 py-0 h-4 mt-0.5",
            isActive
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
              : "bg-muted/50 text-muted-foreground border-border/30"
          )}
        >
          {isActive ? "Ativo" : "Pausado"}
        </Badge>
      </div>
    </div>
  );
}
