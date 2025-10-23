import { NextResponse, NextRequest } from "next/server";
import { toEpochSeconds } from "@/app/(authed)/(shell)/activities/[year]/lib";
import { fetchWindowPaged } from "@/lib/activities";
import { getStravaTokenOrThrow } from "@/lib/token";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const activityName = (url.searchParams.get("activityName") || "").trim();
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";
    const beforeEpoch = toEpochSeconds(new Date(from));
    const afterEpoch = toEpochSeconds(new Date(to));

    const hasSearch = Boolean(activityName || from || to);

    if (!hasSearch) {
      return NextResponse.json({ matches: [], total: 0 });
    }

    const token = await getStravaTokenOrThrow();

    if (!token) {
      return NextResponse.json(
        { error: "Missing Strava token cookie." },
        { status: 401 },
      );
    }

    // Fetch all activities within epoch range
    const activities = await fetchWindowPaged(
      token,
      beforeEpoch,
      afterEpoch,
      {},
    );

    // Filter by name
    const qlc = activityName.toLowerCase();

    const matches = activities.filter(({ name }) =>
      name.toLowerCase().includes(qlc),
    );

    // Return lean fields you need in the client
    return NextResponse.json({
      total: matches.length,
      matches: matches.map((m) => ({
        id: m.id,
        name: m.name,
        start_date: m.start_date,
        sport_type: m.sport_type ?? m.type ?? "",
        prev_type: m.sport_type ?? m.type ?? "",
      })),
    });
  } catch (err: unknown) {
    if ("message" in (err as Error)) {
      return NextResponse.json(
        { ok: false, error: (err as Error).message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: false, error: "Unknown error" },
      { status: 500 },
    );
  }
}
