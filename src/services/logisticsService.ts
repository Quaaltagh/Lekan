const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface LogisticsAuctionDetails {
  name: string;
  weight_kg: number;
  image_url?: string;
}

export interface LogisticsShipment {
  id: string;
  auction_id: string;
  seller_id: string;
  buyer_id: string;
  status: 'in_transit' | 'out_for_delivery' | 'delivered' | 'pending';
  destination: string;
  estimated_arrival: string;
  created_at: string;
  auctions: LogisticsAuctionDetails;
}

export interface LogisticsResponse {
  active: LogisticsShipment[];
  history: LogisticsShipment[];
}

export const logisticsService = {
  getLogistics: async (sellerId: string, token: string): Promise<LogisticsResponse> => {
    const res = await fetch(`${API_URL}/api/logistics/seller/${sellerId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch logistics data.');
    return data;
  },
};
