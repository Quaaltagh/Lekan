import { Request, Response } from 'express';
import { supabase, supabaseAuth } from '../config/supabaseClient';
import { LoginPayload, RegisterPayload } from '../models/userModel';
import { sendNotification } from '../lib/NotificationHelper';

// ─── LOGIN ────────────────────────────────────────────────────────────────────
// Pakai supabaseAuth (anon key) untuk signInWithPassword
// sehingga session tidak merusak shared supabase client (service role)
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password, role }: LoginPayload = req.body;

  if (!email || !password || !role) {
    res.status(400).json({ error: 'Email, password, dan role wajib diisi.' });
    return;
  }

  // ✅ Pakai supabaseAuth — bukan supabase (service role)
  const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    res.status(401).json({ error: 'Email atau password salah.' });
    return;
  }

  // ✅ Query DB tetap pakai supabase (service role) — tidak terpengaruh session
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

  // Pakai admin API (service role) agar bisa langsung confirm email
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // bypass email verification
  });

  if (authError || !authData.user) {
    res.status(400).json({ error: authError?.message || 'Registrasi gagal, coba lagi.' });
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
    await supabase.auth.admin.deleteUser(authData.user.id);
    res.status(500).json({ error: `Gagal menyimpan profil: ${profileError.message}` });
    return;
  }

  // Auto-create wallet
  const { error: walletError } = await supabase
    .from('wallets')
    .insert({ user_id: authData.user.id, balance: 0, pending: 0 });

  if (walletError) {
    console.error('[register] Wallet creation failed (non-critical):', walletError.message);
  }

  // Login otomatis setelah register untuk dapat token
  const { data: loginData } = await supabaseAuth.auth.signInWithPassword({ email, password });

  res.status(201).json({
    message: 'Registrasi berhasil.',
    token: loginData?.session?.access_token ?? null,
    user: {
      id: authData.user.id,
      email,
      full_name: full_name || null,
      role,
    },
  });
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
// Logout cukup di sisi frontend (hapus token dari localStorage)
// Backend tidak perlu signOut() karena JWT stateless
// Memanggil supabase.auth.signOut() pada shared service-role client
// akan merusak semua query berikutnya → response [] sampai restart
export const logout = async (_req: Request, res: Response): Promise<void> => {
  // ✅ Tidak memanggil supabase.auth.signOut() sama sekali
  // Token invalidation ditangani di frontend (hapus dari localStorage)
  res.status(200).json({ message: 'Logout berhasil.' });
};

// ─── GET profil user berdasarkan ID ───────────────────────────────────────────
export const getProfileById = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, vessel_name, verified, role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[getProfileById] error code:', error.code, '| message:', error.message);
    if (error.code === 'PGRST116') {
      res.status(404).json({ error: 'Profil tidak ditemukan.' });
      return;
    }
    res.status(500).json({ error: 'Gagal mengambil profil: ' + error.message });
    return;
  }

  if (!data) {
    res.status(404).json({ error: 'Profil tidak ditemukan.' });
    return;
  }

  res.status(200).json(data);
};