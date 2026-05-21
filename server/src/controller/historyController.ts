import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

const formatDate = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = String(date.getDate()).padStart(2, '0');
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
};

// GET /api/history/:userId
// Return semua lelang yang pernah di-bid user, dengan status Won/Lost
export const getBidHistory = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { search, status, startDate, endDate, page = '1', limit = '10' } = req.query;

  if (!userId) {
    res.status(400).json({ error: 'userId wajib diisi.' });
    return;
  }

  // ── 1. Ambil semua auction_id yang pernah di-bid user ini ──────────────
  const { data: userBids, error: bidsError } = await supabase
    .from('bids')
    .select('auction_id, amount')
    .eq('bidder_id', userId);

  if (bidsError) {
    res.status(500).json({ error: bidsError.message });
    return;
  }

  if (!userBids || userBids.length === 0) {
    res.status(200).json({ data: [], total: 0, page: 1, totalPages: 0 });
    return;
  }

  // Cari bid tertinggi user per auction
  const highestBidPerAuction = new Map<string, number>();
  for (const bid of userBids) {
    const current = highestBidPerAuction.get(bid.auction_id) ?? 0;
    if (bid.amount > current) {
      highestBidPerAuction.set(bid.auction_id, bid.amount);
    }
  }
  const auctionIds = Array.from(highestBidPerAuction.keys());

  // ── 2. Fetch auction detail ───────────────────────────────────────────
  let auctionQuery = supabase
    .from('auctions')
    .select('id, name, image_url, seller_id, final_price, current_bid, ends_at, status, updated_at')
    .in('id', auctionIds)
    .in('status', ['done', 'cancelled']);

  if (startDate) {
    auctionQuery = auctionQuery.gte('updated_at', new Date(startDate as string).toISOString());
  }
  if (endDate) {
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);
    auctionQuery = auctionQuery.lte('updated_at', end.toISOString());
  }

  auctionQuery = auctionQuery.order('updated_at', { ascending: false });

  const { data: auctions, error: auctionsError } = await auctionQuery;

  if (auctionsError) {
    res.status(500).json({ error: auctionsError.message });
    return;
  }

  if (!auctions || auctions.length === 0) {
    res.status(200).json({ data: [], total: 0, page: 1, totalPages: 0 });
    return;
  }

  // ── 3. Fetch winner per auction (bid tertinggi secara global) ──────────
  const { data: topBids } = await supabase
    .from('bids')
    .select('auction_id, bidder_id, amount')
    .in('auction_id', auctionIds)
    .order('amount', { ascending: false });

  const winnerMap = new Map<string, { bidder_id: string; amount: number }>();
  if (topBids) {
    for (const bid of topBids) {
      if (!winnerMap.has(bid.auction_id)) {
        winnerMap.set(bid.auction_id, { bidder_id: bid.bidder_id, amount: bid.amount });
      }
    }
  }

  // ── 4. Fetch seller profiles ───────────────────────────────────────────
  const sellerIds = [...new Set(auctions.map(a => a.seller_id))];
  const { data: sellerProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, vessel_name')
    .in('id', sellerIds);

  const sellerMap = new Map<string, { full_name: string; vessel_name: string }>();
  if (sellerProfiles) {
    for (const p of sellerProfiles) {
      sellerMap.set(p.id, { full_name: p.full_name, vessel_name: p.vessel_name });
    }
  }

  // ── 5. Shape response ─────────────────────────────────────────────
  let shaped = auctions.map(auction => {
    const winner = winnerMap.get(auction.id);
    const isWon = winner?.bidder_id === userId;
    const seller = sellerMap.get(auction.seller_id);
    const userTopBid = highestBidPerAuction.get(auction.id) ?? 0;

    const displayPrice = isWon
      ? (auction.final_price ?? winner?.amount ?? userTopBid)
      : (winner?.amount ?? userTopBid);

    return {
      id: auction.id,
      name: auction.name,
      image: auction.image_url ?? '',
      vessel: seller?.vessel_name ?? '-',
      seller: seller?.full_name ?? 'Nelayan',
      finalPrice: displayPrice.toLocaleString('id-ID'),
      date: formatDate(new Date(auction.updated_at)),
      status: isWon ? 'Won' : 'Lost',
    };
  });

  // ── 6. Filter search ───────────────────────────────────────────────
  if (search) {
    const q = (search as string).toLowerCase();
    shaped = shaped.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.vessel.toLowerCase().includes(q) ||
      item.seller.toLowerCase().includes(q)
    );
  }

  if (status && status !== 'All') {
    shaped = shaped.filter(item => item.status === status);
  }

  // ── 7. Pagination ──────────────────────────────────────────────────────
  const total = shaped.length;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const totalPages = Math.ceil(total / limitNum);
  const paginated = shaped.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.status(200).json({ data: paginated, total, page: pageNum, totalPages });
};

// GET /api/history/detail/:auctionId
// Return detail satu lelang untuk halaman detail history
export const getAuctionHistoryDetail = async (req: Request, res: Response): Promise<void> => {
  const { auctionId } = req.params;

  if (!auctionId) {
    res.status(400).json({ error: 'auctionId wajib diisi.' });
    return;
  }

  // ── 1. Fetch auction ───────────────────────────────────────────────────
  const { data: auction, error: auctionError } = await supabase
    .from('auctions')
    .select('id, name, weight_kg, grade, image_url, status, start_price, final_price, current_bid, ends_at, created_at, seller_id')
    .eq('id', auctionId)
    .single();

  if (auctionError || !auction) {
    res.status(404).json({ error: 'Lelang tidak ditemukan.' });
    return;
  }

  // ── 2. Fetch bids + bidder names ───────────────────────────────────────
  const { data: bids } = await supabase
    .from('bids')
    .select('id, bidder_id, amount, created_at')
    .eq('auction_id', auctionId)
    .order('amount', { ascending: false });

  // Fetch bidder profiles
  const bidderIds = [...new Set((bids ?? []).map(b => b.bidder_id))];
  const { data: bidderProfiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', bidderIds);

  const bidderMap = new Map<string, string>();
  if (bidderProfiles) {
    for (const p of bidderProfiles) bidderMap.set(p.id, p.full_name ?? 'Pembeli');
  }

  const shapedBids = (bids ?? []).map(b => ({
    id: b.id,
    bidder_id: b.bidder_id,
    bidder_name: bidderMap.get(b.bidder_id) ?? 'Pembeli',
    amount: b.amount,
    created_at: b.created_at,
  }));

  // ── 3. Determine winner ────────────────────────────────────────────────
  const topBid = shapedBids[0] ?? null;
  let winner = null;
  if (topBid && ['done', 'cancelled'].includes(auction.status) === false || auction.status === 'done') {
    const { data: winnerProfile } = await supabase
      .from('profiles')
      .select('id, full_name, phone, verified')
      .eq('id', topBid.bidder_id)
      .single();

    if (winnerProfile) {
      winner = {
        id: winnerProfile.id,
        name: winnerProfile.full_name ?? 'Pembeli',
        phone: winnerProfile.phone,
        verified: winnerProfile.verified ?? false,
      };
    }
  }

  // ── 4. Fetch seller profile ────────────────────────────────────────────
  const { data: sellerProfile } = await supabase
    .from('profiles')
    .select('id, full_name, vessel_name, verified')
    .eq('id', auction.seller_id)
    .single();

  const seller = sellerProfile
    ? {
        id: sellerProfile.id,
        name: sellerProfile.full_name ?? 'Nelayan',
        vessel_name: sellerProfile.vessel_name,
        verified: sellerProfile.verified ?? false,
      }
    : null;

  // ── 5. Fetch logistics ─────────────────────────────────────────────────
  const { data: logistics } = await supabase
    .from('logistics')
    .select('id, status, pickup_address, delivery_address, courier, tracking_number, estimated_arrival')
    .eq('auction_id', auctionId)
    .maybeSingle();

  // ── 6. Build escrow info ───────────────────────────────────────────────
  // Ambil dari transactions: ada pembayaran + apakah sudah payout ke seller
  const { data: transactions } = await supabase
    .from('transactions')
    .select('type, amount, status')
    .eq('auction_id', auctionId);

  const escrowAmount = auction.final_price ?? auction.current_bid ?? 0;
  const isReleased = (transactions ?? []).some(
    t => t.type === 'auction_payout' && t.status === 'completed'
  );

  // ── 7. Respond ─────────────────────────────────────────────────────────
  res.status(200).json({
    id: auction.id,
    name: auction.name,
    weight_kg: auction.weight_kg,
    grade: auction.grade,
    image_url: auction.image_url,
    status: auction.status,
    start_price: auction.start_price,
    final_price: auction.final_price ?? auction.current_bid ?? 0,
    ends_at: auction.ends_at,
    created_at: auction.created_at,
    winner,
    seller,
    bids: shapedBids,
    logistics: logistics ?? null,
    escrow: {
      amount: escrowAmount,
      is_released: isReleased,
    },
  });
};