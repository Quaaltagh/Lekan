'use client';
import styles from './NavbarFisherman.module.css';
import { Bell, Wallet, LogOut, ChevronDown, User, Settings, BanknoteIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function NavbarFisherman() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [profileOpen, setProfileOpen] = useState(false);
  const [walletOpen,  setWalletOpen]  = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const walletRef  = useRef<HTMLDivElement>(null);

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (walletRef.current  && !walletRef.current.contains(e.target as Node))  setWalletOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles.navRight}>

        {/* ── Bell ── */}
        <a href="/notification"><Bell className={styles.icon} size={20} /></a>

        {/* ── Wallet Dropdown ── */}
        <div className={styles.dropdownWrapper} ref={walletRef}>
          <button className={styles.iconButton} onClick={() => { setWalletOpen(!walletOpen); setProfileOpen(false); }}>
            <Wallet className={styles.icon} size={20} />
          </button>

          {walletOpen && (
            <div className={styles.dropdown} style={{ width: '240px' }}>
              <div className={styles.dropdownHeader}>
                <p className={styles.dropdownLabel}>Saldo Dompet</p>
                <p className={styles.dropdownBalance}>Rp 0</p>
              </div>
              <hr className={styles.divider} />
              <button className={styles.dropdownItem} onClick={() => { setWalletOpen(false); router.push('/fisherman/withdraw'); }}>
                <BanknoteIcon size={15} />
                Tarik Dana (Withdraw)
              </button>

              <button className={styles.dropdownItem} onClick={() => { setWalletOpen(false); router.push('/fisherman/walletPayment'); }}>
                <Wallet size={15} />
                Dompet
              </button>
            </div>
          )}
        </div>

        {/* ── Profile Dropdown ── */}
        <div className={styles.dropdownWrapper} ref={profileRef}>
          <button
            className={styles.profileButton}
            onClick={() => { setProfileOpen(!profileOpen); setWalletOpen(false); }}
          >
            <div className={styles.avatar} style={{
              background: '#1e3a8a', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700,
            }}>
              {getInitials(user?.full_name || user?.email)}
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{user?.full_name || user?.email?.split('@')[0] || 'Nelayan'}</span>
              <span className={styles.profileRole}>Nelayan</span>
            </div>
            <ChevronDown size={13} color="#94a3b8" style={{ transition: 'transform 0.2s', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
          </button>

          {profileOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <p className={styles.dropdownName}>{user?.full_name || '-'}</p>
                <p className={styles.dropdownEmail}>{user?.email}</p>
              </div>
              <hr className={styles.divider} />
              {/* <button className={styles.dropdownItem} onClick={() => { setProfileOpen(false); router.push('/fisherman/settingsFisherman'); }}>
                <User size={14} /> Profil Saya
              </button> */}
              {/* <button className={styles.dropdownItem} onClick={() => { setProfileOpen(false); router.push('/fisherman/settingsFisherman'); }}>
                <Settings size={14} /> Pengaturan
              </button> */}
              <hr className={styles.divider} />
              <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={handleLogout}>
                <LogOut size={14} /> Keluar
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}