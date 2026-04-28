// models/walletModel.ts

export type TransactionType =
  | "auction_payout"
  | "withdrawal"
  | "refund"
  | "deposit";
export type TransactionStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled";

export interface Wallet {
  id: string;
  user_id: string;
  balance: number; // bigint in DB, IDR (e.g. 15000000)
  pending: number; // bigint
  created_at: string;
  updated_at: string;
}

// Matches your actual `transactions` table columns exactly
export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number; // bigint
  description?: string; // your "description" column
  auction_id?: string; // your "auction_id" column
  status: TransactionStatus;
  created_at: string;
}

export interface WithdrawPayload {
  amount: number;
  description?: string;
}

export interface CreditWalletPayload {
  user_id: string;
  amount: number;
  type: TransactionType;
  auction_id?: string;
  description?: string;
}
