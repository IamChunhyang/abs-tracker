"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Search, Users, Home, Trophy } from "lucide-react";
import { useLang } from "@/lib/language-context";
import { t } from "@/lib/i18n";

export function Nav() {
  const pathname = usePathname();
  const { lang, setLang } = useLang();

  const links = [
    { href: "/", label: t("nav.dashboard", lang), icon: Home },
    { href: "/ranking", label: t("nav.ranking", lang), icon: BarChart3 },
    { href: "/tiers", label: t("nav.tiers", lang), icon: Users },
  ];

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <img src="/호에엥-3.png" alt="Logo" className="w-14 h-14 rounded-full object-cover" />
            <span className="font-bold text-white hidden sm:block">{t("nav.title", lang)}</span>
          </Link>

          <div className="flex items-center gap-1">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              );
            })}
            <Link
              href="/wallet/search"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.search", lang)}</span>
            </Link>

            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as "ko" | "en" | "zh" | "ja")}
              className="ml-2 px-2 py-1.5 rounded-lg text-xs font-medium border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer appearance-none pr-6 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_4px_center] bg-no-repeat"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </div>
      </div>
    </nav>
  );
}
