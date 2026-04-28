import { NextRequest, NextResponse } from "next/server";
import { prefetchAll } from "@/lib/prefetch";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  const expected = process.env.PREFETCH_SECRET || "abs-prefetch-2024";

  if (secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prefetchAll();

  if (result.success) {
    return NextResponse.json({ ok: true, ...result.stats });
  }

  return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
}
