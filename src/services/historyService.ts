const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface HistoryItem {
  id: string;
  name: string;
  image: string;
  vessel: string;
  seller: string;
  finalPrice: string;
  date: string;
  status: 'Won' | 'Lost';
}

export interface HistoryResponse {
  data: HistoryItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface HistoryFilters {
  search?: string;
  status?: 'All' | 'Won' | 'Lost';
  startDate?: string; // ISO string
  endDate?: string;   // ISO string
  page?: number;
  limit?: number;
}

export async function getBidHistory(
  userId: string,
  token: string,
  filters: HistoryFilters = {}
): Promise<HistoryResponse> {
  const params = new URLSearchParams();

  if (filters.search)    params.set('search', filters.search);
  if (filters.status && filters.status !== 'All') params.set('status', filters.status);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate)   params.set('endDate', filters.endDate);
  if (filters.page)      params.set('page', String(filters.page));
  if (filters.limit)     params.set('limit', String(filters.limit));

  const res = await fetch(`${API_URL}/api/history/${userId}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Gagal mengambil histori lelang.');
  }

  return res.json();
}