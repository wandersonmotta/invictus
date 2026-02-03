import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface DualLineChartProps {
  data: { date: string; meta: number; google: number }[];
  className?: string;
  height?: number;
}

const META_COLOR = "hsl(214 100% 50%)";
const GOOGLE_COLOR = "hsl(142 76% 36%)";

export function DualLineChart({
  data,
  className,
  height = 220,
}: DualLineChartProps) {
  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => [
              value.toLocaleString("pt-BR"),
              name === "meta" ? "Meta Ads" : "Google Ads",
            ]}
          />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) =>
              value === "meta" ? "Meta Ads" : "Google Ads"
            }
            iconType="circle"
            iconSize={8}
          />
          <Line
            type="monotone"
            dataKey="meta"
            stroke={META_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: META_COLOR }}
          />
          <Line
            type="monotone"
            dataKey="google"
            stroke={GOOGLE_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: GOOGLE_COLOR }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
