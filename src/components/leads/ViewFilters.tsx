import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
}

interface ViewFiltersProps {
  filters: {
    id: string;
    label: string;
    options: FilterOption[];
    value?: string;
    onChange?: (value: string) => void;
  }[];
  className?: string;
}

export function ViewFilters({ filters, className }: ViewFiltersProps) {
  return (
    <div className={cn("flex items-center gap-2 flex-wrap w-full md:w-auto", className)}>
      {filters.map((filter) => (
        <Select
          key={filter.id}
          value={filter.value}
          onValueChange={filter.onChange}
        >
          <SelectTrigger 
            className="h-8 px-3 text-xs bg-card/60 border-border/40 hover:bg-muted/50 transition-colors flex-1 md:flex-none min-w-0 md:min-w-[100px]"
          >
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent>
            {filter.options.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-xs">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  );
}

// Preset filter configurations for each view
export const META_FILTERS = [
  {
    id: "campaign",
    label: "Campanhas",
    options: [
      { value: "all", label: "Todas as Campanhas" },
      { value: "active", label: "Campanhas Ativas" },
      { value: "paused", label: "Campanhas Pausadas" },
    ],
  },
  {
    id: "ad",
    label: "Anúncios",
    options: [
      { value: "all", label: "Todos os Anúncios" },
      { value: "top", label: "Melhores Anúncios" },
    ],
  },
];

export const GOOGLE_ADS_FILTERS = [
  {
    id: "campaign",
    label: "Campanhas",
    options: [
      { value: "all", label: "Todas as Campanhas" },
      { value: "search", label: "Pesquisa" },
      { value: "display", label: "Display" },
      { value: "youtube", label: "YouTube" },
    ],
  },
  {
    id: "group",
    label: "Grupo",
    options: [
      { value: "all", label: "Todos os Grupos" },
    ],
  },
  {
    id: "type",
    label: "Tipo",
    options: [
      { value: "all", label: "Todos os Tipos" },
      { value: "brand", label: "Brand" },
      { value: "generic", label: "Generic" },
      { value: "competitor", label: "Competitor" },
    ],
  },
];

export const ANALYTICS_FILTERS = [
  {
    id: "city",
    label: "Cidade",
    options: [
      { value: "all", label: "Todas as Cidades" },
      { value: "sao-paulo", label: "São Paulo" },
      { value: "rio-de-janeiro", label: "Rio de Janeiro" },
      { value: "belo-horizonte", label: "Belo Horizonte" },
    ],
  },
  {
    id: "region",
    label: "Região",
    options: [
      { value: "all", label: "Todas as Regiões" },
      { value: "sudeste", label: "Sudeste" },
      { value: "sul", label: "Sul" },
      { value: "nordeste", label: "Nordeste" },
      { value: "centro-oeste", label: "Centro-Oeste" },
      { value: "norte", label: "Norte" },
    ],
  },
];
