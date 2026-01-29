import * as React from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";

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
  // Keep the map stable; we fit Brazil by default.
  const bounds = React.useMemo(() => BRAZIL_BOUNDS, []);

  return (
    <div className="invictus-surface invictus-frame w-full overflow-hidden rounded-lg border border-border/70">
      <div className="h-[360px] w-full sm:h-[420px] lg:h-[520px]">
        <MapContainer
          bounds={bounds}
          boundsOptions={{ padding: [16, 16] }}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {pins.map((p) => (
            <Marker key={p.user_id} position={[p.lat, p.lng]}>
              <Tooltip>
                {p.city && p.state ? `${p.city}/${p.state}` : "Invictus"}
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
