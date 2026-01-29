import * as React from "react";
import L from "leaflet";
import { LocateFixed, Minus, Plus } from "lucide-react";

import type { ApprovedMemberPin } from "./useApprovedMemberPins";

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
}: {
  pins: ApprovedMemberPin[];
  centerMe?: LatLng | null;
}) {
  const canGeolocate = typeof window !== "undefined" && !!window.navigator?.geolocation;
  const mapRef = React.useRef<L.Map | null>(null);
  const markersRef = React.useRef<L.LayerGroup | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const onZoomIn = React.useCallback(() => {
    mapRef.current?.zoomIn();
  }, []);

  const onZoomOut = React.useCallback(() => {
    mapRef.current?.zoomOut();
  }, []);

  const onGeolocate = React.useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Prefer the profile “approximate” location when available
    if (centerMe) {
      map.setView([centerMe.lat, centerMe.lng], 11, { animate: true });
      return;
    }

    // Fallback: browser geolocation
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 13, { animate: true });
      },
      () => {
        // silent fail
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  }, [centerMe]);

  const goldIcon = React.useMemo(() => {
    return L.divIcon({
      className: "invictus-map-pin-wrap",
      html: '<div class="invictus-map-pin" aria-hidden="true"><span class="invictus-map-pin-core"></span></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      tooltipAnchor: [0, -14],
    });
  }, []);

  // init map once
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {}).addTo(map);

    const markers = L.layerGroup().addTo(map);

    map.fitBounds(BRAZIL_BOUNDS);

    mapRef.current = map;
    markersRef.current = markers;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // update markers when pins change
  React.useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (!map || !markers) return;

    markers.clearLayers();

    for (const p of pins) {
      const label = p.city && p.state ? `${p.city}/${p.state}` : "Invictus";
      L.marker([p.lat, p.lng], { icon: goldIcon })
        .addTo(markers)
        .bindTooltip(label, {
          direction: "top",
          opacity: 1,
          sticky: true,
          className: "invictus-map-tooltip",
        });
    }
  }, [pins, goldIcon]);

  return (
    <div className="invictus-surface invictus-frame invictus-map invictus-map-overlay relative w-full overflow-hidden rounded-lg border border-border/70">
      <div className="invictus-map-sweep" aria-hidden="true" />
      <div className="absolute right-3 top-3 z-[600] flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onGeolocate}
          disabled={!centerMe && !canGeolocate}
          aria-label="Localizar"
          className="invictus-map-control inline-flex h-11 w-11 items-center justify-center rounded-md"
        >
          <LocateFixed className="h-4 w-4" />
        </button>

        <div className="invictus-map-control invictus-map-zoom flex flex-col overflow-hidden rounded-md">
          <button
            type="button"
            onClick={onZoomIn}
            aria-label="Zoom in"
            className="invictus-map-zoom-btn inline-flex h-11 w-11 items-center justify-center"
          >
            <Plus className="h-4 w-4" />
          </button>
          <div className="invictus-map-zoom-divider" />
          <button
            type="button"
            onClick={onZoomOut}
            aria-label="Zoom out"
            className="invictus-map-zoom-btn inline-flex h-11 w-11 items-center justify-center"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="h-[360px] w-full sm:h-[420px] lg:h-[520px]">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
