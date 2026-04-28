// services/walletService.ts

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface Wallet {
  id: string;
  user_id: string;
  balance: number; // bigint from DB
  pending: number;
  created_at: string;
  updated_at: string;
}

// Matches your actual transactions table
export interface Transaction {
  id: string;
  user_id: string;
  type: "auction_payout" | "withdrawal" | "refund" | "deposit";
  amount: number; // bigint
  description?: string; // your column
  auction_id?: string; // your column
  status: "pending" | "completed" | "failed" | "cancelled";
  created_at: string;
}

export interface WalletData {
  wallet: Wallet;
  transactions: Transaction[];
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Terjadi kesalahan.");
  return data as T;
}

export const walletService = {
  getWallet: async (userId: string, token: string): Promise<WalletData> => {
    const res = await fetch(`${API_URL}/api/wallet/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse<WalletData>(res);
  },

  getTransactions: async (
    userId: string,
    token: string,
    page = 1,
    limit = 20,
  ) => {
    const res = await fetch(
      `${API_URL}/api/wallet/${userId}/transactions?page=${page}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return handleResponse<{
      transactions: Transaction[];
      total: number;
      page: number;
    }>(res);
  },

  withdraw: async (
    userId: string,
    token: string,
    amount: number,
    description?: string,
  ) => {
    const res = await fetch(`${API_URL}/api/wallet/${userId}/withdraw`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, description }),
    });
    return handleResponse(res);
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatTxDate(isoString: string): string {
  const date = new Date(isoString);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  const time = date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  if (diffDays === 0) return `Today, ${time}`;
  if (diffDays === 1) return `Yesterday, ${time}`;
  return (
    date.toLocaleDateString("id-ID", { day: "numeric", month: "short" }) +
    `, ${time}`
  );
}

export function txLabel(tx: Transaction): string {
  if (tx.description) return tx.description;
  const map: Record<string, string> = {
    auction_payout: "Auction Payout",
    withdrawal: "Penarikan Dana",
    refund: "Refund",
    deposit: "Deposit",
  };
  return map[tx.type] ?? "Transaksi";
}

export function isIncome(tx: Transaction): boolean {
  return tx.type !== "withdrawal";
}
