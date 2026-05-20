const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type TransactionType =
  | 'auction_payout'
  | 'withdrawal'
  | 'refund'
  | 'deposit'
  | 'purchase'
  | 'fee';

export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  pending: number;
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

export interface TransactionsResponse {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
export function formatRupiah(amount: number): string {
  const MAX = 1_000_000_000_000;

  if (amount > MAX) return 'Rp 1000M+';
  if (amount >= 1_000_000_000)
    return `Rp ${(amount / 1_000_000_000).toFixed(amount % 1_000_000_000 === 0 ? 0 : 1)}M`;
  if (amount >= 1_000_000)
    return `Rp ${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}jt`;
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

export function formatTxDate(isoString: string): string {
  const date = new Date(isoString);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  const time = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 0) return `Hari ini, ${time}`;
  if (diffDays === 1) return `Kemarin, ${time}`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + `, ${time}`;
}

export function txLabel(tx: Transaction): string {
  if (tx.description) return tx.description;
  const map: Record<TransactionType, string> = {
    auction_payout: 'Hasil Lelang',
    withdrawal:     'Penarikan Dana',
    refund:         'Pengembalian Dana',
    deposit:        'Deposit Saldo',
    purchase:       'Pembelian Lelang',
    fee:            'Biaya Layanan',
  };
  return map[tx.type] ?? 'Transaksi';
}

export function isIncome(tx: Transaction): boolean {
  return tx.type === 'deposit' || tx.type === 'auction_payout' || tx.type === 'refund';
}

// ─── API ──────────────────────────────────────────────────────────────────────
async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan.');
  return data as T;
}

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export const walletService = {
  // Wallet + 10 transaksi terakhir (1 request)
  getWallet: async (userId: string, token: string) => {
    const res = await fetch(`${API_URL}/api/wallet/${userId}`, {
      headers: authHeaders(token),
    });
    return handleResponse<{ wallet: Wallet; transactions: Transaction[] }>(res);
  },

  // Paginated transaction history
  getTransactions: async (userId: string, token: string, page = 1, limit = 20) => {
    const res = await fetch(`${API_URL}/api/wallet/${userId}/transactions?page=${page}&limit=${limit}`, {
      headers: authHeaders(token),
    });
    return handleResponse<TransactionsResponse>(res);
  },

  // Jumlah bid aktif
  getActiveBidsCount: async (userId: string, token: string) => {
    const res = await fetch(`${API_URL}/api/wallet/${userId}/active-bids`, {
      headers: authHeaders(token),
    });
    return handleResponse<{ count: number }>(res);
  },

  // Buyer: deposit saldo
  deposit: async (userId: string, token: string, amount: number, description?: string) => {
    const res = await fetch(`${API_URL}/api/wallet/${userId}/deposit`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ amount, description }),
    });
    return handleResponse(res);
  },

  // Fisherman: tarik dana
  withdraw: async (userId: string, token: string, amount: number, description?: string) => {
    const res = await fetch(`${API_URL}/api/wallet/${userId}/withdraw`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ amount, description }),
    });
    return handleResponse(res);
  },
};