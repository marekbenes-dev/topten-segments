import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { lat, lng, radiusKm } = await req.json();
  const res = NextResponse.json({ ok: true });

  res.cookies.set("strava_geo_lat", lat, {
    httpOnly: false, // readable client & server (not sensitive)
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });

  res.cookies.set("strava_geo_lng", lng, {
    httpOnly: false, // readable client & server (not sensitive)
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });

  res.cookies.set("strava_geo_radius", radiusKm, {
    httpOnly: false, // readable client & server (not sensitive)
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });

  return res;
}
