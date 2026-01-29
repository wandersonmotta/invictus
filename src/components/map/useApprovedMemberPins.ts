import * as React from "react";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export type ApprovedMemberPin = {
  user_id: string;
  city: string | null;
  state: string | null;
  lat: number;
  lng: number;
  avatar_url: string;
  display_name: string | null;
};

export function useApprovedMemberPins() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [pins, setPins] = React.useState<ApprovedMemberPin[]>([]);

  const reload = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_approved_member_pins", { p_limit: 5000 });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao carregar mapa", description: error.message, variant: "destructive" });
      return;
    }
    setPins((data as ApprovedMemberPin[] | null) ?? []);
  }, [toast]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  return { loading, pins, reload };
}
