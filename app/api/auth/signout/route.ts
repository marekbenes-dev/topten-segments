import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // using 303 see other, because it tells browser to redirect
  const res = NextResponse.redirect(new URL("/", req.url), { status: 303 });

  res.cookies.delete("strava_acces_token");
  res.cookies.delete("strava_refresh_token");
  res.cookies.delete("strava_geo_lat");
  res.cookies.delete("strava_geo_lng");

  return res;
}
