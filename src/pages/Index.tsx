import * as React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { MemberMap } from "@/components/map/MemberMap";
import { useApprovedMemberPins } from "@/components/map/useApprovedMemberPins";
import { useDeviceLocation } from "@/components/map/useDeviceLocation";
import { MemberQuickProfileDialog } from "@/components/map/MemberQuickProfileDialog";
import { MAPBOX_PREMIUM } from "@/config/invictusMap";
import { useNearbyLivePins } from "@/components/map/useNearbyLivePins";

// Update this page (the content is just a fallback if you fail to update the page)

const Index = () => {
  const { loading: pinsLoading, pins, reload } = useApprovedMemberPins();
  const [mode, setMode] = React.useState<"global" | "nearby">("global");
  const [radiusKm, setRadiusKm] = React.useState(80);
  const [selectedUserId, setSelectedUserId] = React.useState<string | null>(null);

  const deviceLocation = useDeviceLocation({ approxDecimals: 2 });

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

  const canUseProximity = me?.access_status === "approved";

  React.useEffect(() => {
    if (mode === "nearby" && canUseProximity) deviceLocation.start();
    if (mode !== "nearby") deviceLocation.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, canUseProximity]);

  const gpsReady = deviceLocation.status === "granted" && !!deviceLocation.exact;

  // Auto-share an approximate live location while in "nearby" mode.
  // Privacy: only sends rounded coords (approx) and expires quickly.
  React.useEffect(() => {
    if (mode !== "nearby") return;
    if (!canUseProximity) return;
    if (!gpsReady) return;
    if (!deviceLocation.approx) return;

    let stopped = false;

    const push = async () => {
      const approx = deviceLocation.approx;
      if (!approx || stopped) return;
      await supabase.rpc("upsert_my_live_location", {
        p_lat: approx.lat,
        p_lng: approx.lng,
        p_approx_decimals: 2,
        p_expires_in_seconds: 300,
      });
    };

    void push();
    const id = window.setInterval(() => {
      void push();
    }, 20_000);

    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [mode, canUseProximity, gpsReady, deviceLocation.approx]);

  const { loading: nearbyLoading, pins: nearbyPinsLive, reload: reloadNearby } = useNearbyLivePins({
    enabled: mode === "nearby" && canUseProximity && gpsReady,
    lat: deviceLocation.exact?.lat ?? null,
    lng: deviceLocation.exact?.lng ?? null,
    radiusKm,
    limit: 5000,
  });

  const nearby = React.useMemo(() => {
    if (mode !== "nearby") return null;
    if (!gpsReady) return null;

    // In "nearby" mode we rely on live-shared locations (opt-in).
    const list = (nearbyPinsLive ?? [])
      .map((p) => ({
        pin: p,
        distanceKm: typeof p.distance_km === "number" ? p.distance_km : 0,
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return list;
  }, [mode, gpsReady, nearbyPinsLive]);

  const pinsForMap = React.useMemo(() => {
    if (mode !== "nearby") return pins;
    // Enquanto o GPS ainda não retornou uma coordenada, evite “mapa vazio”:
    // mantém o mapa global visível e só filtra quando o GPS estiver pronto.
    if (!gpsReady) return pins;
    return (nearby ?? []).map((x) => x.pin);
  }, [mode, pins, nearby, gpsReady]);

  const mapCenter = React.useMemo(() => {
    if (mode === "nearby" && deviceLocation.exact) return deviceLocation.exact;
    return typeof me?.location_lat === "number" && typeof me?.location_lng === "number"
      ? { lat: me.location_lat, lng: me.location_lng }
      : null;
  }, [mode, deviceLocation.exact, me?.location_lat, me?.location_lng]);

  return (
    <main className="invictus-page">
      <header className="invictus-page-header">
        <h1 className="invictus-h1">Mapa</h1>
        <p className="invictus-lead">Um pin por membro aprovado (localização aproximada por cidade).</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MemberMap
            pins={pinsForMap}
            centerMe={mapCenter}
            mapbox={MAPBOX_PREMIUM.token && MAPBOX_PREMIUM.style ? MAPBOX_PREMIUM : null}
            showRadius={mode === "nearby" && canUseProximity}
            radiusCenter={mode === "nearby" ? deviceLocation.approx : null}
            radiusKm={mode === "nearby" ? radiusKm : null}
            onSelectPin={(userId) => {
              setSelectedUserId(userId);
            }}
          />
        </div>

        <aside className="space-y-4">
          <Card className="invictus-surface invictus-frame border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Proximidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {!canUseProximity ? (
                <p className="text-muted-foreground">
                  Disponível após aprovação. Enquanto isso, você pode usar o mapa global normalmente.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMode("global")}
                      className={
                        mode === "global"
                          ? "invictus-surface invictus-frame h-10 flex-1 rounded-md text-sm font-medium"
                          : "h-10 flex-1 rounded-md border border-border/60 text-sm text-muted-foreground hover:bg-muted/20"
                      }
                    >
                      Mapa global
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("nearby")}
                      className={
                        mode === "nearby"
                          ? "invictus-surface invictus-frame h-10 flex-1 rounded-md text-sm font-medium"
                          : "h-10 flex-1 rounded-md border border-border/60 text-sm text-muted-foreground hover:bg-muted/20"
                      }
                    >
                      Perto de mim
                    </button>
                  </div>

                  {mode === "nearby" ? (
                    <div className="space-y-3">
                      <div className="text-xs text-muted-foreground">Sua localização é aproximada (privacidade).</div>

                      {deviceLocation.status === "denied" ? (
                        <div className="space-y-2">
                          <p className="text-muted-foreground">
                            Você negou o acesso ao GPS. Para usar “Perto de mim”, habilite a permissão no navegador.
                          </p>
                          <button
                            type="button"
                            className="text-sm font-medium text-primary underline underline-offset-4"
                            onClick={() => deviceLocation.start()}
                          >
                            Tentar novamente
                          </button>
                        </div>
                      ) : deviceLocation.status === "unsupported" ? (
                        <p className="text-muted-foreground">Seu dispositivo não suporta geolocalização.</p>
                      ) : (
                        <>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm">
                                Raio: <span className="font-medium">{radiusKm} km</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {deviceLocation.status === "requesting"
                                  ? "Solicitando GPS…"
                                  : !gpsReady
                                    ? "Aguardando GPS…"
                                    : null}
                              </div>
                            </div>
                            <Slider
                              value={[radiusKm]}
                              min={10}
                              max={200}
                              step={10}
                              onValueChange={(v) => setRadiusKm(v[0] ?? 80)}
                            />
                          </div>

                          <div className="text-sm text-muted-foreground">
                            Encontrados:{" "}
                            <span className="text-foreground">
                              {mode === "nearby" && gpsReady && nearbyLoading ? "…" : nearby ? nearby.length : "—"}
                            </span>
                          </div>

                          {nearby && nearby.length ? (
                            <div className="max-h-72 overflow-auto rounded-lg border border-border/60">
                              <ul className="divide-y divide-border/60">
                                {nearby.slice(0, 25).map(({ pin, distanceKm }) => (
                                  <li key={pin.user_id}>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedUserId(pin.user_id)}
                                      className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/20"
                                    >
                                      <img
                                        src={pin.avatar_url}
                                        alt={pin.display_name ? `Avatar de ${pin.display_name}` : "Avatar do membro"}
                                        className="h-10 w-10 rounded-full object-cover border border-border/70"
                                        loading="lazy"
                                      />
                                      <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium">{pin.display_name ?? "Invictus"}</div>
                                        {pin.city && pin.state ? (
                                          <div className="truncate text-xs text-muted-foreground">
                                            {pin.city}/{pin.state}
                                          </div>
                                        ) : null}
                                      </div>
                                      <div className="text-xs text-muted-foreground">{Math.round(distanceKm)} km</div>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : mode === "nearby" && gpsReady ? (
                            <p className="text-muted-foreground">Ninguém dentro do raio selecionado.</p>
                          ) : null}
                        </>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>

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
                {pinsLoading
                  ? "Carregando pins..."
                  : mode === "nearby"
                    ? `${pinsForMap.length} pins (dentro do raio)`
                    : `${pins.length} pins (membros aprovados)`}
              </p>
              <button
                type="button"
                className="text-sm font-medium text-primary underline underline-offset-4"
                onClick={() => void reload()}
              >
                Recarregar
              </button>

              {mode === "nearby" && canUseProximity ? (
                <button
                  type="button"
                  className="text-sm font-medium text-primary underline underline-offset-4"
                  onClick={() => void reloadNearby()}
                >
                  Atualizar proximidade
                </button>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </section>

      <MemberQuickProfileDialog
        userId={selectedUserId}
        open={!!selectedUserId}
        onOpenChange={(o) => {
          if (!o) setSelectedUserId(null);
        }}
      />
    </main>
  );
};

export default Index;
