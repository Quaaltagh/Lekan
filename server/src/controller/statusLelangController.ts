import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

// GET /api/status-lelang/:userId
// Return semua lelang aktif yang sedang di-bid user, dengan status winning/outbid
export const getActiveBidStatus = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({ error: 'userId wajib diisi.' });
    return;
  }

  // ── 1. Cari semua auction_id aktif yang pernah di-bid user ─────────────
  const { data: userBids, error: bidsError } = await supabase
    .from('bids')
    .select('auction_id, amount')
    .eq('bidder_id', userId);

  if (bidsError) {
    res.status(500).json({ error: bidsError.message });
    return;
  }

  if (!userBids || userBids.length === 0) {
    res.status(200).json({ data: [], total: 0 });
    return;
  }

  // Cari bid tertinggi user per auction
  const userTopBidMap = new Map<string, number>();
  for (const bid of userBids) {
    const current = userTopBidMap.get(bid.auction_id) ?? 0;
    if (bid.amount > current) userTopBidMap.set(bid.auction_id, bid.amount);
  }
  const auctionIds = Array.from(userTopBidMap.keys());

  // ── 2. Fetch detail auction — hanya yang masih active ──────────────────
  const { data: auctions, error: auctionsError } = await supabase
    .from('auctions')
    .select('id, name, weight_kg, image_url, current_bid, start_price, ends_at, seller_id')
    .in('id', auctionIds)
    .eq('status', 'active')
    .order('ends_at', { ascending: true }); // yang mau habis duluan di atas

  if (auctionsError) {
    res.status(500).json({ error: auctionsError.message });
    return;
  }

  if (!auctions || auctions.length === 0) {
    res.status(200).json({ data: [], total: 0 });
    return;
  }

  // ── 3. Shape response ──────────────────────────────────────────────────
  const shaped = auctions.map(auction => {
    const userBid   = userTopBidMap.get(auction.id) ?? 0;
    const topBid    = auction.current_bid ?? auction.start_price;
    const isWinning = userBid >= topBid; // user adalah penawar tertinggi

    // LOT: 3 huruf species-ish dari nama + 3 digit terakhir UUID
    const shortId = auction.id.replace(/-/g, '').slice(-4).toUpperCase();
    const lotPrefix = auction.name.slice(0, 2).toUpperCase();

    return {
      id:            auction.id,
      name:          auction.name,
      lot:           `${lotPrefix}-${shortId}`,
      weight:        `${auction.weight_kg}KG`,
      image:         auction.image_url ?? '',
      highestBid:    topBid.toLocaleString('id-ID'),
      yourBid:       userBid.toLocaleString('id-ID'),
      status:        isWinning ? 'winning' : 'outbid',
      endsAt:        auction.ends_at, // kirim raw ISO, countdown dihitung di frontend
    };
  });

  res.status(200).json({
    data:  shaped,
    total: shaped.length,
  });
};