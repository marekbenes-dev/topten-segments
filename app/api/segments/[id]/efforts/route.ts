import { NextRequest, NextResponse } from "next/server";
import { getStravaTokenOrThrow } from "@/lib/token";
import { Effort } from "./types";
import { fetchStravaApi } from "@/lib/strava-api";

export const dynamic = "force-dynamic";

async function fetchSegmentEfforts(
  segmentId: number,
  token: string,
): Promise<Effort[]> {
  const perPage = 200;
  const allEfforts: Effort[] = [];

  for (let page = 1; ; page++) {
    const batch = await fetchStravaApi(
      `/segments/${segmentId}/all_efforts`,
      token,
      {
        per_page: String(perPage),
        page: String(page),
      },
    );

    if (!Array.isArray(batch) || batch.length === 0) break;

    // Normalize minimal fields we need
    const normalizedEfforts = batch.map((e) => ({
      id: e.id,
      start_date: e.start_date,
      elapsed_time: e.elapsed_time,
      distance: e.distance,
    }));

    allEfforts.push(...normalizedEfforts);

    if (batch.length < perPage) break;
    // small pacing (optional)
    await new Promise((r) => setTimeout(r, 80));
  }

  return allEfforts;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const segmentId = Number(id);

    if (!segmentId) {
      return NextResponse.json(
        { error: "Invalid segment ID" },
        { status: 400 },
      );
    }

    const token = await getStravaTokenOrThrow();
    const efforts = await fetchSegmentEfforts(segmentId, token);

    return NextResponse.json({ efforts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("token") ? 401 : 502;

    return NextResponse.json({ error: message }, { status });
  }
}
