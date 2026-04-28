const API = "https://block-explorer-api.mainnet.abs.xyz/api";
const RPC = "https://api.mainnet.abs.xyz";
const BLOCKS_PER_SEC = 3.52;

async function getCurrentBlock() {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
  });
  const d = await res.json();
  return parseInt(d.result, 16);
}

async function fetchTxs(address, startBlock) {
  const all = [];
  let curEnd = 99999999;
  for (let i = 0; i < 200; i++) {
    const url = `${API}?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${curEnd}&sort=desc&page=1&offset=1000`;
    const res = await fetch(url);
    const d = await res.json();
    if (d.status === "1" && d.result?.length > 0) {
      all.push(...d.result);
      if (d.result.length < 1000) break;
      const lastBlock = parseInt(d.result[d.result.length - 1].blockNumber, 10);
      curEnd = lastBlock - 1;
      if (curEnd < startBlock) break;
      process.stdout.write(`  batch ${i + 1}: ${all.length} txs so far\r`);
    } else break;
  }
  return all;
}

async function getTxCount(address) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getTransactionCount", params: [address, "latest"], id: 1 }),
  });
  const d = await res.json();
  return parseInt(d.result, 16);
}

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
const customWallets = JSON.parse(readFileSync(join(dataDir, "custom-wallets.json"), "utf-8"));

async function main() {
  const currentBlock = await getCurrentBlock();
  console.log("Current block:", currentBlock);

  const periods = {
    "1d": currentBlock - Math.floor(1 * 86400 * BLOCKS_PER_SEC),
    "7d": currentBlock - Math.floor(7 * 86400 * BLOCKS_PER_SEC),
  };

  const results = {};

  for (const w of customWallets) {
    console.log(`\nFetching ${w.name} (${w.address.slice(0, 10)}...)...`);
    const totalTx = await getTxCount(w.address);
    console.log(`  Total tx count: ${totalTx}`);

    const txs7d = await fetchTxs(w.address, periods["7d"]);
    console.log(`  7d txs: ${txs7d.length}`);

    const contractMap = {};
    for (const tx of txs7d) {
      const to = (tx.to || "").toLowerCase();
      if (!to || to === w.address.toLowerCase()) continue;
      if (!contractMap[to]) contractMap[to] = { count: 0, methods: {} };
      contractMap[to].count++;
      const method = tx.functionName || tx.methodId || "unknown";
      contractMap[to].methods[method] = (contractMap[to].methods[method] || 0) + 1;
    }

    const topContracts = Object.entries(contractMap)
      .map(([addr, stats]) => {
        const topMethod = Object.entries(stats.methods).sort((a, b) => b[1] - a[1])[0];
        return { address: addr, tx_count: stats.count, top_method: topMethod ? topMethod[0] : "" };
      })
      .sort((a, b) => b.tx_count - a.tx_count)
      .slice(0, 20);

    const tx1d = txs7d.filter(tx => parseInt(tx.blockNumber, 10) >= periods["1d"]);

    results[w.address.toLowerCase()] = {
      address: w.address.toLowerCase(),
      name: w.name,
      tier: w.tier,
      total_tx_count: totalTx,
      "1d": { tx_count: tx1d.length },
      "7d": { tx_count: txs7d.length, top_contracts: topContracts },
    };
  }

  writeFileSync(join(dataDir, "custom-wallet-cache.json"), JSON.stringify(results, null, 2));
  console.log("\nSaved to data/custom-wallet-cache.json");
}

main().catch(console.error);
