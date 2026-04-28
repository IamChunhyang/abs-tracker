import { NextRequest, NextResponse } from "next/server";
import { getCurrentBlock, fetchTransactions, periodToBlocks } from "@/lib/abstract-api";
import { getContractName } from "@/lib/data";
import { loadAllWallets, loadCustomWalletCache } from "@/lib/load-wallets";
import { RankingEntry } from "@/lib/types";
import { readCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

const memCache = new Map<string, { data: unknown; ts: number }>();
const MEM_CACHE_TTL = 5 * 60 * 1000;

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
  const period = searchParams.get("period") || "7d";
  const tier = searchParams.get("tier") || "all";

  // 1. File cache (from weekly prefetch)
  const fileCache = readCache(`rankings_${period}_${tier}`) as any;
  if (fileCache) {
    fileCache.rankings = groupRankings(fileCache.rankings || []);

    // Merge custom wallets into wallet_ranking
    const customCache = loadCustomWalletCache();
    const walletRanking: { address: string; name: string; tier: string; tx_count: number }[] = fileCache.wallet_ranking || [];
    const existingAddrs = new Set(walletRanking.map((w: any) => w.address.toLowerCase()));

    for (const [addr, cd] of Object.entries(customCache)) {
      if (existingAddrs.has(addr)) continue;
      const pd = cd[period] as { tx_count: number } | undefined;
      if (!pd || (tier !== "all" && cd.tier !== tier)) continue;
      walletRanking.push({ address: addr, name: cd.name, tier: cd.tier, tx_count: pd.tx_count });
    }

    walletRanking.sort((a: any, b: any) => b.tx_count - a.tx_count);
    fileCache.wallet_ranking = walletRanking;
    fileCache.total_wallets = walletRanking.length;

    return NextResponse.json(fileCache);
  }

  // 2. In-memory cache (fallback for live fetches)
  const memKey = `${period}:${tier}`;
  const cached = memCache.get(memKey);
  if (cached && Date.now() - cached.ts < MEM_CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const currentBlock = await getCurrentBlock();
    const startBlock = periodToBlocks(period, currentBlock);

    const allWallets = loadAllWallets();
    const wallets = tier === "all"
      ? allWallets
      : allWallets.filter((w) => w.tier === tier);

    const contractMap: Record<string, { count: number; users: Set<string> }> = {};
    const walletStats: Record<string, number> = {};

    const batchSize = 5;
    for (let i = 0; i < wallets.length; i += batchSize) {
      const batch = wallets.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map((w) => fetchTransactions(w.address, startBlock))
      );

      for (let j = 0; j < batch.length; j++) {
        const wallet = batch[j];
        const txs = results[j];
        walletStats[wallet.address] = txs.length;

        for (const tx of txs) {
          const to = (tx.to || "").toLowerCase();
          if (!to || to === wallet.address.toLowerCase()) continue;

          if (!contractMap[to]) {
            contractMap[to] = { count: 0, users: new Set() };
          }
          contractMap[to].count++;
          contractMap[to].users.add(wallet.address);
        }
      }

      if (i + batchSize < wallets.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    const groupedMap: Record<string, { count: number; users: Set<string>; topAddress: string; topCount: number }> = {};
    for (const [address, stats] of Object.entries(contractMap)) {
      const info = getContractName(address);
      const key = info.is_unknown ? address : info.name;
      if (!groupedMap[key]) {
        groupedMap[key] = { count: 0, users: new Set(), topAddress: address, topCount: 0 };
      }
      groupedMap[key].count += stats.count;
      for (const user of stats.users) {
        groupedMap[key].users.add(user);
      }
      if (stats.count > groupedMap[key].topCount) {
        groupedMap[key].topAddress = address;
        groupedMap[key].topCount = stats.count;
      }
    }

    const rankings: RankingEntry[] = Object.entries(groupedMap)
      .map(([, stats]) => {
        const info = getContractName(stats.topAddress);
        return {
          contract_address: stats.topAddress,
          contract_name: info.name,
          category: info.category,
          tx_count: stats.count,
          unique_users: stats.users.size,
          is_unknown: info.is_unknown,
        };
      })
      .sort((a, b) => b.tx_count - a.tx_count)
      .slice(0, 100);

    const walletRanking = Object.entries(walletStats)
      .map(([address, count]) => {
        const w = allWallets.find((ww) => ww.address.toLowerCase() === address.toLowerCase());
        return { address, name: w?.name || address.slice(0, 10), tier: w?.tier || "Unknown", tx_count: count };
      })
      .sort((a, b) => b.tx_count - a.tx_count);

    const categoryBreakdown: Record<string, number> = {};
    for (const r of rankings) {
      categoryBreakdown[r.category] = (categoryBreakdown[r.category] || 0) + r.tx_count;
    }

    const result = {
      period,
      tier,
      total_wallets: wallets.length,
      rankings,
      wallet_ranking: walletRanking,
      category_breakdown: categoryBreakdown,
    };

    memCache.set(memKey, { data: result, ts: Date.now() });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Rankings API error:", error);
    return NextResponse.json({ error: "Failed to fetch rankings" }, { status: 500 });
  }
}
