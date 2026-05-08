import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

// GET /api/bids/:auctionId — ambil semua bid untuk lelang tertentu
export const getBidsByAuction = async (req: Request, res: Response): Promise<void> => {
  const { auctionId } = req.params;

  const { data, error } = await supabase
    .from('bids')
    .select('*')
    .eq('auction_id', auctionId)
    .order('amount', { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(200).json(data);
};

// POST /api/bids/:auctionId — submit bid baru
export const submitBid = async (req: Request, res: Response): Promise<void> => {
  const { auctionId } = req.params;
  const { amount, bidder_id } = req.body;

  if (!amount || !bidder_id) {
    res.status(400).json({ error: 'amount dan bidder_id wajib diisi.' });
    return;
  }

  // Cek auction masih aktif
  const { data: auction } = await supabase
    .from('auctions')
    .select('status, current_bid, start_price, ends_at')
    .eq('id', auctionId)
    .single();

  if (!auction) { res.status(404).json({ error: 'Lelang tidak ditemukan.' }); return; }
  if (auction.status !== 'active') { res.status(400).json({ error: 'Lelang sudah berakhir.' }); return; }
  if (new Date(auction.ends_at) < new Date()) { res.status(400).json({ error: 'Waktu lelang sudah habis.' }); return; }

  const currentBid = auction.current_bid ?? auction.start_price;
  if (amount <= currentBid) {
    res.status(400).json({ error: `Bid harus lebih dari Rp ${currentBid.toLocaleString('id-ID')}` });
    return;
  }
  if (amount < currentBid + 50000) {
    res.status(400).json({ error: 'Minimum kenaikan bid adalah Rp 50.000' });
    return;
  }

  // Insert bid
  const { data: bid, error: bidError } = await supabase
    .from('bids')
    .insert({ auction_id: auctionId, bidder_id, amount })
    .select()
    .single();

  if (bidError) { res.status(500).json({ error: bidError.message }); return; }

  // Update current_bid di tabel auctions
  await supabase
    .from('auctions')
    .update({ current_bid: amount, updated_at: new Date().toISOString() })
    .eq('id', auctionId);

  res.status(201).json(bid);
};