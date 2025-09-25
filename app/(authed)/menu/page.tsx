import Link from "next/link";
import ExploreLinkCard from "./ExploreLinkCard";

export default function MenuPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome 👋</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <Link href="/segments" className="border rounded p-4 hover:bg-gray-50">
          <div className="text-lg font-semibold">My Starred Segments</div>
          <p className="text-sm opacity-70">See your starred segments</p>
        </Link>

        <ExploreLinkCard />

        <Link
          href="/activities"
          className="border rounded p-4 hover:bg-gray-50"
        >
          <div className="text-lg font-semibold">My Activities</div>
          <p className="text-sm opacity-70">Recent workouts</p>
        </Link>
      </div>
    </div>
  );
}
