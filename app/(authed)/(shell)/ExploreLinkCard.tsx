"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
    <div className="block rounded px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
      <p className="text-sm mb-2">
        {err ? (
          <span className="text-red-600">{err}</span>
        ) : (
          "Segments around you"
        )}
      </p>

      {/* Radius selector */}
      <label className="text-sm flex items-center gap-2">
        <span className="opacity-70">Radius</span>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          disabled={loading}
          aria-label="Pick radius (km)"
        >
          {[1, 2, 3, 5, 10, 20].map((km) => (
            <option key={km} value={km}>
              {km} km
            </option>
          ))}
        </select>
      </label>

      <Button
        onClick={locateAndGo}
        className="mt-4 w-full rounded py-2"
        disabled={loading}
      >
        {loading ? "Loading…" : `Explore (${radiusKm} km)`}
      </Button>
    </div>
  );
}
