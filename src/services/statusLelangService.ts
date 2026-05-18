const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface ActiveBidItem {
  id: string;
  name: string;
  lot: string;
  weight: string;
  image: string;
  highestBid: string;
  yourBid: string;
  status: 'winning' | 'outbid';
  endsAt: string; // ISO string untuk countdown
}

export interface StatusLelangResponse {
  data: ActiveBidItem[];
  total: number;
}

export async function getActiveBidStatus(
  userId: string,
  token: string
): Promise<StatusLelangResponse> {
  const res = await fetch(`${API_URL}/api/status-lelang/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Gagal mengambil status lelang.');
  }

  return res.json();
}