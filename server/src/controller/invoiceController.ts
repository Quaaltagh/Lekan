import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

// ── GET /api/invoice/:auctionId ───────────────────────────────────────────────
// Ambil data invoice untuk satu auction yang sudah selesai (done/completed)
// Data digabung dari: auctions, profiles (seller & winner), bids, logistics
export const getInvoiceByAuction = async (req: Request, res: Response): Promise<void> => {
  const { auctionId } = req.params;

  if (!auctionId) {
    res.status(400).json({ error: 'auctionId wajib diisi.' });
    return;
  }

  // 1. Ambil data auction
  const { data: auction, error: auctionError } = await supabase
    .from('auctions')
    .select('*')
    .eq('id', auctionId)
    .single();

  if (auctionError || !auction) {
    res.status(404).json({ error: 'Lelang tidak ditemukan.' });
    return;
  }

  // 2. Ambil bid tertinggi (pemenang)
  const { data: bids } = await supabase
    .from('bids')
    .select('*')
    .eq('auction_id', auctionId)
    .order('amount', { ascending: false });

  const winnerBid = bids?.[0] ?? null;

  // 3. Ambil profil seller
  const { data: seller } = await supabase
    .from('profiles')
    .select('id, full_name, vessel_name, verified, bank_name, bank_account')
    .eq('id', auction.seller_id)
    .single();

  // 4. Ambil profil winner (buyer) — kalau ada
  let winner = null;
  if (winnerBid?.bidder_id) {
    const { data: winnerProfile } = await supabase
      .from('profiles')
      .select('id, full_name, verified')
      .eq('id', winnerBid.bidder_id)
      .single();
    winner = winnerProfile;
  }

  // 5. Ambil data logistics — kalau ada
  const { data: logistics } = await supabase
    .from('logistics')
    .select('*')
    .eq('auction_id', auctionId)
    .maybeSingle();

  // 6. Ambil data invoice dari tabel invoices — kalau ada
  const { data: invoiceRecord } = await supabase
    .from('invoices')
    .select('*')
    .eq('auction_id', auctionId)
    .maybeSingle();

  // 7. Hitung nilai keuangan
  const finalPrice     = auction.final_price ?? auction.current_bid ?? auction.start_price ?? 0;
  const platformFeeRate = 0.02; // 2%
  const platformFee    = Math.round(finalPrice * platformFeeRate);
  const logisticsFee   = logistics ? 120000 : 0; // default jika belum ada data real
  const grandTotal     = finalPrice + platformFee + logisticsFee;

  // 8. Susun response
  res.status(200).json({
    invoice_number: invoiceRecord?.id
      ? `INV-${invoiceRecord.id.slice(0, 8).toUpperCase()}`
      : `INV-${auctionId.slice(0, 8).toUpperCase()}`,
    status:       auction.paid ? 'paid' : 'unpaid',
    created_at:   invoiceRecord?.created_at ?? auction.updated_at ?? auction.created_at,
    ends_at:      auction.ends_at,

    auction: {
      id:         auction.id,
      name:       auction.name,
      species:    auction.species,
      grade:      auction.grade,
      weight_kg:  auction.weight_kg,
      image_url:  auction.image_url,
      status:     auction.status,
    },

    seller: seller ? {
      id:          seller.id,
      full_name:   seller.full_name,
      vessel_name: seller.vessel_name,
      verified:    seller.verified,
      bank_name:   seller.bank_name,
      bank_account: seller.bank_account,
    } : null,

    winner: winner ? {
      id:        winner.id,
      full_name: winner.full_name,
      verified:  winner.verified,
    } : null,

    bids: (bids ?? []).map(b => ({
      id:         b.id,
      bidder_id:  b.bidder_id,
      amount:     b.amount,
      created_at: b.created_at,
    })),

    logistics: logistics ? {
      id:                 logistics.id,
      status:             logistics.status,
      courier:            logistics.courier,
      tracking_number:    logistics.tracking_number,
      pickup_address:     logistics.pickup_address,
      delivery_address:   logistics.delivery_address,
      estimated_arrival:  logistics.estimated_arrival,
    } : null,

    financials: {
      subtotal:      finalPrice,
      platform_fee:  platformFee,
      logistics_fee: logisticsFee,
      grand_total:   grandTotal,
    },
  });
};