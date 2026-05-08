// models/walletModel.ts
// Single source of truth untuk semua tipe data wallet — Fisherman & Buyer

// ─── Enums / Unions ───────────────────────────────────────────────────────────

export type TransactionType =
  | 'auction_payout' // Fisherman: hasil lelang masuk
  | 'withdrawal'     // Fisherman: tarik dana
  | 'refund'         // Shared: pengembalian dana
  | 'deposit'        // Buyer: isi saldo
  | 'purchase'       // Buyer: pembelian lelang
  | 'fee';           // Buyer: biaya layanan

export type TransactionStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'cancelled';

// ─── Core Models ──────────────────────────────────────────────────────────────

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;  // bigint di DB, dalam IDR
  pending: number;  // bigint — dana yang sedang diproses
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  description?: string;
  auction_id?: string;
  status: TransactionStatus;
  created_at: string;
}

// ─── Payload Types ────────────────────────────────────────────────────────────

export interface WithdrawPayload {
  amount: number;
  description?: string;
}

export interface DepositPayload {
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

// Tambahan — untuk addPending & releasePending
export interface AddPendingPayload {
  amount: number;
  auction_id?: string;
  description?: string;
}

export interface ReleasePendingPayload {
  amount: number;
  transaction_id?: string; // opsional: untuk update status transaksi
}

// ─── Response Types ───────────────────────────────────────────────────────────

export interface DepositResult {
  message: string;
  transaction: Transaction;
  new_balance: number;
}

export interface WalletWithTransactions {
  wallet: Wallet;
  transactions: Transaction[];
}

export interface WalletSummary {
  wallet: Wallet;
  transactions: Transaction[];
  activeBids: number;
  totalSpent: number;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}