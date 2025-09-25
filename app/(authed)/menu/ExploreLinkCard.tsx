"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ExploreLinkCard({
  lightweight = false,
}: {
  lightweight?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const saveGeoServer = async (lat: number, lng: number, radiusKm: number) => {
    await fetch("/api/geo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng, radiusKm }),
      credentials: "include",
    });
  };

  const onClick = () => {
    setErr(null);
    if (!("geolocation" in navigator)) {
      setErr("Geolocation not supported.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLoading(false);

        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const radiusKm = 3; // tweak as you like

        await saveGeoServer(lat, lng, radiusKm);
        router.push("/explore");
      },
      (e) => {
        setLoading(false);
        setErr(e.message || "Failed to get location");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 },
    );
  };

  if (lightweight) {
    return (
      <Link onClick={onClick} href="/segments">
        Explore Near Me
      </Link>
    );
  }

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
        {err ? (
          <span className="text-red-600">{err}</span>
        ) : (
          "Find segments around you"
        )}
      </p>
    </button>
  );
}
