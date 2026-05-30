import { NextRequest } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { getContractName } from "@/lib/data";
import { RankingEntry, WeeklyRankingEntry } from "@/lib/types";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" } as const;

export const dynamic = "force-dynamic";

const WEEKLY_DIR = join(process.cwd(), "cache", "weekly");

interface WeekInfo {
  week_start: string;
  week_end: string;
  fetched_at: string;
}

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

function loadGroupedRankings(weekStart: string, tier: string): RankingEntry[] | null {
  const filePath = join(WEEKLY_DIR, `${weekStart}_${tier}.json`);
  if (!existsSync(filePath)) return null;
  try {
    const raw = JSON.parse(readFileSync(filePath, "utf-8"));
    return groupRankings(raw.data.rankings || []);
  } catch {
    return null;
  }
}

function computeChanges(current: RankingEntry[], previous: RankingEntry[] | null): WeeklyRankingEntry[] {
  if (!previous || previous.length === 0) {
    return current.map((r) => ({ ...r, rank_change: null, is_new: false, tx_change_pct: null }));
  }
  const prevByName = new Map<string, { rank: number; tx_count: number }>();
  previous.forEach((r, i) => {
    prevByName.set(r.contract_name, { rank: i + 1, tx_count: r.tx_count });
  });

  return current.map((r, i) => {
    const currentRank = i + 1;
    const prev = prevByName.get(r.contract_name);
    if (!prev) {
      return { ...r, rank_change: null, is_new: true, tx_change_pct: null };
    }
    const rank_change = prev.rank - currentRank;
    const tx_change_pct = prev.tx_count > 0
      ? Math.round(((r.tx_count - prev.tx_count) / prev.tx_count) * 1000) / 10
      : null;
    return { ...r, rank_change, is_new: false, tx_change_pct };
  });
}

function loadWeeks(): WeekInfo[] {
  const manifestPath = join(WEEKLY_DIR, "weeks.json");
  if (!existsSync(manifestPath)) return [];
  return JSON.parse(readFileSync(manifestPath, "utf-8"));
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const week = searchParams.get("week");
  const tier = searchParams.get("tier") || "all";
  const allWeeks = searchParams.get("all") === "true";

  const weeks = loadWeeks();

  if (!week) {
    return new Response(JSON.stringify({ weeks }), { headers: JSON_HEADERS });
  }

  if (allWeeks) {
    const result: Record<string, RankingEntry[]> = {};
    for (const w of weeks) {
      const rankings = loadGroupedRankings(w.week_start, tier);
      if (rankings) result[w.week_start] = rankings;
    }
    return new Response(JSON.stringify({ allWeeks: result, weeks }), { headers: JSON_HEADERS });
  }

  const currentRankings = loadGroupedRankings(week, tier);
  if (!currentRankings) {
    return new Response(JSON.stringify({ error: "Week data not found" }), { status: 404, headers: JSON_HEADERS });
  }

  const weekIndex = weeks.findIndex((w) => w.week_start === week);
  const prevWeek = weekIndex >= 0 && weekIndex < weeks.length - 1 ? weeks[weekIndex + 1] : null;
  const prevRankings = prevWeek ? loadGroupedRankings(prevWeek.week_start, tier) : null;

  const rankings = computeChanges(currentRankings, prevRankings);

  const filePath = join(WEEKLY_DIR, `${week}_${tier}.json`);
  const raw = JSON.parse(readFileSync(filePath, "utf-8"));

  return new Response(JSON.stringify({
    ...raw.data,
    rankings,
    total_wallets: raw.data.total_wallets,
  }), { headers: JSON_HEADERS });
}
