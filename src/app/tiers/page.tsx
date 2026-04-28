"use client";

import { useState, useEffect, useMemo, useCallback, Suspense, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/tier-badge";
import { PeriodSelector } from "@/components/period-selector";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight, Trophy, Medal, TrendingUp, Hash, X, Clock, ExternalLink, Copy, Check } from "lucide-react";
import { Period } from "@/lib/types";
import { CATEGORY_COLORS, getContractName } from "@/lib/data";
import { useLang } from "@/lib/language-context";
import { t, tCat } from "@/lib/i18n";
import { useSearchParams, useRouter } from "next/navigation";

interface WalletRank {
  address: string;
  name: string;
  tier: string;
  tx_count: number;
}

interface NearbyWallet {
  address: string;
  name: string;
  tier: string;
  tx_count: number;
  rank: number;
  isTarget: boolean;
}

interface TopContract {
  contract_address: string;
  contract_name: string;
  category: string;
  is_unknown: boolean;
  tx_count: number;
  top_method: string;
}

interface RankResult {
  found: boolean;
  wallet?: {
    address: string;
    name: string;
    tier: string;
    badges: number;
    streaming: boolean;
    portal_link?: string;
  };
  period: string;
  overall_rank: number | null;
  overall_total: number;
  tier_rank: number | null;
  tier_total: number;
  period_tx_count: number;
  total_tx_count: number;
  top_percent: number | null;
  nearby: NearbyWallet[];
  top_contracts: TopContract[];
}

const PAGE_SIZE = 100;

export default function FullRankingPageWrapper() {
  return <Suspense><FullRankingPage /></Suspense>;
}

function FullRankingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lang } = useLang();

  // Full ranking state
  const [wallets, setWallets] = useState<WalletRank[]>([]);
  const [rankLoading, setRankLoading] = useState(true);
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const [page, setPageState] = useState(pageParam || 1);

  // Rank search state
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [period, setPeriodState] = useState<Period>((searchParams.get("period") as Period) || "7d");
  const [rankResult, setRankResult] = useState<RankResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  function setPage(p: number) {
    setPageState(p);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.replace(`/tiers?${params.toString()}`, { scroll: false });
  }

  function setPeriod(p: Period) {
    setPeriodState(p);
    if (query.trim()) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("q", query.trim());
      params.set("period", p);
      router.replace(`/tiers?${params.toString()}`, { scroll: false });
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("rank_history");
    if (saved) setHistory(JSON.parse(saved));
    const initQ = searchParams.get("q");
    if (initQ) doSearch(initQ);
  }, []);

  useEffect(() => {
    fetch("/api/rankings?period=7d&tier=all")
      .then((res) => res.json())
      .then((d) => {
        setWallets(d.wallet_ranking || []);
        setRankLoading(false);
      })
      .catch(() => setRankLoading(false));
  }, []);

  function saveHistory(q: string) {
    const trimmed = q.trim();
    const updated = [trimmed, ...history.filter((h) => h.toLowerCase() !== trimmed.toLowerCase())].slice(0, 10);
    setHistory(updated);
    localStorage.setItem("rank_history", JSON.stringify(updated));
  }

  function removeHistory(q: string) {
    const updated = history.filter((h) => h !== q);
    setHistory(updated);
    localStorage.setItem("rank_history", JSON.stringify(updated));
  }

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setSearchLoading(true);
    setSearched(true);
    saveHistory(q);
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", q.trim());
    params.set("period", period);
    router.replace(`/tiers?${params.toString()}`, { scroll: false });
    try {
      const res = await fetch(`/api/rank?q=${encodeURIComponent(q.trim())}&period=${period}`);
      const data = await res.json();
      setRankResult(data);
    } catch {
      setRankResult({ found: false } as RankResult);
    }
    setSearchLoading(false);
  }, [period, history]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    doSearch(query);
  }

  const filtered = useMemo(() => {
    if (!query.trim()) return wallets;
    const q = query.trim().toLowerCase();
    return wallets.filter(
      (w) => w.name.toLowerCase().includes(q) || w.address.toLowerCase().includes(q)
    );
  }, [wallets, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageWallets = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setPageState(1); }, [query]);

  const tierColor: Record<string, string> = {
    Obsidian: "from-purple-600 to-purple-800",
    Diamond: "from-cyan-500 to-cyan-700",
    Platinum: "from-gray-400 to-gray-600",
    Gold: "from-yellow-500 to-yellow-700",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header + Search */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-7 w-7 text-yellow-400" />
          <h1 className="text-2xl font-bold text-white">{t("tiers.title", lang)}</h1>
        </div>

        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex gap-2 items-stretch">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("rank.placeholder", lang)}
                className="w-full h-full pl-10 pr-9 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder:text-gray-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setSearched(false); setRankResult(null); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <PeriodSelector value={period} onChange={setPeriod} />
            <button
              type="submit"
              disabled={searchLoading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {searchLoading ? "..." : t("rank.search", lang)}
            </button>
          </div>
        </form>

        {history.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Clock className="h-4 w-4 text-gray-600 mt-0.5" />
            {history.map((h) => (
              <button
                key={h}
                className="group flex items-center gap-1 px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
              >
                <span onClick={() => doSearch(h)}>{h}</span>
                <X
                  className="h-3 w-3 text-gray-600 hover:text-red-400 transition-colors"
                  onClick={(e) => { e.stopPropagation(); removeHistory(h); }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search Result */}
      {searchLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
        </div>
      )}

      {!searchLoading && searched && rankResult && !rankResult.found && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-8 text-center">
            <p className="text-gray-400">{t("rank.notFound", lang)}</p>
            <p className="text-gray-600 text-sm mt-2">
              {lang === "ko"
                ? "닉네임 또는 0x 주소를 정확히 입력해주세요"
                : "Please enter an exact nickname or 0x address"}
            </p>
          </CardContent>
        </Card>
      )}

      {!searchLoading && rankResult?.found && rankResult.wallet && (
        <div className="space-y-4">
          {/* Profile + Rank Card */}
          <Card className={`bg-gradient-to-br ${tierColor[rankResult.wallet.tier] || "from-gray-600 to-gray-800"} border-0 overflow-hidden`}>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">{rankResult.wallet.name}</h2>
                    <TierBadge tier={rankResult.wallet.tier} />
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-white/60 text-sm font-mono">
                      {rankResult.wallet.address.slice(0, 10)}...{rankResult.wallet.address.slice(-6)}
                    </p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(rankResult.wallet!.address);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                      className="text-white/40 hover:text-white/80 transition-colors"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <a
                      href={rankResult.wallet.portal_link || `https://portal.abs.xyz/profile/${rankResult.wallet.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Portal
                    </a>
                    <a
                      href={`https://abscan.org/address/${rankResult.wallet.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Abscan
                    </a>
                  </div>
                </div>
                {rankResult.overall_rank && (
                  <div className="text-right">
                    <div className="text-5xl font-black text-white/90">
                      #{rankResult.overall_rank}
                    </div>
                    <p className="text-white/50 text-sm">
                      / {rankResult.overall_total} {t("rank.outOf", lang)}
                    </p>
                    {rankResult.top_percent !== null && (() => {
                      const pct = rankResult.top_percent;
                      const color =
                        pct <= 1 ? "bg-red-500 text-white" :
                        pct <= 3 ? "bg-pink-500 text-white" :
                        pct <= 5 ? "bg-orange-500 text-white" :
                        pct <= 10 ? "bg-yellow-500 text-black" :
                        pct <= 20 ? "bg-green-500 text-white" :
                        pct <= 50 ? "bg-blue-500 text-white" :
                        "bg-white/20 text-white";
                      return (
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
                          {t("rank.topPercent", lang)} {pct}%
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-3 text-center">
                <Hash className="h-4 w-4 text-pink-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">{t("rank.overall", lang)}</p>
                <p className="text-lg font-bold text-white">
                  {rankResult.overall_rank ? `#${rankResult.overall_rank}` : "-"}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-3 text-center">
                <Medal className="h-4 w-4 text-cyan-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">{t("rank.tierRank", lang)}</p>
                <p className="text-lg font-bold text-white">
                  {rankResult.tier_rank ? `#${rankResult.tier_rank}` : "-"}
                  <span className="text-xs text-gray-600 ml-1">/ {rankResult.tier_total}</span>
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-3 text-center">
                <TrendingUp className="h-4 w-4 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">{t("rank.txCount", lang).replace("{period}", t(`period.${period}`, lang))}</p>
                <p className="text-lg font-bold text-white">
                  {rankResult.period_tx_count >= 100000 ? "100,000+" : rankResult.period_tx_count.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-3 text-center">
                <Trophy className="h-4 w-4 text-yellow-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">{t("rank.totalTx", lang)}</p>
                <p className="text-lg font-bold text-white">
                  {rankResult.total_tx_count.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top dApps */}
          {rankResult.top_contracts && rankResult.top_contracts.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-gray-200">{t("rank.topDapps", lang)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {rankResult.top_contracts.map((c, i) => {
                    const total = rankResult.top_contracts.reduce((s, cc) => s + cc.tx_count, 0);
                    const pct = total > 0 ? (c.tx_count / total) * 100 : 0;
                    const info = getContractName(c.contract_address, lang);
                    const color = CATEGORY_COLORS[info.category] || CATEGORY_COLORS.Unknown;
                    return (
                      <div key={c.contract_address} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                        <span className="text-sm font-mono text-gray-600 w-6 text-right">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium truncate ${info.is_unknown ? "text-gray-500" : "text-white"}`}>
                              {info.name}
                            </span>
                            <Badge variant="outline" className="text-[10px] shrink-0" style={{ borderColor: color, color }}>
                              {tCat(info.category, lang)}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                            </div>
                            <span className="text-xs text-gray-500 w-20 text-right">
                              {c.tx_count.toLocaleString()} txs
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No ranking data notice */}
          {!rankResult.overall_rank && (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-6 text-center">
                {rankResult.wallet.tier === "Platinum" && (period === "14d" || period === "30d") ? (
                  <>
                    <p className="text-gray-400">
                      {lang === "ko"
                        ? "Platinum 티어는 1일, 7일 데이터만 지원됩니다"
                        : "Platinum tier only supports 1-day and 7-day data"}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      {lang === "ko"
                        ? "기간을 1일 또는 7일로 변경해주세요"
                        : "Please change the period to 1d or 7d"}
                    </p>
                  </>
                ) : rankResult.wallet.tier === "Gold" ? (
                  <>
                    <p className="text-gray-400">
                      {lang === "ko"
                        ? "Gold 티어의 순위 데이터는 지원되지 않습니다"
                        : "Ranking data for Gold tier is not available"}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      {lang === "ko"
                        ? "현재 Obsidian, Diamond, Platinum 티어만 순위 지원"
                        : "Currently only Obsidian, Diamond, and Platinum tiers are ranked"}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-400">
                    {lang === "ko"
                      ? `${rankResult.wallet.tier} 티어의 순위 데이터를 찾을 수 없습니다`
                      : `Ranking data for ${rankResult.wallet.tier} tier not found`}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Divider */}
      {searched && rankResult?.found && (
        <div className="border-t border-gray-800" />
      )}

      {/* Full Ranking Table */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {filtered.length.toLocaleString()}{lang === "ko" ? "명" : " wallets"}
        </div>

        {rankLoading ? (
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
                      <div
                        key={w.address}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
                        onClick={() => { doSearch(w.name); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-gray-600 w-10 text-right">{rank}</span>
                          <TierBadge tier={w.tier} />
                          <span className="text-sm text-gray-300 hover:text-white transition-colors">
                            {w.name.startsWith("0x") ? `${w.name.slice(0, 6)}...${w.name.slice(-4)}` : w.name}
                          </span>
                        </div>
                        <span className="text-sm font-mono text-gray-500">
                          {w.tx_count >= 100000 ? "100,000+" : w.tx_count.toLocaleString()}
                        </span>
                      </div>
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
    </div>
  );
}
