import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { sendNotification } from '../lib/NotificationHelper';

export const getSellerLogistics = async (req: Request, res: Response): Promise<void> => {
  const { sellerId } = req.params;

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
    // If status is delivered, it goes to history, else active
    if (item.status === 'delivered') {
      history.push(item);
    } else {
      active.push(item);
    }
  }

  res.status(200).json({ active, history });
};

// ─── Helper: ambil logistics + buyer_id dari auction ─────────────────────────
const getLogisticsWithBuyer = async (id: string) => {
  return supabase
    .from('logistics')
    .select(`
      *,
      auctions (
        name,
        buyer_id
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
  const buyerId = logistics.auctions?.buyer_id;
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
  const buyerId = logistics.auctions?.buyer_id;
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
 
  const buyerId = logistics.auctions?.buyer_id;
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