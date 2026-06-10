import { supabase } from '../config/supabaseClient';
import { NotificationType } from '../models/notificationModel';

const PREF_MAP: Partial<Record<NotificationType, string>> = {
  lelang:     'auctionAlerts',
  transaksi:  'bidConfirmations',
  pembayaran: 'bidConfirmations',
  kapal:      'bidConfirmations',
  // 'keamanan' tidak di-map → selalu terkirim
};

async function isNotifAllowed(user_id: string, type: NotificationType): Promise<boolean> {
  const prefKey = PREF_MAP[type];

  if (!prefKey) return true;

  const { data, error } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('user_id', user_id)
    .single();

  if (error || !data) {
    console.warn('[NOTIF] Gagal fetch preferences, default allow:', error?.message);
    return true;
  }

  const prefs = data.preferences ?? {};
  return prefs[prefKey] !== false;
}

export const sendNotification = async (
  user_id: string,
  type: NotificationType,
  title: string,
  description: string
): Promise<void> => {
  const allowed = await isNotifAllowed(user_id, type);

  if (!allowed) {
    console.log(`[NOTIF] Diblokir preferensi user ${user_id} — tipe: ${type}`);
    return;
  }

  const { error } = await supabase
    .from('notifications')
    .insert({ user_id, type, title, description, is_read: false });

  if (error) {
    console.error('[NOTIF] Gagal kirim notifikasi:', error.message);
  }
};