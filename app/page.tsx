import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  const stravaAuthUrl =
    `https://www.strava.com/oauth/authorize` +
    `?client_id=${process.env.CLIENT_ID ?? "178019"}` +
    `&redirect_uri=${process.env.REDIRECT_URI ?? "http://localhost:3000/redirect"}` +
    `&response_type=code` +
    `&scope=activity:read`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <Link href={stravaAuthUrl}>
        <Button size="lg">Sign in with Strava</Button>
      </Link>
    </div>
  );
}
