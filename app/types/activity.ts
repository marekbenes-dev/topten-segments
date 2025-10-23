// Group activities by month (use start_date_local to reflect user's local month)
type TypeTotals = { distance: number; moving: number; count: number };

export type MonthSummary = {
  avgPaceRuns?: string | null;
  monthIdx: number; // 0..11
  totals: { distance: number; moving: number; count: number };
  byType: Record<string, TypeTotals>;
  longestRun?: SummaryActivity;
  longestRide?: SummaryActivity;
  avgRideWatts?: number | null;
  items: SummaryActivity[];
};

export type SummaryActivity = {
  id: number;
  name: string;
  type: string; // "Run" | "Ride" | "Walk" | ...
  sport_type?: string; // newer Strava field (e.g., "TrailRun", "GravelRide", etc.)
  start_date: string; // ISO
  start_date_local: string; // ISO
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  average_watts?: number | null; // rides only; may be missing
  weighted_average_watts?: number | null; // sometimes present
  max_heartrate?: number | null;
  max_watts: number | null; // rides only; may be missing,
  average_heartrate: number | null;
};
