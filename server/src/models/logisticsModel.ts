export type LogisticsStatus = 'in_transit' | 'out_for_delivery' | 'delivered' | 'pending';

export interface Logistics {
  id: string;
  auction_id: string;
  seller_id: string;
  buyer_id: string;
  status: LogisticsStatus;
  destination: string;
  estimated_arrival: string;
  created_at: string;
}

export interface LogisticsWithDetails extends Logistics {
  auctions: {
    name: string;
    weight_kg: number;
    image_url?: string;
  };
}
