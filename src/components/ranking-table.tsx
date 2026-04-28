"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RankingEntry } from "@/lib/types";
import { CATEGORY_COLORS, getContractName } from "@/lib/data";
import { useLang } from "@/lib/language-context";
import { t, tCat } from "@/lib/i18n";

interface RankingTableProps {
  rankings: RankingEntry[];
  loading: boolean;
}

export function RankingTable({ rankings, loading }: RankingTableProps) {
  const { lang } = useLang();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
        <span className="ml-3 text-gray-400">{t("table.loading", lang)}</span>
      </div>
    );
  }

  if (!rankings.length) {
    return <p className="text-center py-10 text-gray-500">{t("table.noData", lang)}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-gray-800 hover:bg-transparent">
          <TableHead className="text-gray-400 w-12">#</TableHead>
          <TableHead className="text-gray-400">{t("table.dapp", lang)}</TableHead>
          <TableHead className="text-gray-400">{t("table.category", lang)}</TableHead>
          <TableHead className="text-gray-400 text-right">{t("table.txs", lang)}</TableHead>
          <TableHead className="text-gray-400 text-right">{t("table.users", lang)}</TableHead>
          <TableHead className="text-gray-400 w-40">{t("table.share", lang)}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rankings.map((r, i) => {
          const totalTxs = rankings.reduce((sum, rr) => sum + rr.tx_count, 0);
          const pct = totalTxs > 0 ? (r.tx_count / totalTxs) * 100 : 0;
          const color = CATEGORY_COLORS[r.category] || CATEGORY_COLORS.Unknown;

          return (
            <TableRow key={r.contract_address} className="border-gray-800 hover:bg-gray-800/50">
              <TableCell className="font-mono text-gray-500">{i + 1}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  {(() => { const info = getContractName(r.contract_address, lang); return (
                  <span className={`font-medium ${info.is_unknown ? "text-gray-500" : "text-white"}`}>
                    {info.name}
                  </span>
                  ); })()}
                  <a
                    href={`https://abscan.org/address/${r.contract_address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-600 hover:text-pink-400 font-mono"
                  >
                    {r.contract_address.slice(0, 10)}...{r.contract_address.slice(-6)}
                  </a>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className="text-xs"
                  style={{ borderColor: color, color }}
                >
                  {tCat(r.category, lang)}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-mono text-white">
                {r.tx_count.toLocaleString()}
              </TableCell>
              <TableCell className="text-right font-mono text-gray-300">
                {r.unique_users}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
