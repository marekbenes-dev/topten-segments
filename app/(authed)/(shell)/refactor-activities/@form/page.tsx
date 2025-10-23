// app/refactor-activities/@form/page.tsx
"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function FormPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();

  const [name, setName] = React.useState(sp.get("activityName") ?? "");
  const [dateFrom, setDateFrom] = React.useState(sp.get("from") ?? "");
  const [dateTo, setDateTo] = React.useState(sp.get("to") ?? "");
  const [error, setError] = React.useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (dateFrom && dateTo && dateFrom > dateTo) {
      setError("“From” date must be on or before the “To” date.");
      return;
    }

    const params = new URLSearchParams(sp.toString());
    params.delete("activityName");
    params.delete("from");
    params.delete("to");

    if (name.trim()) params.set("activityName", name.trim());
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);

    const queryString = params.toString();
    console.log(
      "Navigating to:",
      queryString ? `${pathname}?${queryString}` : pathname,
    );
    // ⬇️ Navigate to the page (not the API). Results pane will react to this.
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap gap-4">
      <div className="flex-col space-between min-w-[240px]">
        <label className="block text-sm font-medium">
          Activity name contains
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border px-3 py-2"
          placeholder="e.g., Morning Run"
        />
      </div>
      <div className="flex-col space-between min-w-[180px]">
        <label className="block text-sm font-medium">From date</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="mt-1 w-full rounded-xl border px-3 py-2"
          max={dateTo || undefined}
        />
      </div>
      <div className="flex-col space-between min-w-[180px]">
        <label className="block text-sm font-medium">To date</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="mt-1 w-full rounded-xl border px-3 py-2"
          min={dateFrom || undefined}
        />
      </div>
      <div className="flex items-end justify-end align-center">
        <Button type="submit" className="h-[42px] rounded-2xl">
          Search
        </Button>
      </div>
      {error && (
        <p className="w-full text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
