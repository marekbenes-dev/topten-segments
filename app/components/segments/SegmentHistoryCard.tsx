"use client";

import * as React from "react";

const H = 60; // svg height
const W = 280; // svg width
const P = 6; // padding

type Props = {
  segmentId: number;
  distanceMeters: number;
};

type Effort = { start_date: string; elapsed_time: number; distance: number };

function toSpeedKmh(d: number, t: number) {
  // meters + seconds -> km/h
  if (!d || !t) return 0;
  return (d / t) * 3.6;
}

function buildPath(xs: number[], ys: number[]) {
  if (!xs.length) return "";
  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < xs.length; i++) d += ` L ${xs[i]} ${ys[i]}`;
  return d;
}

export default function SegmentHistoryCard({
  segmentId,
  distanceMeters,
}: Props) {
  const [efforts, setEfforts] = React.useState<Effort[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [inView, setInView] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Lazy load when card is visible
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  React.useEffect(() => {
    if (!inView || efforts !== null) return;
    const controller = new AbortController();
    fetch(`/api/segments/${segmentId}/efforts`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((json) => {
        const e: Effort[] = (json.efforts || []) as Effort[];
        // sort by date asc (first -> latest)
        e.sort(
          (a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
        );
        setEfforts(e);
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

function Sparkline({
  efforts,
  distanceMeters,
}: {
  efforts: Effort[];
  distanceMeters: number;
}) {
  // map efforts to (t, speed)
  const points = efforts.map((e) => ({
    date: new Date(e.start_date).getTime(),
    speed: toSpeedKmh(e.distance || distanceMeters, e.elapsed_time),
  }));

  // x = time, y = speed (higher is better)
  const minX = points[0].date;
  const maxX = points[points.length - 1].date;
  const minY = Math.min(...points.map((p) => p.speed));
  const maxY = Math.max(...points.map((p) => p.speed));

  const xScale = (v: number) =>
    P + (maxX === minX ? 0 : ((v - minX) / (maxX - minX)) * (W - 2 * P));
  const yScale = (v: number) => {
    // higher speed should be higher on the chart
    if (maxY === minY) return H / 2;
    const r = (v - minY) / (maxY - minY);
    return H - P - r * (H - 2 * P);
  };

  const xs = points.map((p) => xScale(p.date));
  const ys = points.map((p) => yScale(p.speed));
  const path = buildPath(xs, ys);

  const first = points[0].speed;
  const latest = points[points.length - 1].speed;
  const changePct = first > 0 ? ((latest - first) / first) * 100 : 0;

  // PR (max speed)
  const pr = points.reduce(
    (best, p) => (p.speed > best.speed ? p : best),
    points[0],
  );
  const prIdx = points.findIndex((p) => p === pr);

  return (
    <div>
      <svg width={W} height={H} className="block">
        <rect x={0} y={0} width={W} height={H} fill="none" />
        {/* line */}
        <path d={path} stroke="currentColor" fill="none" strokeWidth={1.5} />
        {/* PR dot */}
        <circle cx={xs[prIdx]} cy={ys[prIdx]} r={2.5} />
      </svg>
      <div className="mt-1 text-xs text-gray-700 flex flex-wrap gap-x-3 gap-y-1">
        <span>
          Attempts: <strong>{points.length}</strong>
        </span>
        <span>
          PR speed: <strong>{pr.speed.toFixed(1)} km/h</strong>
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
