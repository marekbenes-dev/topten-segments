"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ExploreLinkCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onClick = () => {
    setErr(null);
    if (!("geolocation" in navigator)) {
      setErr("Geolocation not supported.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoading(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const radiusKm = 3; // tweak as you like
        const qs = new URLSearchParams({
          lat: String(lat),
          lng: String(lng),
          radius_km: String(radiusKm),
          activity_type: "running", // or "riding"
        });
        router.push(`/explore?${qs.toString()}`);
      },
      (e) => {
        setLoading(false);
        setErr(e.message || "Failed to get location");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  };

  return (
    <button
      onClick={onClick}
      className="text-left border rounded p-4 hover:bg-gray-50"
      disabled={loading}
    >
      <div className="text-lg font-semibold">
        {loading ? "Locating…" : "Explore Near Me"}
      </div>
      <p className="text-sm opacity-70">
        {err ? <span className="text-red-600">{err}</span> : "Find segments around you"}
      </p>
    </button>
  );
}
