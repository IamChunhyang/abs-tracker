import { getCurrentBlock, fetchTransactions, periodToBlocks, getTxCount } from "./abstract-api";
import { getContractName } from "./data";
import { loadAllWallets, TIER_ORDER } from "./load-wallets";
import { Wallet } from "./types";
import { RankingEntry } from "./types";
import { writeCache } from "./cache";

const PERIODS = ["1d", "7d", "14d", "30d"] as const;
const PREFETCH_TIERS: readonly string[] = ["Obsidian", "Diamond", "Platinum"];
const DETAIL_TIERS = ["Obsidian", "Diamond"] as const;

interface MinimalTx {
  to: string;
  blockNumber: number;
  functionName: string;
  methodId: string;
}

interface WalletTxData {
  address: string;
  txs: MinimalTx[];
}

function computeRankings(
  walletData: WalletTxData[],
  allWallets: Wallet[],
  startBlock: number,
  period: string,
  tier: string,
) {
  const contractMap: Record<string, { count: number; users: Set<string> }> = {};
  const walletStats: Record<string, number> = {};

  for (const wd of walletData) {
    const periodTxs = wd.txs.filter((tx) => tx.blockNumber >= startBlock);
    walletStats[wd.address] = periodTxs.length;

    for (const tx of periodTxs) {
      if (!tx.to || tx.to === wd.address.toLowerCase()) continue;
      if (!contractMap[tx.to]) {
        contractMap[tx.to] = { count: 0, users: new Set() };
      }
      contractMap[tx.to].count++;
      contractMap[tx.to].users.add(wd.address);
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
      const w = allWallets.find((ww) => ww.address === address);
      return { address, name: w?.name || address.slice(0, 10), tier: w?.tier || "Unknown", tx_count: count };
    })
    .sort((a, b) => b.tx_count - a.tx_count);

  const categoryBreakdown: Record<string, number> = {};
  for (const r of rankings) {
    categoryBreakdown[r.category] = (categoryBreakdown[r.category] || 0) + r.tx_count;
  }

  writeCache(`rankings_${period}_${tier}`, {
    period,
    tier,
    total_wallets: walletData.length,
    rankings,
    wallet_ranking: walletRanking,
    category_breakdown: categoryBreakdown,
  });
}

async function fetchTierTransactions(
  wallets: Wallet[],
  startBlock: number,
  batchSize: number,
  tierName: string,
): Promise<WalletTxData[]> {
  const result: WalletTxData[] = [];
  const totalBatches = Math.ceil(wallets.length / batchSize);

  for (let i = 0; i < wallets.length; i += batchSize) {
    const batch = wallets.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    if (batchNum % 50 === 1 || totalBatches <= 100) {
      console.log(`[prefetch] ${tierName} batch ${batchNum}/${totalBatches}`);
    }

    const results = await Promise.all(
      batch.map((w) =>
        fetchTransactions(w.address, startBlock).catch(() => [])
      )
    );

    for (let j = 0; j < batch.length; j++) {
      result.push({
        address: batch[j].address,
        txs: results[j].map((tx: any) => ({
          to: (tx.to || "").toLowerCase(),
          blockNumber: parseInt(tx.blockNumber, 10),
          functionName: tx.functionName || "",
          methodId: tx.methodId || "",
        })),
      });
    }

    if (i + batchSize < wallets.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  return result;
}

export async function prefetchAll() {
  console.log("[prefetch] Starting full prefetch (all tiers)...");
  const startTime = Date.now();

  try {
    const allWallets = loadAllWallets();
    const currentBlock = await getCurrentBlock();
    const startBlocks: Record<string, number> = {};
    for (const period of PERIODS) {
      startBlocks[period] = periodToBlocks(period, currentBlock);
    }

    const allTxData: WalletTxData[] = [];

    for (const tier of PREFETCH_TIERS) {
      const tierWallets = allWallets.filter((w) => w.tier === tier);
      const batchSize = tier === "Platinum" ? 25 : 5;
      const fetchWindow = tier === "Platinum" ? "7d" : "30d";

      console.log(`[prefetch] === ${tier} (${tierWallets.length} wallets, batch=${batchSize}, window=${fetchWindow}) ===`);
      const tierStart = Date.now();

      const tierTxs = await fetchTierTransactions(
        tierWallets,
        startBlocks[fetchWindow],
        batchSize,
        tier,
      );
      allTxData.push(...tierTxs);

      const tierSec = ((Date.now() - tierStart) / 1000).toFixed(0);
      console.log(`[prefetch] ${tier} done in ${tierSec}s (${tierTxs.length} wallets)`);

      // Compute per-tier rankings (Platinum only has 7d data)
      const tierPeriods = tier === "Platinum" ? (["1d", "7d"] as const) : PERIODS;
      for (const period of tierPeriods) {
        computeRankings(tierTxs, allWallets, startBlocks[period], period, tier);
      }
    }

    // Compute "all" rankings (1d/7d only — Platinum only has 7d data)
    console.log("[prefetch] Computing overall rankings...");
    for (const period of ["1d", "7d"] as const) {
      computeRankings(allTxData, allWallets, startBlocks[period], period, "all");
    }

    // Individual wallet details (Obsidian + Diamond only)
    const detailWallets = allWallets.filter((w) =>
      (DETAIL_TIERS as readonly string[]).includes(w.tier)
    );
    console.log(`[prefetch] Computing wallet details (${detailWallets.length} wallets)...`);

    const totalTxCounts = await Promise.all(
      detailWallets.map((w) => getTxCount(w.address).catch(() => 0))
    );

    for (let wi = 0; wi < detailWallets.length; wi++) {
      const wallet = detailWallets[wi];
      const wd = allTxData.find((d) => d.address === wallet.address);
      if (!wd) continue;

      for (const period of PERIODS) {
        const startBlock = startBlocks[period];
        const periodTxs = wd.txs.filter((tx) => tx.blockNumber >= startBlock);

        const contractMap: Record<string, { count: number; methods: Record<string, number> }> = {};
        for (const tx of periodTxs) {
          if (!tx.to || tx.to === wallet.address.toLowerCase()) continue;
          if (!contractMap[tx.to]) {
            contractMap[tx.to] = { count: 0, methods: {} };
          }
          contractMap[tx.to].count++;
          const method = tx.functionName || tx.methodId || "unknown";
          contractMap[tx.to].methods[method] = (contractMap[tx.to].methods[method] || 0) + 1;
        }

        const topContracts = Object.entries(contractMap)
          .map(([addr, stats]) => {
            const info = getContractName(addr);
            const topMethod = Object.entries(stats.methods).sort((a, b) => b[1] - a[1])[0];
            return {
              address: addr,
              name: info.name,
              category: info.category,
              is_unknown: info.is_unknown,
              tx_count: stats.count,
              top_method: topMethod ? topMethod[0] : "",
            };
          })
          .sort((a, b) => b.tx_count - a.tx_count)
          .slice(0, 20);

        writeCache(`wallet_${wallet.address}_${period}`, {
          address: wallet.address,
          name: wallet.name,
          tier: wallet.tier,
          tier_v2: wallet.tier_v2,
          badges: wallet.badges,
          streaming: wallet.streaming,
          portal_link: wallet.portal_link,
          total_tx_count: totalTxCounts[wi],
          period_tx_count: periodTxs.length,
          period,
          top_contracts: topContracts,
        });
      }
    }

    const durationMs = Date.now() - startTime;
    const durationMin = (durationMs / 60000).toFixed(1);
    writeCache("meta", {
      last_prefetch: new Date().toISOString(),
      wallets_count: allTxData.length,
      periods: [...PERIODS],
      tiers: [...PREFETCH_TIERS],
      duration_ms: durationMs,
    });

    console.log(`[prefetch] Complete in ${durationMin} min`);
    return {
      success: true,
      stats: {
        wallets: allTxData.length,
        rankings_cached: PERIODS.length * (PREFETCH_TIERS.length + 1),
        wallet_detail_cached: detailWallets.length * PERIODS.length,
        duration_ms: durationMs,
      },
    };
  } catch (error) {
    console.error("[prefetch] Error:", error);
    return { success: false, error: String(error) };
  }
}
