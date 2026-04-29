"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { t, l } from "@/lib/i18n";
import Link from "next/link";

interface RankSnippet {
  found: boolean;
  wallet?: { address: string; name: string; tier: string };
  overall_rank: number | null;
  overall_total: number;
}

export function WalletSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [snippet, setSnippet] = useState<RankSnippet | null>(null);
  const { lang } = useLang();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setSnippet(null);
    try {
      const res = await fetch(`/api/rank?q=${encodeURIComponent(trimmed)}&period=7d`);
      const data = await res.json();
      setSnippet(data);
    } catch {
      setSnippet({ found: false, overall_rank: null, overall_total: 0 });
    }
    setLoading(false);
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="flex gap-2 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSnippet(null); }}
            placeholder={t("search.placeholder", lang)}
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>
        <Button type="submit" variant="outline" className="border-gray-700 hover:bg-gray-800" disabled={loading}>
          {loading ? "..." : t("search.button", lang)}
        </Button>
      </form>
      {snippet && (
        <div className="mt-2 text-sm">
          {snippet.found && snippet.wallet ? (
            <Link href={`/wallet/${snippet.wallet.address}`} className="text-gray-300 hover:text-white transition-colors">
              <span className="text-pink-400 font-medium">{snippet.wallet.name}</span>
              {snippet.overall_rank ? (
                <>{" "}({snippet.wallet.tier}) — {l({ ko: "1주 기준 전체", en: "Rank", zh: "排名", ja: "ランク" }, lang)}{" "}
                  <span className="text-white font-semibold">#{snippet.overall_rank}</span>
                  {lang === "ko"
                    ? <>위 / {snippet.overall_total}명</>
                    : <> / {snippet.overall_total} ({t("period.7d", lang)})</>
                  }</>
              ) : (
                <>{" "}({snippet.wallet.tier})</>
              )}
              <span className="text-gray-600 ml-2">→</span>
            </Link>
          ) : (
            <span className="text-gray-500">
              {t("rank.notFound", lang)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
