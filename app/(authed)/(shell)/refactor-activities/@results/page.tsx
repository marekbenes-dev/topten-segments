// ------------------------------------------------------------
// File: app/refactor-activities/@results/page.tsx
// Server component. Reads searchParams (q, target, dry), fetches activities, and
// updates them if dry === "0". Renders a two-column table: Previous vs New.

import { cookies } from "next/headers";

export const dynamic = "force-dynamic"; // always re-run on param change

async function stravaGet(url: string, token: string) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok)
    throw new Error(`GET ${url} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function stravaPut(url: string, token: string, body: { type: string }) {
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return { ok: false, status: res.status, text: await res.text() };
  return { ok: true };
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const sp = await searchParams;
  const q = (sp.q as string | undefined)?.trim();
  const target = (sp.target as string | undefined)?.trim();
  const dry = (sp.dry as string | undefined) !== "0"; // default true

  console.log({ q, target, dry, sp });

  if (!q || !target) {
    return (
      <div className="rounded-2xl border p-6 text-amber-700">
        Provide both an activity name and a new type, then press Run.
      </div>
    );
  }

  const token =
    (await cookies()).get("strava_access_token")?.value ||
    process.env.STRAVA_TOKEN;
  console.log(token);
  if (!token) {
    return (
      <div className="rounded-2xl border p-6 text-red-700">
        Missing Strava token. Set an <code>HttpOnly</code> cookie named{" "}
        <code>strava_access_token</code> or define <code>STRAVA_TOKEN</code> in
        your environment.
      </div>
    );
  }

  // 1) Fetch all activities (paged)
  const perPage = 200;
  let page = 1;
  const all: SummaryActivity[] = [];

  while (true) {
    const url = `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`;
    const batch = await stravaGet(url, token);
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
    // polite delay
    await new Promise((r) => setTimeout(r, 150));
  }

  // 2) Filter by name substring (case-insensitive)
  const qlc = q.toLowerCase();
  const matches = all.filter(
    (a) =>
      a?.name?.toLowerCase().includes(qlc) &&
      (a.sport_type || a.type) !== target,
  );

  // 3) Prepare updates (previous/new state)
  type Row = {
    id: number;
    name: string;
    date: string;
    prevType: string;
    newType: string;
    status: "updated" | "skipped" | "failed";
    error?: string;
  };

  const rows: Row[] = [];

  console.log({ matches });

  for (const a of matches) {
    const prevType = a.sport_type || a.type || "";
    const row: Row = {
      id: a.id,
      name: a.name,
      date: a.start_date,
      prevType,
      newType: target,
      status: dry ? "skipped" : "updated",
    };

    if (!dry) {
      const putUrl = `https://www.strava.com/api/v3/activities/${a.id}`;
      console.log("PUT", putUrl, { type: target });
      const res = await stravaPut(putUrl, token, { type: target });
      if (!res.ok) {
        row.status = "failed";
        row.error = `${res.status} ${res.text}`;
      }
      await new Promise((r) => setTimeout(r, 200));
    }

    rows.push(row);
  }

  return (
    <div className="rounded-2xl border">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h2 className="font-semibold">
            {dry ? "Preview (Dry run)" : "Updated activities"}
          </h2>
          <p className="text-sm text-gray-600">
            Query: <span className="font-mono">{q}</span> • Target type:{" "}
            <span className="font-mono">{target}</span> • Matches: {rows.length}
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-6 text-gray-600">No activities matched.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2 w-8">#</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Previous</th>
                <th className="px-4 py-2">New</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r, idx) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 align-top">{idx + 1}</td>
                  <td className="px-4 py-2 align-top">{r.name}</td>
                  <td className="px-4 py-2 align-top">{formatDate(r.date)}</td>
                  <td className="px-4 py-2 align-top">
                    <div className="font-mono">{r.prevType}</div>
                  </td>
                  <td className="px-4 py-2 align-top">
                    <div className="font-mono">{r.newType}</div>
                  </td>
                  <td className="px-4 py-2 align-top">
                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${
                        r.status === "updated"
                          ? "border-green-500"
                          : r.status === "failed"
                            ? "border-red-500"
                            : "border-gray-400"
                      }`}
                    >
                      {r.status}
                    </span>
                    {r.error && (
                      <div className="text-xs text-red-600 mt-1 break-all">
                        {r.error}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
