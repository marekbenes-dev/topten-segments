// app/redirect/page.tsx
import { setCookie } from "cookies-next";
import { redirect } from "next/navigation";

type StravaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  athlete: { id: number };
};

async function exchangeCodeForToken(code: string) {
  const res = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: JSON.stringify({
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("Strava token exchange failed", res);
   throw new Error(`Token exchange failed, this is the response: ${JSON.stringify(res)}`); 
  }
  return (await res.json()) as StravaTokenResponse;
}

async function getStarredSegments(accessToken: string) {
  const res = await fetch(
    "https://www.strava.com/api/v3/segments/starred?page=1&per_page=30",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error("Fetching starred segments failed");
  return res.json(); // array of segments
}

export default async function RedirectPage({
  searchParams,
}: {
  searchParams: { code?: string; state?: string; error?: string };
}) {
  // 1) Basic sanity checks
  if (searchParams.error) redirect(`/?error=${encodeURIComponent(searchParams.error)}`);
  const code = searchParams.code;
  if (!code) redirect("/?error=missing_code");

  // TODO (recommended): validate `state` matches what you issued before redirecting to Strava

  // 2) Exchange code → tokens (server)
  const token = await exchangeCodeForToken(code);

  // 3) Store token securely (httpOnly cookie). Or write to DB keyed by user.
  const secondsToExpiry = token.expires_at - Math.floor(Date.now() / 1000);
  setCookie("strava_access_token", token.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(0, secondsToExpiry),
  });
  // If you want refresh later, also store token.refresh_token (prefer DB).

  // 4) Server-fetch starred segments
  const segments = await getStarredSegments(token.access_token);

  // 5) Render (or do `redirect('/dashboard')` after saving to DB)
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-xl font-bold">Your starred segments</h1>
      <ul className="mt-4 space-y-3">
        {segments.map((s: DetailedSegment) => (
          <li key={s.id} className="border rounded-lg p-3">
            <div className="font-medium">{s.name}</div>
            <div className="text-sm opacity-70">Distance: {Math.round(s.distance)} m</div>
            <div className="text-sm opacity-70">Avg Grade: {s.effort_count}%</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
