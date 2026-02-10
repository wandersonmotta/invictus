import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type MyProfile = {
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  pix_key: string | null;
  city: string | null;
  state: string | null;
  location_lat: number | null;
  location_lng: number | null;
};

export function useMyProfile(userId: string | null | undefined) {
  return useQuery({
    queryKey: ["my-profile", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<MyProfile | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, display_name, avatar_url, pix_key, city, state, location_lat, location_lng")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return (data ?? null) as MyProfile | null;
    },
  });
}
