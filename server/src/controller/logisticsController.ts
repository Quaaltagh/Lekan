import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { sendNotification } from '../lib/NotificationHelper';

export const getSellerLogistics = async (req: Request, res: Response): Promise<void> => {
  const { sellerId } = req.params;

  try {
    // 1. Ambil semua lelang seller yang sudah selesai
    const { data: doneAuctions, error: auctionsError } = await supabase
      .from('auctions')
      .select('id, seller_id, name, final_price')
      .eq('seller_id', sellerId)
      .eq('status', 'done');

    if (auctionsError) {
      res.status(500).json({ error: auctionsError.message });
      return;
    }

    // 2. Ambil logistik yang sudah ada untuk seller ini
    const { data: existingLogistics, error: existingError } = await supabase
      .from('logistics')
      .select('auction_id')
      .eq('seller_id', sellerId);

    if (existingError) {
      res.status(500).json({ error: existingError.message });
      return;
    }

    const existingAuctionIds = new Set((existingLogistics || []).map(l => l.auction_id));

    // Ambil profile seller untuk pickup_address
    const { data: sellerProfile } = await supabase
      .from('profiles')
      .select('address')
      .eq('id', sellerId)
      .maybeSingle();
    const sellerAddress = sellerProfile?.address || '';

    // 3. Cari yang belum punya record logistik dan buat secara otomatis (self-healing)
    for (const auction of doneAuctions || []) {
      if (!existingAuctionIds.has(auction.id)) {
        // Ambil pemenang dari bids
        const { data: topBid } = await supabase
          .from('bids')
          .select('bidder_id')
          .eq('auction_id', auction.id)
          .order('amount', { ascending: false })
          .limit(1)
          .maybeSingle();

        const winnerId = topBid?.bidder_id || null;

        // Ambil alamat pemenang dari profiles
        let buyerAddress = '';
        if (winnerId) {
          const { data: buyerProfile } = await supabase
            .from('profiles')
            .select('address')
            .eq('id', winnerId)
            .maybeSingle();
          buyerAddress = buyerProfile?.address || '';
        }

        // Insert logistik default tanpa dummy hardcoded
        await supabase.from('logistics').insert({
          auction_id: auction.id,
          seller_id: sellerId,
          buyer_id: winnerId,
          status: 'pending',
          delivery_address: buyerAddress,
          pickup_address: sellerAddress,
          destination: buyerAddress,
          courier: 'Maritime Express',
          tracking_number: `LEKAN-TRK-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          estimated_arrival: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
        });
      }
    }

    // 4. Baru ambil data lengkapnya
    const { data, error } = await supabase
      .from('logistics')
      .select(`
        *,
        auctions (
          name,
          weight_kg,
          image_url
        )
      `)
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const active: any[] = [];
    const history: any[] = [];

    for (const item of data || []) {
      if (item.status === 'delivered') {
        history.push(item);
      } else {
        active.push(item);
      }
    }

    res.status(200).json({ active, history });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Terjadi kesalahan internal.' });
  }
};

// ─── Helper: ambil logistics + buyer_id dari auction ─────────────────────────
const getLogisticsWithBuyer = async (id: string) => {
  return supabase
    .from('logistics')
    .select(`
      *,
      auctions (
        name
      )
    `)
    .eq('id', id)
    .single();
};
 
// ─── PATCH /api/logistics/:id/depart — kapal berangkat ───────────────────────
export const departShip = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
 
  const { data: logistics, error } = await getLogisticsWithBuyer(id);
 
  if (error || !logistics) {
    res.status(404).json({ error: 'Data logistik tidak ditemukan.' });
    return;
  }
 
  if (logistics.status !== 'pending') {
    res.status(400).json({ error: 'Status harus pending sebelum bisa berangkat.' });
    return;
  }
 
  const { data: updated, error: updateError } = await supabase
    .from('logistics')
    .update({ status: 'shipped', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
 
  if (updateError) {
    res.status(500).json({ error: updateError.message });
    return;
  }
 
  // ── NOTIF: kapal berangkat → ke buyer ──────────────────────────────────
  const buyerId = logistics.buyer_id;
  const auctionName = logistics.auctions?.name ?? 'pesanan kamu';
 
  if (buyerId) {
    await sendNotification(
      buyerId,
      'kapal',
      'Kapal Sudah Berangkat',
      `Kapal untuk "${auctionName}" telah berangkat dan sedang dalam perjalanan ke tujuan.`
    );
  }
  
 
  res.status(200).json(updated);
};
 
// ─── PATCH /api/logistics/:id/arrived — kapal tiba ───────────────────────────
export const arrivedShip = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
 
  const { data: logistics, error } = await getLogisticsWithBuyer(id);
 
  if (error || !logistics) {
    res.status(404).json({ error: 'Data logistik tidak ditemukan.' });
    return;
  }
 
  if (logistics.status !== 'shipped') {
    res.status(400).json({ error: 'Status harus shipped sebelum bisa tiba.' });
    return;
  }
 
  const { data: updated, error: updateError } = await supabase
    .from('logistics')
    .update({ status: 'arrived', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
 
  if (updateError) {
    res.status(500).json({ error: updateError.message });
    return;
  }
 
  // ── NOTIF: kapal tiba → ke buyer ───────────────────────────────────────
  const buyerId = logistics.buyer_id;
  const auctionName = logistics.auctions?.name ?? 'pesanan kamu';
 
  if (buyerId) {
    await sendNotification(
      buyerId,
      'kapal',
      'Kapal Sudah Tiba',
      `Kapal untuk "${auctionName}" telah tiba di pelabuhan tujuan. Silakan konfirmasi penerimaan.`
    );
  }
 
  res.status(200).json(updated);
};
 
// ─── PATCH /api/logistics/:id/delivered — transaksi selesai ──────────────────
export const deliveredShip = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
 
  const { data: logistics, error } = await getLogisticsWithBuyer(id);
 
  if (error || !logistics) {
    res.status(404).json({ error: 'Data logistik tidak ditemukan.' });
    return;
  }
 
  if (logistics.status !== 'arrived') {
    res.status(400).json({ error: 'Status harus arrived sebelum bisa diselesaikan.' });
    return;
  }
 
  const { data: updated, error: updateError } = await supabase
    .from('logistics')
    .update({ status: 'delivered', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
 
  if (updateError) {
    res.status(500).json({ error: updateError.message });
    return;
  }
 
  const buyerId = logistics.buyer_id;
  const auctionName = logistics.auctions?.name ?? 'pesanan kamu';
 
  // ── NOTIF: transaksi selesai → ke buyer ────────────────────────────────
  if (buyerId) {
    await sendNotification(
      buyerId,
      'transaksi',
      'Transaksi Selesai',
      `Pesanan "${auctionName}" telah dikonfirmasi selesai. Terima kasih sudah bertransaksi di LEKAN.`
    );
  }
 
   // ── NOTIF: transaksi selesai → ke seller ───────────────────────────────
  if (logistics.seller_id) {
    await sendNotification(
      logistics.seller_id,
      'transaksi',
      'Pengiriman Selesai',
      `Pengiriman untuk "${auctionName}" telah dikonfirmasi diterima oleh pembeli.`
    );
  }
 
  res.status(200).json(updated);
};

// ─── GET /api/logistics/auction/:auctionId ─────────────────────────────────
export const getLogisticsByAuctionId = async (req: Request, res: Response): Promise<void> => {
  const { auctionId } = req.params;

  let { data: logistics, error } = await supabase
    .from('logistics')
    .select(`
      *,
      auctions (
        name,
        weight_kg,
        image_url,
        status,
        final_price,
        grade,
        seller_id,
        ends_at
      )
    `)
    .eq('auction_id', auctionId)
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Jika logistik tidak ada, periksa jika lelang selesai dan buat record default (self-healing)
  if (!logistics) {
    const { data: auction, error: aError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', auctionId)
      .single();

    if (aError || !auction) {
      res.status(404).json({ error: 'Lelang tidak ditemukan.' });
      return;
    }

    if (auction.status === 'done') {
      const { data: topBid } = await supabase
        .from('bids')
        .select('bidder_id, amount')
        .eq('auction_id', auctionId)
        .order('amount', { ascending: false })
        .limit(1)
        .maybeSingle();

      const winnerId = topBid?.bidder_id || null;

      // Ambil alamat pemenang & nelayan dari profile
      const { data: winnerProfile } = await supabase
        .from('profiles')
        .select('address')
        .eq('id', winnerId)
        .maybeSingle();

      const { data: sellerProfile } = await supabase
        .from('profiles')
        .select('address')
        .eq('id', auction.seller_id)
        .maybeSingle();

      const buyerAddress = winnerProfile?.address || '';
      const sellerAddress = sellerProfile?.address || '';

      const { data: newLogistics, error: insertError } = await supabase
        .from('logistics')
        .insert({
          auction_id: auctionId,
          seller_id: auction.seller_id,
          buyer_id: winnerId,
          status: 'pending',
          delivery_address: buyerAddress,
          pickup_address: sellerAddress,
          destination: buyerAddress,
          courier: 'Maritime Express',
          tracking_number: `LEKAN-TRK-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          estimated_arrival: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
        })
        .select(`
          *,
          auctions (
            name,
            weight_kg,
            image_url,
            status,
            final_price,
            grade,
            seller_id,
            ends_at
          )
        `)
        .single();

      if (insertError) {
        res.status(500).json({ error: 'Gagal membuat data logistik default: ' + insertError.message });
        return;
      }

      logistics = newLogistics;
    } else {
      res.status(404).json({ error: 'Data logistik tidak tersedia karena lelang belum selesai.' });
      return;
    }
  }

  res.status(200).json(logistics);
};

// ─── PATCH /api/logistics/:id/address ──────────────────────────────────────
export const updateDeliveryAddress = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { deliveryAddress } = req.body;

  if (!deliveryAddress) {
    res.status(400).json({ error: 'Alamat pengiriman wajib diisi.' });
    return;
  }

  const { data: logistics, error } = await supabase
    .from('logistics')
    .select('status')
    .eq('id', id)
    .single();

  if (error || !logistics) {
    res.status(404).json({ error: 'Data logistik tidak ditemukan.' });
    return;
  }

  if (logistics.status !== 'pending') {
    res.status(400).json({ error: 'Alamat hanya dapat diubah ketika status masih pending.' });
    return;
  }

  const { data: updated, error: updateError } = await supabase
    .from('logistics')
    .update({
      delivery_address: deliveryAddress,
      destination: deliveryAddress,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    res.status(500).json({ error: updateError.message });
    return;
  }

  res.status(200).json(updated);
};