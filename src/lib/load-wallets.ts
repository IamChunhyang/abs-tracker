import { readFileSync } from "fs";
import { join } from "path";
import { Wallet } from "./types";

const DATA_DIR = join(process.cwd(), "data");

function parseCsv(filename: string): Wallet[] {
  const raw = readFileSync(join(DATA_DIR, filename), "utf-8");
  const lines = raw.split("\n").slice(1).filter((l) => l.trim());
  return lines.map((line) => {
    const cols = line.match(/(".*?"|[^,]+)/g) || [];
    const clean = (i: number) => (cols[i] || "").replace(/^"|"$/g, "");
    return {
      address: clean(2).toLowerCase(),
      name: clean(3) || clean(2).slice(0, 10),
      tier: clean(0) as Wallet["tier"],
      tier_v2: parseInt(clean(4)) || 0,
      badges: parseInt(clean(5)) || 0,
      streaming: clean(6) === "yes",
      portal_link: clean(7),
    };
  });
}

let _cached: Wallet[] | null = null;

export function loadAllWallets(): Wallet[] {
  if (_cached) return _cached;

  _cached = [
    ...parseCsv("obsidian.csv"),
    ...parseCsv("diamond.csv"),
    ...parseCsv("platinum.csv"),
    ...parseCsv("gold.csv"),
  ];
  return _cached;
}

export function getWalletsByTier(tier: string): Wallet[] {
  return loadAllWallets().filter((w) => w.tier === tier);
}

export function findWallet(address: string): Wallet | undefined {
  const lower = address.toLowerCase();
  return loadAllWallets().find((w) => w.address === lower);
}

export const TIER_ORDER = ["Obsidian", "Diamond", "Platinum", "Gold"] as const;

export function getTierCounts(): Record<string, number> {
  const wallets = loadAllWallets();
  const counts: Record<string, number> = {};
  for (const tier of TIER_ORDER) {
    counts[tier] = wallets.filter((w) => w.tier === tier).length;
  }
  return counts;
}
