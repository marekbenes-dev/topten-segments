// app/refactor-activities/@results/page.tsx
"use client";

import React from "react";
import { useSearchParams } from "next/navigation";

const COMMON_TYPES = [
  "Run",
  "Ride",
  "Walk",
  "Workout",
  "Hike",
  "Swim",
  "VirtualRide",
  "Rowing",
  "WeightTraining",
  "Yoga",
];

type Match = {
  id: number;
  name: string;
  start_date: string;
  sport_type: string;
  prev_type: string;
};

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
    return iso!;
  }
}

type RowEditorProps = {
  a: Match;
  idx: number;
  onUpdate: (id: number, name?: string, type?: string) => Promise<void>;
};

function RowEditor({ a, idx, onUpdate }: RowEditorProps) {
  const [newName, setNewName] = React.useState("");
  const [newType, setNewType] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function handleUpdate() {
    if (!newName && !newType) return;
    setSaving(true);
    try {
      await onUpdate(a.id, newName || undefined, newType || undefined);
      setNewName("");
      setNewType("");
    } catch (e) {
      alert(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr>
      <td className="px-4 py-2 align-top">{idx + 1}</td>
      <td className="px-4 py-2 align-top">{a.name}</td>
      <td className="px-4 py-2 align-top">{formatDate(a.start_date)}</td>
      <td className="px-4 py-2 align-top">
        <div className="font-mono">{a.sport_type}</div>
      </td>
      <td className="px-4 py-2 align-top" colSpan={3}>
        <div className="flex gap-2 items-center">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`leave blank (keep "${a.name}")`}
            className="w-[260px] rounded-xl border px-3 py-2"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="w-[180px] rounded-xl border px-3 py-2 h-[38px]"
          >
            <option value="">(no change)</option>
            {COMMON_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={saving}
            className="rounded-2xl border px-3 py-2 text-xs"
            title="Apply to this activity"
          >
            {saving ? "Saving…" : "Update"}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ResultsPage() {
  const sp = useSearchParams();
  const q = (sp.get("q") || "").trim();
  const from = sp.get("from") || "";
  const to = sp.get("to") || "";
  const hasSearch = Boolean(q || from || to);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [matches, setMatches] = React.useState<Match[]>([]);

  // Bulk edit state
  const [bulkName, setBulkName] = React.useState("");
  const [bulkType, setBulkType] = React.useState("");

  // Fetch matches when params change
  React.useEffect(() => {
    if (!hasSearch) {
      setMatches([]);
      setError(null);
      return;
    }
    const controller = new AbortController();
    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);

    setLoading(true);
    setError(null);

    fetch(`/api/refactor-activities/search?${qs.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then((json) => setMatches(json.matches || []))
      .catch((e) => {
        if (e.name !== "AbortError") setError(String(e));
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [q, from, to, hasSearch]);

  async function updateOne(id: number, name?: string, type?: string) {
    if (!name && !type) return;
    const res = await fetch("/api/refactor-activities/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name, type }),
    });
    const data = await res.json();
    if (!res.ok || data?.ok === false) {
      throw new Error(data?.error || `Failed to update ${id}`);
    }
    // optimistic local update
    setMatches((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, name: name || m.name, sport_type: type || m.sport_type }
          : m,
      ),
    );
  }

  async function updateAll() {
    if (!bulkName && !bulkType) return;
    const ids = matches.map((m) => m.id);
    const res = await fetch("/api/refactor-activities/bulk-update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids,
        name: bulkName || undefined,
        type: bulkType || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok || data?.ok === false) {
      throw new Error(data?.error || "Bulk update failed");
    }
    // optimistic local update
    setMatches((prev) =>
      prev.map((m) => ({
        ...m,
        name: bulkName || m.name,
        sport_type: bulkType || m.sport_type,
      })),
    );
    setBulkName("");
    setBulkType("");
  }

  if (!hasSearch) {
    return (
      <div className="rounded-2xl border p-6 text-gray-700">
        Use the form above to search by name and/or date. Results will appear
        here.
      </div>
    );
  }

  if (loading) {
    return <div className="rounded-2xl border p-6 text-gray-600">Loading…</div>;
  }

  if (error) {
    return (
      <div className="rounded-2xl border p-6 text-red-700">
        Error loading activities:{" "}
        <span className="break-all">{String(error)}</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Matched activities</h2>
          <p className="text-sm text-gray-600">
            Filter:{" "}
            {q ? (
              <>
                name contains <span className="font-mono">{q}</span>
              </>
            ) : (
              "—"
            )}{" "}
            • Date:{" "}
            {from || to ? (
              <span className="font-mono">
                {from || "…"} → {to || "…"}{" "}
              </span>
            ) : (
              "—"
            )}{" "}
            • Matches: {matches.length}
          </p>
        </div>
      </div>

      {/* Bulk editor */}
      <div className="p-4 border-b">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-col">
            <label className="block text-sm font-medium">New name (all)</label>
            <input
              value={bulkName}
              onChange={(e) => setBulkName(e.target.value)}
              placeholder="leave blank to keep"
              className="mt-1 w-[280px] rounded-xl border px-3 py-2"
            />
          </div>
          <div className="flex-col">
            <label className="block text-sm font-medium">New type (all)</label>
            <select
              value={bulkType}
              onChange={(e) => setBulkType(e.target.value)}
              className="mt-1 w-[220px] rounded-xl border px-3 py-2 h-[42px]"
            >
              <option value="">(no change)</option>
              {COMMON_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => updateAll().catch((e) => alert(String(e)))}
            className="h-[42px] rounded-2xl border px-4 text-sm"
            disabled={matches.length === 0}
          >
            Change all
          </button>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="p-6 text-gray-600">No activities matched.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2 w-8">#</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Current type</th>
                <th className="px-4 py-2" colSpan={3}>
                  Edit & Apply
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {matches.map((a, idx) => (
                <RowEditor key={a.id} a={a} idx={idx} onUpdate={updateOne} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
