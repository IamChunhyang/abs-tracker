"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Activity, Users, Layers, Trophy } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";

interface StatsCardsProps {
  totalTxs: number;
  totalWallets: number;
  topDapp: string;
  activePct: number;
  loading: boolean;
}

export function StatsCards({ totalTxs, totalWallets, topDapp, activePct, loading }: StatsCardsProps) {
  const { lang } = useLang();

  const cards = [
    { label: t("stats.totalTxs", lang), value: totalTxs.toLocaleString(), icon: Activity, color: "text-pink-400" },
    { label: t("stats.trackedWallets", lang), value: totalWallets.toString(), icon: Users, color: "text-cyan-400" },
    { label: t("stats.topDapp", lang), value: topDapp, icon: Trophy, color: "text-yellow-400" },
    { label: t("stats.activeRate", lang), value: `${activePct}%`, icon: Layers, color: "text-green-400" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-500">{card.label}</p>
              <card.icon className={`h-5 w-5 ${card.color} opacity-50`} />
            </div>
            {loading ? (
              <div className="h-7 w-20 bg-gray-800 animate-pulse rounded" />
            ) : (
              <p className={`text-xl font-bold ${card.color} truncate`} title={card.value}>{card.value}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
