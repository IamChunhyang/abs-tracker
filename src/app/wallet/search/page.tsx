"use client";

import { useState, useEffect } from "react";
import { WalletSearch } from "@/components/wallet-search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/tier-badge";
import { useLang } from "@/lib/language-context";
import { t, l } from "@/lib/i18n";
import Link from "next/link";

interface WalletItem {
  address: string;
  name: string;
  tier: string;
  badges: number;
}

const TIERS = ["Obsidian", "Diamond", "Platinum", "Gold"] as const;

export default function SearchPage() {
  const { lang } = useLang();
  const [tierCounts, setTierCounts] = useState<Record<string, number>>({});
  const [walletsByTier, setWalletsByTier] = useState<Record<string, WalletItem[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wallets")
      .then((res) => res.json())
      .then((d) => setTierCounts(d.counts || {}))
      .catch(() => {});

    Promise.all(
      TIERS.map((tier) =>
        fetch(`/api/wallets?tier=${tier}`)
          .then((res) => res.json())
          .then((d) => ({ tier, wallets: d.wallets as WalletItem[] }))
      )
    ).then((results) => {
      const map: Record<string, WalletItem[]> = {};
      for (const r of results) map[r.tier] = r.wallets;
      setWalletsByTier(map);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">{t("search.title", lang)}</h1>
        <p className="text-gray-500 mb-4">{t("search.subtitle", lang)}</p>
        <WalletSearch />
      </div>

      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-900 animate-pulse rounded-lg border border-gray-800" />
        ))
      ) : (
        TIERS.map((tier) => {
          const wallets = walletsByTier[tier] || [];
          const total = tierCounts[tier] || wallets.length;
          if (wallets.length === 0) return null;
          return (
            <Card key={tier} className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-gray-200">
                  <TierBadge tier={tier} />
                  <span>{total}{t("search.walletsCount", lang)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {wallets.map((w) => (
                    <Link
                      key={w.address}
                      href={`/wallet/${w.address}`}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors group"
                    >
                      <span className="text-sm text-gray-300 group-hover:text-white">{w.name}</span>
                      <span className="text-xs text-gray-600 font-mono">
                        {w.address.slice(0, 6)}...{w.address.slice(-4)}
                      </span>
                    </Link>
                  ))}
                  {total > wallets.length && (
                    <div className="px-3 py-2 text-xs text-gray-600">
                      +{total - wallets.length} {l({ ko: "더 보기", en: "more", zh: "更多", ja: "もっと見る" }, lang)}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
