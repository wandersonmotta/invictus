import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data
const impressionsData = [
  { date: "01/08", value: 32000 },
  { date: "02/08", value: 35000 },
  { date: "03/08", value: 38000 },
  { date: "04/08", value: 42000 },
  { date: "05/08", value: 45000 },
  { date: "06/08", value: 48000 },
  { date: "07/08", value: 52000 },
  { date: "08/08", value: 55000 },
  { date: "09/08", value: 51000 },
  { date: "10/08", value: 54000 },
  { date: "11/08", value: 58580 },
];

const analyticsData = [
  { day: "Seg", acessos: 580 },
  { day: "Ter", acessos: 620 },
  { day: "Qua", acessos: 710 },
  { day: "Qui", acessos: 690 },
  { day: "Sex", acessos: 780 },
  { day: "Sáb", acessos: 650 },
  { day: "Dom", acessos: 591 },
];

const regionData = [
  { name: "SP", value: 1908, color: "hsl(var(--primary))" },
  { name: "RJ", value: 277, color: "hsl(45 93% 47%)" },
  { name: "MG", value: 246, color: "hsl(142 76% 36%)" },
  { name: "PR", value: 189, color: "hsl(199 89% 48%)" },
  { name: "Outros", value: 2001, color: "hsl(var(--muted-foreground))" },
];

export function ImpressionsChart() {
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Impressões Totais
        </CardTitle>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">380.580</span>
          <span className="text-xs text-green-500 font-medium">▲ 111%</span>
        </div>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={impressionsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
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
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(value: number) => [value.toLocaleString(), "Impressões"]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function AnalyticsChart() {
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Google Analytics
        </CardTitle>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">4.621</span>
          <span className="text-xs text-muted-foreground">acessos totais</span>
        </div>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={analyticsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Bar
              dataKey="acessos"
              fill="hsl(25 95% 53%)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function RegionChart() {
  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Origem dos Acessos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={regionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {regionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {regionData.map((region) => (
              <div key={region.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: region.color }}
                  />
                  <span className="text-muted-foreground">{region.name}</span>
                </div>
                <span className="font-medium">{region.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
