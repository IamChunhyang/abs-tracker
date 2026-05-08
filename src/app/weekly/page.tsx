"use client";

import { useState, useEffect, Suspense } from "react";
import { RankingTable } from "@/components/ranking-table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RankingEntry } from "@/lib/types";
import { useLang } from "@/lib/language-context";
import { t, Lang } from "@/lib/i18n";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronDown, Flame } from "lucide-react";

interface WeekInfo {
  week_start: string;
  week_end: string;
  fetched_at: string;
}

const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getWeekLabel(weekStart: string, lang: Lang): string {
  const date = new Date(weekStart + "T00:00:00");
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekOfMonth = Math.ceil(day / 7);

  if (lang === "ko") return `${month}월 ${weekOfMonth}주차`;
  if (lang === "en") return `${MONTH_NAMES_EN[month - 1]} W${weekOfMonth}`;
  if (lang === "zh") return `${month}月第${weekOfMonth}周`;
  return `${month}月第${weekOfMonth}週`;
}

function formatDateRange(weekStart: string, weekEnd: string): string {
  const s = new Date(weekStart + "T00:00:00");
  const e = new Date(weekEnd + "T00:00:00");
  return `${s.getMonth() + 1}/${s.getDate()} ~ ${e.getMonth() + 1}/${e.getDate()}`;
}

export default function WeeklyPageWrapper() {
  return <Suspense><WeeklyPage /></Suspense>;
}

function WeeklyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lang } = useLang();

  const [weeks, setWeeks] = useState<WeekInfo[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(searchParams.get("week") || "");
  const [tier, setTierState] = useState(searchParams.get("tier") || "all");
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [totalWallets, setTotalWallets] = useState(0);
  const [loading, setLoading] = useState(true);
  const [weeksLoading, setWeeksLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function setTier(t: string) {
    setTierState(t);
    const params = new URLSearchParams();
    if (selectedWeek) params.set("week", selectedWeek);
    params.set("tier", t);
    router.replace(`/weekly?${params.toString()}`, { scroll: false });
  }

  function selectWeek(week: string) {
    setSelectedWeek(week);
    setDropdownOpen(false);
    const params = new URLSearchParams();
    params.set("week", week);
    params.set("tier", tier);
    router.replace(`/weekly?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    setWeeksLoading(true);
    fetch("/api/weekly")
      .then((res) => res.json())
      .then((d) => {
        const wks: WeekInfo[] = d.weeks || [];
        setWeeks(wks);
        if (!selectedWeek && wks.length > 0) {
          setSelectedWeek(wks[0].week_start);
        }
        setWeeksLoading(false);
      })
      .catch(() => setWeeksLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedWeek) return;
    setLoading(true);
    fetch(`/api/weekly?week=${selectedWeek}&tier=${tier}`)
      .then((res) => res.json())
      .then((d) => {
        setRankings(d.rankings || []);
        setTotalWallets(d.total_wallets || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedWeek, tier]);

  const currentWeekInfo = weeks.find((w) => w.week_start === selectedWeek);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Flame className="h-6 w-6 text-orange-400" />
          {t("weekly.title", lang)}
        </h1>
        <p className="text-gray-500">{t("weekly.subtitle", lang)}</p>
      </div>

      {weeksLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
        </div>
      ) : weeks.length === 0 ? (
        <p className="text-center py-10 text-gray-500">{t("weekly.noData", lang)}</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-4">
            {/* Week selector */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white hover:bg-gray-800 transition-colors min-w-[220px]"
              >
                <Flame className="h-4 w-4 text-orange-400" />
                <span className="flex-1 text-left">
                  {currentWeekInfo
                    ? `${getWeekLabel(currentWeekInfo.week_start, lang)} (${formatDateRange(currentWeekInfo.week_start, currentWeekInfo.week_end)})`
                    : t("weekly.selectWeek", lang)}
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                  <div className="absolute top-full left-0 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                    {weeks.map((w) => (
                      <button
                        key={w.week_start}
                        onClick={() => selectWeek(w.week_start)}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          w.week_start === selectedWeek ? "bg-gray-800 text-orange-400" : "text-gray-300"
                        }`}
                      >
                        <div className="font-medium">{getWeekLabel(w.week_start, lang)}</div>
                        <div className="text-xs text-gray-500">{formatDateRange(w.week_start, w.week_end)}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Tier tabs */}
            <Tabs value={tier} onValueChange={setTier}>
              <TabsList className="bg-gray-900 border border-gray-800">
                <TabsTrigger value="all" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
                  {t("dash.allTiers", lang)}
                </TabsTrigger>
                <TabsTrigger value="Obsidian" className="data-[state=active]:bg-purple-600/30 data-[state=active]:text-purple-300">
                  Obsidian
                </TabsTrigger>
                <TabsTrigger value="Diamond" className="data-[state=active]:bg-cyan-600/30 data-[state=active]:text-cyan-300">
                  Diamond
                </TabsTrigger>
                <TabsTrigger value="Platinum" className="data-[state=active]:bg-gray-500/30 data-[state=active]:text-gray-300">
                  Platinum
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Stats summary */}
          {currentWeekInfo && !loading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">{t("stats.trackedWallets", lang)}</div>
                <div className="text-xl font-bold text-white">{totalWallets.toLocaleString()}</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">{t("stats.totalTxs", lang)}</div>
                <div className="text-xl font-bold text-white">
                  {rankings.reduce((sum, r) => sum + r.tx_count, 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">{t("stats.topDapp", lang)}</div>
                <div className="text-xl font-bold text-orange-400 truncate">
                  {rankings[0]?.contract_name || "-"}
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">dApps</div>
                <div className="text-xl font-bold text-white">{rankings.length}</div>
              </div>
            </div>
          )}

          {/* Rankings table */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg text-gray-200 flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-400" />
                {currentWeekInfo
                  ? `${getWeekLabel(currentWeekInfo.week_start, lang)} ${t("ranking.topDapps", lang)}`
                  : t("ranking.topDapps", lang)}
                {tier !== "all" && <span className="text-sm text-gray-500">— {tier}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RankingTable rankings={rankings} loading={loading} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
