'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, UserRound, Landmark, Lock, ChevronDown, ChevronUp, CheckCircle, X } from 'lucide-react';
import styles from './page.module.css';
import SideFisherman from '../../components/sideFisherman';
import NavbarFisherman from '../../components/NavbarFisherman';
import { useAuth } from '@/context/AuthContext';
import {
  getProfile, updateProfile, updatePassword,
  uploadAvatar, UserProfile,
} from '@/services/profileService';

// ─── Komponen reusable ────────────────────────────────────────────────────────
const SettingsSection = ({ icon: Icon, title, description, children }: any) => (
  <div className={styles.settingsCard}>
    <div className={styles.sectionHeader}>
      <div className={styles.iconWrap}>
        <div className={styles.iconContainer}><Icon size={20} strokeWidth={2} /></div>
        <h3>{title}</h3>
      </div>
      <div className={styles.sectionInfo}><p>{description}</p></div>
    </div>
    <div className={styles.sectionContent}>{children}</div>
  </div>
);

// ─── Daftar bank ──────────────────────────────────────────────────────────────
const BANK_OPTIONS = [
  'Bank Rakyat Indonesia (BRI)',
  'Bank Mandiri',
  'Bank Central Asia (BCA)',
  'Bank Negara Indonesia (BNI)',
  'Bank Syariah Indonesia (BSI)',
  'CIMB Niaga',
  'Danamon',
  'Permata Bank',
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, token } = useAuth();

  // ── Profile state ──────────────────────────────────────────────────────────
  const [profile,      setProfile]      = useState<UserProfile | null>(null);
  const [fullName,     setFullName]     = useState('');
  const [vesselName,   setVesselName]   = useState('');
  const [bio,          setBio]          = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);

  // ── Bank state ─────────────────────────────────────────────────────────────
  const [bankName,    setBankName]    = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankHolder,  setBankHolder]  = useState('');

  // ── Password state ─────────────────────────────────────────────────────────
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword,     setCurrentPassword]     = useState('');
  const [newPassword,         setNewPassword]         = useState('');
  const [confirmPassword,     setConfirmPassword]     = useState('');
  const [showCurrentPass,     setShowCurrentPass]     = useState(false);
  const [showNewPass,         setShowNewPass]         = useState(false);
  const [showConfirmPass,     setShowConfirmPass]     = useState(false);
  const [passwordError,       setPasswordError]       = useState('');

  // ── UI state ───────────────────────────────────────────────────────────────
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveError,   setSaveError]   = useState('');
  const [saving,      setSaving]      = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch profil saat mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !token) return;
    getProfile(user.id, token)
      .then(p => {
        setProfile(p);
        setFullName(p.full_name ?? '');
        setVesselName(p.vessel_name ?? '');
        setBio(p.bio ?? '');
        setProfileImage(p.avatar_url ?? null);
        setBankName(p.bank_name ?? BANK_OPTIONS[0]);
        setBankAccount(p.bank_account ?? '');
        setBankHolder(p.full_name ?? '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id, token]);

  // ── Upload avatar ──────────────────────────────────────────────────────────
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id || !token) return;
    setProfileImage(URL.createObjectURL(file));
    try {
      const url = await uploadAvatar(user.id, token, file);
      setProfileImage(url);
    } catch (err) {
      console.error('Avatar upload gagal:', err);
    }
  };

  // ── Toggle dropdown password ───────────────────────────────────────────────
  const handleTogglePassword = () => {
    if (showPasswordSection) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    }
    setShowPasswordSection(prev => !prev);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !token) return;

    setSaveError('');
    setPasswordError('');
    setSaving(true);

    try {
      // 1. Update profil + bank
      await updateProfile(user.id, token, {
        full_name:    fullName,
        vessel_name:  vesselName,
        bio,
        bank_name:    bankName,
        bank_account: bankAccount,
      });

      // 2. Update password — hanya kalau dropdown dibuka
      if (showPasswordSection) {
        if (!currentPassword) { setPasswordError('Password sekarang wajib diisi.'); setSaving(false); return; }
        if (!newPassword)      { setPasswordError('Password baru wajib diisi.');     setSaving(false); return; }
        if (newPassword.length < 6) { setPasswordError('Password baru minimal 6 karakter.'); setSaving(false); return; }
        if (newPassword !== confirmPassword) { setPasswordError('Konfirmasi password tidak cocok.'); setSaving(false); return; }

        await updatePassword(user.id, token, currentPassword, newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordSection(false);
      }

      setShowSuccess(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  // ── Reset ke nilai original ────────────────────────────────────────────────
  const handleCancel = () => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setVesselName(profile.vessel_name ?? '');
    setBio(profile.bio ?? '');
    setBankName(profile.bank_name ?? BANK_OPTIONS[0]);
    setBankAccount(profile.bank_account ?? '');
    setBankHolder(profile.full_name ?? '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setSaveError('');
    setShowPasswordSection(false);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className={styles.container}>
      <SideFisherman />
      <main className={styles.mainContent}>
        <NavbarFisherman />
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
          Memuat profil...
        </div>
      </main>
    </div>
  );

  return (
    <div className={styles.container}>
      <SideFisherman />

      <main className={styles.mainContent}>
        <NavbarFisherman />

        {/* ── Success Popup — konsisten pakai Lucide, tanpa emoji ── */}
        {showSuccess && (
          <div className={styles.overlay} onClick={() => setShowSuccess(false)}>
            <div className={styles.popup} onClick={e => e.stopPropagation()}>
              <button className={styles.popupClose} onClick={() => setShowSuccess(false)} aria-label="Tutup">
                <X size={18} />
              </button>
              <div className={styles.popupIconWrap}>
                <CheckCircle size={40} strokeWidth={1.8} className={styles.popupCheckIcon} />
              </div>
              <h2 className={styles.popupTitle}>Berhasil Disimpan</h2>
              <p className={styles.popupDesc}>Data pengaturan berhasil diperbarui.</p>
              <button className={styles.popupButton} onClick={() => setShowSuccess(false)}>Tutup</button>
            </div>
          </div>
        )}

        <div className={styles.content}>
          <div className={styles.titleSection}>
            <h1>Pengaturan</h1>
            <p className={styles.subtitle}>Kelola profil, rekening bank, dan keamanan akun Anda.</p>
          </div>

          {saveError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {saveError}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ── Profil ── */}
            <SettingsSection
              icon={UserRound}
              title="Informasi Profil"
              description="Kelola informasi akun dan identitas nelayan Anda."
            >
              <div className={styles.profileUpload}>
                <div className={styles.avatarPlaceholder}>
                  {profileImage
                    ? <img src={profileImage} alt="Profile" className={styles.avatarImage} />
                    : <span className={styles.avatarText}>👤</span>
                  }
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} />
                <button type="button" className={styles.btnSecondary} onClick={() => fileInputRef.current?.click()}>
                  Ubah Foto
                </button>
              </div>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>NAMA LENGKAP</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>NAMA KAPAL</label>
                  <input type="text" value={vesselName} onChange={e => setVesselName(e.target.value)} />
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>BIO</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} />
                </div>
              </div>
            </SettingsSection>

            {/* ── Bank ── */}
            <SettingsSection
              icon={Landmark}
              title="Detail Bank"
              description="Atur rekening bank untuk menerima hasil pembayaran lelang."
            >
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>NAMA BANK</label>
                  <select value={bankName} onChange={e => setBankName(e.target.value)}>
                    {BANK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>NOMOR REKENING</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={e => setBankAccount(e.target.value)}
                    placeholder="Contoh: 1234567890"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>NAMA PEMEGANG REKENING</label>
                  <input
                    type="text"
                    value={bankHolder}
                    onChange={e => setBankHolder(e.target.value)}
                  />
                </div>
              </div>
            </SettingsSection>

            {/* ── Security ── */}
            <SettingsSection
              icon={Lock}
              title="Keamanan"
              description="Klik tombol di bawah jika ingin mengganti password akun Anda."
            >
              {/* Tombol toggle */}
              <button
                type="button"
                className={styles.passwordToggleBtn}
                onClick={handleTogglePassword}
              >
                <span>{showPasswordSection ? 'Batal Ganti Password' : 'Ganti Password'}</span>
                {showPasswordSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {/* Dropdown password */}
              {showPasswordSection && (
                <div className={styles.passwordDropdown}>
                  <p className={styles.passwordDropdownHint}>
                    Semua field wajib diisi untuk mengganti password.
                  </p>

                  <div className={styles.formGrid}>
                    <div className={styles.fullWidth}>
                      <div className={styles.formGroup}><label>PASSWORD SEKARANG</label></div>
                      <div className={styles.passwordWrapper}>
                        <input
                          type={showCurrentPass ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          className={styles.passwordInput}
                          placeholder="Masukkan password sekarang"
                        />
                        <button type="button" className={styles.eyeButton} onClick={() => setShowCurrentPass(p => !p)}>
                          {showCurrentPass ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Password baru */}
                    <div className={styles.formGroup}>
                      <label>PASSWORD BARU</label>
                      <div className={styles.passwordWrapper}>
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Minimal 6 karakter"
                          className={styles.passwordInput}
                        />
                        <button type="button" className={styles.eyeButton} onClick={() => setShowNewPass(p => !p)}>
                          {showNewPass ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Konfirmasi password baru */}
                    <div className={styles.formGroup}>
                      <label>KONFIRMASI PASSWORD BARU</label>
                      <div className={styles.passwordWrapper}>
                        <input
                          type={showConfirmPass ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi password baru"
                          className={styles.passwordInput}
                        />
                        <button type="button" className={styles.eyeButton} onClick={() => setShowConfirmPass(p => !p)}>
                          {showConfirmPass ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                      </div>
                    </div>

                    {passwordError && (
                      <div className={styles.fullWidth} style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '-0.5rem' }}>
                        {passwordError}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </SettingsSection>

            {/* ── Actions ── */}
            <div className={styles.formActions}>
              <button type="button" className={styles.btnCancel} onClick={handleCancel}>
                BATALKAN
              </button>
              <button type="submit" className={styles.btnSave} disabled={saving}>
                {saving ? 'MENYIMPAN...' : 'SIMPAN'}
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}