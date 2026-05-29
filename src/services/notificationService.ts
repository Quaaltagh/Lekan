const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Notification {
  id: string;
  user_id: string;
  type: 'lelang' | 'pembayaran' | 'transaksi' | 'keamanan' | 'kapal';
  title: string;
  description: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

// Helper — ambil token dari localStorage
const authHeaders = (): HeadersInit => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// GET all notifications for a user
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  const res = await fetch(`${BASE_URL}/notifications/${userId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Gagal mengambil notifikasi.');
  return res.json();
};

// GET unread count
export const getUnreadCount = async (userId: string): Promise<number> => {
  const res = await fetch(`${BASE_URL}/notifications/${userId}/unread-count`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Gagal mengambil jumlah notifikasi belum dibaca.');
  const data = await res.json();
  return data.unread_count;
};

// PATCH mark single notification as read
export const markAsRead = async (userId: string, notifId: string): Promise<Notification> => {
  const res = await fetch(`${BASE_URL}/notifications/${userId}/${notifId}/read`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Gagal menandai notifikasi.');
  return res.json();
};

// PATCH mark all as read
export const markAllAsRead = async (userId: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/notifications/${userId}/mark-all-read`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Gagal menandai semua notifikasi.');
};

// DELETE a notification
export const deleteNotification = async (userId: string, notifId: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/notifications/${userId}/${notifId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Gagal menghapus notifikasi.');
};