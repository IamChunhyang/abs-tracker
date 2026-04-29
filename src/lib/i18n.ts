export type Lang = "ko" | "en" | "zh" | "ja";

const dict = {
  // Nav
  "nav.title": { ko: "Abstract Tier Radar", en: "Abstract Tier Radar", zh: "Abstract Tier Radar", ja: "Abstract Tier Radar" },
  "nav.dashboard": { ko: "대시보드", en: "Dashboard", zh: "仪表盘", ja: "ダッシュボード" },
  "nav.ranking": { ko: "디앱 랭킹", en: "dApp Ranking", zh: "dApp排名", ja: "dAppランキング" },
  "nav.tiers": { ko: "전체 랭킹", en: "Full Ranking", zh: "全部排名", ja: "全体ランキング" },
  "nav.search": { ko: "검색", en: "Search", zh: "搜索", ja: "検索" },
  "nav.myRank": { ko: "내 순위", en: "My Rank", zh: "我的排名", ja: "マイランク" },

  // Dashboard
  "dash.title": { ko: "앱스트랙트 티어 레이더", en: "Abstract Tier Radar", zh: "Abstract Tier Radar", ja: "Abstract Tier Radar" },
  "dash.subtitle": { ko: "상위 티어 유저들이 밀고 있는 디앱은?", en: "Track which dApps high-tier Abstract users are using most", zh: "高级用户最常使用的dApp是什么？", ja: "上位ティアユーザーが最も使うdAppは？" },
  "dash.updateSchedule": { ko: "매주 수요일 새벽 1시(KST) 자동 업데이트", en: "Auto-updated every Wednesday at 1:00 AM KST", zh: "每周三凌晨1点(KST)自动更新", ja: "毎週水曜日午前1時(KST)自動更新" },
  "dash.lastUpdated": { ko: "마지막 업데이트", en: "Last updated", zh: "最后更新", ja: "最終更新" },
  "dash.dappRanking": { ko: "디앱(dApp) 랭킹", en: "dApp Ranking", zh: "dApp排名", ja: "dAppランキング" },
  "dash.walletActivity": { ko: "지갑 활동 순위", en: "Wallet Activity Ranking", zh: "钱包活跃排名", ja: "ウォレット活動ランキング" },
  "dash.categoryBreakdown": { ko: "카테고리 분류", en: "Category Breakdown", zh: "分类统计", ja: "カテゴリ分類" },
  "dash.allTiers": { ko: "종합", en: "Combined", zh: "综合", ja: "総合" },

  // Stats cards
  "stats.totalTxs": { ko: "총 트랜잭션", en: "Total Transactions", zh: "总交易数", ja: "総トランザクション" },
  "stats.trackedWallets": { ko: "추적 지갑 수", en: "Tracked Wallets", zh: "追踪钱包数", ja: "追跡ウォレット数" },
  "stats.topDapp": { ko: "1위 dApp", en: "Top dApp", zh: "Top dApp", ja: "Top dApp" },
  "stats.activeRate": { ko: "활성 비율", en: "Active Rate", zh: "活跃率", ja: "アクティブ率" },

  // Ranking page
  "ranking.title": { ko: "dApp 랭킹", en: "dApp Ranking", zh: "dApp排名", ja: "dAppランキング" },
  "ranking.subtitle": { ko: "고티어 Abstract 유저들이 가장 많이 사용한 컨트랙트", en: "Most used contracts by high-tier Abstract users", zh: "高级Abstract用户最常使用的合约", ja: "上位Abstractユーザーが最もよく使うコントラクト" },
  "ranking.topDapps": { ko: "인기 dApp", en: "Top dApps", zh: "热门dApp", ja: "人気dApp" },

  // Ranking table
  "table.dapp": { ko: "디앱(dApp)", en: "dApp / Contract", zh: "dApp/合约", ja: "dApp/コントラクト" },
  "table.category": { ko: "카테고리", en: "Category", zh: "分类", ja: "カテゴリ" },
  "table.txs": { ko: "트랜잭션", en: "Txs", zh: "交易", ja: "Tx数" },
  "table.users": { ko: "유저 수", en: "Users", zh: "用户数", ja: "ユーザー数" },
  "table.share": { ko: "비중", en: "Share", zh: "占比", ja: "シェア" },
  "table.loading": { ko: "온체인 데이터 불러오는 중...", en: "Fetching on-chain data...", zh: "正在获取链上数据...", ja: "オンチェーンデータを読み込み中..." },
  "table.noData": { ko: "데이터가 없습니다", en: "No data available", zh: "暂无数据", ja: "データがありません" },
  "table.contract": { ko: "컨트랙트", en: "Contract", zh: "合约", ja: "コントラクト" },
  "table.topMethod": { ko: "주요 메소드", en: "Top Method", zh: "主要方法", ja: "主要メソッド" },

  // Full ranking page
  "tiers.title": { ko: "전체 랭킹", en: "Full Ranking", zh: "全部排名", ja: "全体ランキング" },
  "tiers.subtitle": { ko: "7일 기준 Obsidian ~ Platinum 전체 지갑 순위", en: "All wallet rankings (Obsidian–Platinum, 7d)", zh: "7日Obsidian~Platinum全部钱包排名", ja: "7日間 Obsidian〜Platinum 全ウォレットランキング" },
  "tiers.loading": { ko: "랭킹 데이터를 불러오는 중...", en: "Fetching ranking data...", zh: "正在加载排名数据...", ja: "ランキングデータを読み込み中..." },
  "tiers.searchPlaceholder": { ko: "닉네임 또는 주소 검색", en: "Search by name or address", zh: "搜索昵称或地址", ja: "ニックネームまたはアドレスを検索" },
  "tiers.page": { ko: "페이지", en: "Page", zh: "页", ja: "ページ" },

  // Wallet search page
  "search.title": { ko: "지갑 검색", en: "Search Wallet", zh: "钱包搜索", ja: "ウォレット検索" },
  "search.subtitle": { ko: "지갑 주소를 입력하면 온체인 활동을 확인할 수 있습니다", en: "Enter any wallet address to see its on-chain activity", zh: "输入钱包地址查看链上活动", ja: "ウォレットアドレスを入力してオンチェーン活動を確認" },
  "search.placeholder": { ko: "닉네임 또는 지갑 주소 검색", en: "Search by nickname or address", zh: "搜索昵称或钱包地址", ja: "ニックネームまたはウォレットアドレスを検索" },
  "search.button": { ko: "검색", en: "Search", zh: "搜索", ja: "検索" },
  "search.walletsCount": { ko: "개 지갑", en: " wallets", zh: "个钱包", ja: "ウォレット" },

  // Wallet detail page
  "wallet.back": { ko: "대시보드로 돌아가기", en: "Back to Dashboard", zh: "返回仪表盘", ja: "ダッシュボードに戻る" },
  "wallet.notFound": { ko: "지갑을 찾을 수 없습니다", en: "Wallet not found", zh: "未找到钱包", ja: "ウォレットが見つかりません" },
  "wallet.allTimeTxs": { ko: "전체 트랜잭션", en: "All-time Transactions", zh: "全部交易", ja: "全トランザクション" },
  "wallet.dappInteractions": { ko: "dApp 상호작용", en: "dApp Interactions", zh: "dApp交互", ja: "dAppインタラクション" },
  "wallet.txsInPeriod": { ko: "개 트랜잭션", en: " transactions in ", zh: "笔交易", ja: "件のトランザクション" },
  "wallet.loading": { ko: "로딩 중...", en: "Loading...", zh: "加载中...", ja: "読み込み中..." },
  "wallet.streaming.active": { ko: "스트리밍: 활성", en: "Streaming: Active", zh: "流式传输：活跃", ja: "ストリーミング：アクティブ" },
  "wallet.streaming.inactive": { ko: "스트리밍: 비활성", en: "Streaming: Inactive", zh: "流式传输：非活跃", ja: "ストリーミング：非アクティブ" },

  // Period selector
  "period.1d": { ko: "24시간", en: "24H", zh: "24小时", ja: "24時間" },
  "period.7d": { ko: "1주", en: "1W", zh: "1周", ja: "1週間" },
  "period.14d": { ko: "2주", en: "2W", zh: "2周", ja: "2週間" },
  "period.30d": { ko: "1개월", en: "1M", zh: "1个月", ja: "1ヶ月" },

  // My Rank page
  "rank.title": { ko: "내 순위 확인", en: "Check My Rank", zh: "查看我的排名", ja: "マイランク確認" },
  "rank.subtitle": { ko: "닉네임 또는 지갑 주소로 검색하면 전체 순위를 확인할 수 있습니다", en: "Search by nickname or wallet address to see your ranking", zh: "输入昵称或钱包地址查看全部排名", ja: "ニックネームまたはウォレットアドレスで検索してランキングを確認" },
  "rank.placeholder": { ko: "닉네임 또는 지갑 주소 입력 후 Enter", en: "Enter name or address, then press Enter", zh: "输入昵称或地址后按Enter", ja: "ニックネームまたはアドレスを入力してEnter" },
  "rank.search": { ko: "순위 검색", en: "Find Rank", zh: "查找排名", ja: "ランク検索" },
  "rank.overall": { ko: "전체 순위", en: "Overall Rank", zh: "全部排名", ja: "全体ランク" },
  "rank.tierRank": { ko: "티어 내 순위", en: "Tier Rank", zh: "等级排名", ja: "ティア内ランク" },
  "rank.txCount": { ko: "{period} 트랜잭션", en: "{period} Txs", zh: "{period}交易", ja: "{period}トランザクション" },
  "rank.totalTx": { ko: "누적 트랜잭션", en: "All-time Txs", zh: "累计交易", ja: "累計トランザクション" },
  "rank.nearby": { ko: "근처 순위", en: "Nearby Rankings", zh: "附近排名", ja: "付近のランキング" },
  "rank.notFound": { ko: "해당 유저를 찾을 수 없습니다", en: "User not found", zh: "未找到该用户", ja: "該当ユーザーが見つかりません" },
  "rank.outOf": { ko: "명 중", en: "out of", zh: "共", ja: "人中" },
  "rank.you": { ko: "← 나", en: "← You", zh: "← 我", ja: "← 自分" },
  "rank.topPercent": { ko: "상위", en: "Top", zh: "前", ja: "上位" },
  "rank.topDapps": { ko: "자주 사용한 dApp", en: "Most Used dApps", zh: "常用dApp", ja: "よく使うdApp" },

  // Categories
  "cat.Gaming": { ko: "게이밍", en: "Gaming", zh: "游戏", ja: "ゲーム" },
  "cat.Governance": { ko: "거버넌스", en: "Governance", zh: "治理", ja: "ガバナンス" },
  "cat.Abstract": { ko: "앱스트랙트", en: "Abstract", zh: "Abstract", ja: "Abstract" },
  "cat.DeFi": { ko: "디파이", en: "DeFi", zh: "DeFi", ja: "DeFi" },
  "cat.Rewards": { ko: "리워드", en: "Rewards", zh: "奖励", ja: "リワード" },
  "cat.NFT": { ko: "NFT", en: "NFT", zh: "NFT", ja: "NFT" },
  "cat.Staking": { ko: "스테이킹", en: "Staking", zh: "质押", ja: "ステーキング" },
  "cat.Infra": { ko: "인프라", en: "Infra", zh: "基础设施", ja: "インフラ" },
  "cat.Arcade": { ko: "아케이드", en: "Arcade", zh: "街机", ja: "アーケード" },
  "cat.Others": { ko: "기타", en: "Others", zh: "其他", ja: "その他" },
  "cat.Unknown": { ko: "미확인", en: "Unknown", zh: "未知", ja: "不明" },
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

export function l(texts: { ko: string; en: string; zh: string; ja: string }, lang: Lang): string {
  return texts[lang];
}
