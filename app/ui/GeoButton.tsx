"use client";

import { useState } from "react";

type Props = {
  onLocate?: (coords: { lat: number; lng: number }) => void;
  label?: string;
};

export default function GeoButton({ onLocate }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setGeoCookie(lat: number, lng: number, radiusKm = 3) {
    const value = encodeURIComponent(JSON.stringify({ lat, lng, radiusKm }));
    document.cookie = `geo=${value}; Max-Age=600; Path=/; SameSite=Lax`;
  }

  async function handleClick() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        const { latitude: lat, longitude: lng } = pos.coords;
        setGeoCookie(lat, lng, 3); // default 3 km radius
        onLocate?.({ lat, lng });
        // fallback: console.log if no callback passed
        if (!onLocate) {
          console.log("Latitude:", lat, "Longitude:", lng);
        }
      },
      (err) => {
        setLoading(false);
        setError(err.message || "Error obtaining location");
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 10_000 }
    );
  }

  return (
    <div>
      <button onClick={handleClick} disabled={loading}>
        {loading ? "Locating…" : "Use my location"}
      </button>
      {error && <p style={{ color: "red", fontSize: 12 }}>{error}</p>}
    </div>
  );
}
