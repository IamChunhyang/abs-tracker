import { NextRequest, NextResponse } from "next/server";
import { loadAllWallets, getTierCounts, TIER_ORDER } from "@/lib/load-wallets";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const tier = request.nextUrl.searchParams.get("tier");
  const search = request.nextUrl.searchParams.get("q")?.toLowerCase();

  if (!tier && !search) {
    return NextResponse.json({
      tiers: TIER_ORDER,
      counts: getTierCounts(),
    });
  }

  let wallets = loadAllWallets();

  if (tier && tier !== "all") {
    wallets = wallets.filter((w) => w.tier === tier);
  }

  if (search) {
    wallets = wallets.filter(
      (w) => w.name.toLowerCase().includes(search) || w.address.includes(search)
    );
  }

  return NextResponse.json({
    total: wallets.length,
    wallets: wallets.slice(0, 200).map((w) => ({
      address: w.address,
      name: w.name,
      tier: w.tier,
      badges: w.badges,
    })),
  });
}
