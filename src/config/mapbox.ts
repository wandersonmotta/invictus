type MapboxConfig = {
  token: string;
  /** Accepts either a full mapbox style URL (mapbox://styles/user/styleId) or "user/styleId" */
  style: string;
};

function normalizeMapboxStyle(style: string) {
  const s = style.trim();
  if (s.startsWith("mapbox://styles/")) {
    return s.replace("mapbox://styles/", "");
  }
  // allow passing `user/styleId`
  return s;
}

export function getMapboxTileConfig(mapbox: MapboxConfig) {
  const token = mapbox.token?.trim();
  const style = normalizeMapboxStyle(mapbox.style);

  if (!token || !style) return null;

  // Raster tiles from a Mapbox style (Leaflet friendly)
  const tileUrl = `https://api.mapbox.com/styles/v1/${style}/tiles/256/{z}/{x}/{y}@2x?access_token=${encodeURIComponent(
    token,
  )}`;

  const attribution =
    '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  return { tileUrl, attribution };
}
