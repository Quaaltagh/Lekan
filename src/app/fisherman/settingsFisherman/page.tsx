'use client';

import React, { useState, useRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './page.module.css';

import SideFisherman from '../../components/sideFisherman';
import NavbarFisherman from '../../components/NavbarFisherman';

// Komponen reusable
const SettingsSection = ({
  icon,
  title,
  description,
  children,
}: any) => (
  <div className={styles.settingsCard}>
    <div className={styles.sectionHeader}>
      <div className={styles.iconContainer}>{icon}</div>

      <div className={styles.sectionInfo}>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>

    <div className={styles.sectionContent}>
      {children}
    </div>
  </div>
);

export default function SettingsPage() {

//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    setShowSuccess(true);
  };

  return (
    <div className={styles.container}>

      {/* Sidebar */}
      <SideFisherman />

      {/* Main Content */}
      <main className={styles.mainContent}>

        {/* Navbar */}
        <NavbarFisherman />

        {showSuccess && (
          <div className={styles.overlay}>
            <div className={styles.popup}>

              <div className={styles.popupIcon}>✅</div>

              <h2 className={styles.popupTitle}>
                Berhasil Disimpan
              </h2>

              <p className={styles.popupDesc}>
                Data pengaturan berhasil diperbarui
              </p>

              <button
                className={styles.popupButton}
                onClick={() => setShowSuccess(false)}
              >
                Tutup
              </button>

            </div>
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>

          {/* Header */}
          <div className={styles.titleSection}>
            <h1>Pengaturan</h1>
            <p className={styles.subtitle}></p>
          </div>

          <form className={styles.settingsForm} onSubmit={handleSubmit}>

            {/* Profile */}
            <SettingsSection
              icon="👤"
              title="Informasi Profil"
              description="Kelola informasi akun dan identitas nelayan Anda."
            >

              <div className={styles.profileUpload}>

                <div className={styles.avatarPlaceholder}>

                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className={styles.avatarImage}
                    />
                  ) : (
                    <span className={styles.avatarText}>👤</span>
                  )}

                </div>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />

                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Ubah Foto
                </button>

              </div>

              <div className={styles.formGrid}>

                <div className={styles.formGroup}>
                  <label>NAMA LENGKAP</label>
                  <input type="text" 
                  defaultValue="Budi Santoso" 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>NAMA KAPAL</label>
                  <input type="text" 
                  defaultValue="KM Bintang Laut" 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>NOMOR HP</label>
                  <input
                  type="tel"
                  defaultValue="0812-3456-7890"
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>ALAMAT</label>
                  <textarea
                  defaultValue="Jl. Pantai Utara No. 12, Cirebon, Jawa Barat"
                  rows={3}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>BIO</label>
                  <textarea
                    defaultValue="Nelayan berpengalaman 15 tahun di perairan utara."
                    rows={3}
                  />
                </div>

              </div>

            </SettingsSection>

            {/* Bank */}
            <SettingsSection
              icon="🏦"
              title="Detail Bank"
              description="Atur rekening bank untuk menerima hasil pembayaran lelang."
            >

              <div className={styles.formGrid}>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>NAMA BANK</label>

                  <select>
                    <option>Bank Rakyat Indonesia (BRI)</option>
                    <option>Bank Mandiri</option>
                    <option>BCA</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>NOMOR KARTU</label>
                  <input type="text" 
                  defaultValue="0123 4567 8910" 
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>NAMA PEMEGANG KARTU</label>
                  <input type="text" 
                  defaultValue="Budi Santoso" 
                  />
                </div>

              </div>

            </SettingsSection>

            {/* Security */}
            <SettingsSection
              icon="🔒"
              title="Keamanan"
              description="Lindungi akun Anda dengan pengaturan keamanan yang aman."
            >

              <div className={styles.formGrid}>

                {/* PASSWORD SEKARANG */}
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>PASSWORD SEKARANG</label>

                  <div className={styles.passwordWrapper}>

                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value="BudiSantoso55"
                      readOnly
                      className={styles.passwordInput}
                    />

                    <button
                      type="button"
                      className={styles.eyeButton}
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <Eye size={18} />
                      ) : (
                        <EyeOff size={18} />
                      )}
                    </button>

                  </div>
                </div>

                {/* PASSWORD BARU */}
                <div className={styles.formGroup}>
                  <label>PASSWORD BARU</label>

                  <input
                    type="password"
                    placeholder="••••••••"
                  />

                </div>

                {/* KONFIRMASI */}
                <div className={styles.formGroup}>
                  <label>KONFIRMASI PASSWORD BARU</label>

                  <input
                    type="password"
                    placeholder="••••••••"
                  />
                </div>

              </div>

            </SettingsSection>

            {/* Buttons */}
            <div className={styles.formActions}>

              <button
                type="button"
                className={styles.btnCancel}
              >
                BATALKAN
              </button>

              <button
                type="submit"
                className={styles.btnSave}
              >
                SIMPAN
              </button>

            </div>

          </form>

        </div>

      </main>

    </div>
  );
}