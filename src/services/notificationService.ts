const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api`;

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

const authHeaders = (token: string): HeadersInit => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const getNotifications = async (userId: string, token: string): Promise<Notification[]> => {
  const res = await fetch(`${BASE_URL}/notifications/${userId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Gagal mengambil notifikasi.');
  return res.json();
};

export const getUnreadCount = async (userId: string, token: string): Promise<number> => {
  const res = await fetch(`${BASE_URL}/notifications/${userId}/unread-count`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Gagal mengambil jumlah notifikasi belum dibaca.');
  const data = await res.json();
  return data.unread_count;
};

export const markAsRead = async (userId: string, notifId: string, token: string): Promise<Notification> => {
  const res = await fetch(`${BASE_URL}/notifications/${userId}/${notifId}/read`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Gagal menandai notifikasi.');
  return res.json();
};

export const markAllAsRead = async (userId: string, token: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/notifications/${userId}/mark-all-read`, {
    method: 'PATCH',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Gagal menandai semua notifikasi.');
};

export const deleteNotification = async (userId: string, notifId: string, token: string): Promise<void> => {
  const res = await fetch(`${BASE_URL}/notifications/${userId}/${notifId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error('Gagal menghapus notifikasi.');
};