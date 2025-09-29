import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("strava_access_token");

  if (!token) redirect("/?no_token"); // not signed in → back to landing

  return (
    <div className="min-h-screen">
      <nav className="border-b">
        <div className="container mx-auto p-4 flex gap-4">
          <form action="/api/auth/signout" method="post" className="ml-auto">
            <Button variant="link" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </nav>
      <main className="container mx-auto p-6">{children}</main>
    </div>
  );
}
