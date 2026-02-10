import * as React from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { LocateFixed } from "lucide-react";

import type { ApprovedMemberPin } from "./useApprovedMemberPins";
import { getMapboxTileConfig } from "@/config/mapbox";

// Fix default marker icons in bundlers
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString(),
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString(),
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString(),
});

// Rough Brazil bounds: [[southWestLat, southWestLng], [northEastLat, northEastLng]]
const BRAZIL_BOUNDS: [[number, number], [number, number]] = [
  [-33.75, -73.99],
  [5.27, -34.79],
];

type LatLng = { lat: number; lng: number };

export function MemberMap({
  pins,
  centerMe,
  mapbox,
  showRadius,
  radiusCenter,
  radiusKm,
  onSelectPin,
}: {
  pins: ApprovedMemberPin[];
  centerMe?: LatLng | null;
  mapbox?: {
    token: string;
    style: string;
  } | null;
  showRadius?: boolean;
  radiusCenter?: LatLng | null;
  radiusKm?: number | null;
  onSelectPin?: (userId: string) => void;
}) {
  const canGeolocate = typeof window !== "undefined" && !!window.navigator?.geolocation;
  const mapRef = React.useRef<L.Map | null>(null);
  const markersRef = React.useRef<L.LayerGroup | null>(null);
  const radiusCircleRef = React.useRef<L.Circle | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  /* 
    Lógica de Mapa:
    1. Global (Padrão): Mostra todos os pinos baseados no cadastro (CEP).
    2. Perto de Mim: Centraliza no usuário (GPS) e foca na região.
  */
  const [userLocation, setUserLocation] = React.useState<LatLng | null>(null);
  const [isLocating, setIsLocating] = React.useState(false);

  // Se centerMe vier de fora (ex: perfil do usuário logado), usamos como fallback inicial
  React.useEffect(() => {
    if (centerMe && !userLocation) {
      setUserLocation(centerMe);
    }
  }, [centerMe]);

  const onCenterOnMe = React.useCallback(() => {
    // Se temos uma localização definida (seja GPS ou CEP), focamos nela
    if (centerMe) {
      mapRef.current?.setView([centerMe.lat, centerMe.lng], 12, { animate: true });
      return;
    }

    // Fallback para geolocalização se não houver centro definido
    if (!navigator.geolocation) {
       alert("Seu navegador não suporta geolocalização.");
       return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        setIsLocating(false);
        mapRef.current?.setView([coords.lat, coords.lng], 12, { animate: true });
      },
      (err) => {
        console.error(err);
        setIsLocating(false);
        alert("Não foi possível obter sua localização. Verifique as permissões.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [centerMe]);

  const iconCacheRef = React.useRef<Map<string, L.DivIcon>>(new Map());

  const getAvatarIcon = React.useCallback((avatarUrl: string) => {
    const cache = iconCacheRef.current;
    const cached = cache.get(avatarUrl);
    if (cached) return cached;

    // Avoid broken HTML attributes from unexpected characters
    const safeUrl = encodeURI(avatarUrl).replace(/"/g, "%22");
    const icon = L.divIcon({
      className: "invictus-avatar-pin-wrap",
      html: `
        <div class="invictus-avatar-pin" aria-hidden="true">
          <span class="invictus-avatar-ring" aria-hidden="true"></span>
          <img class="invictus-avatar-img" src="${safeUrl}" alt="" loading="lazy" />
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      tooltipAnchor: [0, -18],
    });
    cache.set(avatarUrl, icon);
    return icon;
  }, []);

  // init map once
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
    });

    const mb = mapbox ? getMapboxTileConfig(mapbox) : null;
    const tileUrl = mb?.tileUrl ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const attribution =
      mb?.attribution ??
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    L.tileLayer(tileUrl, {
      attribution,
      opacity: 0.46,
    }).addTo(map);

    const markers = L.layerGroup().addTo(map);

    map.fitBounds(BRAZIL_BOUNDS);

    mapRef.current = map;
    markersRef.current = markers;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, [mapbox]);

  // update markers when pins change
  React.useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    markers.clearLayers();
    if (!pins || pins.length === 0) return;

    for (const p of pins) {
      if (typeof p.lat !== 'number' || typeof p.lng !== 'number' || isNaN(p.lat) || isNaN(p.lng)) {
        console.warn(`Invalid coordinates for pin: ${p.user_id}`, p);
        continue;
      }

      const label =
        p.display_name?.trim()
          ? `${p.display_name}${p.city && p.state ? ` — ${p.city}/${p.state}` : ""}`
          : p.city && p.state
            ? `${p.city}/${p.state}`
            : "Invictus";

      try {
        const marker = L.marker([p.lat, p.lng], { icon: getAvatarIcon(p.avatar_url) }).addTo(markers);
        if (onSelectPin) {
          marker.on("click", () => onSelectPin(p.user_id));
        }

        marker.bindTooltip(label, {
            direction: "top",
            opacity: 1,
            sticky: true,
            className: "invictus-map-tooltip",
          });
      } catch (err) {
        console.error("Error adding marker to map:", err);
      }
    }
  }, [pins, getAvatarIcon, onSelectPin]);

  // radius circle overlay (privacy: only show approx center)
  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const shouldShow = !!showRadius && !!radiusCenter && typeof radiusKm === "number" && 
                       typeof radiusCenter.lat === 'number' && typeof radiusCenter.lng === 'number' &&
                       !isNaN(radiusCenter.lat) && !isNaN(radiusCenter.lng);

    if (!shouldShow) {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.remove();
        radiusCircleRef.current = null;
      }
      return;
    }

    const center: [number, number] = [radiusCenter!.lat, radiusCenter!.lng];
    const meters = Math.max(1, radiusKm!) * 1000;

    try {
      if (!radiusCircleRef.current) {
        radiusCircleRef.current = L.circle(center, {
          radius: meters,
          // keep visuals subtle and on-theme
          color: "hsl(var(--primary))" as any,
          fillColor: "hsl(var(--primary))" as any,
          fillOpacity: 0.08,
          weight: 1,
          opacity: 0.65,
        }).addTo(map);
      } else {
        radiusCircleRef.current.setLatLng(center);
        radiusCircleRef.current.setRadius(meters);
      }
    } catch (err) {
      console.error("Error updating radius circle:", err);
    }
  }, [showRadius, radiusCenter, radiusKm]);

  return (
    <div className="invictus-surface invictus-frame invictus-map invictus-map-overlay relative w-full overflow-hidden rounded-lg border border-border/70">
      <div className="invictus-map-sweep" aria-hidden="true" />
      <div className="absolute right-3 top-16 z-[600] flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onCenterOnMe}
          disabled={isLocating}
          className="bg-white dark:bg-zinc-900 shadow-md border border-border/50 flex items-center justify-center h-10 w-10 rounded-md transition-all hover:bg-muted active:scale-95 group"
          title="Minha Posição"
        >
          <LocateFixed className={`h-5 w-5 ${isLocating ? 'animate-spin text-primary' : 'text-muted-foreground group-hover:text-primary'}`} />
          <span className="sr-only">Minha Posição</span>
        </button>
      </div>

      <div className="h-[360px] w-full sm:h-[420px] lg:h-[520px]">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
