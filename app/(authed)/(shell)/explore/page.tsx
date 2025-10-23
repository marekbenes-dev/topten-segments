import { redirect } from "next/navigation";
import { boundsFromCenterRadius } from "../../../../lib/geo";
import { cookies } from "next/headers";
import ExploreMap from "./ExploreMap";
import { StravaCookie } from "@/app/constants/tokens";
import type { ExploreSegment } from "./types/types";

export default async function ExplorePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(StravaCookie.AccessToken)?.value;
  const latCookie = cookieStore.get(StravaCookie.GeoLat)?.value;
  const lngCookie = cookieStore.get(StravaCookie.GeoLng)?.value;
  const radiusCookie = cookieStore.get(StravaCookie.GeoRadius)?.value;

  if (!latCookie || !lngCookie) redirect("/?error=no_geo"); // no geo? fall back

  if (!token) redirect("/?error=missing_token");

  const [swLat, swLng, neLat, neLng] = boundsFromCenterRadius(
    Number(latCookie),
    Number(lngCookie),
    radiusCookie ? Number(radiusCookie) : 5,
  );

  const fmt = (n: number) => n.toFixed(6);
  const clampLat = (n: number) => Math.max(-90, Math.min(90, n));
  const clampLng = (n: number) => ((((n + 180) % 360) + 360) % 360) - 180; // wrap to [-180,180)

  const sw = { lat: clampLat(swLat), lng: clampLng(swLng) };
  const ne = { lat: clampLat(neLat), lng: clampLng(neLng) };

  // Build URL with proper query
  const url = new URL("https://www.strava.com/api/v3/segments/explore");
  url.searchParams.set(
    "bounds",
    `${fmt(sw.lat)},${fmt(sw.lng)},${fmt(ne.lat)},${fmt(ne.lng)}`,
  );
  url.searchParams.set("activity_type", "running"); // or "riding"

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Explore failed", JSON.stringify(res), token);
    redirect("/?error=explore_failed");
  }

  const data = await res.json(); // { segments: [...] }
  // Store results somewhere (DB/session) or redirect with a lightweight flag
  // For demo, just render:
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-xl font-bold">Segments near you</h1>
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ExploreMap segments={data.segments || []} />
        </div>

        <aside className="border rounded-lg p-4">
          <div className="font-semibold mb-2">List</div>
          <ul className="space-y-2">
            {(data.segments || []).map((s: ExploreSegment) => (
              <li key={s.id} className="text-sm">
                <a
                  className="underline"
                  href={`https://www.strava.com/segments/${s.id}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {s.name}
                </a>
                <div className="opacity-70">
                  {s.start_latlng?.[0]?.toFixed(4)},{" "}
                  {s.start_latlng?.[1]?.toFixed(4)}
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
