"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TierBadge } from "@/components/tier-badge";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

interface WalletRank {
  address: string;
  name: string;
  tier: string;
  tx_count: number;
}

const PAGE_SIZE = 100;

export default function FullRankingPageWrapper() {
  return <Suspense><FullRankingPage /></Suspense>;
}

function FullRankingPage() {
  const [wallets, setWallets] = useState<WalletRank[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const [page, setPageState] = useState(pageParam || 1);
  const { lang } = useLang();

  function setPage(p: number) {
    setPageState(p);
    router.replace(`/tiers?page=${p}`, { scroll: false });
  }

  useEffect(() => {
    fetch("/api/rankings?period=7d&tier=all")
      .then((res) => res.json())
      .then((d) => {
        setWallets(d.wallet_ranking || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return wallets;
    const q = search.trim().toLowerCase();
    return wallets.filter(
      (w) => w.name.toLowerCase().includes(q) || w.address.toLowerCase().includes(q)
    );
  }, [wallets, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageWallets = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  const tierColor: Record<string, string> = {
    Obsidian: "text-purple-400",
    Diamond: "text-cyan-400",
    Platinum: "text-gray-400",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("tiers.title", lang)}</h1>
        <p className="text-gray-500">{t("tiers.subtitle", lang)}</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("tiers.searchPlaceholder", lang)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder:text-gray-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {filtered.length.toLocaleString()}{lang === "ko" ? "명" : " wallets"}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
          <span className="ml-3 text-gray-400">{t("tiers.loading", lang)}</span>
        </div>
      ) : (
        <>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-4">
              <div className="flex items-center px-3 py-2 border-b border-gray-800 text-xs text-gray-500">
                <span className="w-10 text-right mr-3">#</span>
                <span className="w-20 mr-3">{lang === "ko" ? "티어" : "Tier"}</span>
                <span className="flex-1">{lang === "ko" ? "닉네임" : "Nickname"}</span>
                <span className="text-right">{lang === "ko" ? "트랜잭션" : "Txs"}</span>
              </div>
              <div className="space-y-1">
                {pageWallets.map((w) => {
                  const globalIdx = wallets.indexOf(w);
                  const rank = globalIdx !== -1 ? globalIdx + 1 : "-";
                  return (
                    <Link
                      key={w.address}
                      href={`/wallet/${w.address}`}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-800/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-gray-600 w-10 text-right">{rank}</span>
                        <TierBadge tier={w.tier} />
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                          {w.name.startsWith("0x") ? `${w.name.slice(0, 6)}...${w.name.slice(-4)}` : w.name}
                        </span>
                      </div>
                      <span className="text-sm font-mono text-gray-500">
                        {w.tx_count >= 100000 ? "100,000+" : w.tx_count.toLocaleString()}
                      </span>
                    </Link>
                  );
                })}
                {pageWallets.length === 0 && (
                  <p className="text-center py-8 text-gray-500">
                    {lang === "ko" ? "검색 결과가 없습니다" : "No results found"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      p === currentPage
                        ? "bg-pink-600 text-white"
                        : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
