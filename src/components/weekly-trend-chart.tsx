"use client";

import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { RankingEntry } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/data";
import { useLang } from "@/lib/language-context";
import { t, Lang } from "@/lib/i18n";

interface WeeklyTrendChartProps {
  allWeeks: Record<string, RankingEntry[]>;
  weekOrder: string[];
}

const MONTH_NAMES_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function shortWeekLabel(weekStart: string, lang: Lang): string {
  const start = new Date(weekStart + "T00:00:00");
  const mid = new Date(start);
  mid.setDate(mid.getDate() + 3);
  const month = mid.getMonth() + 1;
  const day = mid.getDate();
  const weekOfMonth = Math.ceil(day / 7);
  if (lang === "ko") return `${month}/${weekOfMonth}주`;
  if (lang === "en") return `${MONTH_NAMES_EN[month - 1]} W${weekOfMonth}`;
  if (lang === "zh") return `${month}月W${weekOfMonth}`;
  return `${month}月W${weekOfMonth}`;
}

const LINE_COLORS = ["#f59e0b", "#ec4899", "#10b981", "#3b82f6", "#f97316"];

export function WeeklyTrendChart({ allWeeks, weekOrder }: WeeklyTrendChartProps) {
  const { lang } = useLang();

  const { chartData, top5 } = useMemo(() => {
    const txTotals: Record<string, number> = {};
    for (const rankings of Object.values(allWeeks)) {
      for (const r of rankings) {
        txTotals[r.contract_name] = (txTotals[r.contract_name] || 0) + r.tx_count;
      }
    }
    const top5Names = Object.entries(txTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const sortedWeeks = [...weekOrder].reverse();
    const chartData = sortedWeeks.map((weekStart) => {
      const rankings = allWeeks[weekStart] || [];
      const byName = new Map(rankings.map((r) => [r.contract_name, r.tx_count]));
      const point: Record<string, string | number> = { week: shortWeekLabel(weekStart, lang) };
      for (const name of top5Names) {
        point[name] = byName.get(name) || 0;
      }
      return point;
    });

    return {
      chartData,
      top5: top5Names.map((name, i) => {
        const category = Object.values(allWeeks)
          .flat()
          .find((r) => r.contract_name === name)?.category;
        return { name, color: CATEGORY_COLORS[category || "Unknown"] || LINE_COLORS[i] };
      }),
    };
  }, [allWeeks, weekOrder, lang]);

  if (weekOrder.length < 2) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-300 mb-4">{t("weekly.trendTitle", lang)}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData}>
          <XAxis dataKey="week" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={{ stroke: "#374151" }} />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={{ stroke: "#374151" }}
            tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
            labelStyle={{ color: "#9ca3af" }}
            formatter={(value) => [Number(value).toLocaleString(), ""]}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#9ca3af" }}
          />
          {top5.map((d) => (
            <Line
              key={d.name}
              type="monotone"
              dataKey={d.name}
              stroke={d.color}
              strokeWidth={2}
              dot={{ r: 4, fill: d.color }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
