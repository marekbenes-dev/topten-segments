import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { lat, lng, radiusKm } = await req.json();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("geo", encodeURIComponent(JSON.stringify({ lat, lng, radiusKm })), {
    httpOnly: false,     // readable client & server (not sensitive)
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: true,
  });
  return res;
}