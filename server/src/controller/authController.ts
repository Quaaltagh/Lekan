import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
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


export const requestPasswordReset = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email wajib diisi',
      });
    }
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${frontendUrl}/auth/forgotpassword`,
    });

    if (error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(200).json({
      message: 'Link reset password telah dikirim.',
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Server error',
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { accessToken, refreshToken, code, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        error: 'Password baru wajib diisi',
      });
    }

    if (!accessToken && !code) {
      return res.status(400).json({
        error: 'Token akses atau kode verifikasi wajib disertakan',
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

    // Buat client Supabase sementara dengan Anon Key agar tidak merusak session global/shared
    const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    if (code) {
      // PKCE Flow / Code Flow
      const { error: exchangeError } = await tempSupabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        return res.status(400).json({
          error: 'Kode reset password tidak valid atau sudah kadaluarsa.',
        });
      }
    } else if (accessToken) {
      // Implicit Flow / Hash Flow
      const { error: sessionError } = await tempSupabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });
      if (sessionError) {
        return res.status(400).json({
          error: 'Sesi reset password tidak valid atau sudah kadaluarsa.',
        });
      }
    }

    // Perbarui kata sandi dengan aman dalam sesi pengguna
    const { error: updateError } = await tempSupabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return res.status(400).json({
        error: updateError.message,
      });
    }

    return res.status(200).json({
      message: 'Kata sandi berhasil diperbarui.',
    });
  } catch (err) {
    console.error('Error resetPassword:', err);
    return res.status(500).json({
      error: 'Terjadi kesalahan pada server saat mereset kata sandi.',
    });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        error: 'Email dan kode OTP wajib diisi.',
      });
    }

    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

    const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await tempSupabase.auth.verifyOtp({
      email,
      token: code,
      type: 'recovery',
    });

    if (error || !data.session) {
      return res.status(400).json({
        error: error?.message || 'Kode OTP tidak valid atau sudah kadaluarsa.',
      });
    }

    return res.status(200).json({
      message: 'Kode OTP berhasil diverifikasi.',
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (err) {
    console.error('Error verifyOtp:', err);
    return res.status(500).json({
      error: 'Terjadi kesalahan pada server saat memverifikasi kode OTP.',
    });
  }
};

export const googleUpsert = async (req: Request, res: Response): Promise<void> => {
  // Ambil token dari header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token tidak ditemukan.' });
    return;
  }
 
  const token = authHeader.replace('Bearer ', '');
 
  // Verifikasi token ke Supabase dan dapatkan data user
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa.' });
    return;
  }
 
  const { role } = req.body as { role?: 'nelayan' | 'pembeli' };
  if (!role || !['nelayan', 'pembeli'].includes(role)) {
    res.status(400).json({ error: 'Role wajib diisi (nelayan atau pembeli).' });
    return;
  }
 
  // Cek apakah profil sudah ada (user lama yang login lagi)
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle();
 
  if (existing) {
    // User lama — kembalikan profil yang ada, role TIDAK diubah
    res.status(200).json({
      message: 'Login berhasil.',
      user: {
        id: existing.id,
        email: user.email,
        full_name: existing.full_name ?? user.user_metadata?.full_name ?? null,
        role: existing.role,
      },
    });
    return;
  }
 
  // User baru — buat profil dengan role yang dipilih
  const full_name: string =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email ??
    '';
 
  const { error: profileError } = await supabase.from('profiles').insert({
    id: user.id,
    email: user.email,
    full_name,
    role,
  });
 
  if (profileError) {
    res.status(500).json({ error: 'Gagal menyimpan profil: ' + profileError.message });
    return;
  }
 
  // Buat wallet otomatis
  const { error: walletError } = await supabase
    .from('wallets')
    .insert({ user_id: user.id, balance: 0, pending: 0 });
 
  if (walletError) {
    console.error('[googleUpsert] Wallet creation failed (non-critical):', walletError.message);
  }
 
  res.status(201).json({
    message: 'Registrasi via Google berhasil.',
    user: { id: user.id, email: user.email, full_name, role },
  });
};

export const completeProfile = async (req: Request, res: Response): Promise<void> => {
  // Ambil user dari middleware verifyToken (req.user.id)
  // Jika belum ada middleware, bisa pakai token langsung seperti di bawah
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token tidak ditemukan.' });
    return;
  }
 
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
 
  if (userError || !user) {
    res.status(401).json({ error: 'Token tidak valid.' });
    return;
  }
 
  const { full_name, email, phone, address, vessel_name } = req.body;
 
  // Validasi
  if (!full_name?.trim()) { res.status(400).json({ error: 'Nama lengkap wajib diisi.' }); return; }
  if (!email?.trim())     { res.status(400).json({ error: 'Email wajib diisi.' }); return; }
  if (!phone?.trim())     { res.status(400).json({ error: 'Nomor telepon wajib diisi.' }); return; }
  if (!address?.trim())   { res.status(400).json({ error: 'Alamat wajib diisi.' }); return; }
 
  // Cek role — kalau nelayan, vessel_name wajib
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
 
  if (profile?.role === 'nelayan' && !vessel_name?.trim()) {
    res.status(400).json({ error: 'Nama kapal wajib diisi untuk nelayan.' });
    return;
  }
 
  // Update profil di database
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      full_name:    full_name.trim(),
      email:        email.trim(),
      phone:        phone.trim(),
      address:      address.trim(),
      vessel_name:  vessel_name?.trim() || null,
    })
    .eq('id', user.id);
 
  if (updateError) {
    res.status(500).json({ error: 'Gagal menyimpan profil: ' + updateError.message });
    return;
  }
 
  res.status(200).json({ message: 'Profil berhasil dilengkapi.' });
};