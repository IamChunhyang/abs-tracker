import { prefetchAll } from "../src/lib/prefetch";

async function main() {
  console.log("=== Abstract Tier Tracker - Weekly Prefetch ===");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log("");

  const result = await prefetchAll();

  if (result.success) {
    console.log("\n=== Summary ===");
    console.log(`Wallets processed: ${result.stats?.wallets}`);
    console.log(`Rankings cached: ${result.stats?.rankings_cached}`);
    console.log(`Wallet details cached: ${result.stats?.wallet_detail_cached}`);
    console.log(`Duration: ${((result.stats?.duration_ms || 0) / 1000).toFixed(1)}s`);
    process.exit(0);
  } else {
    console.error("\n=== FAILED ===");
    console.error(result.error);
    process.exit(1);
  }
}

main();
