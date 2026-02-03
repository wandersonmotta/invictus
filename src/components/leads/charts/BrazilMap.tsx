import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StateData {
  code: string;
  name: string;
  value: number;
}

interface BrazilMapProps {
  data?: StateData[];
  className?: string;
}

// Simplified SVG paths for Brazilian states
const STATES_PATHS: Record<string, { path: string; name: string }> = {
  AC: { path: "M52,145 L65,140 L68,148 L55,155 Z", name: "Acre" },
  AL: { path: "M285,165 L295,160 L300,168 L290,172 Z", name: "Alagoas" },
  AM: { path: "M80,90 L150,80 L160,130 L90,145 Z", name: "Amazonas" },
  AP: { path: "M195,60 L215,55 L220,80 L200,85 Z", name: "Amapá" },
  BA: { path: "M245,165 L290,155 L295,210 L250,220 Z", name: "Bahia" },
  CE: { path: "M275,120 L295,115 L298,140 L278,145 Z", name: "Ceará" },
  DF: { path: "M218,205 L228,202 L230,212 L220,215 Z", name: "Distrito Federal" },
  ES: { path: "M268,225 L280,220 L283,238 L270,242 Z", name: "Espírito Santo" },
  GO: { path: "M195,195 L245,185 L250,230 L200,240 Z", name: "Goiás" },
  MA: { path: "M230,100 L270,95 L275,135 L235,140 Z", name: "Maranhão" },
  MG: { path: "M220,220 L270,210 L280,260 L230,270 Z", name: "Minas Gerais" },
  MS: { path: "M165,235 L210,225 L215,280 L170,290 Z", name: "Mato Grosso do Sul" },
  MT: { path: "M130,150 L200,140 L210,210 L140,220 Z", name: "Mato Grosso" },
  PA: { path: "M155,75 L230,70 L240,130 L165,140 Z", name: "Pará" },
  PB: { path: "M285,145 L305,140 L308,152 L288,157 Z", name: "Paraíba" },
  PE: { path: "M270,155 L305,148 L308,165 L273,172 Z", name: "Pernambuco" },
  PI: { path: "M250,120 L278,115 L282,165 L255,170 Z", name: "Piauí" },
  PR: { path: "M185,280 L235,270 L240,305 L190,315 Z", name: "Paraná" },
  RJ: { path: "M255,260 L278,255 L282,275 L258,280 Z", name: "Rio de Janeiro" },
  RN: { path: "M288,130 L305,125 L308,140 L291,145 Z", name: "Rio Grande do Norte" },
  RO: { path: "M100,150 L140,145 L145,190 L105,195 Z", name: "Rondônia" },
  RR: { path: "M105,45 L140,40 L145,75 L110,80 Z", name: "Roraima" },
  RS: { path: "M175,315 L225,305 L235,360 L185,370 Z", name: "Rio Grande do Sul" },
  SC: { path: "M200,305 L240,298 L245,330 L205,337 Z", name: "Santa Catarina" },
  SE: { path: "M285,175 L298,172 L300,185 L287,188 Z", name: "Sergipe" },
  SP: { path: "M205,255 L260,245 L265,290 L210,300 Z", name: "São Paulo" },
  TO: { path: "M215,140 L250,135 L255,190 L220,195 Z", name: "Tocantins" },
};

const DEFAULT_DATA: StateData[] = [
  { code: "SP", name: "São Paulo", value: 1908 },
  { code: "RJ", name: "Rio de Janeiro", value: 277 },
  { code: "MG", name: "Minas Gerais", value: 246 },
  { code: "DF", name: "Distrito Federal", value: 221 },
  { code: "PR", name: "Paraná", value: 189 },
  { code: "GO", name: "Goiás", value: 188 },
  { code: "CE", name: "Ceará", value: 167 },
  { code: "SC", name: "Santa Catarina", value: 156 },
  { code: "RS", name: "Rio Grande do Sul", value: 145 },
  { code: "BA", name: "Bahia", value: 120 },
];

export function BrazilMap({ data = DEFAULT_DATA, className }: BrazilMapProps) {
  const [hoveredState, setHoveredState] = React.useState<string | null>(null);

  // Create a map of state code to value
  const valueMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach((d) => {
      map[d.code] = d.value;
    });
    return map;
  }, [data]);

  // Get max value for color scaling
  const maxValue = React.useMemo(() => {
    return Math.max(...data.map((d) => d.value), 1);
  }, [data]);

  // Calculate fill color based on value
  const getFillColor = (stateCode: string) => {
    const value = valueMap[stateCode] || 0;
    const intensity = value / maxValue;
    
    if (intensity === 0) return "hsl(0 0% 25%)";
    
    // Orange scale from light to dark
    const lightness = 65 - intensity * 35;
    return `hsl(25 95% ${lightness}%)`;
  };

  return (
    <TooltipProvider>
      <div className={cn("relative w-full h-48", className)}>
        <svg
          viewBox="40 30 280 350"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {Object.entries(STATES_PATHS).map(([code, { path, name }]) => {
            const value = valueMap[code] || 0;
            const isHovered = hoveredState === code;
            
            return (
              <Tooltip key={code}>
                <TooltipTrigger asChild>
                  <path
                    d={path}
                    fill={getFillColor(code)}
                    stroke="hsl(0 0% 20%)"
                    strokeWidth={isHovered ? 1.5 : 0.5}
                    className="cursor-pointer transition-all duration-150"
                    style={{
                      filter: isHovered ? "brightness(1.2)" : "none",
                    }}
                    onMouseEnter={() => setHoveredState(code)}
                    onMouseLeave={() => setHoveredState(null)}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-card border-border">
                  <div className="text-xs">
                    <p className="font-medium">{name}</p>
                    <p className="text-muted-foreground">
                      {value.toLocaleString("pt-BR")} acessos
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </svg>
      </div>
    </TooltipProvider>
  );
}
