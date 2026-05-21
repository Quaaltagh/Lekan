'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, UserRound, Lock, Settings, Zap, Mail, ShieldCheck, CheckCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './page.module.css';
import Navbar from '@/app/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import {
  getProfile, updateProfile, updatePassword,
  updatePreferences, uploadAvatar, UserProfile,
} from '@/services/profileService';

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

export default function Profile() {
  const { user, token } = useAuth();

  // ── Profile state ──────────────────────────────────────────────────────
  const [profile,      setProfile]      = useState<UserProfile | null>(null);
  const [fullName,     setFullName]     = useState('');
  const [vesselName,   setVesselName]   = useState('');
  const [bio,          setBio]          = useState('');
  const [phone,          setPhone]          = useState('');
  const [email,          setEmail]          = useState('');
  const [address,          setAddress]          = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading,      setLoading]      = useState(true);

  // ── Password state ─────────────────────────────────────────────────────
  // const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword,     setCurrentPassword]     = useState('');
  const [newPassword,         setNewPassword]         = useState('');
  const [confirmPassword,     setConfirmPassword]     = useState('');
  const [showCurrentPass,     setShowCurrentPass]     = useState(false);
  const [showNewPass,         setShowNewPass]         = useState(false);
  const [showConfirmPass,     setShowConfirmPass]     = useState(false);
  const [passwordError,       setPasswordError]       = useState('');

  // ── Preferences state ──────────────────────────────────────────────────
  const [auctionAlerts,    setAuctionAlerts]    = useState(true);
  const [bidConfirmations, setBidConfirmations] = useState(true);
  const [marketingUpdates, setMarketingUpdates] = useState(false);

  // ── UI state ───────────────────────────────────────────────────────────
  const [showSuccess, setShowSuccess] = useState(false);
  const [saveError,   setSaveError]   = useState('');
  const [passwordApiError, setPasswordApiError] = useState('');
  const [saving,      setSaving]      = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch profil saat mount ────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id || !token) return;
    getProfile(user.id, token)
      .then(p => {
        setProfile(p);
        setFullName(p.full_name ?? '');
        setEmail(p.email ?? '');
        setAddress(p.address ?? '');
        setPhone(p.phone ?? '');
        setVesselName(p.vessel_name ?? '');
        setBio(p.bio ?? '');
        setProfileImage(p.avatar_url ?? null);
        setAuctionAlerts(p.preferences?.auctionAlerts ?? true);
        setBidConfirmations(p.preferences?.bidConfirmations ?? true);
        setMarketingUpdates(p.preferences?.marketingUpdates ?? false);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id, token]);

  // ── Upload avatar ──────────────────────────────────────────────────────
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

  // ── Toggle dropdown password — reset field saat ditutup ───────────────
  // const handleTogglePassword = () => {
  //   if (showPasswordSection) {
  //     // Tutup → reset semua field & error
  //     setCurrentPassword('');
  //     setNewPassword('');
  //     setConfirmPassword('');
  //     setPasswordError('');
  //   }
  //   setShowPasswordSection(prev => !prev);
  // };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !token) return;

    setSaveError('');
    setPasswordError('');
    setPasswordApiError('');

    setSaving(true);

    try {
      // 1. Update profil (selalu)
      await updateProfile(user.id, token, { full_name: fullName, vessel_name: vesselName, bio, email, phone, address });

      // 2. Update password — hanya kalau dropdown dibuka
      //    Saat dropdown terbuka, semua field wajib diisi
      const isPasswordFilled = currentPassword || newPassword || confirmPassword;
      if (isPasswordFilled) {
        if (!currentPassword) {
          setPasswordError('Password sekarang wajib diisi.');
          setSaving(false);
          return;
        }
        if (!newPassword) {
          setPasswordError('Password baru wajib diisi.');
          setSaving(false);
          return;
        }
        if (newPassword.length < 6) {
          setPasswordError('Password baru minimal 6 karakter.');
          setSaving(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setPasswordError('Konfirmasi password tidak cocok.');
          setSaving(false);
          return;
        }
        try {
          await updatePassword(user.id, token, currentPassword, newPassword);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } catch (err) {
          // error password (misal password lama salah) → muncul di bawah input
          setPasswordApiError(err instanceof Error ? err.message : 'Password lama tidak cocok.');
          setSaving(false);
          return;
        }
      }

      // 3. Update preferences (selalu)
      await updatePreferences(user.id, token, { auctionAlerts, bidConfirmations, marketingUpdates });

      setShowSuccess(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setSaving(false);
    }
  };

  // ── Reset ke nilai original ────────────────────────────────────────────
  const handleCancel = () => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setEmail(profile.email ?? '');
    setAddress(profile.address ?? '');
    setPhone(profile.phone ?? '');
    setVesselName(profile.vessel_name ?? '');
    setBio(profile.bio ?? '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setSaveError('');
    setPasswordApiError('');  
    // setShowPasswordSection(false);
  };

  if (loading) return (
    <div className={styles.all}>
      <Navbar />
      <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Memuat profil...</div>
    </div>
  );

  return (
    <div className={styles.all}>
      <Navbar />
      <div className={styles.container}>

        {/* ── Success Popup ── */}
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
            <p className={styles.subtitle}>Kelola profil Anda, preferensi, dan keamanan akun.</p>
          </div>

          {saveError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {saveError}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ── Profil ── */}
            <SettingsSection icon={UserRound} title="Informasi Profil" description="Kelola informasi akun dan identitas nelayan Anda.">
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
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>email</label>
                  <input type="text" value={email} onChange={e => setEmail(e.target.value)} />
                </div>

                <div className={styles.formGroup}>
                  <label>NAMA LENGKAP</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} />
                </div>
                {/* <div className={styles.formGroup}>
                  <label>NAMA KAPAL</label>
                  <input type="text" value={vesselName} onChange={e => setVesselName(e.target.value)} />
                </div> */}

                <div className={`${styles.formGroup} ${styles.phoneInput}`}>
                  <label>Nomor Telepon</label>
                  <span className={styles.phonePrefix}>+62</span>
                  <input type="tel" placeholder="81234567890" value={phone}onChange={(e) => {
                    const onlyNumbers = e.target.value.replace(/\D/g, '');
                    setPhone(onlyNumbers);
                  }} />
                </div>

                 <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>Alamat</label>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} />
                </div>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>BIO</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} />
                </div>
              </div>
            </SettingsSection>

            {/* ── Preferences ── */}
            <SettingsSection icon={Settings} title="Preferensi" description="Kelola cara Anda menerima peringatan dan notifikasi.">
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <div className={styles.preferencewrapper}>
                  {[
                    { id: 'alerts',    title: 'Notifikasi Lelang',    description: 'Dapatkan notifikasi saat item yang dipantau mulai dilelang.', icon: Zap,         state: auctionAlerts,    setter: setAuctionAlerts },
                    { id: 'confirm',   title: 'Konfirmasi Penawaran', description: 'Terima email bukti untuk penawaran yang berhasil.',      icon: Mail,        state: bidConfirmations, setter: setBidConfirmations },
                    { id: 'marketing', title: 'Pembaruan Promosi', description: 'Newsletter dan penawaran promosi terbaru.',      icon: ShieldCheck, state: marketingUpdates, setter: setMarketingUpdates },
                  ].map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.id} className={styles.prefcard}>
                        <div className={styles.prefleft}>
                          <div className={`${styles.preficonBox} ${item.state ? styles.preficonBoxActive : styles.preficonBoxInactive}`}>
                            <Icon className={styles.preficon} />
                          </div>
                          <div>
                            <h4 className={styles.preftitle}>{item.title}</h4>
                            <p className={styles.prefdesc}>{item.description}</p>
                          </div>
                        </div>
                        <button type="button" onClick={() => item.setter(!item.state)}
                          className={`${styles.preftoggle} ${item.state ? styles.preftoggleActive : styles.preftoggleInactive}`}>
                          <span className={`${styles.preftoggleDot} ${item.state ? styles.preftoggleDotActive : styles.preftoggleDotInactive}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SettingsSection>

            {/* ── Security ── */}
            <SettingsSection icon={Lock} title="Keamanan" description="Klik tombol di bawah jika ingin mengganti password akun Anda.">

              {/* Tombol toggle dropdown */}
              {/* <button
                type="button"
                className={styles.passwordToggleBtn}
                onClick={handleTogglePassword}
              >
                <span>{showPasswordSection ? 'Batal Ganti Password' : 'Ganti Password'}</span>
                {showPasswordSection ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button> */}

              {/* Dropdown password — muncul saat toggle dibuka */}
              {/* {showPasswordSection && (
                <div className={styles.passwordDropdown}>
                  <p className={styles.passwordDropdownHint}>
                    Semua field wajib diisi untuk mengganti password.
                  </p> */}

                  <div className={styles.formGrid}>
                    {/* Password sekarang */}
                    <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                        <label>PASSWORD SEKARANG</label>
                      <div className={styles.passwordWrapper}>
                        <input
                          type={showCurrentPass ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          className={styles.passwordInput}
                          placeholder="Masukkan password sekarang"
                        />
                        <button type="button" className={styles.eyeButtonFull} onClick={() => setShowCurrentPass(p => !p)}>
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

                    {passwordApiError && (
                      <div className={styles.fullWidth} style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '-0.5rem' }}>
                        {passwordApiError}
                      </div>
                    )}

                    {passwordError && (
                      <div className={styles.fullWidth} style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '-0.5rem' }}>
                        {passwordError}
                      </div>
                    )}

                    
                  </div>
                {/* </div>
              )} */}
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
      </div>
    </div>
  );
}