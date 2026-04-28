import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { LangProvider } from "@/lib/language-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Abstract Tier Radar",
  description: "Track dApp usage by high-tier Abstract ecosystem users",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-gray-950 text-white">
        <LangProvider>
          <Nav />
          <main className="flex-1">{children}</main>
          <footer className="py-4 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600">
              <img src="/chunhyang.png" alt="춘향" className="w-5 h-5 rounded-full" />
              <span>Made by ChunHyang</span>
            </div>
          </footer>
        </LangProvider>
      </body>
    </html>
  );
}
