import { cn } from "@/lib/utils";
import { BarChart3, LineChart, PieChart, Smartphone, LayoutDashboard } from "lucide-react";

export type LeadsView = "overview" | "meta" | "google_ads" | "analytics" | "mobile";

interface LeadsSidebarProps {
  activeView: LeadsView;
  onViewChange: (view: LeadsView) => void;
  className?: string;
}

// Official Meta infinity icon
const MetaIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="#1877F2">
    <path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86c.655 1.706 1.986 2.718 4.04 2.718 1.085 0 2.088-.253 2.977-.744.896-.493 1.704-1.208 2.411-2.112.088-.111.172-.224.252-.338l.083-.123.082.123c.255.364.532.699.835 1.008.605.613 1.289 1.1 2.046 1.46.757.36 1.578.54 2.464.54 2.053 0 3.384-1.012 4.039-2.718.09-.233.166-.483.231-.75a8.3 8.3 0 0 0 .244-2.083c0-2.566-.704-5.24-2.043-7.306C16.768 5.31 15.053 4.03 13.085 4.03c-1.085 0-2.088.253-2.977.744a7.07 7.07 0 0 0-2.411 2.112 9.62 9.62 0 0 0-.168.235l-.167-.235C6.356 5.527 5.33 4.03 3.085 4.03h3.83Zm0 1.9c1.055 0 2.037.826 2.99 2.373.896 1.45 1.467 3.313 1.467 5.146 0 .433-.035.833-.107 1.191-.072.36-.192.697-.36 1.006-.336.617-.88.99-1.663.99-.493 0-.94-.1-1.336-.304-.396-.204-.754-.503-1.072-.893-.318-.39-.596-.858-.835-1.403-.478-1.09-.717-2.361-.717-3.587 0-1.833.571-3.696 1.467-5.146.453-.732.952-1.373 1.166-1.373Zm6.17 0c.214 0 .713.641 1.166 1.373.896 1.45 1.467 3.313 1.467 5.146 0 1.226-.239 2.497-.717 3.587-.239.545-.517 1.013-.835 1.403-.318.39-.676.689-1.072.893-.396.204-.843.304-1.336.304-.783 0-1.327-.373-1.663-.99a3.56 3.56 0 0 1-.36-1.006 5.63 5.63 0 0 1-.107-1.191c0-1.833.571-3.696 1.467-5.146.953-1.547 1.935-2.373 2.99-2.373Z"/>
  </svg>
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
