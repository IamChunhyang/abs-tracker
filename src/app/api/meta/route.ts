import { getCacheMeta } from "@/lib/cache";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" } as const;

export const dynamic = "force-dynamic";

export async function GET() {
  const meta = getCacheMeta();
  if (!meta) {
    return new Response(JSON.stringify({ cached: false }), { headers: JSON_HEADERS });
  }
  return new Response(JSON.stringify({ cached: true, fetched_at: meta.fetched_at }), { headers: JSON_HEADERS });
}
