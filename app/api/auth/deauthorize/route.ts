import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const strava_access_token =
    req.cookies.get("strava_access_token")?.value || null;

  if (!strava_access_token) {
    return NextResponse.json(
      { ok: false, error: "Missing accessToken" },
      { status: 400 },
    );
  }

  await fetch("https://www.strava.com/oauth/deauthorize", {
    method: "POST",
    headers: { Authorization: `Bearer ${strava_access_token}` },
    cache: "no-store",
  });

  const redirect = NextResponse.redirect(new URL("/", req.url), {
    status: 303,
  });
  redirect.cookies.delete("strava_access_token");
  redirect.cookies.delete("strava_refresh_token");
  redirect.cookies.delete("strava_geo_lat");
  redirect.cookies.delete("strava_geo_lng");
  return redirect;
}
