import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LeadsView } from "./LeadsSidebar";

interface LeadsMobileViewSelectorProps {
  activeView: LeadsView;
  onViewChange: (view: LeadsView) => void;
}

const viewOptions: { value: LeadsView; label: string }[] = [
  { value: "overview", label: "Visão Geral" },
  { value: "meta", label: "Meta Ads" },
  { value: "google_ads", label: "Google Ads" },
  { value: "analytics", label: "Analytics" },
];

export function LeadsMobileViewSelector({
  activeView,
  onViewChange,
}: LeadsMobileViewSelectorProps) {
  return (
    <div className="w-full md:hidden">
      <Select value={activeView} onValueChange={onViewChange}>
        <SelectTrigger className="w-full bg-card/60 backdrop-blur-sm border-border/40">
          <SelectValue placeholder="Selecionar visualização" />
        </SelectTrigger>
        <SelectContent>
          {viewOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
