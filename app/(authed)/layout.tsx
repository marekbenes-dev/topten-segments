import { redirect } from "next/navigation";
import Link from "next/link";
import ExploreLinkCard from "./menu/ExploreLinkCard";
import { cookies } from "next/headers";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("strava_access_token");
  if (!token) redirect("/?no_token"); // not signed in → back to landing

  return (
    <div className="min-h-screen">
      <nav className="border-b">
        <div className="container mx-auto p-4 flex gap-4">
          <Link href="/menu">Menu</Link>
          <Link href="/segments">Starred</Link>
          <ExploreLinkCard />
          <form action="/api/auth/signout" method="post" className="ml-auto">
            <button className="underline">Sign out</button>
          </form>
        </div>
      </nav>
      <main className="container mx-auto p-6">{children}</main>
    </div>
  );
}
