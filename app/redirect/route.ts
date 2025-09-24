import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type StravaTokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch seconds
  athlete: { id: number };
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", req.url));
  }

  const { CLIENT_ID, CLIENT_SECRET } = process.env;
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.redirect(new URL("/?error=server_misconfig", req.url));
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
  });

  const res = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: params,
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return NextResponse.redirect(
      new URL(`/?error=token_exchange_failed&detail=${encodeURIComponent(detail.slice(0,200))}`, req.url)
    );
  }

  const token = (await res.json()) as StravaTokenResponse;
  const cookieStore = await cookies();

  // Set secure, httpOnly cookies on the server
  const expires = new Date(token.expires_at * 1000);
  cookieStore.set("strava_access_token", token.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires,
  });
  cookieStore.set("strava_refresh_token", token.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    // (no expiry -> session cookie, or add a long-lived refresh expiry if you prefer)
  });

  // Now you *can* send them to the authed area
  return NextResponse.redirect(new URL("/menu", req.url));
}
