import { NextRequest, NextResponse } from "next/server";
import { readCache } from "@/lib/cache";
import { loadAllWallets, loadCustomWalletCache } from "@/lib/load-wallets";
import { getTxCount } from "@/lib/abstract-api";
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
  let wallet = allWallets.find(
    (w) =>
      w.address === q ||
      w.name.toLowerCase() === q ||
      w.name.toLowerCase().includes(q)
  );

  if (!wallet && q.length >= 3) {
    wallet = allWallets.find((w) => {
      const name = w.name.toLowerCase();
      if (q.length < name.length * 0.5) return false;
      let qi = 0;
      for (let ni = 0; ni < name.length && qi < q.length; ni++) {
        if (name[ni] === q[qi]) qi++;
      }
      return qi === q.length;
    });
  }

  if (!wallet) {
    return NextResponse.json({ found: false });
  }

  const memKey = `${wallet.address}:${period}`;
  const cached = rankMemCache.get(memKey);
  if (cached && Date.now() - cached.ts < RANK_CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  const allRanking = readCache<{ wallet_ranking: WalletRank[] }>(`rankings_${period}_all`);
  const tierRanking = readCache<{ wallet_ranking: WalletRank[] }>(`rankings_${period}_${wallet.tier}`);

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
        ...w, rank: start + i + 1, isTarget: w.address.toLowerCase() === wallet.address,
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

  interface TopContract {
    contract_address: string;
    contract_name: string;
    category: string;
    is_unknown: boolean;
    tx_count: number;
    top_method: string;
  }

  let topContracts: TopContract[] = [];
  const walletCache = readCache<{ top_contracts: TopContract[] }>(`wallet_${wallet.address}_${period}`);
  if (walletCache?.top_contracts) {
    topContracts = walletCache.top_contracts.slice(0, 10);
  }

  // Use pre-fetched custom wallet data if not in ranking cache
  if (!overallRank && !tierRank) {
    const customCache = loadCustomWalletCache();
    const cd = customCache[wallet.address];
    if (cd) {
      const pd = cd[period] as { tx_count: number; top_contracts?: { address: string; tx_count: number; top_method: string }[] } | undefined;
      if (pd) {
        periodTxCount = pd.tx_count;
        if (!totalTxCount) totalTxCount = cd.total_tx_count;

        if (topContracts.length === 0 && pd.top_contracts) {
          topContracts = pd.top_contracts.map((c) => {
            const info = getContractName(c.address);
            return {
              contract_address: c.address,
              contract_name: info.name,
              category: info.category,
              is_unknown: info.is_unknown,
              tx_count: c.tx_count,
              top_method: c.top_method,
            };
          });
        }
      }
    }

    // Compute rank by inserting into cached ranking
    if (periodTxCount > 0 && allRanking) {
      const sorted = allRanking.wallet_ranking;
      const insertIdx = sorted.findIndex((w) => w.tx_count <= periodTxCount);
      overallRank = insertIdx === -1 ? sorted.length + 1 : insertIdx + 1;
      overallTotal = sorted.length + 1;

      const me: WalletRank = { address: wallet.address, name: wallet.name, tier: wallet.tier, tx_count: periodTxCount };
      const pos = insertIdx === -1 ? sorted.length : insertIdx;
      const withMe = [...sorted.slice(0, pos), me, ...sorted.slice(pos)];
      const myIdx = withMe.findIndex((w) => w.address === wallet.address);
      const start = Math.max(0, myIdx - 100);
      const end = Math.min(withMe.length, myIdx + 101);
      nearby = withMe.slice(start, end).map((w, i) => ({
        ...w, rank: start + i + 1, isTarget: w.address === wallet.address,
      }));
    }

    if (periodTxCount > 0 && tierRanking) {
      const sorted = tierRanking.wallet_ranking;
      const insertIdx = sorted.findIndex((w) => w.tx_count <= periodTxCount);
      tierRank = insertIdx === -1 ? sorted.length + 1 : insertIdx + 1;
      tierTotal = sorted.length + 1;
    }
  }

  const topPercent = overallRank && overallTotal
    ? Math.round((overallRank / overallTotal) * 100) : null;

  const result = {
    found: true,
    wallet: { address: wallet.address, name: wallet.name, tier: wallet.tier, badges: wallet.badges, streaming: wallet.streaming, portal_link: wallet.portal_link },
    period,
    overall_rank: overallRank,
    overall_total: overallTotal,
    tier_rank: tierRank,
    tier_total: tierTotal,
    period_tx_count: periodTxCount,
    total_tx_count: totalTxCount,
    top_percent: topPercent,
    nearby,
    top_contracts: topContracts,
  };

  rankMemCache.set(memKey, { data: result, ts: Date.now() });
  return NextResponse.json(result);
}
