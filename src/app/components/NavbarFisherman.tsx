'use client';
import styles from './NavbarFisherman.module.css';
import { Bell, Wallet, LogOut, ChevronDown, Settings, BanknoteIcon, Loader2, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface WalletData {
  balance: number;
  pending: number;
}

const formatIDR = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);

// ─── Avatar component (sama persis dengan buyer Navbar) ───────────────────────
function getInitials(name?: string, email?: string): string {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  if (email) return email[0].toUpperCase();
  return '?';
}

function UserAvatar({ avatarUrl, name, email }: {
  avatarUrl: string | null;
  name?: string;
  email?: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name || 'Avatar'}
        className={styles.avatarImg}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={styles.avatarFallback} style={{
      background: '#1e3a8a', color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '12px', fontWeight: 700,
      width: '100%', height: '100%', borderRadius: '9999px',
    }}>
      {getInitials(name, email)}
    </div>
  );
}

export default function NavbarFisherman({setSidebarOpen}: {setSidebarOpen: (value: boolean) => void;}) {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const [profileOpen,   setProfileOpen]   = useState(false);
  const [walletOpen,    setWalletOpen]    = useState(false);
  const [wallet,        setWallet]        = useState<WalletData | null>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [unreadCount,   setUnreadCount]   = useState(0);

  // ── Avatar state — sama dengan buyer Navbar ───────────────────────────────
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id || !token) { setAvatarUrl(null); return; }
    if ((user as any).avatar_url) { setAvatarUrl((user as any).avatar_url); return; }
    fetch(`${API_URL}/api/profile/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.avatar_url) setAvatarUrl(data.avatar_url); })
      .catch(() => {});
  }, [user?.id, token]);

  useEffect(() => { if (!user) setAvatarUrl(null); }, [user]);

  const profileRef = useRef<HTMLDivElement>(null);
  const walletRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
      if (walletRef.current  && !walletRef.current.contains(e.target as Node))  setWalletOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchWallet = useCallback(async () => {
    if (!user?.id || !token) return;
    setWalletLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/wallet/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWallet({ balance: data.wallet?.balance ?? 0, pending: data.wallet?.pending ?? 0 });
      }
    } catch {}
    finally { setWalletLoading(false); }
  }, [user?.id, token]);

  const fetchUnread = useCallback(async () => {
    if (!user?.id || !token) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications/${user.id}?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const notifs = Array.isArray(data) ? data : (data.notifications ?? []);
        setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
      }
    } catch {}
  }, [user?.id, token]);

  useEffect(() => {
    fetchWallet();
    fetchUnread();
  }, [fetchWallet, fetchUnread]);

  const handleWalletToggle = () => {
    const next = !walletOpen;
    setWalletOpen(next);
    setProfileOpen(false);
    if (next) fetchWallet();
  };

  return (
    <header className={styles.header}>
      <button
        className={styles.mobileMenuButton}
        onClick={() => setSidebarOpen(true)}
      >
        <Menu size={22} />
      </button>

      <div className={styles.navRight}>

        {/* Bell + unread badge */}
        <div style={{ position: 'relative' }}>
          <a href="/notification">
            <Bell className={styles.icon} size={20} />
          </a>
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: '-4px', right: '-4px',
              background: '#ef4444', color: '#fff', borderRadius: '9999px',
              fontSize: '9px', fontWeight: 700, minWidth: '16px', height: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 3px', lineHeight: 1,
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        {/* Wallet Dropdown */}
        <div className={styles.dropdownWrapper} ref={walletRef}>
          <button className={styles.iconButton} onClick={handleWalletToggle}>
            <Wallet className={styles.icon} size={20} />
          </button>
          {walletOpen && (
            <div className={styles.dropdown} style={{ width: '240px' }}>
              <div className={styles.dropdownHeader}>
                <p className={styles.dropdownLabel}>Saldo Tersedia</p>
                {walletLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <Loader2 size={14} className="animate-spin" style={{ color: '#94a3b8' }} />
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>Memuat...</span>
                  </div>
                ) : (
                  <>
                    <p className={styles.dropdownBalance}>{wallet ? formatIDR(wallet.balance) : 'Rp 0'}</p>
                    {wallet && wallet.pending > 0 && (
                      <p style={{ fontSize: '11px', color: '#f59e0b', margin: '2px 0 0', fontWeight: 500 }}>
                        Pending: {formatIDR(wallet.pending)}
                      </p>
                    )}
                  </>
                )}
              </div>
              <hr className={styles.divider} />
              <button className={styles.dropdownItem} onClick={() => { setWalletOpen(false); router.push('/fisherman/withdraw'); }}>
                <BanknoteIcon size={15} /> Tarik Dana (Withdraw)
              </button>
              <button className={styles.dropdownItem} onClick={() => { setWalletOpen(false); router.push('/fisherman/walletPayment'); }}>
                <Wallet size={15} /> Dompet
              </button>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className={styles.dropdownWrapper} ref={profileRef}>
          <button
            className={styles.profileButton}
            onClick={() => { setProfileOpen(!profileOpen); setWalletOpen(false); }}
          >
            <div className={styles.avatar}>
              <UserAvatar avatarUrl={avatarUrl} name={user?.full_name} email={user?.email} />
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{user?.full_name || user?.email?.split('@')[0] || 'Nelayan'}</span>
              <span className={styles.profileRole}>Nelayan</span>
            </div>
            <ChevronDown size={13} color="#94a3b8"
              style={{ transition: 'transform 0.2s', transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
          {profileOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <p className={styles.dropdownName}>{user?.full_name || '-'}</p>
                <p className={styles.dropdownEmail}>{user?.email}</p>
              </div>
              <hr className={styles.divider} />
              <button className={styles.dropdownItem} onClick={() => { setProfileOpen(false); router.push('/fisherman/settingsFisherman'); }}>
                <Settings size={14} /> Pengaturan
              </button>
              <hr className={styles.divider} />
              <button className={`${styles.dropdownItem} ${styles.dropdownLogout}`} onClick={() => { logout(); router.push('/'); }}>
                <LogOut size={14} /> Keluar
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}