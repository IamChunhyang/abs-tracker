import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const CACHE_DIR = join(process.cwd(), "cache");
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

interface CachedData<T> {
  fetched_at: string;
  data: T;
}

function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
}

export function readCache<T>(key: string, maxAgeMs = CACHE_MAX_AGE): T | null {
  const path = join(CACHE_DIR, `${key}.json`);
  if (!existsSync(path)) return null;

  try {
    const raw = readFileSync(path, "utf-8");
    const cached: CachedData<T> = JSON.parse(raw);
    const age = Date.now() - new Date(cached.fetched_at).getTime();
    if (age > maxAgeMs) return null;
    return cached.data;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, data: T): void {
  ensureCacheDir();
  const path = join(CACHE_DIR, `${key}.json`);
  const cached: CachedData<T> = {
    fetched_at: new Date().toISOString(),
    data,
  };
  writeFileSync(path, JSON.stringify(cached, null, 2), "utf-8");
}

export function getCacheMeta(): { fetched_at: string } | null {
  const path = join(CACHE_DIR, "meta.json");
  if (!existsSync(path)) return null;

  try {
    const raw = readFileSync(path, "utf-8");
    const cached: CachedData<unknown> = JSON.parse(raw);
    return { fetched_at: cached.fetched_at };
  } catch {
    return null;
  }
}
