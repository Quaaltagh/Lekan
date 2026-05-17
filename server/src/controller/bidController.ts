import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { sendNotification } from '../lib/NotificationHelper';

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

export const submitBid = async (req: Request, res: Response): Promise<void> => {
  const { auctionId } = req.params;
  const { amount, bidder_id } = req.body;

  if (!amount || !bidder_id) {
    res.status(400).json({ error: 'amount dan bidder_id wajib diisi.' });
    return;
  }

  // ── 1. Cek auction masih aktif ──────────────────────────────────────────
  const { data: auction, error: auctionError } = await supabase
    .from('auctions')
    .select('status, current_bid, start_price, ends_at, seller_id, name')
    .eq('id', auctionId)
    .single();

  if (auctionError) { res.status(500).json({ error: auctionError.message }); return; }
  if (!auction)     { res.status(404).json({ error: 'Lelang tidak ditemukan.' }); return; }
  if (auction.status !== 'active') { res.status(400).json({ error: 'Lelang sudah berakhir.' }); return; }
  if (new Date(auction.ends_at) < new Date()) { res.status(400).json({ error: 'Waktu lelang sudah habis.' }); return; }
  if (auction.seller_id === bidder_id) { res.status(400).json({ error: 'Tidak bisa bid di lelang sendiri.' }); return; }

  const currentBid = auction.current_bid ?? auction.start_price;

  if (amount <= currentBid) {
    res.status(400).json({ error: `Bid harus lebih dari Rp ${currentBid.toLocaleString('id-ID')}` });
    return;
  }
  if (amount < currentBid + 50000) {
    res.status(400).json({ error: 'Minimum kenaikan bid adalah Rp 50.000' });
    return;
  }

  // ── 2. Cari penawar tertinggi SEBELUM bid baru masuk ───────────────────
  const { data: prevTopBid } = await supabase
    .from('bids')
    .select('bidder_id, amount')
    .eq('auction_id', auctionId)
    .order('amount', { ascending: false })
    .limit(1)
    .maybeSingle();

  console.log(`[BID] auction ${auctionId} | currentBid: ${currentBid} | incoming: ${amount} | bidder: ${bidder_id}`);
  console.log(`[BID] prevTopBid:`, prevTopBid);

  // ── 3. Cek apakah user sudah jadi penawar tertinggi ────────────────────
  if (prevTopBid && prevTopBid.bidder_id === bidder_id) {
    res.status(400).json({ error: 'Kamu sudah menjadi penawar tertinggi saat ini.' });
    return;
  }

  // ── 4. Hitung selisih escrow yang perlu dipotong ───────────────────────
  // Kalau user pernah bid sebelumnya, escrow lamanya akan direfund
  // Jadi balance hanya perlu cukup untuk selisih kenaikan
  const { data: userPrevBid } = await supabase
    .from('bids')
    .select('amount')
    .eq('auction_id', auctionId)
    .eq('bidder_id', bidder_id)
    .order('amount', { ascending: false })
    .limit(1)
    .maybeSingle();

  const userPrevEscrow   = userPrevBid?.amount ?? 0;
  const additionalEscrow = amount - userPrevEscrow;

  console.log(`[BID] userPrevEscrow: ${userPrevEscrow} | additionalEscrow: ${additionalEscrow}`);

  // ── 5. Cek & kunci saldo (hanya selisih) ──────────────────────────────
  const { data: bidderWallet } = await supabase
    .from('wallets')
    .select('id, balance, pending')
    .eq('user_id', bidder_id)
    .single();

  if (!bidderWallet) {
    res.status(400).json({ error: 'Wallet tidak ditemukan. Silakan deposit terlebih dahulu.' });
    return;
  }

  console.log(`[BID] balance: ${bidderWallet.balance} | pending: ${bidderWallet.pending} | need: ${additionalEscrow}`);

  if (bidderWallet.balance < additionalEscrow) {
    res.status(400).json({
      error: `Saldo tidak mencukupi. Dibutuhkan Rp ${additionalEscrow.toLocaleString('id-ID')} tapi saldo Rp ${bidderWallet.balance.toLocaleString('id-ID')}`,
    });
    return;
  }

  // Potong balance → tambah pending sebesar selisih
  const { error: escrowError } = await supabase
    .from('wallets')
    .update({
      balance: bidderWallet.balance - additionalEscrow,
      pending: (bidderWallet.pending ?? 0) + additionalEscrow,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', bidder_id);

  if (escrowError) {
    console.error('[BID] escrow error:', escrowError.message);
    res.status(500).json({ error: 'Gagal mengunci saldo: ' + escrowError.message });
    return;
  }

  // ── 6. Refund escrow penawar tertinggi sebelumnya ──────────────────────
  if (prevTopBid && prevTopBid.bidder_id !== bidder_id) {
    const { data: prevWallet } = await supabase
      .from('wallets')
      .select('balance, pending')
      .eq('user_id', prevTopBid.bidder_id)
      .single();

    console.log(`[BID] refund to ${prevTopBid.bidder_id} | amount: ${prevTopBid.amount}`);

    if (prevWallet) {
      const { error: refundError } = await supabase
        .from('wallets')
        .update({
          balance: (prevWallet.balance ?? 0) + prevTopBid.amount,
          pending: Math.max(0, (prevWallet.pending ?? 0) - prevTopBid.amount),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', prevTopBid.bidder_id);

      if (refundError) {
        console.error('[BID] refund error:', refundError.message);
        // Rollback escrow penawar baru
        await supabase.from('wallets').update({
          balance: bidderWallet.balance,
          pending: bidderWallet.pending ?? 0,
          updated_at: new Date().toISOString(),
        }).eq('user_id', bidder_id);

        res.status(500).json({ error: 'Gagal refund penawar sebelumnya.' });
        return;
      }

      await supabase.from('transactions').insert({
        user_id: prevTopBid.bidder_id,
        type: 'refund',
        amount: prevTopBid.amount,
        description: `Refund bid kalah — lelang #${auctionId}`,
        auction_id: auctionId,
        status: 'completed',
      });
    }
  }

  // ── 7. Insert bid baru ──────────────────────────────────────────────────
  const { data: bid, error: bidError } = await supabase
    .from('bids')
    .insert({ auction_id: auctionId, bidder_id, amount })
    .select()
    .single();

  if (bidError) {
    console.error('[BID] insert error:', bidError.message);
    // Rollback escrow
    await supabase.from('wallets').update({
      balance: bidderWallet.balance,
      pending: bidderWallet.pending ?? 0,
      updated_at: new Date().toISOString(),
    }).eq('user_id', bidder_id);

    res.status(500).json({ error: bidError.message });
    return;
  }

  // ── 8. Update current_bid di auctions ──────────────────────────────────
  const { data: updatedAuction, error: updateAuctionError } = await supabase
    .from('auctions')
    .update({ current_bid: amount, updated_at: new Date().toISOString() })
    .eq('id', auctionId)
    .select('current_bid')
    .single();

  if (updateAuctionError) {
    console.error('[BID] CRITICAL — update current_bid gagal:', updateAuctionError.message);
    // FIX error .catch() — gunakan promise biasa, bukan chain di supabase builder
    try {
      await supabase.rpc('sync_auction_current_bid', { p_auction_id: auctionId });
    } catch (rpcErr) {
      console.error('[BID] sync RPC gagal:', rpcErr);
    }
  } else {
    console.log(`[BID] success | new current_bid: ${updatedAuction?.current_bid}`);
  }
  
  await sendNotification(
    auction.seller_id,
    'lelang',
    `Tawaran Baru: ${auction.name}`,
    `Ada tawaran baru sebesar Rp ${amount.toLocaleString('id-ID')} pada lelang kamu.`
  );
  
  console.log(`[BID] success | new current_bid: ${amount}`);
  res.status(201).json(bid);
};