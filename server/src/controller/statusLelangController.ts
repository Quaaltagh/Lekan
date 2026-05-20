import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

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

  if (bidsError) { res.status(500).json({ error: bidsError.message }); return; }
  if (!userBids || userBids.length === 0) {
    res.status(200).json({ data: [], total: 0 });
    return;
  }

  // Bid tertinggi user per auction
  const userTopBidMap = new Map<string, number>();
  for (const bid of userBids) {
    const current = userTopBidMap.get(bid.auction_id) ?? 0;
    if (bid.amount > current) userTopBidMap.set(bid.auction_id, bid.amount);
  }
  const auctionIds = Array.from(userTopBidMap.keys());

  // ── 2. Fetch auction aktif saja ────────────────────────────────────────
  const { data: auctions, error: auctionsError } = await supabase
    .from('auctions')
    .select('id, name, weight_kg, image_url, current_bid, start_price, ends_at, seller_id')
    .in('id', auctionIds)
    .eq('status', 'active')
    .order('ends_at', { ascending: true });

  if (auctionsError) { res.status(500).json({ error: auctionsError.message }); return; }
  if (!auctions || auctions.length === 0) {
    res.status(200).json({ data: [], total: 0 });
    return;
  }

  // ── 3. Fetch bid tertinggi GLOBAL per auction (siapa pemenang saat ini) ─
  const { data: topBids, error: topBidsError } = await supabase
    .from('bids')
    .select('auction_id, bidder_id, amount')
    .in('auction_id', auctionIds)
    .order('amount', { ascending: false });

  if (topBidsError) { res.status(500).json({ error: topBidsError.message }); return; }

  // Map: auction_id → { bidder_id, amount } bid tertinggi secara global
  const globalTopBidMap = new Map<string, { bidder_id: string; amount: number }>();
  for (const bid of topBids ?? []) {
    if (!globalTopBidMap.has(bid.auction_id)) {
      // Karena diurutkan descending, yang pertama = tertinggi
      globalTopBidMap.set(bid.auction_id, {
        bidder_id: bid.bidder_id,
        amount: bid.amount,
      });
    }
  }

  // ── 4. Shape response ──────────────────────────────────────────────────
  const shaped = auctions.map(auction => {
    const userBidAmount = userTopBidMap.get(auction.id) ?? 0;
    const globalTop     = globalTopBidMap.get(auction.id);

    // FIX: isWinning = user adalah pemegang bid tertinggi saat ini
    const isWinning = globalTop?.bidder_id === userId;

    // highestBid = current_bid dari auction (selalu akurat)
    const highestBid = auction.current_bid ?? auction.start_price;

    const shortId   = auction.id.replace(/-/g, '').slice(-4).toUpperCase();
    const lotPrefix = auction.name.slice(0, 2).toUpperCase();

    return {
      id:          auction.id,
      name:        auction.name,
      lot:         `${lotPrefix}-${shortId}`,
      weight:      `${auction.weight_kg}KG`,
      image:       auction.image_url ?? '',
      highestBid:  highestBid.toLocaleString('id-ID'),
      yourBid:     userBidAmount.toLocaleString('id-ID'),
      status:      isWinning ? 'winning' : 'outbid',
      endsAt:      auction.ends_at,
    };
  });

  res.status(200).json({ data: shaped, total: shaped.length });
};