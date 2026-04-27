'use client';
import styles from './Navbar.module.css';
import { Bell, Wallet, Search, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className={styles.header}>
      {/* Kiri - Logo */}
      <div className={styles.navLeft}>
        <Link href="/">
          <img src="/images/Lekan logo with tulisan.png" alt="LEKAN" className={styles.logoimages} />
        </Link>
      </div>

      {/* Tengah - Search */}
      <div className={styles.searchcontainer}>
        <div className={styles.searchwrapper}>
          <div className={styles.searchiconWrapper}>
            <Search className={styles.searchicon} />
          </div>
          <input type="text" className={styles.searchinput} placeholder="Cari ikan..." />
        </div>
      </div>

      {/* Kanan - Actions */}
      <div className={styles.navRight}>
        <a href="#"><Bell className={styles.icon} size={20} /></a>
        <a href="#"><Wallet className={styles.icon} size={20} /></a>

        {user ? (
          <div 
            className={styles.profileWrapper} 
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button className={styles.profileButton}>
              <div className={styles.avatar} style={{
                background: '#1e3a8a',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
              }}>
                {getInitials(user.full_name || user.email)}
              </div>
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>
                  {user.full_name || user.email.split('@')[0]}
                </span>
                <span className={styles.profileRole}>
                  {user.role === 'pembeli' ? 'Pembeli' : 'Nelayan'}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`${styles.chevron} ${dropdownOpen ? styles.chevronOpen : ''}`}
                color="#94a3b8"
              />
            </button>

            {dropdownOpen && (
              <div className={styles.dropdown}>
                <div className={styles.dropdownHeader}>
                  <p className={styles.dropdownName}>{user.full_name || '-'}</p>
                  <p className={styles.dropdownEmail}>{user.email}</p>
                </div>
                <hr className={styles.dropdownDivider} />
                <Link href="/" className={styles.dropdownItem}>Profil Saya</Link>
                <Link href="/" className={styles.dropdownItem}>Status Lelang</Link>
                <Link href="/" className={styles.dropdownItem}>Riwayat Lelang</Link>
                <hr className={styles.dropdownDivider} />
                <button
                  className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                  onClick={() => { logout(); setDropdownOpen(false); }}
                >
                  <LogOut size={14} /> Keluar
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.divauth}>
            <Link href="/auth?mode=login" className={styles.auth}>Masuk</Link>
            {' | '}
            <Link href="/auth?mode=register" className={styles.auth}>Daftar</Link>
          </div>
        )}
      </div>
    </header>
  );
}