import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Button } from "@/components/ui/button";
import ThemeToggle from "../components/ThemeToggle";
import { StravaCookie } from "../constants/tokens";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(StravaCookie.AccessToken)?.value;

  if (!token) redirect("/?no_token"); // not signed in → back to landing

  return (
    <div className="min-h-screen">
      <nav className="border-b">
        <div className="container mx-auto p-4 flex gap-4">
          <ThemeToggle></ThemeToggle>
          <form
            action="/api/auth/deauthorize"
            method="post"
            className="ml-auto"
          >
            <Button variant="link" size="sm">
              Disconnect from Strava
            </Button>
          </form>
        </div>
      </nav>
      <main className="container mx-auto p-6">{children}</main>
    </div>
  );
}
