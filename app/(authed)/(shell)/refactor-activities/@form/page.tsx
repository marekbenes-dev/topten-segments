"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

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

export default function FormPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();

  const [name, setName] = React.useState(sp.get("q") ?? "");

  // Initialize select/custom from URL target
  const urlTarget = sp.get("target") ?? "";
  const isUrlCommon = COMMON_TYPES.includes(urlTarget);

  const [selectVal, setSelectVal] = React.useState<string>(
    isUrlCommon ? urlTarget : urlTarget ? "custom" : "",
  );
  const [customType, setCustomType] = React.useState<string>(
    isUrlCommon ? "" : urlTarget,
  );

  const [dryRun, setDryRun] = React.useState(sp.get("dry") !== "0");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (name.trim()) params.set("q", name.trim());

    const chosen = (selectVal === "custom" ? customType : selectVal)?.trim();
    if (chosen) params.set("target", chosen);

    params.set("dry", dryRun ? "1" : "0");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-4 rounded-2xl border p-4 md:grid-cols-4"
    >
      <div className="md:col-span-2">
        <label className="block text-sm font-medium">
          Activity name contains
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border px-3 py-2"
          placeholder="e.g., Morning Run"
          data-testid="activity-name-input"
          required
        />
      </div>

      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium">New activity type</label>
          <select
            value={selectVal}
            data-testid="new-type-select"
            onChange={(e) => setSelectVal(e.target.value)}
            className="mt-1 w-full rounded-xl border px-3 py-2"
            required={customType.trim().length === 0}
          >
            <option value="">Select…</option>
            {COMMON_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
            <option value="custom">Other…</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Custom type (optional)
          </label>
          <input
            value={customType}
            onChange={(e) => {
              setCustomType(e.target.value);
              if (e.target.value && selectVal !== "custom")
                setSelectVal("custom");
              if (!e.target.value && selectVal === "custom") setSelectVal("");
            }}
            className="mt-1 w-full rounded-xl border px-3 py-2"
            placeholder="Exact Strava type value"
            // Only required if "Other…" is selected
            required={selectVal === "custom"}
          />
          <p className="text-xs text-gray-500 mt-1">
            Pick a common type or choose <em>Other…</em> and type your own. If
            filled, custom overrides.
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4 md:col-span-4">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => setDryRun(e.target.checked)}
          />
          <span className="text-sm">Dry run</span>
        </label>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 shadow-sm bg-black text-white"
        >
          Run
        </button>
      </div>
    </form>
  );
}
