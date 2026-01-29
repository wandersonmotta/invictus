import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { MemberMap } from "@/components/map/MemberMap";
import { useApprovedMemberPins } from "@/components/map/useApprovedMemberPins";

// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  const { loading: pinsLoading, pins, reload } = useApprovedMemberPins();
  const [me, setMe] = React.useState<{
    access_status: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
    location_lat: number | null;
    location_lng: number | null;
  } | null>(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId || !alive) return;
      const { data } = await supabase
        .from("profiles")
        .select("access_status, city, state, postal_code, location_lat, location_lng")
        .eq("user_id", userId)
        .maybeSingle();
      if (!alive) return;
      setMe((data as typeof me) ?? null);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const appearsOnMap =
    me?.access_status === "approved" &&
    !!me?.postal_code &&
    typeof me?.location_lat === "number" &&
    typeof me?.location_lng === "number";

  return (
    <main className="invictus-page">
      <header className="invictus-page-header">
        <h1 className="invictus-h1">Mapa</h1>
        <p className="invictus-lead">Um pin por membro aprovado (localização aproximada por cidade).</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MemberMap
            pins={pins}
            centerMe={
              typeof me?.location_lat === "number" && typeof me?.location_lng === "number"
                ? { lat: me.location_lat, lng: me.location_lng }
                : null
            }
          />
        </div>

        <aside className="space-y-4">
          <Card className="invictus-surface invictus-frame border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Seu status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                {appearsOnMap
                  ? "Você aparece no mapa (pin aproximado)."
                  : "Você ainda não aparece no mapa (apenas aprovados + CEP salvo)."}
              </p>
              {me?.city && me?.state ? (
                <p>
                  <span className="text-muted-foreground">Cidade/UF:</span> {me.city}/{me.state}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card className="invictus-surface invictus-frame border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Pins</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                {pinsLoading ? "Carregando pins..." : `${pins.length} pins (membros aprovados)`}
              </p>
              <button
                type="button"
                className="text-sm font-medium text-primary underline underline-offset-4"
                onClick={() => void reload()}
              >
                Recarregar
              </button>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
};

export default Index;
