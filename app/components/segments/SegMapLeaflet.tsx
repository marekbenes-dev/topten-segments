"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import polyline from "@mapbox/polyline";

// react-leaflet needs window, so load its pieces dynamically
const MapContainer = dynamic(
  async () => (await import("react-leaflet")).MapContainer,
  { ssr: false },
);
const TileLayer = dynamic(
  async () => (await import("react-leaflet")).TileLayer,
  { ssr: false },
);
const Polyline = dynamic(async () => (await import("react-leaflet")).Polyline, {
  ssr: false,
});

// Little bounds helper (no leaflet import needed)
type LatLng = [number, number];
function getBounds(points: LatLng[]) {
  if (!points.length) return null;
  let minLat = points[0][0],
    maxLat = points[0][0];
  let minLng = points[0][1],
    maxLng = points[0][1];
  for (const [lat, lng] of points) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  // Leaflet accepts [[southWestLat, southWestLng], [northEastLat, northEastLng]]
  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ] as [LatLng, LatLng];
}

export default function SegMapLeaflet({
  summaryPolyline,
  height = 240,
}: {
  summaryPolyline: string;
  height?: number;
}) {
  const latlngs = useMemo<LatLng[]>(
    () => polyline.decode(summaryPolyline) as LatLng[],
    [summaryPolyline],
  );
  const bounds = getBounds(latlngs);

  return (
    <div style={{ height, width: "100%" }}>
      <MapContainer
        // If you prefer a fixed center/zoom, you can use center/zoom instead.
        bounds={bounds ?? undefined}
        boundsOptions={{ padding: [20, 20] }}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", borderRadius: 12 }}
      >
        <TileLayer
          // OSM tiles (no token). Be mindful of usage policies for heavy traffic.
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {latlngs.length > 1 && (
          <Polyline
            positions={latlngs} /* pathOptions={{ color: "#ff3b3b" }} */
          />
        )}
      </MapContainer>
    </div>
  );
}
