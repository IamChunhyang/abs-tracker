import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { getContractName } from "@/lib/data";
import { RankingEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

const WEEKLY_DIR = join(process.cwd(), "cache", "weekly");

function groupRankings(rankings: RankingEntry[]): RankingEntry[] {
  const grouped: Record<string, { tx_count: number; unique_users: number; topEntry: RankingEntry; topCount: number }> = {};
  for (const r of rankings) {
    const info = getContractName(r.contract_address);
    if (info.hidden) continue;
    const key = info.is_unknown ? r.contract_address : info.name;
    const entry = { ...r, contract_name: info.name, category: info.category, is_unknown: info.is_unknown };
    if (!grouped[key]) {
      grouped[key] = { tx_count: 0, unique_users: 0, topEntry: entry, topCount: 0 };
    }
    grouped[key].tx_count += r.tx_count;
    grouped[key].unique_users += r.unique_users;
    if (r.tx_count > grouped[key].topCount) {
      grouped[key].topEntry = entry;
      grouped[key].topCount = r.tx_count;
    }
  }
  return Object.values(grouped)
    .map((g) => ({ ...g.topEntry, tx_count: g.tx_count, unique_users: g.unique_users }))
    .sort((a, b) => b.tx_count - a.tx_count);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const week = searchParams.get("week");
  const tier = searchParams.get("tier") || "all";

  if (!week) {
    const manifestPath = join(WEEKLY_DIR, "weeks.json");
    if (!existsSync(manifestPath)) {
      return NextResponse.json({ weeks: [] });
    }
    const weeks = JSON.parse(readFileSync(manifestPath, "utf-8"));
    return NextResponse.json({ weeks });
  }

  const filePath = join(WEEKLY_DIR, `${week}_${tier}.json`);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: "Week data not found" }, { status: 404 });
  }

  try {
    const raw = JSON.parse(readFileSync(filePath, "utf-8"));
    const data = raw.data;
    data.rankings = groupRankings(data.rankings || []);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to read weekly data" }, { status: 500 });
  }
}
