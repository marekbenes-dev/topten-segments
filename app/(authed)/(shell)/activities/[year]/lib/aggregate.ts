import { MonthSummary, SummaryActivity } from "@/app/types/activity";

const isRide = (activityType?: string) =>
  activityType === "Ride" || activityType === "VirtualRide";
const isRun = (activityType?: string) =>
  activityType === "Run" || activityType === "VirtualRun";

export function summarizeByMonth(
  activities: SummaryActivity[],
): MonthSummary[] {
  const months: MonthSummary[] = Array.from(
    { length: 12 },
    (_, monthIndex) => ({
      monthIdx: monthIndex,
      totals: { distance: 0, moving: 0, count: 0 },
      byType: {},
      items: [],
    }),
  );

  for (const activity of activities) {
    const date = new Date(activity.start_date_local ?? activity.start_date);
    const month = months[date.getMonth()];
    month.items.push(activity);

    month.totals.distance += activity.distance ?? 0;
    month.totals.moving += activity.moving_time ?? 0;
    month.totals.count += 1;

    if (
      activity.type === "Workout" &&
      (activity.name.toLowerCase().includes("florb") ||
        activity.name.toLowerCase().includes("futsal"))
    ) {
      activity.type = "Floorball";
    }

    const activityType = activity.type || activity.sport_type || "Other";
    month.byType[activityType] ??= { distance: 0, moving: 0, count: 0 };
    month.byType[activityType].distance += activity.distance ?? 0;
    month.byType[activityType].moving += activity.moving_time ?? 0;
    month.byType[activityType].count += 1;

    if (
      isRun(activityType) &&
      (!month.longestRun || activity.distance > month.longestRun.distance)
    )
      month.longestRun = activity;
    if (
      isRide(activityType) &&
      (!month.longestRide || activity.distance > month.longestRide.distance)
    )
      month.longestRide = activity;
  }

  for (const month of months) {
    const aggregate = month.items.reduce(
      (accumulator, activity) => {
        const movingTime = activity.moving_time ?? 0;
        const distance = activity.distance ?? 0;
        if (movingTime <= 0 || distance <= 0) return accumulator;

        if (isRide(activity.type)) {
          accumulator.totalRideTime += movingTime;
          accumulator.totalWatts +=
            movingTime *
            (activity.weighted_average_watts ?? activity.average_watts ?? 0);
        }

        if (isRun(activity.type)) {
          accumulator.totalRunTime += movingTime;
          accumulator.totalDistance += distance;
        }

        return accumulator;
      },
      { totalRideTime: 0, totalWatts: 0, totalRunTime: 0, totalDistance: 0 },
    );

    month.avgRideWatts =
      aggregate.totalWatts && aggregate.totalRideTime
        ? Math.round(aggregate.totalWatts / aggregate.totalRideTime)
        : null;

    month.avgPaceRuns =
      aggregate.totalDistance && aggregate.totalRunTime
        ? String(
            (aggregate.totalRunTime * 1000) / (aggregate.totalDistance * 60),
          )
        : null;
  }

  return months;
}
