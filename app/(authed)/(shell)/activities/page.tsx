import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function fmtKm(meters: number) {
  return (meters / 1000).toFixed(2);
}

function fmtDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h ? `${h}h` : null, m ? `${m}m` : null, `${s}s`]
    .filter(Boolean)
    .join(" ");
}

function startOfYearUtcEpoch(year: number) {
  return Math.floor(Date.UTC(year, 0, 1, 0, 0, 0) / 1000);
}

function startOfNextYearUtcEpoch(year: number) {
  return Math.floor(Date.UTC(year + 1, 0, 1, 0, 0, 0) / 1000);
}

function fmtPaceMinKm(pace: number) {
  const min = Math.floor(pace);
  const sec = Math.round((pace - min) * 60);
  return `${min}:${sec.toString().padStart(2, "0")} min/km`;
}

async function fetchAllActivities(
  token: string,
  afterEpoch: number,
  beforeEpoch: number,
): Promise<SummaryActivity[]> {
  const perPage = 200; // Strava allows up to 200 for this endpoint
  let page = 1;
  const all: SummaryActivity[] = [];
  // keep page-fetching until fewer than perPage returned
  for (;;) {
    const url = new URL("https://www.strava.com/api/v3/athlete/activities");
    url.searchParams.set("after", String(afterEpoch));
    url.searchParams.set("before", String(beforeEpoch));
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", String(perPage));

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("Activities fetch failed", res.status, await res.text());
      // If token expired etc., bounce out to login/landing
      redirect("/?error=activities_failed");
    }
    const batch = (await res.json()) as SummaryActivity[];
    all.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
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
  const year = Math.min(Math.max(requestedYear, 2009), nowYear + 1);

  // Bound by full UTC years to keep server results small
  const after = startOfYearUtcEpoch(year);
  const before = startOfNextYearUtcEpoch(year);

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

  // Compute avg ride watts (simple mean over rides that have a watts value)
  for (const m of months) {
    const rideWatts: number[] = m.items
      .filter((a) => (a.type || a.sport_type) === "Ride")
      .map((a) => a.weighted_average_watts ?? a.average_watts ?? null)
      .filter((n): n is number => typeof n === "number");
    m.avgRideWatts =
      rideWatts.length > 0
        ? Math.round(rideWatts.reduce((s, n) => s + n, 0) / rideWatts.length)
        : null;

    const runPaces: number[] = m.items
      .filter(
        (a) =>
          (a.type || a.sport_type) === "Run" ||
          (a.type || a.sport_type) === "VirtualRun",
      )
      .map((a) =>
        a.moving_time > 0 && a.distance > 0
          ? (a.moving_time * 1000) / (a.distance * 60) // min/km
          : null,
      )
      .filter((n): n is number => typeof n === "number");
    m.avgPaceRuns =
      runPaces.length > 0
        ? (runPaces.reduce((s, n) => s + n, 0) / runPaces.length).toFixed(2)
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
                  <div>
                    <span className="opacity-70">Total distance: </span>
                    <span className="font-medium">
                      {fmtKm(m.totals.distance)} km
                    </span>
                  </div>
                  <div>
                    <span className="opacity-70">Total moving time: </span>
                    <span className="font-medium">
                      {fmtDuration(m.totals.moving)}
                    </span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="font-medium text-sm">By activity type</div>
                  {has ? (
                    <ul className="mt-1 space-y-1 text-sm">
                      {Object.entries(m.byType)
                        .sort((a, b) => b[1].distance - a[1].distance)
                        .map(([type, t]) => (
                          <li key={type} className="flex justify-between">
                            <span className="opacity-80">
                              {type} ({t.count})
                            </span>
                            <span className="opacity-80">
                              {fmtKm(t.distance)} km · {fmtDuration(t.moving)}
                            </span>
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
                    <div className="opacity-70">Longest run</div>
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
                        <a
                          href={`https://www.strava.com/activities/${m.longestRun.id}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="underline opacity-80"
                        >
                          Open
                        </a>
                      </div>
                    ) : (
                      <div className="opacity-60 mt-1">—</div>
                    )}
                  </div>

                  <div className="border rounded p-2">
                    <div className="opacity-70">Longest ride</div>
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
                        <a
                          href={`https://www.strava.com/activities/${m.longestRide.id}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="underline opacity-80"
                        >
                          Open
                        </a>
                      </div>
                    ) : (
                      <div className="opacity-60 mt-1">—</div>
                    )}
                  </div>
                </div>
                <div className="text-sm">
                  <span className="opacity-70">Avg watts (rides): </span>
                  <span className="font-medium">
                    {m.avgRideWatts != null ? `${m.avgRideWatts} W` : "—"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="opacity-70">Avg pace (runs): </span>
                  <span className="font-medium">
                    {m.avgPaceRuns != null
                      ? fmtPaceMinKm(Number(m.avgPaceRuns))
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
