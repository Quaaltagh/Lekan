import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { CreateAuctionPayload, UpdateAuctionPayload } from '../models/auctionModel';
import { sendNotification } from '../lib/NotificationHelper';

// Helper: Auto-complete expired auctions
const checkAndCompleteExpiredAuctions = async (sellerId?: string): Promise<void> => {
  try {
    const now = new Date().toISOString();
    let query = supabase
      .from('auctions')
      .select('*, bids(bidder_id, amount)')
      .eq('status', 'active')
      .lte('ends_at', now);

    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    const { data: expiredAuctions, error } = await query;
    if (error || !expiredAuctions || expiredAuctions.length === 0) return;

    for (const auction of expiredAuctions) {
      const bids = auction.bids ?? [];
      const winner = bids.reduce(
        (prev: any, curr: any) => (curr.amount > (prev?.amount ?? 0) ? curr : prev),
        null
      );

      // Update status lelang → done
      const { error: updateError } = await supabase
        .from('auctions')
        .update({
          status:      'done',
          final_price: winner?.amount ?? null,
          updated_at:  new Date().toISOString(),
        })
        .eq('id', auction.id);

      if (!updateError) {
        // ── NOTIF: ke buyer pemenang ────────────────────────────────────────────
        if (winner?.bidder_id) {
          await sendNotification(
            winner.bidder_id,
            'lelang',
            `Selamat! Kamu Memenangkan Lelang`,
            `Kamu memenangkan lelang "${auction.name}" dengan tawaran Rp ${winner.amount.toLocaleString('id-ID')}. Silakan lanjutkan ke pembayaran.`
          );
        }

        // ── NOTIF: ke seller bahwa lelang selesai ───────────────────────────────
        await sendNotification(
          auction.seller_id,
          'transaksi',
          'Lelang Selesai',
          `Lelang "${auction.name}" telah berakhir. Harga final: Rp ${winner?.amount?.toLocaleString('id-ID') ?? 'tidak ada penawar'}.`
        );
      }
    }
  } catch (err) {
    console.error('Error auto-completing expired auctions:', err);
  }
};

// ─── GET semua lelang milik seller ───────────────────────────────────────────
export const getAuctionsBySeller = async (req: Request, res: Response): Promise<void> => {
  const { sellerId } = req.params;

  await checkAndCompleteExpiredAuctions(sellerId);

  const { data, error } = await supabase
    .from('auctions')
    .select(`
      *,
      logistics (
        status
      )
    `)
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
  await checkAndCompleteExpiredAuctions();

  const { data, error } = await supabase
    .from('auctions')
    .select(`
      *,
      profiles:seller_id (
        address
      )
    `)
    .eq('status', 'active')
    .order('ends_at', { ascending: true });

  if (error) { res.status(500).json({ error: error.message }); return; }

  const mapped = (data ?? []).map((a: any) => ({
    ...a,
    origin: a.profiles?.address ?? null,
    profiles: undefined,
  }));

  res.status(200).json(mapped);
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

// ─── GET bidding status (Active & Finished) untuk seller ─────────────────────
export const getSellerBiddingStatus = async (req: Request, res: Response): Promise<void> => {
  const { sellerId } = req.params;

  await checkAndCompleteExpiredAuctions(sellerId);

  const { data, error } = await supabase
    .from('auctions')
    .select(`
      *,
      bids (
        amount,
        profiles ( full_name )
      )
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  const activeAuctions: any[] = [];
  const finishedAuctions: any[] = [];

  for (const auction of data || []) {
    const bids = auction.bids || [];
    const biddersCount = bids.length;
    
    // Cari bid tertinggi
    let highestBid = null;
    if (biddersCount > 0) {
      highestBid = bids.reduce((prev: any, current: any) => 
        (prev.amount > current.amount) ? prev : current
      );
    }

    const auctionData = {
      ...auction,
      bidders_count: biddersCount,
      winner_name: highestBid?.profiles?.full_name || null,
    };
    // Hapus relasi raw bids agar response lebih ringan
    delete auctionData.bids;

    if (auction.status === 'active') {
      activeAuctions.push(auctionData);
    } else if (auction.status === 'done' || auction.status === 'completed') {
      finishedAuctions.push(auctionData);
    }
  }

  res.status(200).json({ active: activeAuctions, finished: finishedAuctions });
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


// ─── GET lelang aktif dengan filter & search (untuk buyer homepage) ───────────
export const getBuyerAuctions = async (req: Request, res: Response): Promise<void> => {
  const { search, grade, species, status, min_price, max_price, sort } = req.query;

  await checkAndCompleteExpiredAuctions();

  const filterStatus = (status && typeof status === 'string' && status !== 'all') ? status : 'active';

  let query = supabase
    .from('auctions')
    .select(`
      *,
      profiles:seller_id (
        address
      )
    `)
    .eq('status', filterStatus);

  if (search && typeof search === 'string') {
    query = query.or(`name.ilike.%${search}%,species.ilike.%${search}%`);
  }

  if (grade && typeof grade === 'string' && grade !== 'all') {
    query = query.eq('grade', grade);
  }

  if (species && typeof species === 'string' && species !== 'all') {
    query = query.ilike('species', species);
  }

  if (min_price) query = query.gte('current_bid', Number(min_price));
  if (max_price) query = query.lte('current_bid', Number(max_price));

  switch (sort) {
    case 'price_asc':  query = query.order('current_bid', { ascending: true });  break;
    case 'price_desc': query = query.order('current_bid', { ascending: false }); break;
    case 'ending':     query = query.order('ends_at',     { ascending: true });  break;
    default:           query = query.order('created_at',  { ascending: false }); break;
  }

  const { data, error } = await query;
  if (error) { res.status(500).json({ error: error.message }); return; }

  const mapped = (data ?? []).map((a: any) => ({
    ...a,
    origin: a.profiles?.address ?? null,
    profiles: undefined,
  }));

  res.status(200).json(mapped);
};

export const completeAuction = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
 
  // Ambil lelang + bid tertinggi
  const { data: auction, error } = await supabase
    .from('auctions')
    .select('*, bids(bidder_id, amount)')
    .eq('id', id)
    .single();
 
  if (error || !auction) {
    res.status(404).json({ error: 'Lelang tidak ditemukan.' });
    return;
  }
 
  if (auction.status !== 'active') {
    res.status(400).json({ error: 'Lelang sudah tidak aktif.' });
    return;
  }
 
  // Cari pemenang (bid tertinggi)
  const bids = auction.bids ?? [];
  const winner = bids.reduce(
    (prev: any, curr: any) => (curr.amount > (prev?.amount ?? 0) ? curr : prev),
    null
  );
 
  // Update status lelang → done
  const { error: updateError } = await supabase
    .from('auctions')
    .update({
      status:      'done',
      final_price: winner?.amount ?? null,
      updated_at:  new Date().toISOString(),
    })
    .eq('id', id);
 
  if (updateError) {
    res.status(500).json({ error: updateError.message });
    return;
  }
 
  // ── NOTIF: ke buyer pemenang ────────────────────────────────────────────
  if (winner?.bidder_id) {
    await sendNotification(
      winner.bidder_id,
      'lelang',
      `Selamat! Kamu Memenangkan Lelang`,
      `Kamu memenangkan lelang "${auction.name}" dengan tawaran Rp ${winner.amount.toLocaleString('id-ID')}. Silakan lanjutkan ke pembayaran.`
    );
  }
 
  // ── NOTIF: ke seller bahwa lelang selesai ───────────────────────────────
  await sendNotification(
    auction.seller_id,
    'transaksi',
    'Lelang Selesai',
    `Lelang "${auction.name}" telah berakhir. Harga final: Rp ${winner?.amount?.toLocaleString('id-ID') ?? 'tidak ada penawar'}.`
  );
 
  res.status(200).json({ message: 'Lelang selesai.', winner });
};