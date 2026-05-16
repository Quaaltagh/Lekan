import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { CreateNotificationPayload } from '../models/notificationModel';

// ─── GET semua notifikasi milik user ─────────────────────────────────────────
export const getNotificationsByUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(200).json(data);
};

// ─── GET jumlah notifikasi yang belum dibaca ──────────────────────────────────
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(200).json({ unread_count: count ?? 0 });
};

// ─── CREATE notifikasi baru ───────────────────────────────────────────────────
export const createNotification = async (req: Request, res: Response): Promise<void> => {
  const body: CreateNotificationPayload = req.body;
  const { user_id, type, title, description } = body;

  if (!user_id || !type || !title || !description) {
    res.status(400).json({ error: 'user_id, type, title, dan description wajib diisi.' });
    return;
  }

  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id, type, title, description, is_read: false })
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(201).json(data);
};

// ─── MARK satu notifikasi sebagai sudah dibaca ────────────────────────────────
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
  const { id, userId } = req.params;

  const { data: existing } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!existing) { res.status(404).json({ error: 'Notifikasi tidak ditemukan.' }); return; }
  if (existing.user_id !== userId) { res.status(403).json({ error: 'Tidak diizinkan.' }); return; }

  const { data, error } = await supabase
    .from('notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(200).json(data);
};

// ─── MARK semua notifikasi user sebagai sudah dibaca ─────────────────────────
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(200).json({ message: 'Semua notifikasi telah ditandai sebagai dibaca.' });
};

// ─── DELETE satu notifikasi ───────────────────────────────────────────────────
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  const { id, userId } = req.params;

  const { data: existing } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!existing) { res.status(404).json({ error: 'Notifikasi tidak ditemukan.' }); return; }
  if (existing.user_id !== userId) { res.status(403).json({ error: 'Tidak diizinkan.' }); return; }

  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.status(200).json({ message: 'Notifikasi berhasil dihapus.' });
};
