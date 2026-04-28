import { NextResponse } from "next/server";
import { getCacheMeta } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const meta = getCacheMeta();
  if (!meta) {
    return NextResponse.json({ cached: false });
  }
  return NextResponse.json({ cached: true, fetched_at: meta.fetched_at });
}
