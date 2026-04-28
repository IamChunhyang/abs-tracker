export interface Wallet {
  address: string;
  name: string;
  tier: "Obsidian" | "Diamond" | "Platinum" | "Gold";
  tier_v2: number;
  badges: number;
  streaming: boolean;
  portal_link: string;
}

export interface Contract {
  address: string;
  name: string;
  name_en?: string;
  category: string;
  is_unknown: boolean;
  hidden?: boolean;
}

export interface Transaction {
  hash: string;
  wallet_address: string;
  contract_address: string;
  method_id: string;
  function_name: string;
  block_number: number;
  timestamp: number;
  value: string;
}

export interface RankingEntry {
  contract_address: string;
  contract_name: string;
  category: string;
  tx_count: number;
  unique_users: number;
  is_unknown: boolean;
}

export interface WalletActivity {
  address: string;
  name: string;
  tier: string;
  tx_count: number;
  top_contracts: { address: string; name: string; count: number }[];
}

export interface TierStats {
  tier: string;
  total_wallets: number;
  active_wallets: number;
  total_txs: number;
  avg_txs_per_wallet: number;
  top_dapps: RankingEntry[];
}

export type Period = "1d" | "7d" | "14d" | "30d";
