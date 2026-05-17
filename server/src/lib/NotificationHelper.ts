import { supabase } from '../config/supabaseClient';
import { NotificationType } from '../models/notificationModel';
 
export const sendNotification = async (
  user_id: string,
  type: NotificationType,
  title: string,
  description: string
): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id, type, title, description, is_read: false });
 
  if (error) {
    console.error('[NOTIF] Gagal kirim notifikasi:', error.message);
  }
};
 