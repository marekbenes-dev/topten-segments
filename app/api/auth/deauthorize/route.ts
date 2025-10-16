import { StravaCookie } from "@/app/constants/tokens";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get(StravaCookie.AccessToken)?.value || null;

  if (!accessToken) {
    return NextResponse.json(
      { ok: false, error: "Missing accessToken" },
      { status: 400 },
    );
  }

  await fetch("https://www.strava.com/oauth/deauthorize", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const redirect = NextResponse.redirect(new URL("/", req.url), {
    status: 303,
  });

  redirect.cookies.delete(StravaCookie.AccessToken);
  redirect.cookies.delete(StravaCookie.RefreshToken);
  redirect.cookies.delete(StravaCookie.GeoLat);
  redirect.cookies.delete(StravaCookie.GeoLng);
  redirect.cookies.delete(StravaCookie.GeoRadius);

  return redirect;
}
