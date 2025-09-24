import { redirect } from "next/navigation";
import { boundsFromCenterRadius } from "../../lib/geo";
import { cookies } from "next/headers";

export default async function ExplorePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("strava_access_token");
  const latCookie = cookieStore.get("strava-geo-lat");
  const lngCookie = cookieStore.get("strava-geo-lng");

  if (!latCookie || !lngCookie) redirect("/menu?error=no_geo"); // no geo? fall back

  if (!token) redirect("/menu?error=missing_token");

  const [swLat, swLng, neLat, neLng] = boundsFromCenterRadius(Number(latCookie), Number(lngCookie), 5);


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
    redirect("/menu?error=explore_failed");
  }

  const data = await res.json(); // { segments: [...] }
  // Store results somewhere (DB/session) or redirect with a lightweight flag
  // For demo, just render:
  return (
    <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data.segments, null, 2)}</pre>
  );
}
