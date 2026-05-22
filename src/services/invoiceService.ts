const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface InvoiceAuction {
  id: string;
  name: string;
  species?: string;
  grade?: string;
  weight_kg: number;
  image_url?: string;
  status: string;
}

export interface InvoiceSeller {
  id: string;
  full_name: string;
  vessel_name?: string;
  verified: boolean;
  bank_name?: string;
  bank_account?: string;
}

export interface InvoiceWinner {
  id: string;
  full_name: string;
  verified: boolean;
}

export interface InvoiceLogistics {
  id: string;
  status: string;
  courier?: string;
  tracking_number?: string;
  pickup_address?: string;
  delivery_address?: string;
  estimated_arrival?: string;
}

export interface InvoiceFinancials {
  subtotal: number;
  platform_fee: number;
  logistics_fee: number;
  grand_total: number;
}

export interface InvoiceBid {
  id: string;
  bidder_id: string;
  amount: number;
  created_at: string;
}

export interface InvoiceData {
  invoice_number: string;
  status: 'paid' | 'unpaid';
  created_at: string;
  ends_at: string;
  auction: InvoiceAuction;
  seller: InvoiceSeller | null;
  winner: InvoiceWinner | null;
  bids: InvoiceBid[];
  logistics: InvoiceLogistics | null;
  financials: InvoiceFinancials;
}

export async function getInvoice(auctionId: string, token: string): Promise<InvoiceData> {
  const res = await fetch(`${API_URL}/api/invoice/${auctionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal mengambil data invoice.');
  }

  return res.json();
}