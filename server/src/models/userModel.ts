export type UserRole = 'nelayan' | 'pembeli';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  role: UserRole;
  full_name?: string; // wajib jika role = nelayan
}

export interface LoginPayload {
  email: string;
  password: string;
  role: UserRole;
}