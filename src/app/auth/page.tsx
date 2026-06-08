'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Ship, ShoppingCart, AlertCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/services/authService';
import { supabase } from '../lib/supabase'; // ← tambahan untuk Google OAuth
import styles from './page.module.css';
import Link from 'next/link';


type Mode = 'login' | 'register';

function getPasswordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string } {
  if (pw.length === 0) return { level: 0, label: '' };
  if (pw.length < 6)   return { level: 1, label: 'Terlalu pendek' };
  if (pw.length < 10 && !/[^a-zA-Z0-9]/.test(pw)) return { level: 2, label: 'Cukup' };
  return { level: 3, label: 'Kuat' };
}

function PasswordStrengthBar({ password }: { password: string }) {
  const { level, label } = getPasswordStrength(password);
  if (!password) return null;

  const segmentClass = (idx: number) => {
    if (level === 0 || idx >= level) return styles.strengthSegment;
    if (level === 1) return `${styles.strengthSegment} ${styles.strengthWeak}`;
    if (level === 2) return `${styles.strengthSegment} ${styles.strengthFair}`;
    return `${styles.strengthSegment} ${styles.strengthStrong}`;
  };

  return (
    <>
      <div className={styles.strengthBar}>
        {[0, 1, 2].map(i => <div key={i} className={segmentClass(i)} />)}
      </div>
      <p className={styles.strengthLabel}>{label}</p>
    </>
  );
}

function AuthContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useAuth();

  const [mode, setMode]                 = useState<Mode>('login');
  const [role, setRole]                 = useState<UserRole>('nelayan');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false); // ← tambahan
  const [error, setError]               = useState('');

  const [form, setForm] = useState({ full_name: '', email: '', password: '' });

  // Sync mode dari query param
  useEffect(() => {
    setMode(searchParams.get('mode') === 'register' ? 'register' : 'login');
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async () => {
    setError('');

    if (!form.email || !form.password) {
      setError('Email dan password wajib diisi.');
      return;
    }
    if (mode === 'register' && role === 'nelayan' && !form.full_name.trim()) {
      setError('Nama lengkap wajib diisi untuk nelayan.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        // 1. Jalankan fungsi login dari AuthContext
        await login(form.email, form.password, role);

        // 2. Ambil sesi user yang baru saja login
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session?.user) {
          // 3. Cek apakah address sudah diisi di tabel profiles
          const { data: profile } = await supabase
            .from('profiles')
            .select('address')
            .eq('id', sessionData.session.user.id)
            .single();

          // 4. Jika address kosong, paksa ke halaman completeProfile
          if (!profile?.address || profile.address.trim() === '') {
            router.push('/auth/completeProfile');
            return; // Hentikan fungsi di sini agar tidak lanjut ke dashboard
          }
        }

        // Jika address ada, izinkan masuk ke dashboard
        router.push(role === 'pembeli' ? '/' : '/fisherman/dashboard');

      } else {
        // Alur Register tetap sama
        await register(form.email, form.password, role, form.full_name || undefined);
        router.push('/auth/completeProfile');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google OAuth ────────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setError('');
    setIsGoogleLoading(true);

    // Simpan role sebelum redirect — state React hilang saat redirect
    sessionStorage.setItem('lekan_pending_role', role);
    localStorage.setItem('lekan_pending_role', role);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    });

    if (oauthError) {
      setError('Gagal memulai login Google: ' + oauthError.message);
      setIsGoogleLoading(false);
    }
    // Kalau sukses, browser redirect ke Google — tidak perlu setLoading(false)
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const showNameField = mode === 'register' && role === 'nelayan';

  return (
    <div className={styles.pageWrapper}>

      {/* ── Kiri Hero ── */}
      <div className={styles.hero}>
        <div className={styles.heroDecor} />
        <div className={styles.heroDecor2} />

        <div className={styles.heroTop}>
          <p className={styles.heroLogo}>LEKAN</p>
          <p className={styles.heroTagline}>
            Menghubungkan lautan peluang melalui <br />pasar makanan laut premium yang mengutamakan digital.
          </p>
        </div>

        <div className={styles.heroBottom}>
          <div className={styles.heroFeature}>
            <div className={styles.heroFeatureIcon}>
              <Ship size={18} color="white" />
            </div>
            <div>
              <p className={styles.heroFeatureTitle}>Terpecaya</p>
              <p className={styles.heroFeatureDesc}>Pedagang terverifikasi dan transaksi aman.</p>
            </div>
          </div>
          <div className={styles.heroFeature}>
            <div className={styles.heroFeatureIcon}>
              <Lock size={18} color="white" />
            </div>
            <div>
              <p className={styles.heroFeatureTitle}>Transaksi Dengan Mudah</p>
              <p className={styles.heroFeatureDesc}>Penyelesaian transaksi dompet digital secara instan dan penawaran yang transparan.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Kanan Form ── */}
      <div className={styles.formSide}>
        <div className={styles.formCard}>

          {/* Heading */}
          <div className={styles.formHeading}>
            <h1 className={styles.formTitle}>
              {mode === 'login' ? 'Selamat Datang' : 'Buat Akun Baru'}
            </h1>
            <p className={styles.formSubtitle}>
              {mode === 'login'
                ? 'Silakan masuk untuk melanjutkan akses ke pelelangan.'
                : 'Daftar sekarang dan mulai berdagang di LEKAN.'}
            </p>
          </div>

          {/* Role Toggle */}
          <div className={styles.roleToggle}>
            <button
              className={`${styles.roleBtn} ${role === 'nelayan' ? styles.roleBtnActive : ''}`}
              onClick={() => { setRole('nelayan'); setError(''); }}
            >
              <Ship size={15} /> Nelayan
            </button>
            <button
              className={`${styles.roleBtn} ${role === 'pembeli' ? styles.roleBtnActive : ''}`}
              onClick={() => { setRole('pembeli'); setError(''); }}
            >
              <ShoppingCart size={15} /> Pembeli
            </button>
          </div>

          {/* Fields */}
          <div className={styles.fields} onKeyDown={handleKeyDown}>

            {showNameField && (
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Nama Lengkap</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}><User size={16} /></span>
                  <input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="Nama lengkap kamu"
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Alamat Email</label>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><Mail size={16} /></span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="email@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>Kata Sandi</label>
                {mode === 'login' && (
                  <a href="/auth/forgotpassword" className={styles.forgotLink}>Lupa Sandi?</a>
                )}
              </div>
              <div className={styles.inputWrap}>
                <span className={styles.inputIcon}><Lock size={16} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  className={styles.inputRight}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'register' && (
                <PasswordStrengthBar password={form.password} />
              )}
            </div>

            {error && (
              <div className={styles.errorBox}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}

            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading
                ? 'Memproses...'
                : mode === 'login'
                  ? 'Masuk ke Dashboard →'
                  : 'Daftar Sekarang →'}
            </button>
          </div>

          {/* Divider */}
          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>ATAU LANJUT DENGAN</span>
            <div className={styles.dividerLine} />
          </div>

          {/* ── Google Button ── */}
          <div className={styles.socialGrid}>
            <button
              className={styles.socialBtn}
              onClick={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24"
                    style={{ animation: 'lekan-spin 0.8s linear infinite', flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                      fill="none" strokeDasharray="31" strokeDashoffset="10" />
                  </svg>
                  Menghubungkan...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  Lanjut dengan Google
                </span>
              )}
            </button>
          </div>

          <style>{`@keyframes lekan-spin { to { transform: rotate(360deg); } }`}</style>

          {/* Toggle mode */}
          <p className={styles.toggleMode}>
            {mode === 'login' ? (
              <>Belum punya akun?
                <Link href="/auth?mode=register" className={styles.toggleBtn}>Daftar Sekarang</Link>
              </>
            ) : (
              <>Sudah punya akun?
                <Link href="/auth?mode=login" className={styles.toggleBtn}>Masuk</Link>
              </>
            )}
          </p>

        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthContent />
    </Suspense>
  );
}