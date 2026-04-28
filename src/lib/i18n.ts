export type Lang = "ko" | "en";

const dict = {
  // Nav
  "nav.title": { ko: "Abstract Tier Radar", en: "Abstract Tier Radar" },
  "nav.dashboard": { ko: "대시보드", en: "Dashboard" },
  "nav.ranking": { ko: "디앱 랭킹", en: "dApp Ranking" },
  "nav.tiers": { ko: "전체 랭킹", en: "Full Ranking" },
  "nav.search": { ko: "검색", en: "Search" },
  "nav.myRank": { ko: "내 순위", en: "My Rank" },

  // Dashboard
  "dash.title": { ko: "앱스트랙트 티어 레이더", en: "Abstract Tier Radar" },
  "dash.subtitle": { ko: "상위 티어 유저들이 밀고 있는 디앱은?", en: "Track which dApps high-tier Abstract users are using most" },
  "dash.updateSchedule": { ko: "매주 수요일 새벽 1시(KST) 자동 업데이트", en: "Auto-updated every Wednesday at 1:00 AM KST" },
  "dash.lastUpdated": { ko: "마지막 업데이트", en: "Last updated" },
  "dash.dappRanking": { ko: "디앱(dApp) 랭킹", en: "dApp Ranking" },
  "dash.walletActivity": { ko: "지갑 활동", en: "Wallet Activity" },
  "dash.categoryBreakdown": { ko: "카테고리 분류", en: "Category Breakdown" },
  "dash.allTiers": { ko: "종합", en: "Combined" },

  // Stats cards
  "stats.totalTxs": { ko: "총 트랜잭션", en: "Total Transactions" },
  "stats.trackedWallets": { ko: "추적 지갑 수", en: "Tracked Wallets" },
  "stats.topDapp": { ko: "1위 dApp", en: "Top dApp" },
  "stats.activeRate": { ko: "활성 비율", en: "Active Rate" },

  // Ranking page
  "ranking.title": { ko: "dApp 랭킹", en: "dApp Ranking" },
  "ranking.subtitle": { ko: "고티어 Abstract 유저들이 가장 많이 사용한 컨트랙트", en: "Most used contracts by high-tier Abstract users" },
  "ranking.topDapps": { ko: "인기 dApp", en: "Top dApps" },

  // Ranking table
  "table.dapp": { ko: "디앱(dApp)", en: "dApp / Contract" },
  "table.category": { ko: "카테고리", en: "Category" },
  "table.txs": { ko: "트랜잭션", en: "Txs" },
  "table.users": { ko: "유저 수", en: "Users" },
  "table.share": { ko: "비중", en: "Share" },
  "table.loading": { ko: "온체인 데이터 불러오는 중...", en: "Fetching on-chain data..." },
  "table.noData": { ko: "데이터가 없습니다", en: "No data available" },
  "table.contract": { ko: "컨트랙트", en: "Contract" },
  "table.topMethod": { ko: "주요 메소드", en: "Top Method" },

  // Full ranking page
  "tiers.title": { ko: "전체 랭킹", en: "Full Ranking" },
  "tiers.subtitle": { ko: "7일 기준 Obsidian ~ Platinum 전체 지갑 순위", en: "All wallet rankings (Obsidian–Platinum, 7d)" },
  "tiers.loading": { ko: "랭킹 데이터를 불러오는 중...", en: "Fetching ranking data..." },
  "tiers.searchPlaceholder": { ko: "닉네임 또는 주소 검색", en: "Search by name or address" },
  "tiers.page": { ko: "페이지", en: "Page" },

  // Wallet search page
  "search.title": { ko: "지갑 검색", en: "Search Wallet" },
  "search.subtitle": { ko: "지갑 주소를 입력하면 온체인 활동을 확인할 수 있습니다", en: "Enter any wallet address to see its on-chain activity" },
  "search.placeholder": { ko: "닉네임 또는 지갑 주소 검색", en: "Search by nickname or address" },
  "search.button": { ko: "검색", en: "Search" },
  "search.walletsCount": { ko: "개 지갑", en: " wallets" },

  // Wallet detail page
  "wallet.back": { ko: "대시보드로 돌아가기", en: "Back to Dashboard" },
  "wallet.notFound": { ko: "지갑을 찾을 수 없습니다", en: "Wallet not found" },
  "wallet.allTimeTxs": { ko: "전체 트랜잭션", en: "All-time Transactions" },
  "wallet.dappInteractions": { ko: "dApp 상호작용", en: "dApp Interactions" },
  "wallet.txsInPeriod": { ko: "개 트랜잭션", en: " transactions in " },
  "wallet.loading": { ko: "로딩 중...", en: "Loading..." },
  "wallet.streaming.active": { ko: "스트리밍: 활성", en: "Streaming: Active" },
  "wallet.streaming.inactive": { ko: "스트리밍: 비활성", en: "Streaming: Inactive" },

  // Period selector
  "period.1d": { ko: "24시간", en: "24 hours" },
  "period.7d": { ko: "7일", en: "7 days" },
  "period.14d": { ko: "14일", en: "14 days" },
  "period.30d": { ko: "30일", en: "30 days" },

  // My Rank page
  "rank.title": { ko: "내 순위 확인", en: "Check My Rank" },
  "rank.subtitle": { ko: "닉네임 또는 지갑 주소로 검색하면 전체 순위를 확인할 수 있습니다", en: "Search by nickname or wallet address to see your ranking" },
  "rank.placeholder": { ko: "닉네임 또는 지갑 주소 입력 후 순위 검색 클릭", en: "Enter name or address, then press Find Rank" },
  "rank.search": { ko: "순위 검색", en: "Find Rank" },
  "rank.overall": { ko: "전체 순위", en: "Overall Rank" },
  "rank.tierRank": { ko: "티어 내 순위", en: "Tier Rank" },
  "rank.txCount": { ko: "{period} 트랜잭션", en: "{period} Txs" },
  "rank.totalTx": { ko: "누적 트랜잭션", en: "All-time Txs" },
  "rank.nearby": { ko: "근처 순위", en: "Nearby Rankings" },
  "rank.notFound": { ko: "해당 유저를 찾을 수 없습니다", en: "User not found" },
  "rank.outOf": { ko: "명 중", en: "out of" },
  "rank.you": { ko: "← 나", en: "← You" },
  "rank.topPercent": { ko: "상위", en: "Top" },
  "rank.topDapps": { ko: "자주 사용한 dApp", en: "Most Used dApps" },

  // Categories
  "cat.Gaming": { ko: "게이밍", en: "Gaming" },
  "cat.Governance": { ko: "거버넌스", en: "Governance" },
  "cat.Abstract": { ko: "앱스트랙트", en: "Abstract" },
  "cat.DeFi": { ko: "디파이", en: "DeFi" },
  "cat.Rewards": { ko: "리워드", en: "Rewards" },
  "cat.NFT": { ko: "NFT", en: "NFT" },
  "cat.Staking": { ko: "스테이킹", en: "Staking" },
  "cat.Infra": { ko: "인프라", en: "Infra" },
  "cat.Arcade": { ko: "아케이드", en: "Arcade" },
  "cat.Others": { ko: "기타", en: "Others" },
  "cat.Unknown": { ko: "미확인", en: "Unknown" },
} as const;

export type TKey = keyof typeof dict;

export function t(key: TKey, lang: Lang): string {
  return dict[key][lang];
}

export function tCat(category: string, lang: Lang): string {
  const key = `cat.${category}` as TKey;
  if (key in dict) return dict[key][lang];
  return category;
}
