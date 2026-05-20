export type NotificationType = 'lelang' | 'pembayaran' | 'transaksi' | 'keamanan' | 'kapal';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  description: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationPayload {
  user_id: string;
  type: NotificationType;
  title: string;
  description: string;
}
