'use client';
import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, Ship, ShoppingCart, AlertCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/services/authService';
import styles from './page.module.css';

type Mode = 'login' | 'register';

// ── Password strength ─────────────────────────────────────────────────────────
function getPasswordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string } {
  if (pw.length === 0) return { level: 0, label: '' };
  if (pw.length < 6)   return { level: 1, label: 'Terlalu pendek' };
  if (pw.length < 10 && !/[^a-zA-Z0-9]/.test(pw)) return { level: 2, label: 'Cukup' };
  return { level: 3, label: 'Kuat' };
}

// ── PasswordStrengthBar ───────────────────────────────────────────────────────
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useAuth();

  const [mode, setMode]               = useState<Mode>('login');
  const [role, setRole]               = useState<UserRole>('nelayan');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState('');

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

    // Validasi minimal
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
        await login(form.email, form.password, role);
      } else {
        await register(form.email, form.password, role, form.full_name || undefined);
      }
      router.push(role === 'pembeli' ? '/' : '/fisherman/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setForm({ full_name: '', email: '', password: '' });
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
            Connecting oceans of opportunity through a<br />
            premium, digital-first seafood marketplace.
          </p>
        </div>

        <div className={styles.heroBottom}>
          <div className={styles.heroFeature}>
            <div className={styles.heroFeatureIcon}>
              <Ship size={18} color="white" />
            </div>
            <div>
              <p className={styles.heroFeatureTitle}>Trusted Network</p>
              <p className={styles.heroFeatureDesc}>Verified merchants and secure transactions.</p>
            </div>
          </div>
          <div className={styles.heroFeature}>
            <div className={styles.heroFeatureIcon}>
              <Lock size={18} color="white" />
            </div>
            <div>
              <p className={styles.heroFeatureTitle}>Fintech-Ready</p>
              <p className={styles.heroFeatureDesc}>Instant wallet settlements and transparent bidding.</p>
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

            {/* Nama Lengkap — hanya nelayan register */}
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

            {/* Email */}
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

            {/* Password */}
            <div className={styles.fieldGroup}>
              <div className={styles.fieldLabelRow}>
                <label className={styles.fieldLabel}>Kata Sandi</label>
                {mode === 'login' && (
                  <a href="#" className={styles.forgotLink}>Lupa Sandi?</a>
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

              {/* Password strength — hanya saat register */}
              {mode === 'register' && (
                <PasswordStrengthBar password={form.password} />
              )}
            </div>

            {/* Error */}
            {error && (
              <div className={styles.errorBox}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={isLoading}
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

          {/* Social */}
          <div className={styles.socialGrid}>
            <button className={styles.socialBtn}>Google</button>
            <button className={styles.socialBtn}>Facebook</button>
          </div>

          {/* Toggle mode */}
          <p className={styles.toggleMode}>
            {mode === 'login' ? (
              <>Belum punya akun?
                <button className={styles.toggleBtn} onClick={() => switchMode('register')}>
                  Daftar Sekarang
                </button>
              </>
            ) : (
              <>Sudah punya akun?
                <button className={styles.toggleBtn} onClick={() => switchMode('login')}>
                  Masuk
                </button>
              </>
            )}
          </p>

        </div>
      </div>
    </div>
  );
}