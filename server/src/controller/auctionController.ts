import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { CreateAuctionPayload, UpdateAuctionPayload } from '../models/auctionModel';

// ─── GET semua lelang milik seller ───────────────────────────────────────────
export const getAuctionsBySeller = async (req: Request, res: Response): Promise<void> => {
  const { sellerId } = req.params;

  const { data, error } = await supabase
    .from('auctions')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(200).json(data);
};

// ─── GET detail satu lelang ───────────────────────────────────────────────────
export const getAuctionById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('auctions').select('*').eq('id', id).single();

  if (error || !data) { res.status(404).json({ error: 'Lelang tidak ditemukan.' }); return; }
  res.status(200).json(data);
};

// ─── GET semua lelang aktif (untuk buyer) ────────────────────────────────────
export const getActiveAuctions = async (_req: Request, res: Response): Promise<void> => {
  const { data, error } = await supabase
    .from('auctions').select('*').eq('status', 'active')
    .order('ends_at', { ascending: true });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(200).json(data);
};

// ─── CREATE lelang + upload gambar ───────────────────────────────────────────
export const createAuction = async (req: Request, res: Response): Promise<void> => {
  const { sellerId } = req.params;

  // Ambil field dari multipart/json body
  const {
    name, species, grade,
    weight_kg, start_price,
    duration_hours,         // 2 | 6 | 12 | 24
    image_base64,           // opsional: base64 string dari frontend
    image_mime,             // e.g. "image/jpeg"
  } = req.body as CreateAuctionPayload;

  // Validasi wajib
  if (!name || !weight_kg || !start_price || !duration_hours) {
    res.status(400).json({ error: 'name, weight_kg, start_price, dan duration_hours wajib diisi.' });
    return;
  }

  // Hitung ends_at dari durasi
  const ends_at = new Date(
    Date.now() + Number(duration_hours) * 60 * 60 * 1000
  ).toISOString();

  // ── Upload gambar ke Supabase Storage (opsional) ──────────────────────────
  let image_url: string | null = null;

  if (image_base64 && image_mime) {
    const base64Data = image_base64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = image_mime.split('/')[1] || 'jpg';
    const fileName = `auctions/${sellerId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('auction-images')
      .upload(fileName, buffer, {
        contentType: image_mime,
        upsert: false,
      });

    if (uploadError) {
      res.status(500).json({ error: `Gagal upload gambar: ${uploadError.message}` });
      return;
    }

    const { data: urlData } = supabase.storage
      .from('auction-images')
      .getPublicUrl(fileName);

    image_url = urlData.publicUrl;
  }

  // ── Insert ke tabel auctions ──────────────────────────────────────────────
  const { data, error } = await supabase
    .from('auctions')
    .insert({
      seller_id: sellerId,
      name: name.trim(),
      species: species?.trim() || null,
      grade: grade?.trim() || null,
      weight_kg: Number(weight_kg),
      start_price: Number(start_price),
      current_bid: Number(start_price),
      status: 'active',
      ends_at,
      image_url,
      paid: false,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json(data);
};

// ─── UPDATE lelang ────────────────────────────────────────────────────────────
export const updateAuction = async (req: Request, res: Response): Promise<void> => {
  const { id, sellerId } = req.params;
  const body: UpdateAuctionPayload = req.body;

  const { data: existing } = await supabase
    .from('auctions').select('seller_id, status').eq('id', id).single();

  if (!existing) { res.status(404).json({ error: 'Lelang tidak ditemukan.' }); return; }
  if (existing.seller_id !== sellerId) { res.status(403).json({ error: 'Tidak diizinkan.' }); return; }
  if (existing.status === 'active') { res.status(400).json({ error: 'Lelang aktif tidak dapat diubah.' }); return; }

  const { data, error } = await supabase
    .from('auctions')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(200).json(data);
};

// ─── DELETE lelang ────────────────────────────────────────────────────────────
export const deleteAuction = async (req: Request, res: Response): Promise<void> => {
  const { id, sellerId } = req.params;

  const { data: existing } = await supabase
    .from('auctions').select('seller_id, status').eq('id', id).single();

  if (!existing) { res.status(404).json({ error: 'Lelang tidak ditemukan.' }); return; }
  if (existing.seller_id !== sellerId) { res.status(403).json({ error: 'Tidak diizinkan.' }); return; }
  if (existing.status === 'active') { res.status(400).json({ error: 'Lelang aktif tidak dapat dihapus.' }); return; }

  const { error } = await supabase.from('auctions').delete().eq('id', id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(200).json({ message: 'Lelang berhasil dihapus.' });
};