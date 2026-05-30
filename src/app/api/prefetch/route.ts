import { NextRequest } from "next/server";
import { prefetchAll } from "@/lib/prefetch";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" } as const;

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expected = process.env.PREFETCH_SECRET || "abs-prefetch-2024";

  if (secret !== expected) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: JSON_HEADERS });
  }

  const result = await prefetchAll();

  if (result.success) {
    return new Response(JSON.stringify({ ok: true, ...result.stats }), { headers: JSON_HEADERS });
  }

  return new Response(JSON.stringify({ ok: false, error: result.error }), { status: 500, headers: JSON_HEADERS });
}
