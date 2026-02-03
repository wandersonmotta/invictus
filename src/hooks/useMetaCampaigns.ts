import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  thumbnail_url: string | null;
  ad_sets_count: number;
  ads_count: number;
  insights: {
    spend: number;
    purchases: number;
    cost_per_purchase: number;
  };
}

interface MetaCampaignsResponse {
  connected: boolean;
  period?: { start: string; end: string };
  campaigns?: MetaCampaign[];
  error?: string;
}

interface UseMetaCampaignsOptions {
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

export function useMetaCampaigns(options: UseMetaCampaignsOptions = {}) {
  const { startDate, endDate, enabled = true } = options;

  return useQuery<MetaCampaignsResponse>({
    queryKey: ["meta-campaigns", startDate, endDate],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { connected: false, error: "Não autenticado" };
      }

      const params = new URLSearchParams();
      if (startDate) params.set("start_date", startDate);
      if (endDate) params.set("end_date", endDate);

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leads-meta-campaigns?${params}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { connected: false, error: data.error || "Erro ao buscar campanhas" };
      }

      return data;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}
