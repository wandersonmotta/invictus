import { cn } from "@/lib/utils";
import { BarChart3, LineChart, PieChart, Smartphone, LayoutDashboard } from "lucide-react";

export type LeadsView = "overview" | "meta" | "google_ads" | "analytics" | "mobile";

interface LeadsSidebarProps {
  activeView: LeadsView;
  onViewChange: (view: LeadsView) => void;
  className?: string;
}

// Meta icon - blue infinity symbol
const MetaIcon = () => (
  <span className="text-lg leading-none font-bold" style={{ color: "#1877F2" }} aria-hidden>
    ∞
  </span>
);

// Official Google Ads icon
const GoogleAdsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#FBBC04" d="M3.5 18.49l5.5-9.53 5.5 9.53a3 3 0 0 1-1.1 4.1 3 3 0 0 1-4.1-1.1L3.5 18.49Z"/>
    <path fill="#4285F4" d="M14.5 18.49l5.5-9.53a3 3 0 0 1 4.1 1.1 3 3 0 0 1-1.1 4.1l-5.5 3.18-3-1.85Z"/>
    <path fill="#34A853" d="M9 8.96l5.5-9.53a3 3 0 0 1 4.1 1.1l-5.5 9.53L9 8.96Z"/>
    <circle fill="#EA4335" cx="6" cy="18" r="3"/>
  </svg>
);

// Official Google Analytics icon
const AnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5">
    <path fill="#F9AB00" d="M21 21H3v-2h18v2Z"/>
    <path fill="#E37400" d="M21 17H3v-2h18v2Zm0-4H3v-2h18v2Z"/>
    <path fill="#F9AB00" d="M12 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
    <path fill="#E37400" d="M12 9v4m-4 0a4 4 0 0 1 8 0"/>
  </svg>
);

const navItems: { id: LeadsView; label: string; icon: React.ReactNode }[] = [
  {
    id: "overview",
    label: "Visão Geral",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    id: "meta",
    label: "Meta Ads",
    icon: <MetaIcon />,
  },
  {
    id: "google_ads",
    label: "Google Ads",
    icon: <GoogleAdsIcon />,
  },
  {
    id: "analytics",
    label: "GA4",
    icon: <AnalyticsIcon />,
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
        <span className="hidden lg:inline text-sm font-semibold text-foreground">
          Leads
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
