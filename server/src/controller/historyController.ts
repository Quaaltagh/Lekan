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
  // Pakai distinct supaya satu auction tidak muncul berkali-kali
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

  // ── 2. Fetch auction detail + seller profile ───────────────────────────
  // Supabase tidak support join langsung ke auth.users, jadi kita fetch profiles terpisah
  let auctionQuery = supabase
    .from('auctions')
    .select('id, name, image_url, seller_id, final_price, current_bid, ends_at, status, updated_at')
    .in('id', auctionIds)
    .in('status', ['done', 'cancelled']); // hanya yang sudah selesai

  // Filter tanggal
  if (startDate) {
    auctionQuery = auctionQuery.gte('updated_at', new Date(startDate as string).toISOString());
  }
  if (endDate) {
    // End of day
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

  // Map: auction_id → top bidder
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

  // ── 5. Shape response sesuai HistoryItemProps frontend ─────────────────
  let shaped = auctions.map(auction => {
    const winner = winnerMap.get(auction.id);
    const isWon = winner?.bidder_id === userId;
    const seller = sellerMap.get(auction.seller_id);
    const userTopBid = highestBidPerAuction.get(auction.id) ?? 0;

    // finalPrice: kalau menang → pakai final_price lelang, kalau kalah → pakai bid tertinggi user
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

  // ── 6. Filter search (dilakukan di memory karena join sudah selesai) ───
  if (search) {
    const q = (search as string).toLowerCase();
    shaped = shaped.filter(item =>
      item.name.toLowerCase().includes(q) ||
      item.vessel.toLowerCase().includes(q) ||
      item.seller.toLowerCase().includes(q)
    );
  }

  // Filter status Won/Lost
  if (status && status !== 'All') {
    shaped = shaped.filter(item => item.status === status);
  }

  // ── 7. Pagination ──────────────────────────────────────────────────────
  const total = shaped.length;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const totalPages = Math.ceil(total / limitNum);
  const paginated = shaped.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.status(200).json({
    data: paginated,
    total,
    page: pageNum,
    totalPages,
  });
};