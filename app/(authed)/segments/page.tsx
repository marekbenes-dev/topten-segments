// app/redirect/page.tsx
import { getCookie } from "cookies-next";
import { redirect } from "next/navigation";

async function getStarredSegments(accessToken: string) {
  const res = await fetch(
    "https://www.strava.com/api/v3/segments/starred?page=1&per_page=30",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Fetching starred segments failed");
  return res.json(); // array of segments
}

export default async function SegmentsPage({
  searchParams,
}: {
  searchParams: { code?: string; state?: string; error?: string };
}) {
  // 1) Basic sanity checks
  if (searchParams.error) redirect(`/?error=${encodeURIComponent(searchParams.error)}`);
  const code = searchParams.code;
  if (!code) redirect("/?error=missing_code");

  // TODO (recommended): validate `state` matches what you issued before redirecting to Strava


  const token = await getCookie("strava_access_token");

  if (!token) {
    redirect("/?error=missing_token");
  }

  const segments = await getStarredSegments(token);

  // 5) Render (or do `redirect('/dashboard')` after saving to DB)
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-xl font-bold">Your starred segments</h1>
      <ul className="mt-4 space-y-3">
        {segments.map((s: DetailedSegment) => (
          <li key={s.id} className="border rounded-lg p-3">
            <div className="font-medium">{s.name}</div>
            <div className="text-sm opacity-70">Distance: {Math.round(s.distance)} m</div>
            <div className="text-sm opacity-70">Your PR: {s.athlete_pr_effort.elapsed_time}</div>
            <div className="text-sm opacity-70">Avg Grade: {s.effort_count}%</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
