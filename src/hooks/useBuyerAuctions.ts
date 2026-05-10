'use client';
import { useEffect, useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface BuyerAuction {
  id: string;
  seller_id: string;
  name: string;
  species?: string;
  grade?: string;
  weight_kg: number;
  start_price: number;
  current_bid?: number;
  final_price?: number;
  status: string;
  ends_at: string;
  image_url?: string;
  created_at: string;
}

export interface AuctionFilters {
  search?: string;
  species?: string;
  status?: 'active' | 'done' | 'pending' | 'cancelled';
  min_price?: string;
  max_price?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'ending';
}

export function useBuyerAuctions(filters: AuctionFilters = {}) {
  const [auctions, setAuctions] = useState<BuyerAuction[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  const fetchAuctions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.search)    params.set('search',    filters.search);
      if (filters.species && filters.species !== 'all')
                             params.set('species',   filters.species);
      if (filters.status)    params.set('status',    filters.status);
      if (filters.min_price) params.set('min_price', filters.min_price);
      if (filters.max_price) params.set('max_price', filters.max_price);
      if (filters.sort)      params.set('sort',      filters.sort);

      const res = await fetch(`${API_URL}/api/auctions/buyer?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat lelang.');
      const data: BuyerAuction[] = await res.json();
      setAuctions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.species, filters.status, filters.min_price, filters.max_price, filters.sort]);

  useEffect(() => {
    fetchAuctions();
  }, [fetchAuctions]);

  return { auctions, loading, error, refetch: fetchAuctions };
}

export function formatCountdown(endsAt: string): string {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return 'Berakhir';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatRp(value: number): string {
  return value.toLocaleString('id-ID');
}