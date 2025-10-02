"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

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

  const urlTarget = sp.get("target") ?? "";
  const isUrlCommon = COMMON_TYPES.includes(urlTarget);

  const [selectVal, setSelectVal] = React.useState<string>(
    isUrlCommon ? urlTarget : urlTarget ? "custom" : "",
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (name.trim()) params.set("q", name.trim());
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-4">
      <div className="flex-col space-between">
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

      <div className="flex-col space-between">
        <label className="block text-sm font-medium">New activity type</label>
        <select
          value={selectVal}
          data-testid="new-type-select"
          onChange={(e) => setSelectVal(e.target.value)}
          className="mt-1 w-full rounded-xl border px-3 py-2 h-[42px]"
          required
        >
          <option value="">Select…</option>
          {COMMON_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-end justify-end align-center">
        <Button type="submit" className="h-[42px] rounded-2xl">
          Run
        </Button>
      </div>
    </form>
  );
}
