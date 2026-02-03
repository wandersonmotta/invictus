import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { format } from "date-fns";

interface DateRange {
  from?: Date;
  to?: Date;
}

interface MetaMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  frequency: number;
  cpc: number;
  cpm: number;
  ctr: number;
  purchases: number;
  purchase_value: number;
  roas: number;
}

interface GoogleAdsMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpc: number;
  ctr: number;
}

interface GA4Metrics {
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
  conversions: number;
}

interface MetaResponse {
  connected: boolean;
  period?: { start: string; end: string };
  metrics?: MetaMetrics;
  error?: string;
  note?: string;
}

interface GoogleResponse {
  connected: boolean;
  period?: { start: string; end: string };
  metrics?: GoogleAdsMetrics | GA4Metrics;
  error?: string;
  note?: string;
}

export function useLeadsMetrics(dateRange: DateRange | undefined) {
  const { session } = useAuth();

  const startDate = dateRange?.from
    ? format(dateRange.from, "yyyy-MM-dd")
    : format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
  const endDate = dateRange?.to
    ? format(dateRange.to, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  const metaQuery = useQuery<MetaResponse>({
    queryKey: ["leads-meta", startDate, endDate],
    queryFn: async () => {
      if (!session?.access_token) {
        return { connected: false, error: "Not authenticated" };
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leads-meta-insights?start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        return { connected: false, error: data.error };
      }
      return data;
    },
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const googleAdsQuery = useQuery<GoogleResponse>({
    queryKey: ["leads-google-ads", startDate, endDate],
    queryFn: async () => {
      if (!session?.access_token) {
        return { connected: false, error: "Not authenticated" };
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leads-google-insights?platform=google_ads&start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        return { connected: false, error: data.error };
      }
      return data;
    },
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000,
  });

  const ga4Query = useQuery<GoogleResponse>({
    queryKey: ["leads-ga4", startDate, endDate],
    queryFn: async () => {
      if (!session?.access_token) {
        return { connected: false, error: "Not authenticated" };
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leads-google-insights?platform=google_analytics&start_date=${startDate}&end_date=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (!response.ok) {
        return { connected: false, error: data.error };
      }
      return data;
    },
    enabled: !!session?.access_token,
    staleTime: 5 * 60 * 1000,
  });

  // Calculate aggregated KPIs
  const metaMetrics = metaQuery.data?.metrics;
  const googleMetrics = googleAdsQuery.data?.metrics as GoogleAdsMetrics | undefined;
  const ga4Metrics = ga4Query.data?.metrics as GA4Metrics | undefined;

  const totalSpend = (metaMetrics?.spend || 0) + (googleMetrics?.spend || 0);
  const totalConversions =
    (metaMetrics?.purchases || 0) + (googleMetrics?.conversions || 0);
  const totalRevenue = metaMetrics?.purchase_value || 0;
  const roi = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const conversionRate =
    (metaMetrics?.clicks || 0) + (googleMetrics?.clicks || 0) > 0
      ? (totalConversions /
          ((metaMetrics?.clicks || 0) + (googleMetrics?.clicks || 0))) *
        100
      : 0;

  return {
    meta: {
      isLoading: metaQuery.isLoading,
      isError: metaQuery.isError,
      data: metaQuery.data,
      connected: metaQuery.data?.connected ?? false,
    },
    googleAds: {
      isLoading: googleAdsQuery.isLoading,
      isError: googleAdsQuery.isError,
      data: googleAdsQuery.data,
      connected: googleAdsQuery.data?.connected ?? false,
    },
    ga4: {
      isLoading: ga4Query.isLoading,
      isError: ga4Query.isError,
      data: ga4Query.data,
      connected: ga4Query.data?.connected ?? false,
    },
    aggregated: {
      totalSpend,
      totalConversions,
      totalRevenue,
      roi,
      conversionRate,
      isLoading:
        metaQuery.isLoading || googleAdsQuery.isLoading || ga4Query.isLoading,
    },
    refetchAll: () => {
      metaQuery.refetch();
      googleAdsQuery.refetch();
      ga4Query.refetch();
    },
  };
}

// Helper to format currency
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

// Helper to format numbers
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

// Helper to format percentage
export function formatPercent(value: number, decimals = 2): string {
  return `${formatNumber(value, decimals)}%`;
}
