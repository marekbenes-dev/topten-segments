import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

async function stravaPut(
  id: number,
  token: string,
  body: { name?: string; type?: string },
) {
  const payload: Record<string, string> = {};
  if (body.name) payload.name = body.name;
  if (body.type) payload.type = body.type;
  if (!Object.keys(payload).length) return { ok: true };

  const res = await fetch(`https://www.strava.com/api/v3/activities/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) return { ok: false, status: res.status, text: await res.text() };
  return { ok: true };
}

export async function POST(req: NextRequest) {
  try {
    const token = (await cookies()).get("strava_access_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 401 });
    }

    const { ids, name, type } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0 || (!name && !type)) {
      return NextResponse.json(
        { error: "Provide ids[] and at least one of name/type" },
        { status: 400 },
      );
    }

    const results: Array<{ id: number; ok: boolean; error?: string }> = [];
    for (const raw of ids) {
      const id = Number(raw);
      if (!id) continue;
      const res = await stravaPut(id, token, { name, type });
      if (!res.ok) {
        results.push({ id, ok: false, error: `${res.status} ${res.text}` });
      } else {
        results.push({ id, ok: true });
      }
      await new Promise((r) => setTimeout(r, 200)); // pacing
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: unknown) {
    if ("message" in (err as Error)) {
      return NextResponse.json(
        { ok: false, error: (err as Error).message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: false, error: "Unknown error" },
      { status: 500 },
    );
  }
}
