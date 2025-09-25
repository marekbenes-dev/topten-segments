import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.redirect(new URL("/"));

  res.cookies.delete("strava-token");
  res.cookies.delete("strava-refresh-token");
  res.cookies.delete("strava-geo-lat");
  res.cookies.delete("strava-geo-lng");

  return res;
}
