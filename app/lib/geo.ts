export function boundsFromCenterRadius(lat: number, lng: number, radiusKm: number) {
  const kmPerDegLat = 111.32;
  const dLat = radiusKm / kmPerDegLat;

  const kmPerDegLng = Math.max(1e-6, 111.32 * Math.cos((lat * Math.PI) / 180));
  const dLng = radiusKm / kmPerDegLng;

  const wrap = (x: number) => ((x + 180) % 360 + 360) % 360 - 180;
  return [lat - dLat, wrap(lng - dLng), lat + dLat, wrap(lng + dLng)] as const;
}
