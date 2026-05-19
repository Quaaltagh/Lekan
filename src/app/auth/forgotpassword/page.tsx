'use client';
import React, { useState } from 'react';
import { useEffect } from 'react';
// import { supabase } from '../../../../server/src/lib/supabaseClient';
import { Mail, ArrowLeft, Ship, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { authService } from '@/services/authService';

type Step = 'request' | 'sent' | 'reset' | 'done';

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
export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep]         = useState<Step>('request');
  const [email, setEmail]       = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [code, setCode]         = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState('');

  // ── Mount Effect: Deteksi Token / Code dari URL dengan Scanner Interval ──────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleUrlCheck = () => {
      // 1. Cek parameter hash (Implicit Flow / URL hash)
      const hash = window.location.hash;
      if (hash) {
        // Hilangkan '#' di awal, atau jika diawali dengan '#/' (routing hash)
        const cleanHash = hash.startsWith('#/') ? hash.substring(2) : hash.substring(1);
        const params = new URLSearchParams(cleanHash);
        const access = params.get('access_token');
        const refresh = params.get('refresh_token');

        if (access) {
          setAccessToken(access);
          if (refresh) setRefreshToken(refresh);
          setStep('reset');
          return true;
        }
      }

      // 2. Cek parameter query (PKCE Flow / Code Flow)
      const searchParams = new URLSearchParams(window.location.search);
      const queryCode = searchParams.get('code');
      if (queryCode) {
        setCode(queryCode);
        setStep('reset');
        return true;
      }
      return false;
    };

    // Jalankan pemeriksaan langsung
    handleUrlCheck();

    // Jalankan scanner interval tiap 100ms selama 3 detik untuk mengantisipasi keterlambatan mount/hydration URL
    let count = 0;
    const interval = setInterval(() => {
      count++;
      const isFound = handleUrlCheck();
      if (isFound || count >= 30) {
        clearInterval(interval);
      }
    }, 100);

    // Dengarkan juga event perubahan hash (jika redireksinya terjadi di sisi client setelah mount)
    const onHashChange = () => {
      handleUrlCheck();
    };
    window.addEventListener('hashchange', onHashChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  // Request reset email ───────────────────────────────────────────
  const handleRequestReset = async () => {
    setError('');
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError('Masukkan alamat email yang valid.');
      return;
    }
    setIsLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setStep('sent');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mengirim email. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 3: Set new password ──────────────────────────────────────────────
  const handleResetPassword = async () => {
    setError('');
    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    setIsLoading(true);
    try {
      await authService.resetPassword({
        accessToken,
        refreshToken,
        code,
        newPassword,
      });
      setStep('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal mereset password. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
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

          {/* ── STEP: request ── */}
          {step === 'request' && (
            <>
              <button className={styles.backBtn} onClick={() => router.push('/auth?mode=login')}>
                <ArrowLeft size={15} /> Kembali ke Login
              </button>
              <div className={styles.formHeading}>
                <div className={styles.stepIcon}><Mail size={28} /></div>
                <h1 className={styles.formTitle}>Lupa Kata Sandi?</h1>
                <p className={styles.formSubtitle}>
                  Masukkan email akunmu. Kami akan mengirimkan kode verifikasi untuk mereset kata sandi.
                </p>
              </div>
              <div className={styles.fields}>
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Alamat Email</label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputIcon}><Mail size={16} /></span>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleRequestReset()}
                      className={styles.input}
                      placeholder="email@example.com"
                      autoComplete="email"
                    />
                  </div>
                </div>
                {error && (
                  <div className={styles.errorBox}>
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    {error}
                  </div>
                )}
                <button className={styles.submitBtn} onClick={handleRequestReset} disabled={isLoading}>
                  {isLoading ? 'Mengirim...' : 'Kirim Kode Verifikasi →'}
                </button>
              </div>
            </>
          )}

          {/* ── STEP: sent ── */}
          {step === 'sent' && (
            <>
              <button className={styles.backBtn} onClick={() => { setStep('request'); setError(''); }}>
                <ArrowLeft size={15} /> Ganti Email
              </button>
              <div className={styles.formHeading}>
                <div className={styles.stepIcon} style={{ background: 'var(--clr-accent-soft2, #e0f2fe)' }}>
                  <Mail size={28} color="var(--clr-accent, #0284c7)" />
                </div>
                <h1 className={styles.formTitle}>Cek Email Kamu</h1>
                <p className={styles.formSubtitle}>
                  Kami telah mengirimkan tautan reset kata sandi ke email <strong>{email}</strong>.
                  Silakan periksa kotak masuk atau spam email Anda dan klik tautan tersebut untuk membuat kata sandi baru.
                </p>
              </div>
              <div className={styles.fields}>
                {error && (
                  <div className={styles.errorBox}>
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    {error}
                  </div>
                )}
                <p className={styles.resendRow} style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--clr-text-light, #64748b)' }}>
                  Tidak menerima tautan?{' '}
                  <button className={styles.toggleBtn} onClick={handleRequestReset} disabled={isLoading} style={{ color: 'var(--clr-accent, #0284c7)', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    {isLoading ? 'Mengirim ulang...' : 'Kirim Ulang'}
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ── STEP: reset (new password) ── */}
          {step === 'reset' && (
            <>
              <div className={styles.formHeading}>
                <div className={styles.stepIcon} style={{ background: 'var(--clr-accent-soft2)' }}>
                  <Lock size={28} />
                </div>
                <h1 className={styles.formTitle}>Buat Kata Sandi Baru</h1>
                <p className={styles.formSubtitle}>
                  Pilih kata sandi yang kuat dan belum pernah kamu gunakan sebelumnya.
                </p>
              </div>
              <div className={styles.fields}>
                {/* New Password */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Kata Sandi Baru</label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputIcon}><Lock size={16} /></span>
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(''); }}
                      className={styles.input}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button type="button" className={styles.inputRight} onClick={() => setShowNew(!showNew)} tabIndex={-1}>
                      {showNew
                        ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                  <PasswordStrengthBar password={newPassword} />
                </div>

                {/* Confirm Password */}
                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Konfirmasi Kata Sandi</label>
                  <div className={styles.inputWrap}>
                    <span className={styles.inputIcon}><Lock size={16} /></span>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
                      className={`${styles.input} ${confirmPassword && confirmPassword !== newPassword ? styles.inputError : ''}`}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button type="button" className={styles.inputRight} onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}>
                      {showConfirm
                        ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className={styles.matchError}>Password tidak cocok</p>
                  )}
                </div>

                {error && (
                  <div className={styles.errorBox}>
                    <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                    {error}
                  </div>
                )}
                <button className={styles.submitBtn} onClick={handleResetPassword} disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru →'}
                </button>
              </div>
            </>
          )}

          {/* ── STEP: done ── */}
          {step === 'done' && (
            <div className={styles.successState}>
              <div className={styles.successIcon}>
                <CheckCircle size={48} />
              </div>
              <h1 className={styles.formTitle}>Kata Sandi Berhasil Diubah!</h1>
              <p className={styles.formSubtitle}>
                Kata sandi akunmu sudah diperbarui. Silakan masuk dengan kata sandi baru.
              </p>
              <button
                className={styles.submitBtn}
                style={{ marginTop: '1.5rem' }}
                onClick={() => router.push('/auth?mode=login')}
              >
                Kembali ke Login →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}