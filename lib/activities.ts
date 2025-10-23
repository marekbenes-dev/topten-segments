import { redirect } from "next/navigation";
import {
  toEpochSeconds,
  startOfMonthUTC,
  startOfNextMonthUTC,
} from "../app/(authed)/(shell)/activities/[year]/lib/date";
import { SummaryActivity } from "@/app/types/activity";

export async function fetchWindowPaged(
  token: string,
  afterEpoch: number,
  beforeEpochExclusive: number,
  init: RequestInit,
): Promise<SummaryActivity[]> {
  const perPage = 200;
  const allActivities: SummaryActivity[] = [];
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
    allActivities.push(...batch);
    if (batch.length < perPage) break;
  }

  return allActivities;
}

// Fetches (1) rest-of-year cached, (2) current month no-cache.
// Assumes your typical range is within the current year.
// If you sometimes query across years, see the note below.
export async function fetchAllActivities(
  token: string,
  afterEpoch: number,
  beforeEpochExclusive: number,
): Promise<SummaryActivity[]> {
  const now = new Date();
  const monthStart = toEpochSeconds(startOfMonthUTC(now));
  const nextMonthStart = toEpochSeconds(startOfNextMonthUTC(now));

  const all: SummaryActivity[] = [];
  const olderEnd = Math.min(beforeEpochExclusive, monthStart);

  if (afterEpoch < olderEnd) {
    // Tag by year(s) covered, so you can revalidateTag('strava-2025')
    const yStart = new Date(afterEpoch * 1000).getUTCFullYear();
    const yEnd = new Date((olderEnd - 1) * 1000).getUTCFullYear();
    const tags: string[] = [];
    for (let y = yStart; y <= yEnd; y++) tags.push(`strava-${y}`);

    const cached = await fetchWindowPaged(token, afterEpoch, olderEnd, {
      next: { revalidate: 2628000, tags },
    });
    all.push(...cached);
  }

  // ---- Current month window: fetched fresh
  const currStart = Math.max(afterEpoch, monthStart);
  const currEnd = Math.min(beforeEpochExclusive, nextMonthStart);

  if (currStart < currEnd) {
    const fresh = await fetchWindowPaged(token, currStart, currEnd, {
      cache: "no-store",
    });
    all.push(...fresh);
  }

  return all;
}

export function pickActivityStats(activity: SummaryActivity) {
  const {
    max_heartrate,
    moving_time,
    start_date,
    sport_type,
    weighted_average_watts,
    max_watts,
    average_heartrate,
    average_watts,
  } = activity;
  return {
    max_heartrate,
    moving_time,
    start_date,
    sport_type,
    weighted_average_watts,
    max_watts,
    average_heartrate,
    average_watts,
  };
}
