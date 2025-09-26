"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ExploreLinkCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(3); // default radius

  const saveGeoServer = async (lat: number, lng: number, radiusKm: number) => {
    await fetch("/api/geo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng, radiusKm }),
      credentials: "include",
    });
  };

  function getErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    try {
      return JSON.stringify(err);
    } catch {
      return "Unknown error";
    }
  }

  const locateAndGo = async () => {
    setErr(null);
    if (!("geolocation" in navigator)) {
      setErr("Geolocation not supported.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          await saveGeoServer(lat, lng, radiusKm);
          router.push("/explore");
        } catch (e: unknown) {
          setErr(getErrorMessage(e));
        } finally {
          setLoading(false);
        }
      },
      (e) => {
        setLoading(false);
        setErr(e.message || "Failed to get location");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 },
    );
  };

  return (
    <div className="border rounded p-4 hover:bg-gray-50">
      <div className="flex items-center justify-between gap-3">
        <div>
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
        </div>

        {/* Radius selector */}
        <label className="text-sm flex items-center gap-2">
          <span className="opacity-70">Radius</span>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            disabled={loading}
            aria-label="Search radius (km)"
          >
            {[1, 2, 3, 5, 10, 20].map((km) => (
              <option key={km} value={km}>
                {km} km
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        onClick={locateAndGo}
        className="mt-4 w-full rounded bg-black text-white py-2 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Getting location…" : `Explore (${radiusKm} km)`}
      </button>
    </div>
  );
}
