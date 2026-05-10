const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  vessel_name?: string;
  bio?: string;
  avatar_url?: string;
  phone?: string;
  bank_account?: string;
  bank_name?: string;
  verified?: boolean;
  role: string;
  preferences: {
    auctionAlerts: boolean;
    bidConfirmations: boolean;
    marketingUpdates: boolean;
  };
}

function authHeader(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export async function getProfile(userId: string, token: string): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/api/profile/${userId}`, {
    headers: authHeader(token),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Gagal mengambil profil.');
  return res.json();
}

export async function updateProfile(
  userId: string,
  token: string,
  payload: { full_name?: string; vessel_name?: string; bio?: string }
): Promise<UserProfile> {
  const res = await fetch(`${API_URL}/api/profile/${userId}`, {
    method: 'PUT',
    headers: authHeader(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Gagal update profil.');
  return (await res.json()).profile;
}

export async function updatePassword(
  userId: string,
  token: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/profile/${userId}/password`, {
    method: 'PUT',
    headers: authHeader(token),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Gagal update password.');
}

export async function updatePreferences(
  userId: string,
  token: string,
  preferences: { auctionAlerts?: boolean; bidConfirmations?: boolean; marketingUpdates?: boolean }
): Promise<void> {
  const res = await fetch(`${API_URL}/api/profile/${userId}/preferences`, {
    method: 'PUT',
    headers: authHeader(token),
    body: JSON.stringify(preferences),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Gagal update preferensi.');
}

export async function uploadAvatar(
  userId: string,
  token: string,
  file: File
): Promise<string> {
  const base64Image = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch(`${API_URL}/api/profile/${userId}/avatar`, {
    method: 'POST',
    headers: authHeader(token),
    body: JSON.stringify({ base64Image, mimeType: file.type }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Gagal upload avatar.');
  return (await res.json()).avatar_url;
}