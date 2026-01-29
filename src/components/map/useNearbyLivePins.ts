import * as React from "react";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type NearbyLivePin = {
  user_id: string;
  city: string | null;
  state: string | null;
  lat: number;
  lng: number;
  avatar_url: string;
  display_name: string | null;
  distance_km: number;
};

export function useNearbyLivePins({
  enabled,
  lat,
  lng,
  radiusKm,
  limit = 200,
}: {
  enabled: boolean;
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  limit?: number;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [pins, setPins] = React.useState<NearbyLivePin[]>([]);

  const reload = React.useCallback(async () => {
    if (!enabled || typeof lat !== "number" || typeof lng !== "number") return;
    setLoading(true);
    const { data, error } = await supabase.rpc("get_nearby_member_pins", {
      p_lat: lat,
      p_lng: lng,
      p_radius_km: radiusKm,
      p_limit: limit,
    });
    setLoading(false);
    if (error) {
      toast({
        title: "Erro ao carregar proximidade",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setPins((data as NearbyLivePin[] | null) ?? []);
  }, [enabled, lat, lng, radiusKm, limit, toast]);

  React.useEffect(() => {
    if (!enabled) {
      setPins([]);
      setLoading(false);
      return;
    }
    void reload();
  }, [enabled, reload]);

  return { loading, pins, reload };
}
