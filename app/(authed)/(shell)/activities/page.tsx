import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  fmtKm,
  fmtPaceMinKm,
  iconForType,
  monthWindowsUTC,
  prettyTypeLabel,
  startOfMonthUTC,
  startOfNextMonthUTC,
  startOfNextYearUtcEpoch,
  startOfYearUtcEpoch,
  toEpochSeconds,
} from "./lib";
import { MONTHS } from "./constants";
import { fmtDuration } from "@/lib/format";

async function fetchWindowPaged(
  token: string,
  afterEpoch: number,
  beforeEpochExclusive: number,
  init: RequestInit,
): Promise<SummaryActivity[]> {
  const perPage = 200;
  const out: SummaryActivity[] = [];
  for (let page = 1; ; page++) {
    const url = new URL("https://www.strava.com/api/v3/athlete/activities");
    url.searchParams.set("after", String(afterEpoch));
    url.searchParams.set("before", String(beforeEpochExclusive - 1)); // exclusive upper bound
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));

    const res = await fetch(url, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) },
    });

    if (!res.ok) {
      console.error("Activities fetch failed", res.status, await res.text());
      redirect("/?error=activities_failed");
    }

    const batch = (await res.json()) as SummaryActivity[];
    out.push(...batch);
    if (batch.length < perPage) break;
  }
  return out;
}

async function fetchAllActivities(
  token: string,
  afterEpoch: number,
  beforeEpoch: number,
): Promise<SummaryActivity[]> {
  const now = new Date();
  const currentMonthStart = toEpochSeconds(startOfMonthUTC(now));
  const nextMonthStart = toEpochSeconds(startOfNextMonthUTC(now));
  const beforeExclusive = beforeEpoch;

  const all: SummaryActivity[] = [];

  for (const [winAfter, winBeforeExcl] of monthWindowsUTC(
    afterEpoch,
    beforeExclusive,
  )) {
    const windowOverlapsCurrentMonth =
      winAfter < nextMonthStart && winBeforeExcl > currentMonthStart;

    if (windowOverlapsCurrentMonth) {
      // This window is (at least partly) the current month -> always fresh
      const fresh = await fetchWindowPaged(token, winAfter, winBeforeExcl, {
        cache: "no-store",
      });
      all.push(...fresh);
    } else {
      // Older month -> cache on the server for 1 month (tagged by yyyy-mm for optional manual revalidate)
      const d = new Date(winAfter * 1000);
      const tag = `strava-${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const cached = await fetchWindowPaged(token, winAfter, winBeforeExcl, {
        next: { revalidate: 2628000, tags: [tag] },
      });
      all.push(...cached);
    }
  }

  return all;
}

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ year?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const token = cookieStore.get("strava_access_token")?.value;
  if (!token) redirect("/?no_token");

  const now = new Date();
  const nowYear = now.getUTCFullYear();
  const requestedYear = Number.isFinite(Number(sp.year))
    ? Number(sp.year)
    : nowYear;

  // guard ridiculous years
  const year = Math.min(Math.max(requestedYear, 2009), nowYear);
  const after = startOfYearUtcEpoch(year);
  // check if year is current year to prevent going into the future
  const before =
    nowYear === year ? toEpochSeconds(now) : startOfNextYearUtcEpoch(year);
  const activities = await fetchAllActivities(token, after, before);

  // Initialize 12 months
  const months: MonthSummary[] = Array.from({ length: 12 }, (_, i) => ({
    monthIdx: i,
    totals: { distance: 0, moving: 0, count: 0 },
    byType: {},
    items: [],
  }));

  for (const a of activities) {
    const d = new Date(a.start_date_local ?? a.start_date);
    const idx = d.getMonth(); // 0..11 in *local* time
    const m = months[idx];

    m.items.push(a);
    m.totals.distance += a.distance;
    m.totals.moving += a.moving_time;
    m.totals.count += 1;

    const t = a.type || a.sport_type || "Other";

    if (!m.byType[t]) m.byType[t] = { distance: 0, moving: 0, count: 0 };
    m.byType[t].distance += a.distance;
    m.byType[t].moving += a.moving_time;
    m.byType[t].count += 1;

    if (t === "Run" || t === "VirtualRun") {
      if (!m.longestRun || a.distance > m.longestRun.distance) m.longestRun = a;
    }

    if (t === "Ride" || t === "VirtualRide") {
      if (!m.longestRide || a.distance > m.longestRide.distance)
        m.longestRide = a;
    }
  }

  const isRide = (t?: string) => t === "Ride" || t === "VirtualRide";
  const isRun = (t?: string) => t === "Run" || t === "VirtualRun";

  for (const m of months) {
    const agg = m.items.reduce(
      (acc, a) => {
        const mt = a.moving_time ?? 0;
        const dist = a.distance ?? 0;
        if (mt <= 0 || dist <= 0) return acc;

        if (isRide(a.type)) {
          acc.totalRideTime += mt;
          acc.totalWatts +=
            mt * (a.weighted_average_watts ?? a.average_watts ?? 0);
        }

        if (isRun(a.type)) {
          acc.totalRunTime += mt;
          acc.totalDistance += dist;
        }

        return acc;
      },
      { totalRideTime: 0, totalWatts: 0, totalRunTime: 0, totalDistance: 0 },
    );

    const { totalRideTime, totalWatts, totalRunTime, totalDistance } = agg;

    m.avgRideWatts =
      totalWatts && totalRideTime
        ? Math.round(totalWatts / totalRideTime)
        : null;

    m.avgPaceRuns =
      totalDistance && totalRunTime
        ? String((totalRunTime * 1000) / (totalDistance * 60)) // minutes/km (decimal)
        : null;
  }

  // Decide how many tiles to show
  const monthsToShow = year < nowYear ? 12 : Math.min(12, now.getMonth() + 1); // up to current month inclusive

  // Year nav
  const prevYear = year - 1;
  const nextYear = Math.min(year + 1, nowYear); // don’t go beyond current year by default

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link
          prefetch={false}
          href={`/activities?year=${prevYear}`}
          className="border rounded px-3 py-2 hover:bg-gray-50"
          aria-disabled={prevYear < 2010}
        >
          ← {prevYear}
        </Link>
        <h1 className="text-2xl font-bold">Activities · {year}</h1>
        <Link
          href={`/activities?year=${nextYear}`}
          className={`border rounded px-3 py-2 ${year >= nowYear ? "opacity-50 pointer-events-none" : "hover:bg-gray-50"}`}
        >
          {nextYear} →
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {months.slice(0, monthsToShow).map((m) => {
          const has = m.totals.count > 0;
          const monthName = MONTHS[m.monthIdx];

          return (
            <div
              key={m.monthIdx}
              className="border rounded-lg p-4 flex flex-col min-h-80" // 👈 flex column + min height
            >
              {/* TOP: header + totals + by-type */}
              <div>
                <div className="flex items-baseline justify-between">
                  <div className="text-lg font-semibold">
                    {monthName} {year}
                  </div>
                  <div className="text-sm opacity-70">
                    {has ? `${m.totals.count} activities` : "No activities"}
                  </div>
                </div>

                <div className="mt-2 text-sm">
                  <div className="flex items-baseline justify-between">
                    <span className="opacity-70">Total moving time: </span>
                    <span className="font-medium">
                      {fmtDuration(m.totals.moving)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="opacity-70">Total distance: </span>
                    <span className="font-medium">
                      {fmtKm(m.totals.distance)}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="font-medium text-sm">By activity type</div>
                  {has ? (
                    <ul className="mt-1 space-y-1 text-sm">
                      {Object.entries(m.byType)
                        .sort((a, b) => b[1].moving - a[1].moving)
                        .map(([type, t]) => (
                          <li key={type} className="flex justify-between">
                            <span className="w-50 opacity-80 inline-flex items-center gap-2">
                              <span aria-hidden="true">
                                {iconForType(type)}
                              </span>
                              <span>
                                {prettyTypeLabel(type)} ({t.count})
                              </span>
                            </span>
                            <div className="w-50 flex justify-between tabular-nums">
                              <span>{t.distance > 0 && fmtKm(t.distance)}</span>
                              <span>{fmtDuration(t.moving, true)}</span>
                            </div>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <div className="text-sm opacity-60">—</div>
                  )}
                </div>
              </div>

              {/* BOTTOM: longest run/ride + watts */}
              <div className="mt-auto pt-3 space-y-3">
                {" "}
                {/* 👈 pushes this block to the bottom */}
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="border rounded p-2">
                    <div className="flex justify-between items-baseline">
                      <div className="opacity-70">Longest run</div>
                      {m.longestRun && (
                        <a
                          href={`https://www.strava.com/activities/${m.longestRun?.id}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="underline opacity-80"
                        >
                          Open
                        </a>
                      )}
                    </div>
                    {m.longestRun ? (
                      <div className="mt-1">
                        <div
                          className="font-medium truncate"
                          title={m.longestRun.name}
                        >
                          {m.longestRun.name}
                        </div>
                        <div className="opacity-80">
                          {fmtKm(m.longestRun.distance)} km ·{" "}
                          {fmtDuration(m.longestRun.moving_time)}
                        </div>
                      </div>
                    ) : (
                      <div className="opacity-60 mt-1">No runs this month.</div>
                    )}
                  </div>

                  <div className="border rounded p-2">
                    <div className="flex justify-between items-baseline">
                      <div className="opacity-70">Longest ride</div>
                      {m.longestRide && (
                        <a
                          href={`https://www.strava.com/activities/${m.longestRide?.id}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="underline opacity-80"
                        >
                          Open
                        </a>
                      )}
                    </div>
                    {m.longestRide ? (
                      <div className="mt-1">
                        <div
                          className="font-medium truncate"
                          title={m.longestRide.name}
                        >
                          {m.longestRide.name}
                        </div>
                        <div className="opacity-80">
                          {fmtKm(m.longestRide.distance)} km ·{" "}
                          {fmtDuration(m.longestRide.moving_time)}
                        </div>
                      </div>
                    ) : (
                      <div className="opacity-60 mt-1">
                        No rides this month.
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-baseline justify-between mt-2 pt-2 border-t">
                  <div className="text-sm">
                    <span className="opacity-70" title="Weighted average watts">
                      Watts:{" "}
                    </span>
                    <span className="font-medium">
                      {m.avgRideWatts != null ? `${m.avgRideWatts} W` : "—"}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="opacity-70" title="Average pace">
                      Pace:{" "}
                    </span>
                    <span className="font-medium">
                      {m.avgPaceRuns != null
                        ? fmtPaceMinKm(Number(m.avgPaceRuns))
                        : "No runs this month."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
