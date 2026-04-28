import { NextRequest, NextResponse } from "next/server";
import { readCache, writeCache } from "@/lib/cache";
import { loadAllWallets } from "@/lib/load-wallets";
import { getTxCount, getCurrentBlock, fetchTransactions, periodToBlocks } from "@/lib/abstract-api";
import { getContractName } from "@/lib/data";

interface WalletRank {
  address: string;
  name: string;
  tier: string;
  tx_count: number;
}

export const dynamic = "force-dynamic";

const rankMemCache = new Map<string, { data: unknown; ts: number }>();
const RANK_CACHE_TTL = 10 * 60 * 1000;

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim().toLowerCase();
  const period = request.nextUrl.searchParams.get("period") || "7d";

  if (!q) {
    return NextResponse.json({ error: "q required" }, { status: 400 });
  }

  const allWallets = loadAllWallets();
  const wallet = allWallets.find(
    (w) =>
      w.address === q ||
      w.name.toLowerCase() === q ||
      w.name.toLowerCase().includes(q)
  );

  if (!wallet) {
    return NextResponse.json({ found: false });
  }

  const memKey = `${wallet.address}:${period}`;
  const cached = rankMemCache.get(memKey);
  if (cached && Date.now() - cached.ts < RANK_CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const allRanking = readCache<{
    wallet_ranking: WalletRank[];
  }>(`rankings_${period}_all`);

  const tierRanking = readCache<{
    wallet_ranking: WalletRank[];
  }>(`rankings_${period}_${wallet.tier}`);

  let overallRank: number | null = null;
  let overallTotal = 0;
  let periodTxCount = 0;
  let nearby: (WalletRank & { rank: number; isTarget: boolean })[] = [];

  if (allRanking) {
    const sorted = allRanking.wallet_ranking;
    overallTotal = sorted.length;
    const idx = sorted.findIndex((w) => w.address.toLowerCase() === wallet.address);
    if (idx !== -1) {
      overallRank = idx + 1;
      periodTxCount = sorted[idx].tx_count;

      const start = Math.max(0, idx - 100);
      const end = Math.min(sorted.length, idx + 101);
      nearby = sorted.slice(start, end).map((w, i) => ({
        ...w,
        rank: start + i + 1,
        isTarget: w.address.toLowerCase() === wallet.address,
      }));
    }
  }

  let tierRank: number | null = null;
  let tierTotal = 0;

  if (tierRanking) {
    const sorted = tierRanking.wallet_ranking;
    tierTotal = sorted.length;
    const idx = sorted.findIndex((w) => w.address.toLowerCase() === wallet.address);
    if (idx !== -1) {
      tierRank = idx + 1;
      if (!periodTxCount) periodTxCount = sorted[idx].tx_count;
    }
  }

  let totalTxCount = 0;
  try {
    totalTxCount = await getTxCount(wallet.address);
  } catch {}

  const topPercent =
    overallRank && overallTotal
      ? Math.round((overallRank / overallTotal) * 100)
      : null;

  interface TopContract {
    contract_address: string;
    contract_name: string;
    category: string;
    is_unknown: boolean;
    tx_count: number;
    top_method: string;
  }

  let topContracts: TopContract[] = [];
  const walletCache = readCache<{
    top_contracts: TopContract[];
  }>(`wallet_${wallet.address}_${period}`);
  if (walletCache?.top_contracts) {
    topContracts = walletCache.top_contracts.slice(0, 10);
  }

  // Live fetch if wallet not found in cache
  if (!overallRank && !tierRank) {
    try {
      const currentBlock = await getCurrentBlock();
      const startBlock = periodToBlocks(period, currentBlock);
      const txs = await fetchTransactions(wallet.address, startBlock);
      periodTxCount = txs.length;

      if (topContracts.length === 0) {
        const cMap: Record<string, { count: number; methods: Record<string, number> }> = {};
        for (const tx of txs) {
          const to = (tx.to || "").toLowerCase();
          if (!to || to === wallet.address) continue;
          if (!cMap[to]) cMap[to] = { count: 0, methods: {} };
          cMap[to].count++;
          const method = tx.functionName || tx.methodId || "unknown";
          cMap[to].methods[method] = (cMap[to].methods[method] || 0) + 1;
        }
        topContracts = Object.entries(cMap)
          .map(([addr, stats]) => {
            const info = getContractName(addr);
            const topMethod = Object.entries(stats.methods).sort((a, b) => b[1] - a[1])[0];
            return {
              contract_address: addr,
              contract_name: info.name,
              category: info.category,
              is_unknown: info.is_unknown,
              tx_count: stats.count,
              top_method: topMethod ? topMethod[0] : "",
            };
          })
          .sort((a, b) => b.tx_count - a.tx_count)
          .slice(0, 10);
      }

      // Compute rank by inserting into cached ranking
      if (periodTxCount > 0 && allRanking) {
        const sorted = allRanking.wallet_ranking;
        const insertIdx = sorted.findIndex((w) => w.tx_count <= periodTxCount);
        overallRank = insertIdx === -1 ? sorted.length + 1 : insertIdx + 1;
        overallTotal = sorted.length + 1;

        const me: WalletRank = { address: wallet.address, name: wallet.name, tier: wallet.tier, tx_count: periodTxCount };
        const withMe = [...sorted.slice(0, insertIdx === -1 ? sorted.length : insertIdx), me, ...sorted.slice(insertIdx === -1 ? sorted.length : insertIdx)];
        const myIdx = withMe.findIndex((w) => w.address === wallet.address);
        const start = Math.max(0, myIdx - 100);
        const end = Math.min(withMe.length, myIdx + 101);
        nearby = withMe.slice(start, end).map((w, i) => ({
          ...w,
          rank: start + i + 1,
          isTarget: w.address === wallet.address,
        }));
      }

      if (periodTxCount > 0 && tierRanking) {
        const sorted = tierRanking.wallet_ranking;
        const insertIdx = sorted.findIndex((w) => w.tx_count <= periodTxCount);
        tierRank = insertIdx === -1 ? sorted.length + 1 : insertIdx + 1;
        tierTotal = sorted.length + 1;
      }

      // Cache result for next time
      if (periodTxCount > 0) {
        try {
          writeCache(`wallet_${wallet.address}_${period}`, {
            address: wallet.address,
            name: wallet.name,
            tier: wallet.tier,
            tier_v2: wallet.tier_v2,
            badges: wallet.badges,
            streaming: wallet.streaming,
            portal_link: wallet.portal_link,
            total_tx_count: totalTxCount,
            period_tx_count: periodTxCount,
            period,
            top_contracts: topContracts,
          });
        } catch {}
      }
    } catch {}
  }

  const topPercent2 =
    overallRank && overallTotal
      ? Math.round((overallRank / overallTotal) * 100)
      : null;

  const result = {
    found: true,
    wallet: {
      address: wallet.address,
      name: wallet.name,
      tier: wallet.tier,
      badges: wallet.badges,
      streaming: wallet.streaming,
    },
    period,
    overall_rank: overallRank,
    overall_total: overallTotal,
    tier_rank: tierRank,
    tier_total: tierTotal,
    period_tx_count: periodTxCount,
    total_tx_count: totalTxCount,
    top_percent: topPercent2 ?? topPercent,
    nearby,
    top_contracts: topContracts,
  };

  rankMemCache.set(memKey, { data: result, ts: Date.now() });
  return NextResponse.json(result);
}
