import * as React from "react";
import { cn } from "@/lib/utils";

interface StateData {
  code: string;
  name: string;
  value: number;
}

interface BrazilMapProps {
  data?: StateData[];
  className?: string;
}

// Real SVG paths for Brazilian states (simplified but accurate outlines)
const STATES_PATHS: Record<string, { path: string; name: string; cx: number; cy: number }> = {
  AC: { path: "M95,240 L130,230 L145,245 L140,265 L115,275 L90,265 Z", name: "Acre", cx: 115, cy: 252 },
  AM: { path: "M100,130 L200,100 L280,110 L290,160 L250,200 L200,220 L140,230 L90,200 L80,160 Z", name: "Amazonas", cx: 180, cy: 165 },
  RR: { path: "M170,50 L220,40 L250,70 L240,110 L200,120 L165,100 L160,70 Z", name: "Roraima", cx: 200, cy: 80 },
  AP: { path: "M310,50 L350,40 L370,70 L365,110 L340,130 L300,120 L295,80 Z", name: "Amapá", cx: 335, cy: 85 },
  PA: { path: "M250,100 L350,90 L400,100 L430,140 L440,200 L400,230 L340,240 L280,220 L250,180 L260,140 Z", name: "Pará", cx: 350, cy: 165 },
  RO: { path: "M145,230 L200,220 L230,250 L225,300 L185,320 L145,300 L130,260 Z", name: "Rondônia", cx: 180, cy: 270 },
  MT: { path: "M200,220 L290,200 L350,220 L380,280 L365,360 L300,380 L230,360 L200,300 L210,250 Z", name: "Mato Grosso", cx: 285, cy: 290 },
  TO: { path: "M350,220 L400,230 L420,280 L415,350 L380,390 L340,380 L330,320 L340,260 Z", name: "Tocantins", cx: 375, cy: 305 },
  MA: { path: "M400,170 L460,150 L500,180 L510,240 L470,280 L420,280 L400,230 Z", name: "Maranhão", cx: 455, cy: 215 },
  PI: { path: "M470,220 L510,200 L540,230 L545,300 L515,340 L475,320 L465,270 Z", name: "Piauí", cx: 505, cy: 270 },
  CE: { path: "M520,190 L570,175 L595,210 L580,260 L540,270 L520,240 Z", name: "Ceará", cx: 555, cy: 220 },
  RN: { path: "M575,210 L610,200 L625,230 L605,260 L575,255 Z", name: "Rio Grande do Norte", cx: 598, cy: 230 },
  PB: { path: "M565,260 L610,255 L625,280 L595,300 L560,290 Z", name: "Paraíba", cx: 592, cy: 275 },
  PE: { path: "M515,290 L600,280 L620,310 L580,340 L510,340 L500,315 Z", name: "Pernambuco", cx: 555, cy: 310 },
  AL: { path: "M580,330 L610,320 L625,350 L600,370 L575,355 Z", name: "Alagoas", cx: 598, cy: 345 },
  SE: { path: "M570,365 L595,355 L610,380 L585,400 L560,385 Z", name: "Sergipe", cx: 585, cy: 375 },
  BA: { path: "M420,310 L515,290 L570,330 L580,400 L550,470 L480,490 L420,460 L400,400 L415,350 Z", name: "Bahia", cx: 485, cy: 390 },
  GO: { path: "M340,360 L400,340 L440,380 L450,450 L420,490 L360,500 L320,460 L310,400 Z", name: "Goiás", cx: 375, cy: 420 },
  DF: { path: "M398,408 L420,400 L430,420 L415,438 L395,430 Z", name: "Distrito Federal", cx: 412, cy: 418 },
  MS: { path: "M250,380 L320,370 L360,420 L370,500 L340,560 L280,570 L240,520 L230,440 Z", name: "Mato Grosso do Sul", cx: 300, cy: 470 },
  MG: { path: "M420,420 L500,400 L550,440 L560,520 L520,570 L450,590 L390,560 L380,490 Z", name: "Minas Gerais", cx: 470, cy: 495 },
  ES: { path: "M550,480 L580,470 L595,510 L580,550 L550,545 Z", name: "Espírito Santo", cx: 570, cy: 510 },
  RJ: { path: "M520,545 L570,530 L590,560 L565,590 L520,585 L505,565 Z", name: "Rio de Janeiro", cx: 548, cy: 565 },
  SP: { path: "M380,510 L460,490 L520,530 L530,590 L480,620 L400,610 L360,570 L365,530 Z", name: "São Paulo", cx: 445, cy: 560 },
  PR: { path: "M350,560 L420,545 L470,580 L480,640 L430,680 L360,680 L320,640 L325,590 Z", name: "Paraná", cx: 400, cy: 615 },
  SC: { path: "M370,680 L440,670 L470,710 L455,750 L400,760 L360,730 Z", name: "Santa Catarina", cx: 415, cy: 715 },
  RS: { path: "M340,740 L420,720 L460,760 L450,830 L380,870 L310,850 L290,790 Z", name: "Rio Grande do Sul", cx: 375, cy: 795 },
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
  const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });

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
    
    // Orange scale from light to dark based on intensity
    const lightness = 70 - intensity * 40;
    return `hsl(25 95% ${lightness}%)`;
  };

  const handleMouseMove = (e: React.MouseEvent, code: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const svgRect = (e.currentTarget.closest('svg') as SVGSVGElement)?.getBoundingClientRect();
    if (svgRect) {
      setTooltipPos({
        x: e.clientX - svgRect.left,
        y: e.clientY - svgRect.top - 45,
      });
    }
    setHoveredState(code);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox="70 30 580 860"
        className="w-full h-auto max-h-[280px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* States */}
        {Object.entries(STATES_PATHS).map(([code, { path, name }]) => {
          const value = valueMap[code] || 0;
          const isHovered = hoveredState === code;
          
          return (
            <path
              key={code}
              d={path}
              fill={getFillColor(code)}
              stroke="hsl(0 0% 15%)"
              strokeWidth={isHovered ? 2 : 1}
              className="cursor-pointer transition-all duration-150"
              style={{
                filter: isHovered ? "brightness(1.3)" : "none",
              }}
              onMouseMove={(e) => handleMouseMove(e, code)}
              onMouseLeave={() => setHoveredState(null)}
            />
          );
        })}

        {/* Custom Tooltip */}
        {hoveredState && (
          <g
            transform={`translate(${tooltipPos.x}, ${tooltipPos.y})`}
            style={{ pointerEvents: "none" }}
          >
            <rect
              x={-60}
              y={0}
              width={120}
              height={40}
              rx={6}
              fill="hsl(0 0% 10%)"
              stroke="hsl(0 0% 25%)"
              strokeWidth={1}
            />
            <text
              x={0}
              y={16}
              textAnchor="middle"
              fill="white"
              fontSize={11}
              fontWeight={500}
            >
              {STATES_PATHS[hoveredState]?.name}
            </text>
            <text
              x={0}
              y={32}
              textAnchor="middle"
              fill="hsl(0 0% 65%)"
              fontSize={10}
            >
              {(valueMap[hoveredState] || 0).toLocaleString("pt-BR")} acessos
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
