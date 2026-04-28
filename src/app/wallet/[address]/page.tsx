"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/tier-badge";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { CATEGORY_COLORS } from "@/lib/data";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";

interface WalletData {
  address: string;
  name: string | null;
  tier: string | null;
  tier_v2: number | null;
  badges: number | null;
  streaming: boolean | null;
  portal_link: string | null;
  total_tx_count: number;
  top_contracts: {
    address: string;
    name: string;
    category: string;
    is_unknown: boolean;
    tx_count: number;
  }[];
}

export default function WalletPage() {
  const params = useParams<{ address: string }>();
  const address = params.address;
  const router = useRouter();
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { lang } = useLang();

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/wallet?address=${encodeURIComponent(address)}&period=7d`)
      .then((res) => res.json())
      .then((d) => {
        if (d.error === "not_found") {
          setNotFound(true);
          setLoading(false);
          return;
        }
        if (d.address && d.address.toLowerCase() !== address.toLowerCase()) {
          router.replace(`/wallet/${d.address}`);
          return;
        }
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [address, router]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {lang === "ko" ? "뒤로가기" : "Go Back"}
      </button>

      {notFound && (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="py-12 text-center">
            <p className="text-gray-400 text-lg">{t("wallet.notFound", lang)}</p>
            <p className="text-gray-600 text-sm mt-2">&quot;{decodeURIComponent(address)}&quot;</p>
          </CardContent>
        </Card>
      )}

      {!notFound && <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              <div className="h-8 w-48 bg-gray-800 animate-pulse rounded" />
              <div className="h-4 w-96 bg-gray-800 animate-pulse rounded" />
            </div>
          ) : data ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-white">
                    {data.name || `${address.slice(0, 10)}...${address.slice(-6)}`}
                  </h1>
                  {data.tier && <TierBadge tier={data.tier} />}
                </div>
                <p className="font-mono text-sm text-gray-500">{address}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                  {data.tier_v2 !== null && <span>Tier V2: {data.tier_v2}</span>}
                  {data.badges !== null && <span>{lang === "ko" ? "뱃지" : "Badges"}: {data.badges}</span>}
                  {data.streaming !== null && (
                    <span>{data.streaming ? t("wallet.streaming.active", lang) : t("wallet.streaming.inactive", lang)}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-right">
                  <p className="text-sm text-gray-500">{t("wallet.allTimeTxs", lang)}</p>
                  <p className="text-2xl font-bold text-pink-400">{data.total_tx_count.toLocaleString()}</p>
                </div>
                <div className="flex gap-3 mt-2">
                  <a href={`https://portal.abs.xyz/profile/${data.address}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600/20 border border-pink-500/40 text-sm text-pink-300 hover:bg-pink-600/30 transition-colors">
                    {lang === "ko" ? "프로필 바로가기" : "View Profile"} <ExternalLink className="h-4 w-4" />
                  </a>
                  <a href={`https://abscan.org/address/${data.address}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600/20 border border-cyan-500/40 text-sm text-cyan-300 hover:bg-cyan-600/30 transition-colors">
                    Abscan <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">{t("wallet.notFound", lang)}</p>
          )}
        </CardContent>
      </Card>}

      {!notFound && !loading && data?.top_contracts && data.top_contracts.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg text-gray-200">
              {lang === "ko" ? "자주 사용한 dApp" : "Top dApps"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.top_contracts.map((c, i) => {
                const color = CATEGORY_COLORS[c.category] || CATEGORY_COLORS.Unknown;
                return (
                  <span key={c.address} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700">
                    <span className="text-xs text-gray-500">{i + 1}</span>
                    <span className={`text-sm ${c.is_unknown ? "text-gray-500" : "text-white"}`}>{c.name}</span>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  </span>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
