"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/tier-badge";
import { PeriodSelector } from "@/components/period-selector";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Search, TrendingUp, Hash, X, Clock } from "lucide-react";
import { Period } from "@/lib/types";
import { CATEGORY_COLORS, getContractName } from "@/lib/data";
import { useLang } from "@/lib/language-context";
import { t, tCat } from "@/lib/i18n";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

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

export default function RankPageWrapper() {
  return <Suspense><RankPage /></Suspense>;
}

function RankPage() {
  const searchParams = useSearchParams();
  const routerRank = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [period, setPeriodState] = useState<Period>((searchParams.get("period") as Period) || "7d");
  const [result, setResult] = useState<RankResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const { lang } = useLang();

  function setPeriod(p: Period) {
    setPeriodState(p);
    if (query.trim()) routerRank.replace(`/rank?q=${encodeURIComponent(query.trim())}&period=${p}`, { scroll: false });
  }

  useEffect(() => {
    const saved = localStorage.getItem("rank_history");
    if (saved) setHistory(JSON.parse(saved));
    const initQ = searchParams.get("q");
    if (initQ) doSearch(initQ);
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
    setLoading(true);
    setSearched(true);
    saveHistory(q);
    routerRank.replace(`/rank?q=${encodeURIComponent(q.trim())}&period=${period}`, { scroll: false });
    try {
      const res = await fetch(`/api/rank?q=${encodeURIComponent(q.trim())}&period=${period}`);
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ found: false } as RankResult);
    }
    setLoading(false);
  }, [period, history]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    doSearch(query);
  }

  const tierColor: Record<string, string> = {
    Obsidian: "from-purple-600 to-purple-800",
    Diamond: "from-cyan-500 to-cyan-700",
    Platinum: "from-gray-400 to-gray-600",
    Gold: "from-yellow-500 to-yellow-700",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-400" />
          <h1 className="text-3xl font-bold text-white">{t("rank.title", lang)}</h1>
        </div>
        <p className="text-gray-500">{t("rank.subtitle", lang)}</p>
      </div>

      <form onSubmit={handleSearch} className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("rank.placeholder", lang)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder:text-gray-600 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
            />
          </div>
          <PeriodSelector value={period} onChange={setPeriod} />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "..." : t("rank.search", lang)}
          </button>
        </div>
      </form>

      {history.length > 0 && (
        <div className="flex flex-wrap gap-2 -mt-4">
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

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
        </div>
      )}

      {!loading && searched && result && !result.found && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400 text-lg">{t("rank.notFound", lang)}</p>
            <p className="text-gray-600 text-sm mt-2">
              {lang === "ko"
                ? "닉네임 또는 0x 주소를 정확히 입력해주세요"
                : "Please enter an exact nickname or 0x address"}
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && result?.found && result.wallet && (
        <div className="space-y-6">
          {/* Profile + Rank Card */}
          <Card className={`bg-gradient-to-br ${tierColor[result.wallet.tier] || "from-gray-600 to-gray-800"} border-0 overflow-hidden`}>
            <CardContent className="py-8">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">{result.wallet.name}</h2>
                    <TierBadge tier={result.wallet.tier} />
                  </div>
                  <p className="text-white/60 text-sm font-mono">
                    {result.wallet.address.slice(0, 10)}...{result.wallet.address.slice(-6)}
                  </p>
                </div>
                {result.overall_rank && (
                  <div className="text-right">
                    <div className="text-5xl font-black text-white/90">
                      #{result.overall_rank}
                    </div>
                    <p className="text-white/50 text-sm">
                      / {result.overall_total} {t("rank.outOf", lang)}
                    </p>
                    {result.top_percent !== null && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-medium">
                        {t("rank.topPercent", lang)} {result.top_percent}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-4 text-center">
                <Hash className="h-5 w-5 text-pink-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">{t("rank.overall", lang)}</p>
                <p className="text-xl font-bold text-white">
                  {result.overall_rank ? `#${result.overall_rank}` : "-"}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-4 text-center">
                <Medal className="h-5 w-5 text-cyan-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">{t("rank.tierRank", lang)}</p>
                <p className="text-xl font-bold text-white">
                  {result.tier_rank ? `#${result.tier_rank}` : "-"}
                  <span className="text-xs text-gray-600 ml-1">/ {result.tier_total}</span>
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-4 text-center">
                <TrendingUp className="h-5 w-5 text-green-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">{t("rank.txCount", lang)}</p>
                <p className="text-xl font-bold text-white">
                  {result.period_tx_count >= 100000 ? "100,000+" : result.period_tx_count.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-4 text-center">
                <Trophy className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">{t("rank.totalTx", lang)}</p>
                <p className="text-xl font-bold text-white">
                  {result.total_tx_count.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top dApps */}
          {result.top_contracts && result.top_contracts.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg text-gray-200">
                  {t("rank.topDapps", lang)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.top_contracts.map((c, i) => {
                    const total = result.top_contracts.reduce((s, cc) => s + cc.tx_count, 0);
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

          {/* Nearby Rankings */}
          {result.nearby.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg text-gray-200">{t("rank.nearby", lang)}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-[600px] overflow-y-auto" ref={(el) => {
                  if (el) {
                    const target = el.querySelector("[data-target]");
                    if (target) target.scrollIntoView({ block: "center" });
                  }
                }}>
                  {result.nearby.map((w) => (
                    <Link
                      key={w.address}
                      href={`/wallet/${w.address}`}
                      data-target={w.isTarget ? "true" : undefined}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                        w.isTarget
                          ? "bg-pink-600/20 border border-pink-500/30"
                          : "hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className={`text-sm font-mono w-8 ${w.isTarget ? "text-pink-300 font-bold" : "text-gray-500"}`}>
                          #{w.rank}
                        </span>
                        <TierBadge tier={w.tier} />
                        <span className={`text-sm ${w.isTarget ? "text-white font-semibold" : "text-gray-300"}`}>
                          {w.name}
                        </span>
                        {w.isTarget && (
                          <span className="text-xs text-pink-400 font-medium">
                            {t("rank.you", lang)}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-mono text-gray-500">
                        {w.tx_count >= 100000 ? "100,000+" : w.tx_count.toLocaleString()} txs
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* No ranking data notice */}
          {!result.overall_rank && (
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="py-8 text-center">
                {result.wallet.tier === "Platinum" && (period === "14d" || period === "30d") ? (
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
                ) : result.wallet.tier === "Gold" ? (
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
                  <>
                    <p className="text-gray-400">
                      {lang === "ko"
                        ? `${result.wallet.tier} 티어의 순위 데이터를 찾을 수 없습니다`
                        : `Ranking data for ${result.wallet.tier} tier not found`}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
