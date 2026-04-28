"use client";

import { useState, useEffect, Suspense } from "react";
import { StatsCards } from "@/components/stats-cards";
import { RankingTable } from "@/components/ranking-table";
import { PeriodSelector } from "@/components/period-selector";
import { WalletSearch } from "@/components/wallet-search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Period, RankingEntry } from "@/lib/types";
import { isKoreanUser, getContractName } from "@/lib/data";
import { useLang } from "@/lib/language-context";
import { t, tCat } from "@/lib/i18n";
import { useSearchParams, useRouter } from "next/navigation";

interface ApiResponse {
  period: string;
  tier: string;
  total_wallets: number;
  rankings: RankingEntry[];
  wallet_ranking: { address: string; name: string; tier: string; tx_count: number }[];
  category_breakdown: Record<string, number>;
}

export default function DashboardPage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [period, setPeriodState] = useState<Period>((searchParams.get("period") as Period) || "7d");
  const [tier, setTierState] = useState(searchParams.get("tier") || "Obsidian");

  function setPeriod(p: Period) {
    setPeriodState(p);
    setWalletPage(0);
    router.replace(`/?tier=${tier}&period=${p}`, { scroll: false });
  }
  function setTier(t: string) {
    setTierState(t);
    setWalletPage(0);
    const newPeriod = (t === "Platinum" || t === "all") && (period === "14d" || period === "30d") ? "7d" : period;
    if (newPeriod !== period) setPeriodState(newPeriod as Period);
    router.replace(`/?tier=${t}&period=${newPeriod}`, { scroll: false });
  }
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [walletPage, setWalletPage] = useState(0);
  const { lang } = useLang();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/rankings?period=${period}&tier=${tier}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period, tier]);

  useEffect(() => {
    fetch("/api/meta")
      .then((res) => res.json())
      .then((d) => {
        if (d.cached && d.fetched_at) setLastUpdated(d.fetched_at);
      })
      .catch(() => {});
  }, []);

  const totalTxs = data?.rankings?.reduce((s, r) => s + r.tx_count, 0) || 0;
  const activeWallets = data?.wallet_ranking?.filter((w) => w.tx_count > 0).length || 0;
  const totalWallets = data?.total_wallets || 0;
  const activePct = totalWallets > 0 ? Math.round((activeWallets / totalWallets) * 100) : 0;
  const topEntry = data?.rankings?.[0];
  const topDapp = topEntry ? getContractName(topEntry.contract_address, lang).name : "-";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
              {t("dash.title", lang)}
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t("dash.subtitle", lang)}</p>
        </div>
      </div>

      <div className="rounded-xl border border-pink-500/20 bg-gray-900 -mt-2">
        <details>
          <summary className="flex items-center gap-3 p-4 cursor-pointer select-none">
            <div className="flex-1 min-w-0">
              <span className="text-sm text-pink-300 font-semibold">
                {lang === "ko"
                  ? "📌 트랜잭션 수와 관계없이 XP 효율 좋은 디앱 (4/29 기준)"
                  : "📌 XP-efficient dApps regardless of tx count (Apr 29)"}
              </span>
              <span className="text-[10px] text-gray-500 ml-2">{lang === "ko" ? "▼ 클릭해서 보기" : "▼ Click to view"}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <a
                href={lang === "ko" ? "https://t.me/Iam_Chunhyang/34" : "https://x.com/CryptoChunhyang"}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-pink-600/20 border border-pink-500/30 text-xs text-pink-300 hover:bg-pink-600/30 transition-colors font-medium whitespace-nowrap"
              >
                {lang === "ko" ? "🚀 초보 가이드" : "🚀 Beginner Guide"}
              </a>
              <a
                href={lang === "ko" ? "https://t.me/Iam_Chunhyang/419" : "https://x.com/CryptoChunhyang"}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-xs text-cyan-300 hover:bg-cyan-600/30 transition-colors font-medium whitespace-nowrap"
              >
                {lang === "ko" ? "🔄 복귀 유저" : "🔄 Returning"}
              </a>
            </div>
          </summary>
          <div className="px-4 pb-4 space-y-4">
            <div className="border-t border-gray-800 pt-3"></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <a href="https://mog.onchainheroes.xyz/" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-yellow-500/20 bg-yellow-950/10 p-3 block hover:border-yellow-500/40 transition-colors">
                <p className="text-sm font-semibold text-white hover:text-yellow-300 transition-colors">Maze of Gains (MOG) ↗</p>
                <p className="text-xs mt-1">
                  <span className="text-gray-400">{lang === "ko" ? "구슬 1000개 모으고" : "Collect 1000 marbles for"}</span>
                  <span className="text-pink-400 ml-1 font-medium">{lang === "ko" ? "4만 XP" : "~40K XP"}</span>
                </p>
              </a>
              <a href="https://shop.cosmo.fans/ko/shop/list" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-cyan-500/20 bg-cyan-950/10 p-3 block hover:border-cyan-500/40 transition-colors">
                <p className="text-sm font-semibold text-white hover:text-cyan-300 transition-colors">COSMO ({lang === "ko" ? "25장 구매" : "Buy 25"}) ↗</p>
                <p className="text-xs mt-1">
                  <span className="text-gray-400">{lang === "ko" ? "25장 구매시 약" : "Buy 25 for"}</span>
                  <span className="text-pink-400 ml-1 font-medium">{lang === "ko" ? "3만 XP" : "~30K XP"}</span>
                </p>
              </a>
              <a href="https://lobby.cambria.gg/" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-purple-500/20 bg-purple-950/10 p-3 block hover:border-purple-500/40 transition-colors">
                <p className="text-sm font-semibold text-white hover:text-purple-300 transition-colors">Cambria ↗</p>
                <p className="text-xs mt-1">
                  <span className="text-pink-400 font-medium">Top 100</span>
                  <span className="text-gray-400 ml-1">{lang === "ko" ? "내 순위권 들기" : "ranking goal"}</span>
                </p>
              </a>
              <a href="https://www.duper.gg/game" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-green-500/20 bg-green-950/10 p-3 block hover:border-green-500/40 transition-colors">
                <p className="text-sm font-semibold text-white hover:text-green-300 transition-colors">Duper ↗</p>
                <p className="text-xs mt-1">
                  <span className="text-gray-400">{lang === "ko" ? "출석 + 캐주얼 2판" : "Check-in + 2 games"}</span>
                  <span className="text-pink-400 ml-1 font-medium">{lang === "ko" ? "후 데일리 보상" : "then daily rewards"}</span>
                </p>
              </a>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-gray-800 sm:hidden">
              <a
                href={lang === "ko" ? "https://t.me/Iam_Chunhyang/34" : "https://x.com/CryptoChunhyang"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-pink-600/20 border border-pink-500/30 text-xs text-pink-300 hover:bg-pink-600/30 transition-colors font-medium"
              >
                {lang === "ko" ? "🚀 초보 가이드 입장 →" : "🚀 Beginner guide →"}
              </a>
              <a
                href={lang === "ko" ? "https://t.me/Iam_Chunhyang/419" : "https://x.com/CryptoChunhyang"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-xs text-cyan-300 hover:bg-cyan-600/30 transition-colors font-medium"
              >
                {lang === "ko" ? "🔄 복귀 유저 루틴 →" : "🔄 Returning routines →"}
              </a>
            </div>
          </div>
        </details>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Tabs value={tier} onValueChange={setTier}>
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="Obsidian" className="data-[state=active]:bg-purple-600/30 data-[state=active]:text-purple-300">
              Obsidian<span className="text-[10px] text-gray-500 ml-1">(13)</span>
            </TabsTrigger>
            <TabsTrigger value="Diamond" className="data-[state=active]:bg-cyan-600/30 data-[state=active]:text-cyan-300">
              Diamond<span className="text-[10px] text-gray-500 ml-1">(122)</span>
            </TabsTrigger>
            <TabsTrigger value="Platinum" className="data-[state=active]:bg-gray-500/30 data-[state=active]:text-gray-300">
              Platinum<span className="text-[10px] text-gray-500 ml-1">(1,464)</span>
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              {t("dash.allTiers", lang)}<span className="text-[10px] text-gray-500 ml-1">(1,599)</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <PeriodSelector
          value={period}
          onChange={setPeriod}
          periods={tier === "Platinum" || tier === "all" ? ["1d", "7d"] : undefined}
        />
        <div className="ml-auto">
          <WalletSearch />
        </div>
      </div>

      {(tier === "Platinum" || tier === "all") && (
        <p className="text-xs text-gray-500 -mt-3">
          {lang === "ko"
            ? "※ Platinum 티어는 데이터 수집 효율을 위해 최근 7일 데이터만 지원됩니다"
            : "※ Platinum tier only supports up to 7-day data due to collection constraints"}
        </p>
      )}

      <StatsCards
        totalTxs={totalTxs}
        totalWallets={totalWallets}
        topDapp={topDapp}
        activePct={activePct}
        loading={loading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-gray-200">{t("dash.dappRanking", lang)}</CardTitle>
          </CardHeader>
          <CardContent>
            <RankingTable rankings={data?.rankings || []} loading={loading} />
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-gray-200">{t("dash.walletActivity", lang)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-800 animate-pulse rounded" />
              ))
            ) : (
              <>
                {data?.wallet_ranking?.slice(walletPage * 50, (walletPage + 1) * 50).map((w, i) => {
                  const rank = walletPage * 50 + i;
                  const maxTx = data.wallet_ranking[0]?.tx_count || 1;
                  const pct = (w.tx_count / maxTx) * 100;
                  const tierColor =
                    w.tier === "Obsidian" ? "bg-purple-500" :
                    w.tier === "Diamond" ? "bg-cyan-500" :
                    w.tier === "Gold" ? "bg-yellow-500" : "bg-gray-500";

                  return (
                    <a key={w.address} href={`/wallet/${w.address}`} className="block group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600 w-5">{rank < 3 ? ["🥇", "🥈", "🥉"][rank] : rank + 1}</span>
                          <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                            {w.name.startsWith("0x") ? `${w.name.slice(0, 6)}...${w.name.slice(-4)}` : w.name}
                            {isKoreanUser(w.name) && " 🇰🇷"}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-gray-500">
                          {w.tx_count >= 100000 ? "100,000+" : w.tx_count.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${tierColor}`}
                          style={{ width: `${pct}%`, opacity: 0.7 }}
                        />
                      </div>
                    </a>
                  );
                })}
                {data?.wallet_ranking && data.wallet_ranking.length > 50 && (
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                    <button
                      onClick={() => setWalletPage((p) => Math.max(0, p - 1))}
                      disabled={walletPage === 0}
                      className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      &lt;
                    </button>
                    <span className="text-xs text-gray-500">
                      {walletPage * 50 + 1}–{Math.min((walletPage + 1) * 50, data.wallet_ranking.length)} / {data.wallet_ranking.length}
                    </span>
                    <button
                      onClick={() => setWalletPage((p) => p + 1)}
                      disabled={(walletPage + 1) * 50 >= data.wallet_ranking.length}
                      className="px-3 py-1.5 text-sm rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      &gt;
                    </button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>


      <p className="text-center text-xs text-gray-600">
        {lastUpdated && (
          <span>
            {t("dash.lastUpdated", lang)}: {new Date(lastUpdated).toLocaleDateString(lang === "ko" ? "ko-KR" : "en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            {" · "}
          </span>
        )}
        {t("dash.updateSchedule", lang)}
      </p>
    </div>
  );
}
