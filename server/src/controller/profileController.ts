import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';

// ── GET /api/profile/:userId ───────────────────────────────────────────────
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, vessel_name, phone, bank_account, bank_name, bio, avatar_url, preferences, verified, role')
    .eq('id', userId)
    .single();

  if (error) {
    res.status(error.code === 'PGRST116' ? 404 : 500).json({ error: error.message });
    return;
  }

  res.status(200).json(data);
};

// ── PUT /api/profile/:userId ───────────────────────────────────────────────
// Update info profil: nama, kapal, bio, avatar_url
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { full_name, vessel_name, bio, avatar_url } = req.body;

  // Minimal satu field harus diisi
  if (!full_name && !vessel_name && bio === undefined && !avatar_url) {
    res.status(400).json({ error: 'Tidak ada data yang diupdate.' });
    return;
  }

  const updates: Record<string, any> = {};
  if (full_name)   updates.full_name   = full_name;
  if (vessel_name) updates.vessel_name = vessel_name;
  if (bio !== undefined) updates.bio   = bio;
  if (avatar_url)  updates.avatar_url  = avatar_url;

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ message: 'Profil berhasil diperbarui.', profile: data });
};

// ── PUT /api/profile/:userId/password ─────────────────────────────────────
// Update password via Supabase Auth Admin
export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Password lama dan baru wajib diisi.' });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
    return;
  }

  // Ambil email user untuk verifikasi password lama
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single();

  if (!profile) {
    res.status(404).json({ error: 'User tidak ditemukan.' });
    return;
  }

  // Verifikasi password lama dengan cara login ulang
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: currentPassword,
  });

  if (signInError) {
    res.status(401).json({ error: 'Password lama tidak sesuai.' });
    return;
  }

  // Update password via Admin API
  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (updateError) {
    res.status(500).json({ error: 'Gagal update password: ' + updateError.message });
    return;
  }

  res.status(200).json({ message: 'Password berhasil diperbarui.' });
};

// ── PUT /api/profile/:userId/preferences ──────────────────────────────────
// Update preferences notifikasi
export const updatePreferences = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { auctionAlerts, bidConfirmations, marketingUpdates } = req.body;

  const preferences: Record<string, boolean> = {};
  if (typeof auctionAlerts    === 'boolean') preferences.auctionAlerts    = auctionAlerts;
  if (typeof bidConfirmations === 'boolean') preferences.bidConfirmations = bidConfirmations;
  if (typeof marketingUpdates === 'boolean') preferences.marketingUpdates = marketingUpdates;

  if (Object.keys(preferences).length === 0) {
    res.status(400).json({ error: 'Tidak ada preferensi yang diupdate.' });
    return;
  }

  // Merge dengan preferences yang ada (tidak overwrite semua)
  const { data: existing } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', userId)
    .single();

  const merged = { ...(existing?.preferences ?? {}), ...preferences };

  const { data, error } = await supabase
    .from('profiles')
    .update({ preferences: merged })
    .eq('id', userId)
    .select('preferences')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(200).json({ message: 'Preferensi berhasil diperbarui.', preferences: data.preferences });
};

// ── POST /api/profile/:userId/avatar ──────────────────────────────────────
// Upload avatar ke Supabase Storage, return public URL
export const uploadAvatar = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const { base64Image, mimeType } = req.body; // e.g. "image/jpeg"

  if (!base64Image || !mimeType) {
    res.status(400).json({ error: 'base64Image dan mimeType wajib diisi.' });
    return;
  }

  const buffer     = Buffer.from(base64Image, 'base64');
  const ext        = mimeType.split('/')[1] ?? 'jpg';
  const filePath   = `avatars/${userId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars') // buat bucket "avatars" di Supabase Storage
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true, // overwrite kalau sudah ada
    });

  if (uploadError) {
    res.status(500).json({ error: 'Gagal upload avatar: ' + uploadError.message });
    return;
  }

  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const publicUrl = urlData.publicUrl;

  // Simpan URL ke profiles
  await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);

  res.status(200).json({ message: 'Avatar berhasil diupload.', avatar_url: publicUrl });
};