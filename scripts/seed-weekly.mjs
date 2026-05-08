import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const CACHE_DIR = join(process.cwd(), "cache");
const WEEKLY_DIR = join(CACHE_DIR, "weekly");

if (!existsSync(WEEKLY_DIR)) mkdirSync(WEEKLY_DIR, { recursive: true });

// The prefetch ran on 2026-04-29 (Tuesday).
// 7d data covers April 22 (Tue) ~ April 28 (Mon) = 4월 4주차
const WEEK_START = "2026-04-22";
const WEEK_END = "2026-04-28";

const tiers = ["Obsidian", "Diamond", "Platinum", "Gold", "all"];

let seeded = 0;
for (const tier of tiers) {
  const srcPath = join(CACHE_DIR, `rankings_7d_${tier}.json`);
  if (!existsSync(srcPath)) {
    console.log(`SKIP: ${srcPath} not found`);
    continue;
  }

  const raw = JSON.parse(readFileSync(srcPath, "utf-8"));
  const weeklyData = {
    fetched_at: raw.fetched_at,
    data: {
      ...raw.data,
      week_start: WEEK_START,
      week_end: WEEK_END,
      period: "weekly",
    },
  };

  const destPath = join(WEEKLY_DIR, `${WEEK_START}_${tier}.json`);
  writeFileSync(destPath, JSON.stringify(weeklyData, null, 2), "utf-8");
  console.log(`OK: ${tier} -> ${destPath}`);
  seeded++;
}

// Update weeks manifest
const manifestPath = join(WEEKLY_DIR, "weeks.json");
let weeks = [];
if (existsSync(manifestPath)) {
  weeks = JSON.parse(readFileSync(manifestPath, "utf-8"));
}

const existing = weeks.find((w) => w.week_start === WEEK_START);
if (!existing) {
  weeks.push({
    week_start: WEEK_START,
    week_end: WEEK_END,
    fetched_at: new Date().toISOString(),
  });
  weeks.sort((a, b) => b.week_start.localeCompare(a.week_start));
}

writeFileSync(manifestPath, JSON.stringify(weeks, null, 2), "utf-8");
console.log(`\nSeeded ${seeded} tier files for week ${WEEK_START} ~ ${WEEK_END}`);
console.log(`Manifest: ${weeks.length} week(s)`);
