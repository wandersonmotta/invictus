import * as React from "react";
import L from "leaflet";

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

export function MemberMap({ pins }: { pins: ApprovedMemberPin[] }) {
  const mapRef = React.useRef<L.Map | null>(null);
  const markersRef = React.useRef<L.LayerGroup | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // init map once
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
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
      L.marker([p.lat, p.lng]).addTo(markers).bindTooltip(label, { direction: "top", opacity: 1 });
    }
  }, [pins]);

  return (
    <div className="invictus-surface invictus-frame w-full overflow-hidden rounded-lg border border-border/70">
      <div className="h-[360px] w-full sm:h-[420px] lg:h-[520px]">
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
