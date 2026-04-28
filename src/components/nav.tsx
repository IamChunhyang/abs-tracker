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
    { href: "/rank", label: t("nav.myRank", lang), icon: Trophy },
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

            <button
              onClick={() => setLang(lang === "ko" ? "en" : "ko")}
              className="ml-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-700 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
            >
              {lang === "ko" ? "EN" : "KR"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
