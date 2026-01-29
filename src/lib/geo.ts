export type LatLng = { lat: number; lng: number };

// Distância em KM (haversine)
export function haversineKm(a: LatLng, b: LatLng) {
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export function roundLatLng(v: LatLng, decimals = 2): LatLng {
  const pow = 10 ** decimals;
  return {
    lat: Math.round(v.lat * pow) / pow,
    lng: Math.round(v.lng * pow) / pow,
  };
}

function toRad(n: number) {
  return (n * Math.PI) / 180;
}
