import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { lat, lng } = await req.json();
  const res = NextResponse.json({ ok: true });

  res.cookies.set("strava-geo-lat", lat, {
    httpOnly: false,     // readable client & server (not sensitive)
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: true,
  });

  res.cookies.set("strava-geo-lng", lng, {
    httpOnly: false,     // readable client & server (not sensitive)
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: true,
  });

  return res;
}