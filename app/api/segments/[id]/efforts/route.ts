import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { StravaCookie } from "@/app/constants/tokens";

export const dynamic = "force-dynamic";

type Effort = {
  id: number;
  start_date: string; // ISO
  elapsed_time: number; // seconds
  distance: number; // meters
};

async function fetchEffortsPaged(segmentId: number, token: string) {
  const perPage = 200;
  const all: Effort[] = [];
  for (let page = 1; ; page++) {
    const url = new URL(
      `https://www.strava.com/api/v3/segments/${segmentId}/all_efforts`,
    );
    url.searchParams.set("per_page", String(perPage));
    url.searchParams.set("page", String(page));
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      // cache Strava response for an hour; you can tweak this
      next: { revalidate: 3600, tags: [`segment-efforts-${segmentId}`] },
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Strava error: ${res.status} ${text}` },
        { status: 502 },
      );
    }
    const batch = await res.json();
    if (!Array.isArray(batch) || batch.length === 0) break;

    // Normalize minimal fields we need
    for (const e of batch) {
      all.push({
        id: e.id,
        start_date: e.start_date,
        elapsed_time: e.elapsed_time,
        distance: e.distance,
      });
    }

    if (batch.length < perPage) break;
    // small pacing (optional)
    await new Promise((r) => setTimeout(r, 80));
  }
  return NextResponse.json({ efforts: all });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  console.log("GET /api/segments/[id]/efforts", await params, req);
  const p = await params;
  console.log(p, "params");
  const token = (await cookies()).get(StravaCookie.AccessToken)?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Missing Strava token" },
      { status: 401 },
    );
  }

  const idNum = Number(p.id);
  if (!idNum) {
    return NextResponse.json({ error: "Invalid segment id" }, { status: 400 });
  }

  return fetchEffortsPaged(idNum, token);
}
