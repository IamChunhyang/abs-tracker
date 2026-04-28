import { NextRequest, NextResponse } from "next/server";
import { getTxCount } from "@/lib/abstract-api";
import { findWallet, loadAllWallets } from "@/lib/load-wallets";
import { readCache } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const rawAddress = request.nextUrl.searchParams.get("address");
  const period = request.nextUrl.searchParams.get("period") || "7d";

  if (!rawAddress) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  let address = rawAddress;

  if (!rawAddress.startsWith("0x")) {
    const q = rawAddress.toLowerCase();
    const wallet = loadAllWallets().find(
      (w) => w.name.toLowerCase() === q || w.name.toLowerCase().includes(q)
    );
    if (!wallet) {
      return NextResponse.json({ error: "not_found", name: rawAddress });
    }
    address = wallet.address;
  }

  // File cache (from weekly prefetch) — return full data immediately
  const fileCache = readCache<Record<string, unknown>>(`wallet_${address.toLowerCase()}_${period}`);
  if (fileCache) {
    if (Array.isArray(fileCache.top_contracts)) {
      fileCache.top_contracts = fileCache.top_contracts.slice(0, 10);
    }
    return NextResponse.json(fileCache);
  }

  const walletInfo = findWallet(address);

  let totalTxCount = 0;
  try { totalTxCount = await getTxCount(address); } catch {}

  // Try to get top contracts from any cached period
  let topContracts: { address: string; name: string; category: string; is_unknown: boolean; tx_count: number; top_method: string }[] = [];
  const periods = [period, "7d", "1d", "14d", "30d"];
  for (const p of periods) {
    const wc = readCache<{ top_contracts: typeof topContracts }>(`wallet_${address.toLowerCase()}_${p}`);
    if (wc?.top_contracts?.length) {
      topContracts = wc.top_contracts.slice(0, 10);
      break;
    }
  }

  const result = {
    address,
    name: walletInfo?.name || null,
    tier: walletInfo?.tier || null,
    tier_v2: walletInfo?.tier_v2 || null,
    badges: walletInfo?.badges || null,
    streaming: walletInfo?.streaming || null,
    portal_link: walletInfo?.portal_link || null,
    total_tx_count: totalTxCount,
    period,
    top_contracts: topContracts,
  };

  return NextResponse.json(result);
}
