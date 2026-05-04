export type AuctionStatus = 'active' | 'done' | 'pending' | 'cancelled';

export interface Auction {
  id: string;
  seller_id: string;
  name: string;
  species?: string;
  grade?: string;
  weight_kg: number;
  start_price: number;
  current_bid?: number;
  final_price?: number;
  status: AuctionStatus;
  ends_at: string;
  paid: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAuctionPayload {
  name: string;
  species?: string;
  grade?: string;
  weight_kg: number | string;
  start_price: number | string;
  duration_hours: number | string; // 2 | 6 | 12 | 24
  image_base64?: string;           // base64 dari frontend
  image_mime?: string;             // e.g. "image/jpeg"
}

export interface UpdateAuctionPayload {
  name?: string;
  species?: string;
  grade?: string;
  weight_kg?: number;
  start_price?: number;
  ends_at?: string;
  image_url?: string;
  status?: AuctionStatus;
}