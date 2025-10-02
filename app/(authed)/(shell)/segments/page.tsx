import { fmtDuration } from "@/lib/format";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function getStarredSegments(accessToken: string) {
  const res = await fetch(
    "https://www.strava.com/api/v3/segments/starred?page=1&per_page=30",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    throw new Error("Fetching starred segments failed" + JSON.stringify(res));
  }

  return res.json(); // array of segments
}

export default async function SegmentsPage() {
  const cookieStore = await cookies();
  const token = String(cookieStore.get("strava_access_token")?.value);

  if (!token) {
    redirect("/?error=missing_token");
  }

  const segments = await getStarredSegments(token);

  console.log("Fetched segments:", segments);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-xl font-bold">Your starred segments</h1>
      <ul className="mt-4 space-y-3">
        {segments.map((s: DetailedSegment) => (
          <li key={s.id} className="border rounded-lg p-3">
            <div className="font-medium">
              {s.name} / {s.activity_type}
            </div>
            <div className="text-sm opacity-70">
              Distance: {Math.round(s.distance)} m
            </div>
            <div className="text-sm opacity-70">
              Your PR: {fmtDuration(s.athlete_pr_effort?.elapsed_time)} mins
            </div>
            <div className="text-sm opacity-70">
              Avg Grade: {s.average_grade}%
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
