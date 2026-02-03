import { cn } from "@/lib/utils";
import { BarChart3, LineChart, PieChart, Smartphone, LayoutDashboard } from "lucide-react";

export type LeadsView = "overview" | "meta" | "google_ads" | "analytics" | "mobile";

interface LeadsSidebarProps {
  activeView: LeadsView;
  onViewChange: (view: LeadsView) => void;
  className?: string;
}

const navItems: { id: LeadsView; label: string; icon: React.ReactNode }[] = [
  {
    id: "overview",
    label: "Visão Geral",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    id: "meta",
    label: "Meta Ads",
    icon: (
      <span className="text-lg leading-none text-[#1877F2]">∞</span>
    ),
  },
  {
    id: "google_ads",
    label: "Google Ads",
    icon: (
      <span className="text-lg leading-none text-emerald-500">▲</span>
    ),
  },
  {
    id: "analytics",
    label: "GA4",
    icon: (
      <span className="text-lg leading-none text-orange-500">📊</span>
    ),
  },
  {
    id: "mobile",
    label: "Mobile",
    icon: <Smartphone className="h-5 w-5" />,
  },
];

export function LeadsSidebar({
  activeView,
  onViewChange,
  className,
}: LeadsSidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col gap-1 p-2 bg-card/40 backdrop-blur-sm border-r border-border/40",
        "w-20 lg:w-48 shrink-0",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-center lg:justify-start gap-2 p-3 mb-2">
        <span className="text-2xl">📈</span>
        <span className="hidden lg:inline text-xs text-muted-foreground font-medium">
          DashCortex
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                "text-sm font-medium",
                "hover:bg-muted/50",
                isActive
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground"
              )}
            >
              <span className="flex items-center justify-center w-6 h-6">
                {item.icon}
              </span>
              <span className="hidden lg:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
