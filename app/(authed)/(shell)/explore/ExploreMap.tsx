"use client";

import * as L from "leaflet";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { ExploreSegment } from "./types/types";

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [points, map]);
  return null;
}

export default function ExploreMap({
  segments,
}: {
  segments: ExploreSegment[];
}) {
  // Fallback center if no segments yet (Prague-ish)
  const fallbackCenter: [number, number] = [50.08, 14.43];

  const points = useMemo(
    () => segments.map((s) => s.start_latlng).filter(Boolean),
    [segments],
  );

  return (
    <div className="h-[480px] w-full border rounded-lg overflow-hidden">
      <MapContainer
        center={points[0] ?? fallbackCenter}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          // OpenStreetMap tiles (no key)
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://osm.org/copyright">OSM</a> contributors'
        />

        {points.length > 0 && <FitBounds points={points} />}

        {segments.map((seg) => {
          const [lat, lng] = seg.start_latlng || [];
          if (typeof lat !== "number" || typeof lng !== "number") return null;
          return (
            <CircleMarker
              key={seg.id}
              center={[lat, lng]}
              radius={6}
              stroke={false}
              color="#FC5200"
              fillOpacity={0.8}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-medium">{seg.name}</div>
                  <a
                    className="underline"
                    href={`https://www.strava.com/segments/${seg.id}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    Open on Strava
                  </a>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
