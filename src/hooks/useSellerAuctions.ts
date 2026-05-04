'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function useSellerAuctions() {
  const { user, token } = useAuth();
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Initial fetch via Express backend ────────────────────────────────────
  useEffect(() => {
    if (!user || !token) return;

    async function fetchAuctions() {
      try {
        setError(null);
        const res = await fetch(`${API_URL}/api/auctions/seller/${user!.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) throw new Error('Gagal memuat data lelang.');
        const data: Auction[] = await res.json();
        setAuctions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      } finally {
        setLoading(false);
      }
    }

    fetchAuctions();
  }, [user, token]);

  // ── Supabase Realtime subscription ───────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    // Skip realtime jika env belum diisi
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.warn("NEXT_PUBLIC_SUPABASE_URL atau NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi di .env.local");
      return;
    }

    // Buat WebSocket connection ke Supabase Realtime
    const wsUrl = `${SUPABASE_URL.replace('https', 'wss')}/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    const socket = new WebSocket(wsUrl);

    const channelRef = `auctions:seller_id=eq.${user.id}`;
    let heartbeat: ReturnType<typeof setInterval>;

    socket.onopen = () => {
      // Join channel
      socket.send(JSON.stringify({
        topic: `realtime:${channelRef}`,
        event: 'phx_join',
        payload: {
          config: {
            broadcast: { self: false },
            presence: { key: '' },
            postgres_changes: [
              {
                event: '*',
                schema: 'public',
                table: 'auctions',
                filter: `seller_id=eq.${user.id}`,
              },
            ],
          },
        },
        ref: '1',
      }));

      // Heartbeat tiap 30 detik supaya koneksi tetap hidup
      heartbeat = setInterval(() => {
        socket.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: '0' }));
      }, 30000);
    };

    socket.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const payload = msg?.payload;
      const changeType = payload?.data?.type; // INSERT | UPDATE | DELETE
      const record: Auction = payload?.data?.record;
      const oldRecord = payload?.data?.old_record;

      if (!changeType || !record) return;

      setAuctions((prev) => {
        switch (changeType) {
          case 'INSERT':
            // Tambah lelang baru di awal list
            return [record, ...prev];

          case 'UPDATE':
            // Update data lelang yang berubah (current_bid, status, dll)
            return prev.map((a) => (a.id === record.id ? { ...a, ...record } : a));

          case 'DELETE':
            // Hapus dari list
            return prev.filter((a) => a.id !== (oldRecord?.id || record.id));

          default:
            return prev;
        }
      });
    };

    socket.onerror = (err) => {
      console.error('Realtime WS error:', err);
    };

    return () => {
      clearInterval(heartbeat);
      socket.close();
    };
  }, [user]);

  return { auctions, loading, error };
}