const EXPLORER_API = "https://block-explorer-api.mainnet.abs.xyz/api";
const RPC_URL = "https://api.mainnet.abs.xyz";

const FETCH_TIMEOUT = 10_000;

function fetchWithTimeout(url: string, options?: RequestInit, timeoutMs = FETCH_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal, cache: "no-store" as RequestCache })
    .finally(() => clearTimeout(timer));
}

interface RawTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  input: string;
  blockNumber: string;
  timeStamp: string;
  methodId: string;
  functionName: string;
  isError: string;
  contractAddress: string | null;
}

export async function getCurrentBlock(): Promise<number> {
  const res = await fetchWithTimeout(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 }),
  });
  const data = await res.json();
  return parseInt(data.result, 16);
}

export async function getBlockTimestamp(blockNumber: number): Promise<number> {
  const hex = "0x" + blockNumber.toString(16);
  const res = await fetchWithTimeout(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getBlockByNumber", params: [hex, false], id: 1 }),
  });
  const data = await res.json();
  return parseInt(data.result.timestamp, 16);
}

export async function getTxCount(address: string): Promise<number> {
  const res = await fetchWithTimeout(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getTransactionCount", params: [address, "latest"], id: 1 }),
  });
  const data = await res.json();
  return parseInt(data.result, 16);
}

export async function fetchTransactions(
  address: string,
  startBlock: number,
  endBlock: number = 99999999
): Promise<RawTx[]> {
  const BATCH = 1000;
  const MAX_BATCHES = 100;
  const allTxs: RawTx[] = [];
  let curEnd = endBlock;

  for (let i = 0; i < MAX_BATCHES; i++) {
    try {
      const url = `${EXPLORER_API}?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${curEnd}&sort=desc&page=1&offset=${BATCH}`;
      const res = await fetchWithTimeout(url, undefined, 15_000);
      const data = await res.json();
      if (data.status === "1" && Array.isArray(data.result) && data.result.length > 0) {
        allTxs.push(...data.result);
        if (data.result.length < BATCH) break;
        const lastBlock = parseInt(data.result[data.result.length - 1].blockNumber, 10);
        curEnd = lastBlock - 1;
        if (curEnd < startBlock) break;
      } else {
        break;
      }
    } catch {
      console.warn(`fetchTransactions batch ${i + 1} timeout/error for ${address.slice(0, 10)}`);
      break;
    }
  }

  return allTxs;
}

export async function getContractInfo(address: string): Promise<{ name: string; verified: boolean }> {
  try {
    const url = `${EXPLORER_API}?module=contract&action=getsourcecode&address=${address}`;
    const res = await fetchWithTimeout(url);
    const data = await res.json();
    if (data.status === "1" && Array.isArray(data.result) && data.result.length > 0) {
      const name = data.result[0].ContractName || "";
      return { name, verified: name.length > 0 };
    }
  } catch {
    console.warn(`getContractInfo timeout/error for ${address.slice(0, 10)}`);
  }
  return { name: "", verified: false };
}

const BLOCKS_PER_SECOND = 3.52;

export function blocksForDays(days: number): number {
  return Math.floor(days * 86400 * BLOCKS_PER_SECOND);
}

export function periodToBlocks(period: string, currentBlock: number): number {
  switch (period) {
    case "1d": return currentBlock - blocksForDays(1);
    case "7d": return currentBlock - blocksForDays(7);
    case "14d": return currentBlock - blocksForDays(14);
    case "30d": return currentBlock - blocksForDays(30);
    default: return currentBlock - blocksForDays(7);
  }
}
