import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { LoginPayload, RegisterPayload } from '../models/userModel';

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password, role }: LoginPayload = req.body;

  if (!email || !password || !role) {
    res.status(400).json({ error: 'Email, password, dan role wajib diisi.' });
    return;
  }

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    res.status(401).json({ error: 'Email atau password salah.' });
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    res.status(404).json({ error: 'Profil pengguna tidak ditemukan.' });
    return;
  }

  if (profile.role !== role) {
    res.status(403).json({ error: `Akun ini terdaftar sebagai ${profile.role}, bukan ${role}.` });
    return;
  }

  res.status(200).json({
    message: 'Login berhasil.',
    token: authData.session?.access_token,
    user: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
    },
  });
};

// ─── REGISTER ─────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, role, full_name }: RegisterPayload = req.body;

  if (!email || !password || !role) {
    res.status(400).json({ error: 'Email, password, dan role wajib diisi.' });
    return;
  }

  if (role === 'nelayan' && !full_name) {
    res.status(400).json({ error: 'Nama lengkap wajib diisi untuk nelayan.' });
    return;
  }

  // Daftar via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    res.status(400).json({ error: authError.message });
    return;
  }

  if (!authData.user) {
    res.status(400).json({ error: 'Registrasi gagal, coba lagi.' });
    return;
  }

  // Simpan profil — jika gagal, hapus user dari auth.users (rollback)
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    email,
    full_name: full_name || null,
    role,
  });

  if (profileError) {
    console.error('Profile insert error:', profileError);

    // Rollback: hapus user dari auth.users supaya bisa register ulang
    await supabase.auth.admin.deleteUser(authData.user.id);

    res.status(500).json({
      error: `Gagal menyimpan profil: ${profileError.message}`,
    });
    return;
  }

  res.status(201).json({
    message: 'Registrasi berhasil.',
    token: authData.session?.access_token,
    user: {
      id: authData.user.id,
      email,
      full_name: full_name || null,
      role,
    },
  });
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export const logout = async (_req: Request, res: Response): Promise<void> => {
  await supabase.auth.signOut();
  res.status(200).json({ message: 'Logout berhasil.' });
};

// ─── GET profil user berdasarkan ID (untuk halaman detail lelang) ─────────────
// FIX: tambah logging error asli agar bisa debug penyebab "Profil tidak ditemukan."
// Penyebab umum: RLS blocking (pastikan supabaseClient pakai SERVICE_ROLE_KEY),
// atau user ada di auth.users tapi row-nya tidak ada di tabel profiles.
export const getProfileById = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, vessel_name, verified, role')
    .eq('id', userId)
    .single();

  if (error) {
    // Log error asli ke console server — berguna untuk debug RLS vs not found
    console.error('[getProfileById] error code:', error.code, '| message:', error.message);

    // PGRST116 = row tidak ditemukan (.single() tidak dapat baris)
    if (error.code === 'PGRST116') {
      res.status(404).json({ error: 'Profil tidak ditemukan.' });
      return;
    }

    // Error lain: kemungkinan RLS block, koneksi DB, dsb
    res.status(500).json({ error: 'Gagal mengambil profil: ' + error.message });
    return;
  }

  if (!data) {
    res.status(404).json({ error: 'Profil tidak ditemukan.' });
    return;
  }

  res.status(200).json(data);
};