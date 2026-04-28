import { getCurrentBlock, fetchTransactions, periodToBlocks, getTxCount } from "../src/lib/abstract-api";
import { getContractName } from "../src/lib/data";
import { loadAllWallets } from "../src/lib/load-wallets";
import { readCache, writeCache } from "../src/lib/cache";

const CAPPED_ADDRESSES = [
  "0xfc61f1b7701f6765ff548b3bca403cdaa723d260",
  "0x164cb4eacf03e4635f7c040d28e2fb2f129bb462",
  "0xabf793be9dbc4c6fb90485552dd223d242166984",
  "0xb5748a472adfa371244cdc5a0a13189410cf8097",
  "0x6052354efe95df428da38efa36be764d3eea6bdb",
  "0xda2ca34d57242cbe18f3046925645668b9e60292",
  "0x7390022cbff03b8501084ca8fa72cdb932a415d6",
];

const PERIODS = ["1d", "7d", "14d", "30d"] as const;

async function main() {
  console.log(`=== Re-fetching ${CAPPED_ADDRESSES.length} capped wallets ===`);
  const allWallets = loadAllWallets();
  const currentBlock = await getCurrentBlock();
  const startBlocks: Record<string, number> = {};
  for (const p of PERIODS) {
    startBlocks[p] = periodToBlocks(p, currentBlock);
  }

  for (const address of CAPPED_ADDRESSES) {
    const wallet = allWallets.find((w) => w.address.toLowerCase() === address.toLowerCase());
    console.log(`\nFetching ${wallet?.name || address}...`);
    const start = Date.now();

    const txs = await fetchTransactions(address, startBlocks["30d"]);
    const mapped = txs.map((tx: any) => ({
      to: (tx.to || "").toLowerCase(),
      blockNumber: parseInt(tx.blockNumber, 10),
      functionName: tx.functionName || "",
      methodId: tx.methodId || "",
    }));

    console.log(`  Got ${mapped.length} txs in ${((Date.now() - start) / 1000).toFixed(0)}s`);

    // Update wallet detail caches
    if (wallet) {
      const totalTxCount = await getTxCount(address).catch(() => 0);

      for (const period of PERIODS) {
        const startBlock = startBlocks[period];
        const periodTxs = mapped.filter((tx) => tx.blockNumber >= startBlock);

        const contractMap: Record<string, { count: number; methods: Record<string, number> }> = {};
        for (const tx of periodTxs) {
          if (!tx.to || tx.to === address.toLowerCase()) continue;
          if (!contractMap[tx.to]) contractMap[tx.to] = { count: 0, methods: {} };
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

        writeCache(`wallet_${address}_${period}`, {
          address,
          name: wallet.name,
          tier: wallet.tier,
          tier_v2: wallet.tier_v2,
          badges: wallet.badges,
          streaming: wallet.streaming,
          portal_link: wallet.portal_link,
          total_tx_count: totalTxCount,
          period_tx_count: periodTxs.length,
          period,
          top_contracts: topContracts,
        });
      }
    }

    // Update rankings caches
    for (const period of PERIODS) {
      for (const tier of ["Diamond", "all"]) {
        const cacheKey = `rankings_${period}_${tier}`;
        const cached = readCache<any>(cacheKey, Infinity);
        if (!cached) continue;

        const wr = cached.wallet_ranking?.find((w: any) => w.address.toLowerCase() === address.toLowerCase());
        if (wr) {
          const periodTxs = mapped.filter((tx) => tx.blockNumber >= startBlocks[period]);
          wr.tx_count = periodTxs.length;
          cached.wallet_ranking.sort((a: any, b: any) => b.tx_count - a.tx_count);
          writeCache(cacheKey, cached);
          console.log(`  Updated ${cacheKey}: ${wr.name} → ${periodTxs.length} txs`);
        }
      }
    }
  }

  console.log("\n=== Done ===");
}

main();
