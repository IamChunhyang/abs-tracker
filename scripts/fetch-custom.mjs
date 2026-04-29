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
  for (let i = 0; i < 500; i++) {
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

function buildTopContracts(txs, walletAddr) {
  const contractMap = {};
  for (const tx of txs) {
    const to = (tx.to || "").toLowerCase();
    if (!to || to === walletAddr) continue;
    if (!contractMap[to]) contractMap[to] = { count: 0, methods: {} };
    contractMap[to].count++;
    const method = tx.functionName || tx.methodId || "unknown";
    contractMap[to].methods[method] = (contractMap[to].methods[method] || 0) + 1;
  }
  return Object.entries(contractMap)
    .map(([addr, stats]) => {
      const topMethod = Object.entries(stats.methods).sort((a, b) => b[1] - a[1])[0];
      return { address: addr, tx_count: stats.count, top_method: topMethod ? topMethod[0] : "" };
    })
    .sort((a, b) => b.tx_count - a.tx_count)
    .slice(0, 20);
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

  const periodBlocks = {
    "1d": currentBlock - Math.floor(1 * 86400 * BLOCKS_PER_SEC),
    "7d": currentBlock - Math.floor(7 * 86400 * BLOCKS_PER_SEC),
    "14d": currentBlock - Math.floor(14 * 86400 * BLOCKS_PER_SEC),
    "30d": currentBlock - Math.floor(30 * 86400 * BLOCKS_PER_SEC),
  };

  let existing = {};
  try {
    existing = JSON.parse(readFileSync(join(dataDir, "custom-wallet-cache.json"), "utf-8"));
  } catch {}

  const forceAll = process.argv.includes("--force");
  const results = { ...existing };

  for (const w of customWallets) {
    const key = w.address.toLowerCase();
    if (!forceAll && existing[key]) {
      console.log(`\nSkipping ${w.name} (already cached)`);
      continue;
    }
    console.log(`\nFetching ${w.name} (${w.address.slice(0, 10)}...)...`);
    const totalTx = await getTxCount(w.address);
    console.log(`  Total tx count: ${totalTx}`);

    const txs30d = await fetchTxs(w.address, periodBlocks["30d"]);
    console.log(`\n  30d txs: ${txs30d.length}`);

    const txs14d = txs30d.filter(tx => parseInt(tx.blockNumber, 10) >= periodBlocks["14d"]);
    const txs7d = txs30d.filter(tx => parseInt(tx.blockNumber, 10) >= periodBlocks["7d"]);
    const txs1d = txs30d.filter(tx => parseInt(tx.blockNumber, 10) >= periodBlocks["1d"]);
    console.log(`  14d: ${txs14d.length}, 7d: ${txs7d.length}, 1d: ${txs1d.length}`);

    results[key] = {
      address: key,
      name: w.name,
      tier: w.tier,
      total_tx_count: totalTx,
      "1d": { tx_count: txs1d.length },
      "7d": { tx_count: txs7d.length, top_contracts: buildTopContracts(txs7d, key) },
      "14d": { tx_count: txs14d.length, top_contracts: buildTopContracts(txs14d, key) },
      "30d": { tx_count: txs30d.length, top_contracts: buildTopContracts(txs30d, key) },
    };
  }

  writeFileSync(join(dataDir, "custom-wallet-cache.json"), JSON.stringify(results, null, 2));
  console.log("\nSaved to data/custom-wallet-cache.json");
}

main().catch(console.error);
