import { NextRequest, NextResponse } from "next/server";
import { readCache } from "@/lib/cache";
import { loadAllWallets } from "@/lib/load-wallets";
import { getTxCount } from "@/lib/abstract-api";

interface WalletRank {
  address: string;
  name: string;
  tier: string;
  tx_count: number;
}

export const dynamic = "force-dynamic";

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

  return NextResponse.json({
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
    top_percent: topPercent,
    nearby,
    top_contracts: topContracts,
  });
}
