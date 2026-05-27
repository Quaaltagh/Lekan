import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { sendNotification } from '../lib/NotificationHelper';
import { calculateEstimatedArrival } from '../lib/islandEstimator';

// ── Helper: buat record logistik default ─────────────────────────────────────
async function buildAndInsertLogistics(params: {
  auctionId: string;
  sellerId: string;
  winnerId: string | null;
  pickupAddress: string;
  deliveryAddress: string;
  selectFields: string;
}) {
  const { auctionId, sellerId, winnerId, pickupAddress, deliveryAddress, selectFields } = params;

  const estimatedArrival = calculateEstimatedArrival(pickupAddress, deliveryAddress);

  return supabase
    .from('logistics')
    .insert({
      auction_id:        auctionId,
      seller_id:         sellerId,
      buyer_id:          winnerId,
      status:            'pending',
      pickup_address:    pickupAddress,
      delivery_address:  deliveryAddress,
      destination:       deliveryAddress,
      courier:           'Maritime Express',
      tracking_number:   `LEKAN-TRK-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
      estimated_arrival: estimatedArrival,
    })
    .select(selectFields)
    .single();
}

// ── Helper: ambil alamat dari profiles ───────────────────────────────────────
async function getAddress(userId: string | null): Promise<string> {
  if (!userId) return '';
  const { data } = await supabase
    .from('profiles')
    .select('address')
    .eq('id', userId)
    .maybeSingle();
  return data?.address || '';
}

// ── Helper: ambil winner dari bids ───────────────────────────────────────────
async function getWinnerId(auctionId: string): Promise<string | null> {
  const { data } = await supabase
    .from('bids')
    .select('bidder_id')
    .eq('auction_id', auctionId)
    .order('amount', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.bidder_id ?? null;
}

// ── GET /api/logistics/seller/:sellerId ──────────────────────────────────────
export const getSellerLogistics = async (req: Request, res: Response): Promise<void> => {
  const { sellerId } = req.params;

  try {
    const { data: doneAuctions, error: auctionsError } = await supabase
      .from('auctions')
      .select('id, seller_id, name, final_price')
      .eq('seller_id', sellerId)
      .eq('status', 'done');

    if (auctionsError) { res.status(500).json({ error: auctionsError.message }); return; }

    const { data: existingLogistics, error: existingError } = await supabase
      .from('logistics')
      .select('auction_id')
      .eq('seller_id', sellerId);

    if (existingError) { res.status(500).json({ error: existingError.message }); return; }

    const existingAuctionIds = new Set((existingLogistics || []).map(l => l.auction_id));
    const sellerAddress = await getAddress(sellerId);

    // Self-healing: buat logistik yang belum ada
    for (const auction of doneAuctions || []) {
      if (!existingAuctionIds.has(auction.id)) {
        const winnerId     = await getWinnerId(auction.id);
        const buyerAddress = await getAddress(winnerId);

        await buildAndInsertLogistics({
          auctionId:       auction.id,
          sellerId,
          winnerId,
          pickupAddress:   sellerAddress,
          deliveryAddress: buyerAddress,
          selectFields:    'id',
        });
      }
    }

    const { data, error } = await supabase
      .from('logistics')
      .select('*, auctions(name, weight_kg, image_url)')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) { res.status(500).json({ error: error.message }); return; }

    const active:  any[] = [];
    const history: any[] = [];
    for (const item of data || []) {
      item.status === 'delivered' ? history.push(item) : active.push(item);
    }

    res.status(200).json({ active, history });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Terjadi kesalahan internal.' });
  }
};

// ── Helper: fetch logistics + auction join ────────────────────────────────────
const getLogisticsWithBuyer = (id: string) =>
  supabase
    .from('logistics')
    .select('*, auctions(name)')
    .eq('id', id)
    .single();

// ── PATCH /api/logistics/:id/depart ──────────────────────────────────────────
export const departShip = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { data: logistics, error } = await getLogisticsWithBuyer(id);

  if (error || !logistics) { res.status(404).json({ error: 'Data logistik tidak ditemukan.' }); return; }
  if (logistics.status !== 'pending') { res.status(400).json({ error: 'Status harus pending sebelum bisa berangkat.' }); return; }

  const { data: updated, error: updateError } = await supabase
    .from('logistics')
    .update({ status: 'shipped', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (updateError) { res.status(500).json({ error: updateError.message }); return; }

  if (logistics.buyer_id) {
    await sendNotification(
      logistics.buyer_id, 'kapal', 'Kapal Sudah Berangkat',
      `Kapal untuk "${logistics.auctions?.name ?? 'pesanan kamu'}" telah berangkat dan sedang dalam perjalanan.`
    );
  }

  res.status(200).json(updated);
};

// ── PATCH /api/logistics/:id/arrived ─────────────────────────────────────────
export const arrivedShip = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  // Ambil data lengkap termasuk estimated_arrival
  const { data: logistics, error } = await supabase
    .from('logistics')
    .select('*, auctions(name)')
    .eq('id', id)
    .single();

  if (error || !logistics) { res.status(404).json({ error: 'Data logistik tidak ditemukan.' }); return; }
  if (logistics.status !== 'shipped') { res.status(400).json({ error: 'Status harus shipped sebelum bisa tiba.' }); return; }

  // ── Validasi estimasi waktu tiba ──────────────────────────────────────────
  if (logistics.estimated_arrival) {
    const now       = new Date();
    const estimated = new Date(logistics.estimated_arrival);
    if (now < estimated) {
      const diffMs    = estimated.getTime() - now.getTime();
      const diffDays  = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.ceil((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      const timeLabel = diffDays > 0
        ? `${diffDays} hari ${diffHours} jam`
        : `${diffHours} jam`;

      res.status(400).json({
        error: `Kapal belum bisa dikonfirmasi tiba. Estimasi tiba dalam ${timeLabel} lagi.`,
        estimated_arrival: logistics.estimated_arrival,
        can_confirm_at: logistics.estimated_arrival,
      });
      return;
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from('logistics')
    .update({ status: 'arrived', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (updateError) { res.status(500).json({ error: updateError.message }); return; }

  if (logistics.buyer_id) {
    await sendNotification(
      logistics.buyer_id, 'kapal', 'Kapal Sudah Tiba',
      `Kapal untuk "${logistics.auctions?.name ?? 'pesanan kamu'}" telah tiba di pelabuhan tujuan. Silakan konfirmasi penerimaan.`
    );
  }

  res.status(200).json(updated);
};

// ── PATCH /api/logistics/:id/delivered ───────────────────────────────────────
export const deliveredShip = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { data: logistics, error } = await getLogisticsWithBuyer(id);

  if (error || !logistics) { res.status(404).json({ error: 'Data logistik tidak ditemukan.' }); return; }
  if (logistics.status !== 'arrived') { res.status(400).json({ error: 'Status harus arrived sebelum bisa diselesaikan.' }); return; }

  const { data: updated, error: updateError } = await supabase
    .from('logistics')
    .update({ status: 'delivered', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (updateError) { res.status(500).json({ error: updateError.message }); return; }

  const auctionName = logistics.auctions?.name ?? 'pesanan kamu';

  if (logistics.buyer_id) {
    await sendNotification(logistics.buyer_id, 'transaksi', 'Transaksi Selesai',
      `Pesanan "${auctionName}" telah dikonfirmasi selesai. Terima kasih sudah bertransaksi di LEKAN.`
    );
  }
  if (logistics.seller_id) {
    await sendNotification(logistics.seller_id, 'transaksi', 'Pengiriman Selesai',
      `Pengiriman untuk "${auctionName}" telah dikonfirmasi diterima oleh pembeli.`
    );
  }

  res.status(200).json(updated);
};

// ── GET /api/logistics/auction/:auctionId ────────────────────────────────────
export const getLogisticsByAuctionId = async (req: Request, res: Response): Promise<void> => {
  const { auctionId } = req.params;

  const JOIN_FIELDS = `
    *,
    auctions (
      name, weight_kg, image_url, status, final_price, grade, seller_id, ends_at, species, created_at
    )
  `;

  let { data: logistics, error } = await supabase
    .from('logistics')
    .select(JOIN_FIELDS)
    .eq('auction_id', auctionId)
    .maybeSingle();

  if (error) { res.status(500).json({ error: error.message }); return; }

  if (!logistics) {
    const { data: auction, error: aError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', auctionId)
      .single();

    if (aError || !auction) { res.status(404).json({ error: 'Lelang tidak ditemukan.' }); return; }

    if (auction.status !== 'done') {
      res.status(404).json({ error: 'Data logistik tidak tersedia karena lelang belum selesai.' });
      return;
    }

    const winnerId      = await getWinnerId(auctionId);
    const pickupAddress = await getAddress(auction.seller_id);
    const buyerAddress  = await getAddress(winnerId);

    const { data: newLogistics, error: insertError } = await buildAndInsertLogistics({
      auctionId,
      sellerId:        auction.seller_id,
      winnerId,
      pickupAddress,
      deliveryAddress: buyerAddress,
      selectFields:    JOIN_FIELDS,
    });

    if (insertError) {
      res.status(500).json({ error: 'Gagal membuat data logistik: ' + insertError.message });
      return;
    }

    logistics = newLogistics;
  }

  res.status(200).json(logistics);
};

// ── PATCH /api/logistics/:id/address ─────────────────────────────────────────
export const updateDeliveryAddress = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { deliveryAddress } = req.body;

  if (!deliveryAddress) { res.status(400).json({ error: 'Alamat pengiriman wajib diisi.' }); return; }

  const { data: logistics, error } = await supabase
    .from('logistics')
    .select('status, pickup_address')
    .eq('id', id)
    .single();

  if (error || !logistics) { res.status(404).json({ error: 'Data logistik tidak ditemukan.' }); return; }
  if (logistics.status !== 'pending') {
    res.status(400).json({ error: 'Alamat hanya dapat diubah ketika status masih pending.' });
    return;
  }

  // Recalculate estimated arrival berdasarkan alamat baru
  const newEstimatedArrival = calculateEstimatedArrival(logistics.pickup_address || '', deliveryAddress);

  const { data: updated, error: updateError } = await supabase
    .from('logistics')
    .update({
      delivery_address:  deliveryAddress,
      destination:       deliveryAddress,
      estimated_arrival: newEstimatedArrival,
      updated_at:        new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) { res.status(500).json({ error: updateError.message }); return; }

  res.status(200).json(updated);
};