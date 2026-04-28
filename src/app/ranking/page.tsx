"use client";

import { useState, useEffect, Suspense } from "react";
import { RankingTable } from "@/components/ranking-table";
import { PeriodSelector } from "@/components/period-selector";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Period, RankingEntry } from "@/lib/types";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";
import { useSearchParams, useRouter } from "next/navigation";

export default function RankingPageWrapper() {
  return <Suspense><RankingPage /></Suspense>;
}

function RankingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [period, setPeriodState] = useState<Period>((searchParams.get("period") as Period) || "7d");
  const [tier, setTierState] = useState(searchParams.get("tier") || "Obsidian");

  function setPeriod(p: Period) {
    setPeriodState(p);
    router.replace(`/ranking?tier=${tier}&period=${p}`, { scroll: false });
  }
  function setTier(t: string) {
    setTierState(t);
    router.replace(`/ranking?tier=${t}&period=${period}`, { scroll: false });
  }
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang } = useLang();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/rankings?period=${period}&tier=${tier}`)
      .then((res) => res.json())
      .then((d) => {
        setRankings(d.rankings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period, tier]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{t("ranking.title", lang)}</h1>
        <p className="text-gray-500">{t("ranking.subtitle", lang)}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Tabs value={tier} onValueChange={setTier}>
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger value="Obsidian" className="data-[state=active]:bg-purple-600/30 data-[state=active]:text-purple-300">
              Obsidian
            </TabsTrigger>
            <TabsTrigger value="Diamond" className="data-[state=active]:bg-cyan-600/30 data-[state=active]:text-cyan-300">
              Diamond
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              {t("dash.allTiers", lang)}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg text-gray-200">
            {t("ranking.topDapps", lang)} - {tier === "all" ? t("dash.allTiers", lang) : tier} ({period})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RankingTable rankings={rankings} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
