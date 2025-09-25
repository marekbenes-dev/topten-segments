import { redirect } from "next/navigation";
import { boundsFromCenterRadius } from "../../lib/geo";
import { cookies } from "next/headers";

export default async function ExplorePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("strava_access_token")?.value;
  const latCookie = cookieStore.get("strava-geo-lat")?.value;
  const lngCookie = cookieStore.get("strava-geo-lng")?.value;

  if (!latCookie || !lngCookie) redirect("/menu?error=no_geo"); // no geo? fall back

  if (!token) redirect("/menu?error=missing_token");

  const [swLat, swLng, neLat, neLng] = boundsFromCenterRadius(Number(latCookie), Number(lngCookie), 5);

  const fmt = (n: number) => n.toFixed(6);
  const clampLat = (n: number) => Math.max(-90, Math.min(90, n));
  const clampLng = (n: number) => ((n + 180) % 360 + 360) % 360 - 180; // wrap to [-180,180)

  const sw = { lat: clampLat(swLat), lng: clampLng(swLng) };
  const ne = { lat: clampLat(neLat), lng: clampLng(neLng) };

  // Build URL with proper query
  const url = new URL("https://www.strava.com/api/v3/segments/explore");
  url.searchParams.set(
    "bounds",
    `${fmt(sw.lat)},${fmt(sw.lng)},${fmt(ne.lat)},${fmt(ne.lng)}`
  );
  url.searchParams.set("activity_type", "running"); // or "riding"

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Explore failed", JSON.stringify(res), token);
    redirect("/menu?error=explore_failed");
  }

  const data = await res.json(); // { segments: [...] }
  // Store results somewhere (DB/session) or redirect with a lightweight flag
  // For demo, just render:
  return (
    <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data.segments, null, 2)}</pre>
  );
}
