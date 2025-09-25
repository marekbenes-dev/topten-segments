import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const res = NextResponse.redirect(new URL("/", req.url));

  res.cookies.delete("strava-token");
  res.cookies.delete("strava-refresh-token");
  res.cookies.delete("strava-geo-lat");
  res.cookies.delete("strava-geo-lng");

  return res;
}
