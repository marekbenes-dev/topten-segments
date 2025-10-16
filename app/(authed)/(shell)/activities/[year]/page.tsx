import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  fmtKm,
  fmtPaceMinKm,
  iconForType,
  prettyTypeLabel,
  startOfNextYearUtcEpoch,
  startOfYearUtcEpoch,
  toEpochSeconds,
} from "./lib";
import { fmtDuration } from "@/lib/format";
import { MONTHS } from "./constants";
import { StravaCookie } from "@/app/constants/tokens";
import { fetchAllActivities, pickActivityStats } from "./lib/activities";
import { summarizeByMonth } from "./lib/aggregate";

export default async function ActivitiesPage({
  params,
}: {
  params?: Promise<{ year?: string }>;
}) {
  const sp = (await params) ?? {};
  const cookieStore = await cookies();
  const token = cookieStore.get(StravaCookie.AccessToken)?.value;

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

  const filtered = activities.map(pickActivityStats);
  console.log("Filtered Activities:", filtered.slice(0, 100));

  // Group by month
  const months = summarizeByMonth(activities);

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
          href={`/activities/${prevYear}`}
          className="border rounded px-3 py-2 hover:bg-gray-50"
          aria-disabled={prevYear < 2010}
        >
          ← {prevYear}
        </Link>
        <h1 className="text-2xl font-bold">Activities · {year}</h1>
        <Link
          href={`/activities/${nextYear}`}
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
                            <span className="opacity-80 inline-flex items-center gap-2">
                              <span aria-hidden="true">
                                {iconForType(type)}
                              </span>
                              <span>
                                {prettyTypeLabel(type)} ({t.count})
                              </span>
                            </span>
                            <div className="flex justify-between tabular-nums">
                              <span className="px-2">
                                {t.distance > 0 && fmtKm(t.distance)}
                              </span>
                              <span className="w-[60px] flex justify-end">
                                {fmtDuration(t.moving, true)}
                              </span>
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
