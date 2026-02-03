import { cn } from "@/lib/utils";

interface IconProps {
  className?: string;
}

// Meta icon - blue infinity symbol matching brand guidelines
export function MetaIcon({ className }: IconProps) {
  return (
    <span 
      className={cn("text-lg leading-none font-bold", className)} 
      style={{ color: "#1877F2" }} 
      aria-hidden
    >
      ∞
    </span>
  );
}

// Official Google Ads icon - multicolor
export function GoogleAdsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", className)}>
      <path fill="#FBBC04" d="M3.5 18.49l5.5-9.53 5.5 9.53a3 3 0 0 1-1.1 4.1 3 3 0 0 1-4.1-1.1L3.5 18.49Z"/>
      <path fill="#4285F4" d="M14.5 18.49l5.5-9.53a3 3 0 0 1 4.1 1.1 3 3 0 0 1-1.1 4.1l-5.5 3.18-3-1.85Z"/>
      <path fill="#34A853" d="M9 8.96l5.5-9.53a3 3 0 0 1 4.1 1.1l-5.5 9.53L9 8.96Z"/>
      <circle fill="#EA4335" cx="6" cy="18" r="3"/>
    </svg>
  );
}

// Official Google Analytics icon - orange/amber
export function AnalyticsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 192 192" className={cn("h-5 w-5", className)}>
      <path fill="none" d="M0 0h192v192H0z"/>
      <path 
        fill="#F9AB00" 
        d="M130 29v132c0 14.77 10.19 23 21 23 10 0 21-7 21-23V30c0-13.54-10-22-21-22s-21 9.33-21 21z"
      />
      <path 
        fill="#E37400" 
        d="M20 130v32c0 14.77 10.19 23 21 23 10 0 21-7 21-23v-32c0-13.54-10-22-21-22s-21 9.33-21 21z"
      />
      <circle fill="#E37400" cx="96" cy="163" r="21"/>
      <circle fill="#F9AB00" cx="96" cy="99" r="21"/>
    </svg>
  );
}

// Header icons with text for card headers
export function MetaHeaderIcon({ className }: IconProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <MetaIcon />
    </div>
  );
}

export function GoogleAdsHeaderIcon({ className }: IconProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <GoogleAdsIcon />
    </div>
  );
}

export function AnalyticsHeaderIcon({ className }: IconProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <AnalyticsIcon />
    </div>
  );
}
