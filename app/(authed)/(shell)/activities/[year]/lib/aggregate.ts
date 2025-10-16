const isRide = (t?: string) => t === "Ride" || t === "VirtualRide";
const isRun = (t?: string) => t === "Run" || t === "VirtualRun";

export type MonthSummary = {
  monthIdx: number;
  totals: { distance: number; moving: number; count: number };
  byType: Record<string, { distance: number; moving: number; count: number }>;
  items: SummaryActivity[];
  longestRun?: SummaryActivity;
  longestRide?: SummaryActivity;
  avgRideWatts?: number | null;
  avgPaceRuns?: string | null;
};

export function summarizeByMonth(
  activities: SummaryActivity[],
): MonthSummary[] {
  const months: MonthSummary[] = Array.from({ length: 12 }, (_, i) => ({
    monthIdx: i,
    totals: { distance: 0, moving: 0, count: 0 },
    byType: {},
    items: [],
  }));

  for (const a of activities) {
    const d = new Date(a.start_date_local ?? a.start_date);
    const m = months[d.getMonth()];
    m.items.push(a);

    m.totals.distance += a.distance ?? 0;
    m.totals.moving += a.moving_time ?? 0;
    m.totals.count += 1;

    const t = a.type || a.sport_type || "Other";
    m.byType[t] ??= { distance: 0, moving: 0, count: 0 };
    m.byType[t].distance += a.distance ?? 0;
    m.byType[t].moving += a.moving_time ?? 0;
    m.byType[t].count += 1;

    if (isRun(t) && (!m.longestRun || a.distance > m.longestRun.distance))
      m.longestRun = a;
    if (isRide(t) && (!m.longestRide || a.distance > m.longestRide.distance))
      m.longestRide = a;
  }

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

    m.avgRideWatts =
      agg.totalWatts && agg.totalRideTime
        ? Math.round(agg.totalWatts / agg.totalRideTime)
        : null;

    m.avgPaceRuns =
      agg.totalDistance && agg.totalRunTime
        ? String((agg.totalRunTime * 1000) / (agg.totalDistance * 60))
        : null;
  }

  return months;
}
