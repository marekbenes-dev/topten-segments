import { redirect } from "next/navigation";
import { boundsFromCenterRadius } from "../../lib/geo";
import { getCookie } from "cookies-next";

export default async function ExplorePage({ searchParams }: { searchParams: { code?: string } }) {
  const geoRaw = await getCookie("geo");
  if (!geoRaw) redirect("/segments"); // no geo? fall back

  const { lat, lng, radiusKm } = JSON.parse(decodeURIComponent(geoRaw));
  const [swLat, swLng, neLat, neLng] = boundsFromCenterRadius(lat, lng, radiusKm);

  // 3) Call Strava Explore (server-side)
  const token = await getCookie("strava_access_token");
  const qs = new URLSearchParams({
    bounds: `${swLat},${swLng},${neLat},${neLng}`,
    activity_type: "running", // or "riding"
  });

  const res = await fetch(`https://www.strava.com/api/v3/segments/explore?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Explore failed", await res.text());
    redirect("/segments?error=explore_failed");
  }

  const data = await res.json(); // { segments: [...] }
  // Store results somewhere (DB/session) or redirect with a lightweight flag
  // For demo, just render:
  return (
    <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data.segments, null, 2)}</pre>
  );
}
