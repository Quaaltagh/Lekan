const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export type UserRole = 'nelayan' | 'pembeli';

export interface LoginPayload {
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role: UserRole;
  full_name?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    full_name?: string;
    role: UserRole;
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Terjadi kesalahan.');
  return data as T;
}

export const authService = {
  login: async (payload: LoginPayload) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },

  register: async (payload: RegisterPayload) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },

  logout: async () => {
    await fetch(`${API_URL}/api/auth/logout`, { method: 'POST' });
  },

  requestPasswordReset: async (email: string) => {
    const res = await fetch(`${API_URL}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    return handleResponse<{ message: string }>(res);
  },
};