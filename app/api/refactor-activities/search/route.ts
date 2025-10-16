import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { StravaCookie } from "@/app/constants/tokens";

export const dynamic = "force-dynamic";

async function stravaGet(url: string, token: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${url} failed: ${res.status} ${text}`);
  }
  return res.json();
}

function parseDateRange(from?: string, to?: string) {
  const fromIso = from ? new Date(`${from}T00:00:00Z`) : undefined;
  const toIso = to ? new Date(`${to}T23:59:59.999Z`) : undefined;
  return { fromIso, toIso };
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const from = url.searchParams.get("from") || "";
    const to = url.searchParams.get("to") || "";

    const hasSearch = Boolean(q || from || to);
    if (!hasSearch) {
      return NextResponse.json({ matches: [], total: 0 });
    }

    const token =
      (await cookies()).get(StravaCookie.AccessToken)?.value ||
      process.env.STRAVA_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "Missing Strava token cookie or STRAVA_TOKEN env." },
        { status: 401 },
      );
    }

    // Fetch all activities (paged)
    const perPage = 200;
    let page = 1;
    const all: SummaryActivity[] = [];

    while (true) {
      const api = `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`;
      const batch = await stravaGet(api, token);
      if (!Array.isArray(batch) || batch.length === 0) break;
      all.push(...batch);
      if (batch.length < perPage) break;
      page += 1;
      // polite pacing
      await new Promise((r) => setTimeout(r, 120));
    }

    // Filter by name + date inclusive
    const qlc = q.toLowerCase();
    const { fromIso, toIso } = parseDateRange(from, to);

    const matches = all.filter((a) => {
      const nameOk = q ? a?.name?.toLowerCase().includes(qlc) : true;
      const when = a?.start_date ? new Date(a.start_date) : undefined;
      const fromOk = fromIso ? !!when && when >= fromIso : true;
      const toOk = toIso ? !!when && when <= toIso : true;
      return nameOk && fromOk && toOk;
    });

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
