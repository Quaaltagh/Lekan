import { supabase } from '../config/supabaseClient';

// ── Settlement satu lelang ──────────────────────────────────────────────────
async function settleAuction(auctionId: string, sellerId: string) {
  console.log(`[AuctionExpiry] Settling auction ${auctionId}...`);

  // 1. Cari pemenang (bid tertinggi)
  const { data: topBid } = await supabase
    .from('bids')
    .select('bidder_id, amount')
    .eq('auction_id', auctionId)
    .order('amount', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Tidak ada bid → cancel, tidak ada settlement
  if (!topBid) {
    await supabase
      .from('auctions')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', auctionId);
    console.log(`[AuctionExpiry] Auction ${auctionId} cancelled — tidak ada penawar.`);
    return;
  }

  const { bidder_id: winnerId, amount: finalPrice } = topBid;

  // 2. Pindahkan dana dari pending pemenang → pending seller
  //    (dana sudah dikunci di pending saat bid, tidak perlu potong balance lagi)
  const { data: winnerWallet } = await supabase
    .from('wallets')
    .select('pending')
    .eq('user_id', winnerId)
    .single();

  if (!winnerWallet) {
    console.error(`[AuctionExpiry] Wallet pemenang ${winnerId} tidak ditemukan.`);
    return;
  }

  // Kurangi pending pemenang
  await supabase
    .from('wallets')
    .update({
      pending: Math.max(0, (winnerWallet.pending ?? 0) - finalPrice),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', winnerId);

  // Catat transaksi purchase untuk pemenang
  await supabase.from('transactions').insert({
    user_id: winnerId,
    type: 'purchase',
    amount: finalPrice,
    description: `Pembelian lelang #${auctionId}`,
    auction_id: auctionId,
    status: 'completed',
  });

  // 3. Masukkan ke pending seller (menunggu konfirmasi/release admin)
  const { data: sellerWallet } = await supabase
    .from('wallets')
    .select('pending')
    .eq('user_id', sellerId)
    .single();

  if (sellerWallet) {
    await supabase
      .from('wallets')
      .update({
        pending: (sellerWallet.pending ?? 0) + finalPrice,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', sellerId);
  }

  // Catat transaksi payout untuk seller (pending sampai di-release)
  await supabase.from('transactions').insert({
    user_id: sellerId,
    type: 'auction_payout',
    amount: finalPrice,
    description: `Payout lelang #${auctionId}`,
    auction_id: auctionId,
    status: 'pending',
  });

  // 4. Finalisasi auction
  await supabase
    .from('auctions')
    .update({
      status: 'done',
      final_price: finalPrice,
      paid: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', auctionId);

  console.log(`[AuctionExpiry] Auction ${auctionId} settled — pemenang: ${winnerId}, harga: Rp ${finalPrice.toLocaleString('id-ID')}`);
}

// ── Main cron job ───────────────────────────────────────────────────────────
export async function checkExpiredAuctions() {
  const now = new Date().toISOString();
  console.log('[AuctionExpiry] Cek pada:', now);

  // Ambil dulu sebelum diupdate, supaya bisa settle satu-satu
  const { data: expiredAuctions, error } = await supabase
    .from('auctions')
    .select('id, name, seller_id')
    .eq('status', 'active')
    .lt('ends_at', now);

  if (error) {
    console.error('[AuctionExpiry] Error fetch:', error.message);
    return;
  }

  if (!expiredAuctions || expiredAuctions.length === 0) {
    console.log('[AuctionExpiry] Tidak ada lelang yang perlu ditutup.');
    return;
  }

  console.log(`[AuctionExpiry] ${expiredAuctions.length} lelang expired:`, expiredAuctions.map(a => a.name));

  // Settle tiap auction satu per satu (tidak paralel, hindari race condition)
  for (const auction of expiredAuctions) {
    await settleAuction(auction.id, auction.seller_id);
  }
}

export function startAuctionExpiryJob(intervalMs = 60_000) {
  console.log('[AuctionExpiry] Job started — cek tiap 1 menit');
  checkExpiredAuctions();
  return setInterval(checkExpiredAuctions, intervalMs);
}