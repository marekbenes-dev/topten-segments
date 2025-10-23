"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";

const SVG_HEIGHT = 60; // svg height in px
const SVG_WIDTH = 280; // svg width in px
const PADDING = 6; // padding inside the svg

type Props = {
  segmentId: number;
  distanceMeters: number;
};

type Effort = { start_date: string; elapsed_time: number; distance: number };

/**
 * Convert meters + seconds -> km/h.
 * Returns 0 for invalid inputs (to avoid div-by-zero or NaN).
 */
function toSpeedKmh(distanceMeters: number, elapsedSeconds: number): number {
  if (!distanceMeters || !elapsedSeconds) return 0;
  return (distanceMeters / elapsedSeconds) * 3.6;
}

/**
 * Build an SVG path string from arrays of x- and y-coordinates.
 * The path starts at the first point ("M x y") and then draws line segments ("L x y") to subsequent points.
 *
 * @param xCoordinates - array of x positions (in SVG coordinate space)
 * @param yCoordinates - array of y positions (in SVG coordinate space)
 * @returns an SVG path "d" attribute string or an empty string if no points provided
 */
function buildSvgPath(xCoordinates: number[], yCoordinates: number[]): string {
  if (!xCoordinates.length) return "";
  // Start path at first point
  let path = `M ${xCoordinates[0]} ${yCoordinates[0]}`;
  // Append line commands for remaining points
  for (let i = 1; i < xCoordinates.length; i++) {
    path += ` L ${xCoordinates[i]} ${yCoordinates[i]}`;
  }
  return path;
}

export default function SegmentHistoryCard({
  segmentId,
  distanceMeters,
}: Props) {
  const [efforts, setEfforts] = useState<Effort[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /**
   * Lazy-load pattern: use IntersectionObserver to mark component as "in view".
   * Once the element enters the viewport (with a rootMargin), setInView(true) so the data fetch can start.
   */
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  /**
   * Effect to fetch efforts when the card becomes visible.
   * - Will only run once (efforts === null) after inView is true.
   * - Uses AbortController to cancel the request if the component unmounts or dependencies change.
   * - Sorts received efforts by start_date ascending before storing them.
   */
  useEffect(() => {
    if (!inView || efforts !== null) return;

    const controller = new AbortController();

    fetch(`/api/segments/${segmentId}/efforts`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json();
      })
      .then((json) => {
        const fetchedEfforts: Effort[] = (json.efforts || []) as Effort[];
        // sort by date ascending (oldest -> newest)
        fetchedEfforts.sort(
          (a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
        );
        setEfforts(fetchedEfforts);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(String(e));
      });

    return () => controller.abort();
  }, [inView, segmentId, efforts]);

  return (
    <div ref={ref} className="mt-2">
      {!inView || efforts === null ? (
        <div className="text-sm text-gray-500">Loading history…</div>
      ) : error ? (
        <div className="text-sm text-red-600 break-all">
          Failed to load history: {error}
        </div>
      ) : efforts.length === 0 ? (
        <div className="text-sm text-gray-500">
          No efforts yet on this segment.
        </div>
      ) : (
        <Sparkline efforts={efforts} distanceMeters={distanceMeters} />
      )}
    </div>
  );
}

/**
 * Sparkline component:
 * - Transforms efforts into timestamp + speed points.
 * - Computes scales for X (time) and Y (speed) that map values into SVG coordinates.
 * - Draws a polyline (SVG path) and highlights the PR (max speed) point.
 *
 * @param efforts - array of efforts sorted by start_date ascending
 * @param distanceMeters - fallback distance when an effort distance is zero
 */
function Sparkline({
  efforts,
  distanceMeters,
}: {
  efforts: Effort[];
  distanceMeters: number;
}) {
  // Map efforts to points with date (ms) and speed (km/h)
  const points = efforts.map((e) => ({
    dateMs: new Date(e.start_date).getTime(),
    speedKmh: toSpeedKmh(e.distance || distanceMeters, e.elapsed_time),
  }));

  // X = time (ms), Y = speed (km/h)
  const minTime = points[0].dateMs;
  const maxTime = points[points.length - 1].dateMs;
  const minSpeed = Math.min(...points.map((p) => p.speedKmh));
  const maxSpeed = Math.max(...points.map((p) => p.speedKmh));

  /**
   * Scale a time value (ms) to an x coordinate in SVG space.
   * If all times are equal, place them at the left padding.
   */
  const scaleX = (timeMs: number) =>
    PADDING +
    (maxTime === minTime
      ? 0
      : ((timeMs - minTime) / (maxTime - minTime)) * (SVG_WIDTH - 2 * PADDING));

  /**
   * Scale a speed value (km/h) to a y coordinate in SVG space.
   * Higher speed should be visually higher on the chart (smaller SVG y).
   * If all speeds are equal, return center vertical position.
   */
  const scaleY = (speedKmh: number) => {
    if (maxSpeed === minSpeed) return SVG_HEIGHT / 2;
    const ratio = (speedKmh - minSpeed) / (maxSpeed - minSpeed);
    return SVG_HEIGHT - PADDING - ratio * (SVG_HEIGHT - 2 * PADDING);
  };

  // Build arrays of scaled coordinates for the SVG path
  const xCoordinates = points.map((p) => scaleX(p.dateMs));
  const yCoordinates = points.map((p) => scaleY(p.speedKmh));
  const pathD = buildSvgPath(xCoordinates, yCoordinates);

  const firstSpeed = points[0].speedKmh;
  const latestSpeed = points[points.length - 1].speedKmh;
  const changePct =
    firstSpeed > 0 ? ((latestSpeed - firstSpeed) / firstSpeed) * 100 : 0;

  // Find PR (max speed) point and its index for drawing the dot
  const prPoint = points.reduce(
    (best, p) => (p.speedKmh > best.speedKmh ? p : best),
    points[0],
  );
  const prIndex = points.findIndex((p) => p === prPoint);

  return (
    <div>
      <svg width={SVG_WIDTH} height={SVG_HEIGHT} className="block">
        <rect x={0} y={0} width={SVG_WIDTH} height={SVG_HEIGHT} fill="none" />
        {/* line */}
        <path d={pathD} stroke="currentColor" fill="none" strokeWidth={1.5} />
        {/* PR dot */}
        <circle cx={xCoordinates[prIndex]} cy={yCoordinates[prIndex]} r={2.5} />
      </svg>
      <div className="mt-1 text-xs text-gray-700 flex flex-wrap gap-x-3 gap-y-1">
        <span>
          Attempts: <strong>{points.length}</strong>
        </span>
        <span>
          PR speed: <strong>{prPoint.speedKmh.toFixed(1)} km/h</strong>
        </span>
        <span>
          Change since first:{" "}
          <strong
            className={changePct >= 0 ? "text-green-600" : "text-red-600"}
          >
            {changePct >= 0 ? "+" : ""}
            {changePct.toFixed(1)}%
          </strong>
        </span>
      </div>
    </div>
  );
}
