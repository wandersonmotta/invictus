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

// Accurate SVG paths for Brazilian states (based on simplified GeoJSON)
const STATES: Record<string, { path: string; name: string }> = {
  AC: {
    name: "Acre",
    path: "M73.7,161.5L72.2,164.8L70,166L69.4,168.3L66.5,168.8L64.2,170.5L60.8,168.8L58.5,169.8L54.6,168.2L51.2,168.7L49.7,166.8L44.8,165.2L42.5,166.7L36.3,164.2L34.5,160.8L36.8,158.2L40.2,158.7L43.5,155.8L49.2,156.3L52.8,153.8L56.7,154.5L61.2,151.7L65.5,152.8L68.8,150.5L73.2,152.3L76.5,155.8L75.2,159.2Z",
  },
  AM: {
    name: "Amazonas",
    path: "M176.8,45.5L183.2,48.8L188.5,46.2L194.8,48.5L199.2,52.8L206.5,51.2L213.8,54.5L219.2,51.8L226.5,55.2L231.8,53.5L238.2,57.8L243.5,55.2L247.8,58.5L244.2,64.8L247.5,72.2L252.8,76.5L256.2,83.8L252.5,90.2L256.8,97.5L253.2,104.8L248.5,108.2L244.8,116.5L239.2,119.8L234.5,127.2L228.8,130.5L223.2,128.8L217.5,132.2L210.8,129.5L204.2,133.8L197.5,130.2L191.8,134.5L185.2,131.8L179.5,136.2L173.8,133.5L168.2,138.8L162.5,135.2L157.8,140.5L152.2,137.8L146.5,143.2L140.8,139.5L135.2,144.8L129.5,141.2L124.8,147.5L119.2,144.8L113.5,150.2L107.8,146.5L102.2,152.8L96.5,149.2L91.8,155.5L86.2,152.8L80.5,158.2L75.2,159.2L76.5,155.8L73.2,152.3L68.8,150.5L65.5,152.8L61.2,151.7L65.8,144.2L72.2,140.5L78.5,143.8L84.8,139.2L91.2,142.5L97.5,137.8L103.8,141.2L110.2,136.5L116.5,139.8L122.8,134.2L129.2,137.5L135.5,131.8L141.8,135.2L148.2,129.5L154.5,132.8L160.8,126.2L167.2,129.5L173.5,122.8L179.8,126.2L186.2,118.5L181.5,112.8L185.8,105.2L180.2,98.5L184.5,91.8L178.8,85.2L183.2,77.5L177.5,70.8L181.8,63.2L176.2,56.5Z",
  },
  AP: {
    name: "Amapá",
    path: "M260.8,48.5L267.2,44.8L273.5,48.2L278.8,43.5L284.2,47.8L289.5,43.2L295.8,49.5L298.2,56.8L294.5,63.2L298.8,70.5L293.2,77.8L290.5,85.2L284.8,88.5L280.2,96.8L274.5,99.2L269.8,93.5L265.2,99.8L259.5,95.2L254.8,102.5L249.2,98.8L252.8,90.2L256.2,83.8L252.8,76.5L247.5,72.2L244.2,64.8L247.8,58.5L254.2,54.8Z",
  },
  BA: {
    name: "Bahia",
    path: "M361.5,176.8L367.8,180.2L374.2,176.5L380.5,182.8L385.8,178.2L392.2,184.5L397.5,179.8L402.8,186.2L408.2,181.5L413.5,188.8L411.8,196.2L407.2,202.5L411.5,210.8L405.8,218.2L410.2,225.5L404.5,232.8L408.8,240.2L402.2,247.5L398.5,255.8L392.8,262.2L387.2,259.5L381.5,267.8L374.8,263.2L369.2,270.5L362.5,266.8L356.8,274.2L350.2,269.5L344.5,277.8L337.8,273.2L332.2,280.5L325.5,275.8L319.8,283.2L313.2,278.5L307.5,286.8L301.8,282.2L298.2,274.8L304.5,268.2L298.8,261.5L305.2,254.8L299.5,248.2L306.8,241.5L301.2,234.8L308.5,228.2L302.8,221.5L310.2,214.8L304.5,208.2L312.8,201.5L307.2,194.8L315.5,188.2L309.8,181.5L318.2,174.8L324.5,180.2L330.8,174.5L337.2,180.8L343.5,175.2L349.8,182.5L356.2,176.8Z",
  },
  CE: {
    name: "Ceará",
    path: "M373.5,107.2L379.8,103.5L386.2,109.8L392.5,104.2L398.8,111.5L405.2,106.8L410.5,114.2L404.8,121.5L410.2,128.8L403.5,136.2L398.8,143.5L392.2,149.8L385.5,145.2L379.8,152.5L373.2,148.8L366.5,156.2L359.8,151.5L354.2,158.8L348.5,154.2L353.2,146.8L347.5,140.2L354.8,133.5L349.2,126.8L356.5,120.2L350.8,113.5L358.2,106.8L364.5,112.2L370.8,106.5Z",
  },
  DF: {
    name: "Distrito Federal",
    path: "M295.2,206.5L301.5,203.8L307.8,210.2L304.2,216.5L297.5,213.8Z",
  },
  ES: {
    name: "Espírito Santo",
    path: "M380.5,260.8L386.8,257.2L393.2,263.5L389.5,270.8L395.8,277.2L390.2,284.5L384.5,280.8L378.8,288.2L372.2,283.5L376.5,276.2L370.8,269.5L377.2,262.8Z",
  },
  GO: {
    name: "Goiás",
    path: "M280.5,186.2L286.8,182.5L293.2,188.8L299.5,183.2L305.8,190.5L312.2,185.8L318.5,193.2L312.8,200.5L319.2,207.8L312.5,215.2L318.8,222.5L311.2,229.8L306.5,237.2L300.8,243.5L294.2,238.8L288.5,246.2L281.8,241.5L276.2,248.8L269.5,244.2L274.2,236.8L268.5,230.2L275.8,223.5L270.2,216.8L277.5,210.2L271.8,203.5L279.2,196.8L273.5,190.2Z",
  },
  MA: {
    name: "Maranhão",
    path: "M295.8,89.5L302.2,85.8L308.5,92.2L314.8,87.5L321.2,94.8L327.5,90.2L333.8,97.5L340.2,92.8L346.5,100.2L340.8,107.5L347.2,114.8L340.5,122.2L346.8,129.5L339.2,136.8L333.5,143.2L327.8,139.5L322.2,146.8L315.5,142.2L309.8,150.5L303.2,145.8L297.5,153.2L291.8,148.5L298.2,141.2L292.5,134.5L299.8,127.8L294.2,121.2L301.5,114.5L295.8,107.8L303.2,101.2L297.5,94.5Z",
  },
  MG: {
    name: "Minas Gerais",
    path: "M306.5,205.8L312.8,202.2L319.2,208.5L325.5,203.8L331.8,211.2L338.2,206.5L344.5,213.8L350.8,209.2L357.2,216.5L363.5,211.8L369.8,219.2L364.2,226.5L370.5,233.8L363.8,241.2L358.2,247.5L352.5,243.8L346.8,251.2L340.2,246.5L334.5,253.8L328.8,249.2L323.2,256.5L316.5,251.8L310.8,259.2L304.2,254.5L298.5,261.8L292.8,257.2L299.2,249.8L293.5,243.2L300.8,236.5L295.2,229.8L302.5,223.2L296.8,216.5L304.2,209.8Z",
  },
  MS: {
    name: "Mato Grosso do Sul",
    path: "M228.5,232.8L234.8,229.2L241.2,235.5L247.5,230.8L253.8,238.2L260.2,233.5L266.5,240.8L259.8,248.2L266.2,255.5L259.5,262.8L253.8,269.2L248.2,265.5L242.5,272.8L235.8,268.2L230.2,275.5L223.5,270.8L218.8,278.2L212.2,273.5L217.8,266.2L211.2,259.5L218.5,252.8L212.8,246.2L220.2,239.5L214.5,232.8Z",
  },
  MT: {
    name: "Mato Grosso",
    path: "M180.5,130.2L186.8,126.5L193.2,132.8L199.5,128.2L205.8,135.5L212.2,130.8L218.5,138.2L224.8,133.5L231.2,140.8L237.5,136.2L243.8,143.5L250.2,138.8L256.5,146.2L262.8,141.5L269.2,148.8L263.5,156.2L270.8,163.5L264.2,170.8L258.5,177.2L252.8,173.5L247.2,180.8L240.5,176.2L234.8,183.5L228.2,178.8L222.5,186.2L215.8,181.5L210.2,188.8L203.5,184.2L197.8,191.5L191.2,186.8L185.5,194.2L178.8,189.5L184.5,182.2L178.8,175.5L186.2,168.8L180.5,162.2L188.8,155.5L183.2,148.8L191.5,142.2L185.8,135.5Z",
  },
  PA: {
    name: "Pará",
    path: "M245.2,54.8L251.5,51.2L257.8,57.5L264.2,52.8L270.5,60.2L276.8,55.5L283.2,62.8L289.5,58.2L295.8,65.5L290.2,72.8L296.5,80.2L289.8,87.5L284.2,94.8L278.5,90.2L272.8,97.5L266.2,92.8L260.5,100.2L253.8,95.5L248.2,102.8L241.5,98.2L246.2,90.8L240.5,84.2L247.8,77.5L242.2,70.8L249.5,64.2L243.8,57.5Z",
  },
  PB: {
    name: "Paraíba",
    path: "M398.5,142.8L404.8,139.2L411.2,145.5L406.5,152.8L400.8,148.2L395.2,155.5L389.5,151.8L396.8,144.5Z",
  },
  PE: {
    name: "Pernambuco",
    path: "M378.2,148.5L384.5,144.8L390.8,151.2L397.2,146.5L403.5,153.8L396.8,161.2L391.2,167.5L385.5,163.8L379.8,171.2L373.2,166.5L367.5,173.8L360.8,169.2L366.2,161.8L360.5,155.2L367.8,148.5L374.2,152.8Z",
  },
  PI: {
    name: "Piauí",
    path: "M343.5,100.8L349.8,97.2L356.2,103.5L362.5,98.8L368.8,106.2L362.2,113.5L368.5,120.8L361.8,128.2L356.2,134.5L350.5,130.8L344.8,138.2L338.2,133.5L332.5,140.8L325.8,136.2L320.2,143.5L313.5,138.8L319.2,131.5L313.5,124.8L320.8,118.2L315.2,111.5L322.5,104.8L328.8,109.2L335.2,103.5Z",
  },
  PR: {
    name: "Paraná",
    path: "M252.5,290.8L258.8,287.2L265.2,293.5L271.5,288.8L277.8,296.2L284.2,291.5L290.5,298.8L284.8,306.2L291.2,313.5L284.5,320.8L278.8,327.2L273.2,323.5L267.5,330.8L260.8,326.2L255.2,333.5L248.5,328.8L254.2,321.5L248.5,314.8L255.8,308.2L250.2,301.5L257.5,294.8Z",
  },
  RJ: {
    name: "Rio de Janeiro",
    path: "M358.2,293.5L364.5,289.8L370.8,296.2L365.2,303.5L359.5,299.8L353.8,307.2L348.2,303.5L354.8,296.2Z",
  },
  RN: {
    name: "Rio Grande do Norte",
    path: "M392.8,123.5L399.2,119.8L405.5,126.2L410.8,121.5L416.2,128.8L409.5,136.2L403.8,132.5L398.2,139.8L392.5,136.2L398.8,128.8Z",
  },
  RO: {
    name: "Rondônia",
    path: "M126.5,156.8L132.8,153.2L139.2,159.5L145.5,154.8L151.8,162.2L158.2,157.5L164.5,164.8L157.8,172.2L164.2,179.5L157.5,186.8L151.8,193.2L146.2,189.5L140.5,196.8L133.8,192.2L128.2,199.5L121.5,194.8L127.2,187.5L121.5,180.8L128.8,174.2L123.2,167.5L130.5,160.8Z",
  },
  RR: {
    name: "Roraima",
    path: "M164.5,31.8L170.8,28.2L177.2,34.5L183.5,29.8L189.8,37.2L183.2,44.5L189.5,51.8L182.8,59.2L177.2,65.5L171.5,61.8L165.8,69.2L159.2,64.5L153.5,71.8L146.8,67.2L152.5,59.8L146.8,53.2L154.2,46.5L148.5,39.8L155.8,33.2L162.2,37.5Z",
  },
  RS: {
    name: "Rio Grande do Sul",
    path: "M248.8,337.2L255.2,333.5L261.5,339.8L267.8,335.2L274.2,342.5L269.5,349.8L275.8,357.2L268.2,364.5L262.5,370.8L256.8,367.2L251.2,374.5L244.5,369.8L238.8,377.2L232.2,372.5L237.8,365.2L232.2,358.5L239.5,351.8L233.8,345.2L241.2,338.5L247.5,343.8Z",
  },
  SC: {
    name: "Santa Catarina",
    path: "M264.5,325.8L270.8,322.2L277.2,328.5L283.5,323.8L289.8,331.2L283.2,338.5L277.5,344.8L271.8,341.2L266.2,348.5L259.5,343.8L265.2,336.5L259.5,329.8Z",
  },
  SE: {
    name: "Sergipe",
    path: "M385.5,179.8L391.8,176.2L398.2,182.5L393.5,189.8L387.8,186.2L382.2,193.5L377.5,189.8L384.2,182.5Z",
  },
  SP: {
    name: "São Paulo",
    path: "M278.8,265.2L285.2,261.5L291.5,267.8L297.8,263.2L304.2,270.5L310.5,265.8L316.8,273.2L323.2,268.5L329.5,275.8L322.8,283.2L317.2,289.5L311.5,285.8L305.8,293.2L299.2,288.5L293.5,295.8L286.8,291.2L281.2,298.5L274.5,293.8L280.2,286.5L274.5,279.8L281.8,273.2L276.2,266.5Z",
  },
  TO: {
    name: "Tocantins",
    path: "M298.2,136.8L304.5,133.2L310.8,139.5L317.2,134.8L323.5,142.2L316.8,149.5L323.2,156.8L316.5,164.2L310.8,170.5L305.2,166.8L299.5,174.2L292.8,169.5L287.2,176.8L280.5,172.2L286.2,164.8L280.5,158.2L287.8,151.5L282.2,144.8L289.5,138.2L295.8,142.5Z",
  },
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
  const containerRef = React.useRef<HTMLDivElement | null>(null);

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

  // Calculate fill color based on value (orange scale like reference)
  const getFillColor = (stateCode: string) => {
    const value = valueMap[stateCode] || 0;
    const intensity = value / maxValue;

    if (intensity === 0) return "hsl(var(--muted))";

    // Orange scale from light to saturated (matching reference)
    const lightness = 65 - intensity * 30;
    const saturation = 70 + intensity * 25;
    return `hsl(25 ${saturation}% ${lightness}%)`;
  };

  const updateTooltipPos = React.useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setTooltipPos({
        x: clientX - rect.left,
        y: clientY - rect.top,
      });
    },
    []
  );

  const handlePointerMove = (e: React.PointerEvent, code: string) => {
    updateTooltipPos(e.clientX, e.clientY);
    setHoveredState(code);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <svg
        viewBox="30 20 400 370"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        style={{ maxHeight: 280 }}
      >
        {/* States */}
        {Object.entries(STATES).map(([code, { path, name }]) => {
          const isHovered = hoveredState === code;

          return (
            <path
              key={code}
              d={path}
              fill={getFillColor(code)}
              stroke="hsl(var(--border))"
              strokeWidth={isHovered ? 1.5 : 0.5}
              className="cursor-pointer transition-all duration-150"
              style={{
                filter: isHovered ? "brightness(1.25)" : "none",
              }}
              onPointerMove={(e) => handlePointerMove(e, code)}
              onPointerEnter={(e) => handlePointerMove(e, code)}
              onPointerLeave={() => setHoveredState(null)}
            />
          );
        })}
      </svg>

      {/* Tooltip (HTML) */}
      {hoveredState && (
        <div
          className="pointer-events-none absolute z-50 -translate-x-1/2 -translate-y-[calc(100%+10px)]"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="rounded-md border border-border bg-popover text-popover-foreground shadow-lg px-3 py-2 whitespace-nowrap">
            <div className="text-xs font-semibold leading-tight">
              {STATES[hoveredState]?.name}
            </div>
            <div className="text-[11px] text-muted-foreground leading-tight mt-0.5 tabular-nums">
              {(valueMap[hoveredState] || 0).toLocaleString("pt-BR")} acessos
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
