import React from "react";

interface RefactorActivitiesLayoutProps {
  children?: React.ReactNode;
  results: React.ReactNode;
  form: React.ReactNode;
}

export default function RefactorActivitiesLayout({
  children, // unused (no leaf page under the segment)
  results,
  form,
}: RefactorActivitiesLayoutProps) {
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-2xl font-bold">Batch Activity Refactor</h1>
      <p className="text-gray-600 mt-1">
        Enter an activity name substring and a new type. Results render
        server-side.
      </p>

      <div className="mt-6 grid gap-6">
        {/* Search form (client) */}
        {form}
        {/* Results (server) */}
        {results}
      </div>
    </div>
  );
}
