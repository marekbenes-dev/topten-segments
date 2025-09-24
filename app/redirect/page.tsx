import { getCookie,setCookie } from "cookies-next/client";
import { redirect } from "next/navigation";

export default async function RedirectPage({ searchParams }: { searchParams: { code?: string; error?: string } }) {
  if (searchParams.error) redirect(`/?error=${encodeURIComponent(searchParams.error)}`);

  const code = searchParams.code;

  if (!code) redirect("/?error=missing_code");
  // TODO (recommended): validate `state` matches what you issued before redirecting to Strava

  type StravaTokenResponse = {
    access_token: string;
    refresh_token: string;
    expires_at: number; // epoch seconds
    athlete: { id: number };
  };

  async function exchangeCodeForToken(code: string) {
    const { CLIENT_ID, CLIENT_SECRET } = process.env;

    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error("Missing CLIENT_ID or CLIENT_SECRET in Vercel environment properties.");
    }

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    });

    const res = await fetch("https://www.strava.com/api/v3/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Strava token exchange failed", res);
      throw new Error(`Token exchange failed, this is the response: ${JSON.stringify(res)}`); 
    }
    
    return (await res.json()) as StravaTokenResponse;
  }

  const token = await exchangeCodeForToken(code);
  const secondsToExpiry = token.expires_at - Math.floor(Date.now() / 1000);

  setCookie("strava_access_token", token.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.max(0, secondsToExpiry),
  });
  setCookie('strava_refresh_token', token.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",  
  });

  redirect("/menu");
}
