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

  // Stabilize coordinates to 3 decimals (~100m) to prevent excessive refetching
  const stableLat = React.useMemo(
    () => (typeof lat === "number" ? Math.round(lat * 1000) / 1000 : null),
    [lat]
  );
  const stableLng = React.useMemo(
    () => (typeof lng === "number" ? Math.round(lng * 1000) / 1000 : null),
    [lng]
  );

  // Track last fetch params to prevent duplicate fetches
  const lastFetchRef = React.useRef<string | null>(null);

  const reload = React.useCallback(async (force = false) => {
    if (!enabled || typeof stableLat !== "number" || typeof stableLng !== "number") return;

    const fetchKey = `${stableLat},${stableLng},${radiusKm}`;
    
    // Skip if same params and not forced
    if (!force && lastFetchRef.current === fetchKey) return;
    
    lastFetchRef.current = fetchKey;
    setLoading(true);
    
    const { data, error } = await supabase.rpc("get_nearby_member_pins", {
      p_lat: stableLat,
      p_lng: stableLng,
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
  }, [enabled, stableLat, stableLng, radiusKm, limit, toast]);

  // Initial fetch and refetch when key params change (stabilized)
  React.useEffect(() => {
    if (!enabled) {
      setPins([]);
      setLoading(false);
      lastFetchRef.current = null;
      return;
    }
    void reload();
  }, [enabled, stableLat, stableLng, radiusKm, reload]);

  // Periodic refetch every 30 seconds while enabled (for live location updates)
  React.useEffect(() => {
    if (!enabled) return;
    
    const intervalId = window.setInterval(() => {
      void reload(true);
    }, 30_000);
    
    return () => window.clearInterval(intervalId);
  }, [enabled, reload]);

  const manualReload = React.useCallback(() => void reload(true), [reload]);

  return { loading, pins, reload: manualReload };
}
