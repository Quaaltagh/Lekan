'use client';

import React, { useState, useRef } from 'react';
import { Eye, EyeOff, LucideIcon, UserRound, Lock, Settings, Zap, Mail, ShieldCheck } from 'lucide-react';
import styles from './page.module.css';
import Navbar from '@/app/components/Navbar';



// Komponen reusable

type SettingsSectionProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  children: React.ReactNode;
};

const SettingsSection = ({
  icon: Icon,
  title,
  description,
  children,
}: any) => (
  <div className={styles.settingsCard}>
    <div className={styles.sectionHeader}>
        <div className={styles.iconWrap}>
            <div className={styles.iconContainer}><Icon size={20} strokeWidth={2} /></div>    
            <h3>{title}</h3>  
        </div>
      

      <div className={styles.sectionInfo}>
        <p>{description}</p>
      </div>
    </div>

    <div className={styles.sectionContent}>
      {children}
    </div>
  </div>
);

export default function Profile() {

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
  const [auctionAlerts, setAuctionAlerts] = useState(true);
  const [bidConfirmations, setBidConfirmations] = useState(true);
  const [marketingUpdates, setMarketingUpdates] = useState(false);

  return (
    <div className={styles.all}>
        <Navbar />
        <div className={styles.container}>
        

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
            <p className={styles.subtitle}>Kelola profil Anda, preferensi, dan keamanan akun.</p>
          </div>

          <form className={styles.settingsForm} onSubmit={handleSubmit}>

            {/* Profile */}
            <SettingsSection
              icon={UserRound}
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

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label>BIO</label>
                  <textarea
                    defaultValue="Nelayan berpengalaman 15 tahun di perairan utara."
                    rows={3}
                  />
                </div>

              </div>

            </SettingsSection>

            {/* Preference */}
            <SettingsSection
              icon={Settings}
              title="Preferensi "
              description="Kelola cara Anda menerima peringatan dan notifikasi."
            >
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>

                <div className={styles.preferencewrapper}>
                    {[
                        {
                        id: 'alerts',
                        title: 'Auction Alerts',
                        description: 'Get notified when watched items go live.',
                        icon: Zap,
                        state: auctionAlerts,
                        setter: setAuctionAlerts
                        },
                        {
                        id: 'confirm',
                        title: 'Bid Confirmations',
                        description: 'Email receipts for successful bids.',
                        icon: Mail,
                        state: bidConfirmations,
                        setter: setBidConfirmations
                        },
                        {
                        id: 'marketing',
                        title: 'Marketing Updates',
                        description: 'Newsletters and promotional offers.',
                        icon: ShieldCheck,
                        state: marketingUpdates,
                        setter: setMarketingUpdates
                        }
                    ].map((item) => {
                        const Icon = item.icon;

                        return (
                        <div key={item.id} className={styles.prefcard}>
                            <div className={styles.prefleft}>
                            <div className= {`${styles.preficonBox} ${
                                item.state ? styles.preficonBoxActive : styles.preficonBoxInactive
                            }`}
                        
                            >
                                <Icon className={styles.preficon} />
                            </div>

                            <div>
                                <h4 className={styles.preftitle}>{item.title}</h4>
                                <p className={styles.prefdesc}>{item.description}</p>
                            </div>
                            </div>

                            <button
                            type="button"
                            onClick={() => item.setter(!item.state)}
                            className={`${styles.preftoggle} ${
                                item.state ? styles.preftoggleActive : styles.preftoggleInactive
                            }`}
                            >
                            <span
                                className={`${styles.preftoggleDot} ${
                                item.state ? styles.preftoggleDotActive : styles.preftoggleDotInactive
                                }`}
                            />
                            </button>
                        </div>
                        );
                    })}
                    </div>

              </div>

            </SettingsSection>

            {/* Security */}
            <SettingsSection
              icon={Lock}
              title="Keamanan"
              description="Lindungi akun Anda dengan pengaturan keamanan yang aman."
            >

              <div className={styles.formGrid}>

                {/* PASSWORD SEKARANG */}
                <div className={`${styles.fullWidth}`}>
                  <div className={styles.formGroup}>
                  <label>PASSWORD SEKARANG</label>
                  </div>
                  

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

      </div>

    </div>
  );
}